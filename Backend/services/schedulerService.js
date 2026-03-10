const axios = require('axios');
const sequelize = require('../config/database');
const { Faculty, Subject, Classroom, Timetable, TimetableEntry } = require('../models');

async function buildSchedulingPayload() {
  const faculties = await Faculty.findAll({ include: [{ model: Subject, as: 'subjects', attributes: ['id'] }] });
  const subjects = await Subject.findAll();
  const classrooms = await Classroom.findAll();

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
}

async function sendToOptimizer(payload) {
  const url = process.env.OPTIMIZER_URL || 'http://localhost:8000/optimize';
  const { data } = await axios.post(url, payload, { timeout: 60_000 });
  return data;
}

function validateOptimizerResponse(resp) {
  if (!resp || !Array.isArray(resp.entries)) {
    throw Object.assign(new Error('Invalid optimizer response: expected entries array'), { status: 502 });
  }
  // Basic structural validation
  resp.entries.forEach((e, idx) => {
    const required = ['day', 'period', 'classroom_id', 'subject_id', 'faculty_id'];
    required.forEach(k => {
      if (typeof e[k] === 'undefined' || e[k] === null) {
        throw Object.assign(new Error(`Optimizer entry ${idx} missing field ${k}`), { status: 502 });
      }
    });
  });
}

async function persistTimetable(resp) {
  return await sequelize.transaction(async (t) => {
    const tt = await Timetable.create({ status: 'generated' }, { transaction: t });
    const rows = resp.entries.map(e => ({
      timetable_id: tt.id,
      day: e.day,
      period: e.period,
      classroom_id: e.classroom_id,
      subject_id: e.subject_id,
      faculty_id: e.faculty_id,
    }));
    await TimetableEntry.bulkCreate(rows, { transaction: t });
    return tt;
  });
}

exports.generateTimetable = async () => {
  const payload = await buildSchedulingPayload();
  const optimized = await sendToOptimizer(payload);
  validateOptimizerResponse(optimized);
  const timetable = await persistTimetable(optimized);
  const entries = await TimetableEntry.findAll({ where: { timetable_id: timetable.id }, order: [['day', 'ASC'], ['period', 'ASC']] });
  return { id: timetable.id, entries };
};
