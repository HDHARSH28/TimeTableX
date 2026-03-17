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

exports.getSubjectById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const subject = await Subject.findByPk(id, {
      include: [{ model: Faculty, as: 'faculty', attributes: ['id', 'name'] }],
    });

    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found' });
    }

    res.json({ success: true, data: subject });
  } catch (err) {
    next(err);
  }
};

exports.updateSubject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, classes_per_week, faculty_id } = req.body;

    const subject = await Subject.findByPk(id);
    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found' });
    }

    if (name) subject.name = name;
    if (classes_per_week) subject.classes_per_week = classes_per_week;
    if (faculty_id) {
      const faculty = await Faculty.findByPk(faculty_id);
      if (!faculty) {
        return res.status(404).json({ success: false, message: 'Faculty not found' });
      }
      subject.faculty_id = faculty_id;
    }

    await subject.save();
    const updatedSubject = await Subject.findByPk(id, {
      include: [{ model: Faculty, as: 'faculty', attributes: ['id', 'name'] }],
    });

    res.json({ success: true, data: updatedSubject });
  } catch (err) {
    next(err);
  }
};

exports.deleteSubject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const subject = await Subject.findByPk(id);

    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found' });
    }

    await subject.destroy();
    res.json({ success: true, message: 'Subject deleted successfully' });
  } catch (err) {
    next(err);
  }
};
