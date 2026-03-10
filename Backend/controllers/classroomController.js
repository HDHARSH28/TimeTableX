const { Classroom } = require('../models');

exports.addClassroom = async (req, res, next) => {
  try {
    const { name, capacity } = req.body;
    if (!name || !capacity) {
      return res.status(400).json({ success: false, message: 'name and capacity are required' });
    }

    const classroom = await Classroom.create({ name, capacity });
    res.status(201).json({ success: true, data: classroom });
  } catch (err) {
    next(err);
  }
};

exports.getAllClassrooms = async (req, res, next) => {
  try {
    const classrooms = await Classroom.findAll({ order: [['id', 'ASC']] });
    res.json({ success: true, data: classrooms });
  } catch (err) {
    next(err);
  }
};
