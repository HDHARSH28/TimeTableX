const { Timetable, TimetableEntry, Subject, Faculty, Classroom, Department } = require('../models');
const { generateTimetableSchedule } = require('../services/optimizerService');

// @desc    Generate optimized timetable
// @route   POST /api/timetables/generate
// @access  Private/Admin
const generateTimetable = async (req, res, next) => {
  try {
    const { name, departmentId, semester, academicYear } = req.body;

    if (!name || !departmentId || !semester || !academicYear) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, departmentId, semester, and academicYear'
      });
    }

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
      if (assignedFaculties.length === 0) {
        // No faculty assigned
        optimizerSubjects.push({
          id: s.id,
          name: s.name,
          code: s.code,
          classesPerWeek: s.classesPerWeek,
          facultyId: null,
          departmentId: s.departmentId,
          semester: s.semester
        });
      } else if (assignedFaculties.length === 1) {
        // Exactly one faculty
        optimizerSubjects.push({
          id: s.id,
          name: s.name,
          code: s.code,
          classesPerWeek: s.classesPerWeek,
          facultyId: assignedFaculties[0].id,
          departmentId: s.departmentId,
          semester: s.semester
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
              id: s.id * 1000 + idx, // Unique sub-subject ID for optimizer
              name: `${s.name} (${fac.name})`,
              code: s.code,
              classesPerWeek: facClasses,
              facultyId: fac.id,
              departmentId: s.departmentId,
              semester: s.semester
            });
          }
        });
      }
    });

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
      days: 5,
      slots_per_day: 6
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

    // 7. Create Timetable record
    const timetable = await Timetable.create({
      name,
      departmentId,
      semester,
      academicYear,
      status: 'draft'
    });

    // 8. Create TimetableEntries
    const timetableEntries = optimizationResult.schedule.map(entry => {
      // Map sub-subject ID back to original subject ID
      const originalSubjectId = entry.subject_id >= 1000 ? Math.floor(entry.subject_id / 1000) : entry.subject_id;
      return {
        timetableId: timetable.id,
        subjectId: originalSubjectId,
        facultyId: entry.faculty_id,
        classroomId: entry.classroom_id,
        dayOfWeek: entry.day_of_week,
        slotIndex: entry.slot_index
      };
    });

    await TimetableEntry.bulkCreate(timetableEntries);

    // 9. Fetch saved complete timetable
    const completeTimetable = await Timetable.findByPk(timetable.id, {
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

    // Sort entries by day and slot index
    const sortedEntries = [...timetable.TimetableEntries].sort((a, b) => {
      if (a.dayOfWeek !== b.dayOfWeek) return a.dayOfWeek - b.dayOfWeek;
      return a.slotIndex - b.slotIndex;
    });

    sortedEntries.forEach(entry => {
      const day = dayNames[entry.dayOfWeek] || entry.dayOfWeek;
      const slot = `Period ${entry.slotIndex}`;
      const code = entry.Subject ? entry.Subject.code : 'N/A';
      const subject = entry.Subject ? entry.Subject.name : 'N/A';
      const faculty = entry.Faculty ? entry.Faculty.name : 'N/A';
      const classroom = entry.Classroom ? entry.Classroom.name : 'N/A';
      csv += `"${day}","${slot}","${code}","${subject}","${faculty}","${classroom}"\n`;
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
