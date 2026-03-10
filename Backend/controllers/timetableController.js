const { Timetable, TimetableEntry, Classroom, Subject, Faculty } = require('../models');
const schedulerService = require('../services/schedulerService');

exports.generateTimetable = async (req, res, next) => {
  try {
    const result = await schedulerService.generateTimetable();
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

exports.getTimetable = async (req, res, next) => {
  try {
    const { id } = req.params;
    const tt = await Timetable.findByPk(id, {
      include: [{
        model: TimetableEntry,
        as: 'entries',
        include: [
          { model: Classroom, as: 'classroom' },
          { model: Subject, as: 'subject' },
          { model: Faculty, as: 'faculty' },
        ],
      }],
    });
    if (!tt) return res.status(404).json({ success: false, message: 'Timetable not found' });
    res.json({ success: true, data: tt });
  } catch (err) {
    next(err);
  }
};
