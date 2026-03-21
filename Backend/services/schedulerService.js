const axios = require('axios');
const sequelize = require('../config/database');
const { Faculty, Subject, Classroom, Timetable, TimetableEntry } = require('../models');

const OPTIMIZER_URL = process.env.OPTIMIZER_URL || 'http://localhost:8000/optimize';
const OPTIMIZER_TIMEOUT = 60000; // 60 seconds

// Simple fallback scheduler if OR-Tools service is unavailable
function generateFallbackSchedule(payload) {
  const entries = [];
  const daysPerWeek = 6;
  const timeSlotsPerDay = 5;
  let currentDay = 0;
  let currentSlot = 0;

  payload.subjects.forEach((subject) => {
    for (let i = 0; i < subject.classes_per_week; i++) {
      const classroom = payload.classrooms[Math.floor(Math.random() * payload.classrooms.length)];
      
      entries.push({
        subject_id: subject.id,
        faculty_id: subject.faculty_id,
        classroom_id: classroom.id,
        day: currentDay % daysPerWeek,
        period: currentSlot % timeSlotsPerDay,
        day_name: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][currentDay % daysPerWeek],
        time_slot: getTimeLabel(currentSlot % timeSlotsPerDay),
      });

      currentSlot++;
      if (currentSlot % timeSlotsPerDay === 0) {
        currentDay++;
      }
    }
  });

  return {
    success: true,
    entries,
    fallback: true,
    message: 'Using fallback schedule (OR-Tools optimizer unavailable)',
    statistics: {
      total_slots: entries.length,
      days_used: Math.min(daysPerWeek, Math.ceil(entries.length / timeSlotsPerDay)),
      classrooms_used: new Set(entries.map(e => e.classroom_id)).size,
    },
  };
}

function getTimeLabel(slotIdx) {
  const times = {
    0: '9:00-11:00',
    1: '11:00-13:00',
    2: '13:00-15:00',
    3: '15:00-17:00',
    4: '17:00-19:00',
  };
  return times[slotIdx] || '9:00-11:00';
}

async function buildSchedulingPayload() {
  try {
    const [faculties, subjects, classrooms] = await Promise.all([
      Faculty.findAll({ include: [{ model: Subject, as: 'subjects', attributes: ['id'] }] }),
      Subject.findAll(),
      Classroom.findAll(),
    ]);

    if (!faculties.length || !subjects.length || !classrooms.length) {
      throw new Error('Insufficient data: need at least 1 faculty, 1 subject, and 1 classroom');
    }

    return {
      faculties: faculties.map(f => ({
        id: f.id,
        name: f.name,
        max_classes_per_day: f.max_classes_per_day,
        subject_ids: (f.subjects || []).map(s => s.id),
      })),
      subjects: subjects.map(s => ({
        id: s.id,
        name: s.name,
        classes_per_week: s.classes_per_week,
        faculty_id: s.faculty_id,
      })),
      classrooms: classrooms.map(c => ({ id: c.id, name: c.name, capacity: c.capacity })),
    };
  } catch (error) {
    throw Object.assign(new Error(`Failed to build payload: ${error.message}`), { status: 500 });
  }
}

async function sendToOptimizer(payload) {
  try {
    console.log(`Sending optimization request to ${OPTIMIZER_URL}...`);
    const response = await axios.post(OPTIMIZER_URL, payload, {
      timeout: OPTIMIZER_TIMEOUT,
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.data || !response.data.entries) {
      throw new Error('Invalid response format from optimizer');
    }

    console.log(`Optimizer returned ${response.data.entries.length} schedule entries`);
    return response.data;
  } catch (error) {
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      console.warn('OR-Tools optimizer service unavailable, using fallback scheduler');
      return null; // Signal to use fallback
    }
    if (error.code === 'ECONNABORTED') {
      console.warn('Optimizer timeout exceeded, using fallback scheduler');
      return null;
    }
    throw Object.assign(
      new Error(`Optimizer error: ${error.response?.data?.error || error.message}`),
      { status: error.response?.status || 502 }
    );
  }
}

function validateOptimizerResponse(resp) {
  if (!resp || typeof resp !== 'object') {
    throw Object.assign(new Error('Invalid optimizer response format'), { status: 502 });
  }

  if (!Array.isArray(resp.entries)) {
    throw Object.assign(new Error('Invalid optimizer response: expected entries array'), { status: 502 });
  }

  if (resp.entries.length === 0) {
    throw Object.assign(new Error('Optimizer returned no schedule entries'), { status: 502 });
  }

  // Validate each entry
  resp.entries.forEach((e, idx) => {
    const required = ['day', 'period', 'classroom_id', 'subject_id', 'faculty_id'];
    required.forEach(field => {
      if (typeof e[field] === 'undefined' || e[field] === null) {
        throw Object.assign(
          new Error(`Entry ${idx} missing required field: ${field}`),
          { status: 502 }
        );
      }
    });

    // Validate field types
    if (!Number.isInteger(e.day) || e.day < 0 || e.day > 6) {
      throw Object.assign(new Error(`Entry ${idx}: invalid day ${e.day}`), { status: 502 });
    }
    if (!Number.isInteger(e.period) || e.period < 0 || e.period > 4) {
      throw Object.assign(new Error(`Entry ${idx}: invalid period ${e.period}`), { status: 502 });
    }
  });
}

async function persistTimetable(resp) {
  try {
    return await sequelize.transaction(async (t) => {
      const tt = await Timetable.create(
        {
          status: 'generated',
          meta_info: JSON.stringify({
            fallback: resp.fallback || false,
            message: resp.message,
            statistics: resp.statistics,
          }),
        },
        { transaction: t }
      );

      const rows = resp.entries.map(e => ({
        timetable_id: tt.id,
        day: e.day,
        period: e.period,
        classroom_id: e.classroom_id,
        subject_id: e.subject_id,
        faculty_id: e.faculty_id,
      }));

      await TimetableEntry.bulkCreate(rows, { transaction: t });
      console.log(`Timetable ${tt.id} persisted with ${rows.length} entries`);
      return tt;
    });
  } catch (error) {
    throw Object.assign(new Error(`Failed to persist timetable: ${error.message}`), { status: 500 });
  }
}

exports.generateTimetable = async () => {
  try {
    console.log('Starting timetable generation...');
    
    const payload = await buildSchedulingPayload();
    console.log(
      `Payload prepared: ${payload.faculties.length} faculties, ` +
      `${payload.subjects.length} subjects, ${payload.classrooms.length} classrooms`
    );

    let optimized = await sendToOptimizer(payload);

    // Use fallback if optimizer is unavailable
    if (!optimized) {
      console.log('Using fallback scheduling algorithm');
      optimized = generateFallbackSchedule(payload);
    } else {
      validateOptimizerResponse(optimized);
    }

    const timetable = await persistTimetable(optimized);
    const entries = await TimetableEntry.findAll({
      where: { timetable_id: timetable.id },
      order: [['day', 'ASC'], ['period', 'ASC']],
    });

    console.log(`Timetable generation complete: ${entries.length} entries`);
    return {
      id: timetable.id,
      entries,
      meta: timetable.meta_info ? JSON.parse(timetable.meta_info) : {},
    };
  } catch (error) {
    console.error('Timetable generation failed:', error.message);
    throw error;
  }
};
