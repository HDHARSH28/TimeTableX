const { Faculty, Subject } = require('../models');

exports.addFaculty = async (req, res, next) => {
  try {
    const { name, max_classes_per_day, subject_ids } = req.body;
    if (!name || !max_classes_per_day) {
      return res.status(400).json({ success: false, message: 'name and max_classes_per_day are required' });
    }

    const faculty = await Faculty.create({ name, max_classes_per_day });

    if (Array.isArray(subject_ids) && subject_ids.length) {
      await Subject.update(
        { faculty_id: faculty.id },
        { where: { id: subject_ids } }
      );
    }

    const subjects = await Subject.findAll({ where: { faculty_id: faculty.id }, attributes: ['id'] });
    res.status(201).json({ success: true, data: { ...faculty.toJSON(), subject_ids: subjects.map(s => s.id) } });
  } catch (err) {
    next(err);
  }
};

exports.getAllFaculty = async (req, res, next) => {
  try {
    const faculties = await Faculty.findAll({
      include: [{ model: Subject, as: 'subjects', attributes: ['id'] }],
      order: [['id', 'ASC']],
    });

    const data = faculties.map(f => ({
      id: f.id,
      name: f.name,
      max_classes_per_day: f.max_classes_per_day,
      subject_ids: (f.subjects || []).map(s => s.id),
    }));

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};
