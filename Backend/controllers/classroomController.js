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

exports.getClassroomById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const classroom = await Classroom.findByPk(id);

    if (!classroom) {
      return res.status(404).json({ success: false, message: 'Classroom not found' });
    }

    res.json({ success: true, data: classroom });
  } catch (err) {
    next(err);
  }
};

exports.updateClassroom = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, capacity } = req.body;

    const classroom = await Classroom.findByPk(id);
    if (!classroom) {
      return res.status(404).json({ success: false, message: 'Classroom not found' });
    }

    if (name) classroom.name = name;
    if (capacity) classroom.capacity = capacity;
    await classroom.save();

    res.json({ success: true, data: classroom });
  } catch (err) {
    next(err);
  }
};

exports.deleteClassroom = async (req, res, next) => {
  try {
    const { id } = req.params;
    const classroom = await Classroom.findByPk(id);

    if (!classroom) {
      return res.status(404).json({ success: false, message: 'Classroom not found' });
    }

    await classroom.destroy();
    res.json({ success: true, message: 'Classroom deleted successfully' });
  } catch (err) {
    next(err);
  }
};
