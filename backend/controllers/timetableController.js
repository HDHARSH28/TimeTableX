const { Timetable, TimetableEntry, Subject, Faculty, Classroom, Department, sequelize } = require('../models');
const { generateTimetableSchedule } = require('../services/optimizerService');

// @desc    Generate optimized timetable
// @route   POST /api/timetables/generate
// @access  Private/Admin
const generateTimetable = async (req, res, next) => {
  try {
    const { name, departmentId, semester, academicYear, workingDays, slotsPerDay, breaks, startTime, slotDuration, numBatches } = req.body;

    if (!name || !departmentId || !semester || !academicYear) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, departmentId, semester, and academicYear'
      });
    }

    const finalWorkingDays = workingDays || '1,2,3,4,5';
    const finalSlotsPerDay = slotsPerDay ? parseInt(slotsPerDay, 10) : 6;
    const finalBreaks = breaks || '';
    const finalStartTime = startTime || '08:30';
    const finalSlotDuration = slotDuration ? parseInt(slotDuration, 10) : 60;
    // Co-faculty split IDs use rem = 10 + idx, so batch numbers must stay ≤ 9
    // to avoid subject-ID collisions with that encoding.
    const finalNumBatches = numBatches ? Math.min(9, Math.max(1, parseInt(numBatches, 10))) : 3;

    // 1. Check if department exists
    const dept = await Department.findByPk(departmentId);
    if (!dept) {
      return res.status(404).json({ success: false, message: 'Department not found' });
    }

    // 2. Fetch all subjects for this department and semester
    const subjects = await Subject.findAll({
      where: { departmentId, semester },
      include: [Faculty]
    });

    if (subjects.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No subjects found for the selected department and semester. Cannot generate timetable.'
      });
    }

    // 3. Fetch all unique faculty assigned to these subjects
    const allAssignedFaculty = [];
    const facultySeen = new Set();
    subjects.forEach(s => {
      if (s.Faculties) {
        s.Faculties.forEach(f => {
          if (!facultySeen.has(f.id)) {
            facultySeen.add(f.id);
            allAssignedFaculty.push(f);
          }
        });
      }
    });

    // 4. Fetch all classrooms
    const classrooms = await Classroom.findAll({ raw: true });
    if (classrooms.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No classrooms registered. Please register classrooms before generating a timetable.'
      });
    }

    // 5. Prepare payload for optimizer service
    const optimizerSubjects = [];
    subjects.forEach(s => {
      const assignedFaculties = s.Faculties || [];
      
      if (s.type === 'both') {
        const theoryClasses = Math.ceil(s.classesPerWeek / 2);
        const labClasses = s.classesPerWeek - theoryClasses;

        // 1. Push Theory part — split across co-faculty consistently with pure-theory logic
        if (assignedFaculties.length <= 1) {
          optimizerSubjects.push({
            id: s.id,
            name: `${s.name} (Theory)`,
            code: s.code,
            classesPerWeek: theoryClasses,
            facultyId: assignedFaculties.length === 1 ? assignedFaculties[0].id : null,
            departmentId: s.departmentId,
            semester: s.semester,
            type: 'theory'
          });
        } else {
          // Multiple co-faculty: distribute theoryClasses proportionally
          const F = assignedFaculties.length;
          const baseClasses = Math.floor(theoryClasses / F);
          const remainder = theoryClasses % F;
          assignedFaculties.forEach((fac, idx) => {
            const facClasses = baseClasses + (idx < remainder ? 1 : 0);
            if (facClasses > 0) {
              optimizerSubjects.push({
                id: s.id * 10000 + 10 + idx, // same co-faculty split encoding as pure theory
                name: `${s.name} (Theory – ${fac.name})`,
                code: s.code,
                classesPerWeek: facClasses,
                facultyId: fac.id,
                departmentId: s.departmentId,
                semester: s.semester,
                type: 'theory'
              });
            }
          });
        }

        // 2. Push Lab part (B1 … B{numBatches})
        if (labClasses > 0) {
          for (let b = 1; b <= finalNumBatches; b++) {
            const fac = assignedFaculties.length > 0 
              ? assignedFaculties[(b - 1) % assignedFaculties.length] 
              : null;
            
            optimizerSubjects.push({
              id: s.id * 10000 + b,
              name: `${s.name} (B${b})`,
              code: s.code,
              classesPerWeek: labClasses,
              facultyId: fac ? fac.id : null,
              departmentId: s.departmentId,
              semester: s.semester,
              type: 'lab'
            });
          }
        }
      } else if (s.type === 'lab') {
        // Generate B1 … B{numBatches} batches
        for (let b = 1; b <= finalNumBatches; b++) {
          const fac = assignedFaculties.length > 0 
            ? assignedFaculties[(b - 1) % assignedFaculties.length] 
            : null;
          
          optimizerSubjects.push({
            id: s.id * 10000 + b,
            name: `${s.name} (B${b})`,
            code: s.code,
            classesPerWeek: s.classesPerWeek,
            facultyId: fac ? fac.id : null,
            departmentId: s.departmentId,
            semester: s.semester,
            type: 'lab'
          });
        }
      } else {
        // Theory or Tutorial
        const sType = s.type || 'theory';
        if (assignedFaculties.length === 0) {
          optimizerSubjects.push({
            id: s.id,
            name: s.name,
            code: s.code,
            classesPerWeek: s.classesPerWeek,
            facultyId: null,
            departmentId: s.departmentId,
            semester: s.semester,
            type: sType
          });
        } else if (assignedFaculties.length === 1) {
          optimizerSubjects.push({
            id: s.id,
            name: s.name,
            code: s.code,
            classesPerWeek: s.classesPerWeek,
            facultyId: assignedFaculties[0].id,
            departmentId: s.departmentId,
            semester: s.semester,
            type: sType
          });
        } else {
          // Split classesPerWeek among co-assigned faculties
          const F = assignedFaculties.length;
          const C = s.classesPerWeek;
          const baseClasses = Math.floor(C / F);
          const remainder = C % F;
          
          assignedFaculties.forEach((fac, idx) => {
            const facClasses = baseClasses + (idx < remainder ? 1 : 0);
            if (facClasses > 0) {
              optimizerSubjects.push({
                id: s.id * 10000 + 10 + idx, // Unique sub-subject ID for optimizer
                name: `${s.name} (${fac.name})`,
                code: s.code,
                classesPerWeek: facClasses,
                facultyId: fac.id,
                departmentId: s.departmentId,
                semester: s.semester,
                type: sType
              });
            }
          });
        }
      }
    });

    const facultyAvailability = {};
    allAssignedFaculty.forEach(f => {
      const fDays = f.workingDays || '1,2,3,4,5';
      facultyAvailability[f.id] = fDays.split(',').map(d => parseInt(d, 10));
    });

    const parsedWorkingDays = finalWorkingDays.split(',').map(d => parseInt(d, 10));
    const parsedBreaks = finalBreaks.trim() ? finalBreaks.split(',').map(b => parseInt(b, 10)) : [];

    for (const b of parsedBreaks) {
      if (b <= 1 || b >= finalSlotsPerDay) {
        return res.status(400).json({
          success: false,
          message: `Breaks cannot be placed at the start (Period 1) or end (Period ${finalSlotsPerDay}) of the day. They must be scheduled in the middle.`
        });
      }
    }

    const optimizerPayload = {
      subjects: optimizerSubjects,
      faculty: allAssignedFaculty.map(f => ({
        id: f.id,
        name: f.name,
        maxClassesPerDay: f.maxClassesPerDay
      })),
      classrooms: classrooms.map(c => ({
        id: c.id,
        name: c.name,
        capacity: c.capacity,
        type: c.type
      })),
      days: Math.max(...parsedWorkingDays, 5),
      slots_per_day: finalSlotsPerDay,
      working_days: parsedWorkingDays,
      breaks: parsedBreaks,
      faculty_availability: facultyAvailability
    };

    // 6. Call Python Optimizer
    const optimizationResult = await generateTimetableSchedule(optimizerPayload);

    if (optimizationResult.status !== 'feasible' && optimizationResult.status !== 'optimal') {
      return res.status(422).json({
        success: false,
        status: optimizationResult.status,
        message: 'Optimization failed. The constraints specified are unsolvable. Please check faculty/classroom workloads or capacity.'
      });
    }

    // 7 & 8. Persist Timetable + TimetableEntries atomically.
    // If bulkCreate fails (bad FK, connection blip, etc.) the transaction rolls
    // back so we never end up with an orphaned Timetable row that has no entries.
    const timetableEntries = optimizationResult.schedule.map(entry => {
      let originalSubjectId = entry.subject_id;
      let batch = null;

      if (entry.subject_id >= 10000) {
        originalSubjectId = Math.floor(entry.subject_id / 10000);
        const rem = entry.subject_id % 10000;
        // A rem in [1..finalNumBatches] encodes a lab batch; higher values
        // (10, 11, …) encode co-faculty splits and carry no batch label.
        if (rem >= 1 && rem <= finalNumBatches) {
          batch = `B${rem}`;
        }
      }

      return {
        subjectId: originalSubjectId,
        facultyId: entry.faculty_id,
        classroomId: entry.classroom_id,
        dayOfWeek: entry.day_of_week,
        slotIndex: entry.slot_index,
        batch
      };
    });

    let completeTimetable;
    await sequelize.transaction(async (t) => {
      const timetable = await Timetable.create(
        {
          name,
          departmentId,
          semester,
          academicYear,
          status: 'draft',
          workingDays: finalWorkingDays,
          slotsPerDay: finalSlotsPerDay,
          breaks: finalBreaks,
          startTime: finalStartTime,
          slotDuration: finalSlotDuration
        },
        { transaction: t }
      );

      const entriesWithId = timetableEntries.map(e => ({ ...e, timetableId: timetable.id }));
      await TimetableEntry.bulkCreate(entriesWithId, { transaction: t });

      completeTimetable = await Timetable.findByPk(timetable.id, {
        transaction: t,
        include: [
          { model: Department, attributes: ['id', 'name', 'code'] },
          {
            model: TimetableEntry,
            include: [
              { model: Subject, attributes: ['id', 'name', 'code'] },
              { model: Faculty, attributes: ['id', 'name', 'email'] },
              { model: Classroom, attributes: ['id', 'name', 'capacity', 'type'] }
            ]
          }
        ]
      });
    });

    res.status(201).json({
      success: true,
      message: 'Timetable generated and saved successfully',
      data: completeTimetable
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all timetables
// @route   GET /api/timetables
// @access  Private
const getTimetables = async (req, res, next) => {
  try {
    const timetables = await Timetable.findAll({
      include: [{ model: Department, attributes: ['id', 'name', 'code'] }],
      order: [['createdAt', 'DESC']]
    });
    res.status(200).json({ success: true, count: timetables.length, data: timetables });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single timetable with all entries
// @route   GET /api/timetables/:id
// @access  Private
const getTimetable = async (req, res, next) => {
  try {
    const timetable = await Timetable.findByPk(req.params.id, {
      include: [
        { model: Department, attributes: ['id', 'name', 'code'] },
        {
          model: TimetableEntry,
          include: [
            { model: Subject, attributes: ['id', 'name', 'code'] },
            { model: Faculty, attributes: ['id', 'name', 'email'] },
            { model: Classroom, attributes: ['id', 'name', 'capacity', 'type'] }
          ]
        }
      ]
    });

    if (!timetable) {
      return res.status(404).json({ success: false, message: 'Timetable not found' });
    }

    res.status(200).json({ success: true, data: timetable });
  } catch (error) {
    next(error);
  }
};

// @desc    Update timetable status
// @route   PUT /api/timetables/:id/status
// @access  Private/Admin
const updateTimetableStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!status || !['draft', 'published'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Valid status required: draft or published' });
    }

    let timetable = await Timetable.findByPk(req.params.id);
    if (!timetable) {
      return res.status(404).json({ success: false, message: 'Timetable not found' });
    }

    timetable = await timetable.update({ status });
    res.status(200).json({ success: true, data: timetable });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete timetable
// @route   DELETE /api/timetables/:id
// @access  Private/Admin
const deleteTimetable = async (req, res, next) => {
  try {
    const timetable = await Timetable.findByPk(req.params.id);
    if (!timetable) {
      return res.status(404).json({ success: false, message: 'Timetable not found' });
    }
    await timetable.destroy();
    res.status(200).json({ success: true, message: 'Timetable deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Export timetable as CSV format
// @route   GET /api/timetables/:id/export
// @access  Private
const exportTimetable = async (req, res, next) => {
  try {
    const timetable = await Timetable.findByPk(req.params.id, {
      include: [
        { model: Department, attributes: ['name'] },
        {
          model: TimetableEntry,
          include: [
            { model: Subject, attributes: ['name', 'code'] },
            { model: Faculty, attributes: ['name'] },
            { model: Classroom, attributes: ['name'] }
          ]
        }
      ]
    });

    if (!timetable) {
      return res.status(404).json({ success: false, message: 'Timetable not found' });
    }

    // Convert entries to CSV
    let csv = 'Day,Slot,Subject Code,Subject Name,Faculty,Classroom\n';
    const dayNames = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    const parts = (timetable.startTime || '08:30').split(':');
    const startHour = isNaN(parseInt(parts[0], 10)) ? 8 : parseInt(parts[0], 10);
    const startMin = isNaN(parseInt(parts[1], 10)) ? 30 : parseInt(parts[1], 10);
    const duration = timetable.slotDuration || 60;

    const formatTime = (totalMinutes) => {
      const hours = Math.floor(totalMinutes / 60) % 24;
      const mins = totalMinutes % 60;
      return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
    };

    const getTimeForPeriod = (pIndex) => {
      const startTotalMinutes = startHour * 60 + startMin + (pIndex - 1) * duration;
      const endTotalMinutes = startTotalMinutes + duration;
      return `${formatTime(startTotalMinutes)} - ${formatTime(endTotalMinutes)}`;
    };

    // Sort entries by day and slot index
    const sortedEntries = [...timetable.TimetableEntries].sort((a, b) => {
      if (a.dayOfWeek !== b.dayOfWeek) return a.dayOfWeek - b.dayOfWeek;
      return a.slotIndex - b.slotIndex;
    });

    // RFC 4180: escape embedded double-quotes by doubling them.
    const csvEscape = (val) => String(val ?? '').replace(/"/g, '""');

    sortedEntries.forEach(entry => {
      const day = dayNames[entry.dayOfWeek] || entry.dayOfWeek;
      const slot = `Period ${entry.slotIndex} (${getTimeForPeriod(entry.slotIndex)})`;
      const code = entry.Subject ? (entry.Subject.code + (entry.batch ? `: ${entry.batch}` : '')) : 'N/A';
      const subject = entry.Subject ? entry.Subject.name : 'N/A';
      const faculty = entry.Faculty ? entry.Faculty.name : 'N/A';
      const classroom = entry.Classroom ? entry.Classroom.name : 'N/A';
      csv += `"${csvEscape(day)}","${csvEscape(slot)}","${csvEscape(code)}","${csvEscape(subject)}","${csvEscape(faculty)}","${csvEscape(classroom)}"\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=timetable_${timetable.id}.csv`);
    return res.status(200).send(csv);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  generateTimetable,
  getTimetables,
  getTimetable,
  updateTimetableStatus,
  deleteTimetable,
  exportTimetable
};
