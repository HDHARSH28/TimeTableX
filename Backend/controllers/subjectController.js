const { Subject, Faculty } = require('../models');

exports.addSubject = async (req, res, next) => {
  try {
    const { name, classes_per_week, faculty_id } = req.body;
    if (!name || !classes_per_week || !faculty_id) {
      return res.status(400).json({ success: false, message: 'name, classes_per_week and faculty_id are required' });
    }

    const faculty = await Faculty.findByPk(faculty_id);
    if (!faculty) {
      return res.status(404).json({ success: false, message: 'Faculty not found' });
    }

    const subject = await Subject.create({ name, classes_per_week, faculty_id });
    res.status(201).json({ success: true, data: subject });
  } catch (err) {
    next(err);
  }
};

exports.getAllSubjects = async (req, res, next) => {
  try {
    const subjects = await Subject.findAll({
      include: [{ model: Faculty, as: 'faculty', attributes: ['id', 'name'] }],
      order: [['id', 'ASC']],
    });
    res.json({ success: true, data: subjects });
  } catch (err) {
    next(err);
  }
};
