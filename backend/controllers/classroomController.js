const { Classroom } = require('../models');

// @desc    Get all classrooms
// @route   GET /api/classrooms
// @access  Private
const getClassrooms = async (req, res, next) => {
  try {
    const classrooms = await Classroom.findAll({ order: [['name', 'ASC']] });
    res.status(200).json({ success: true, count: classrooms.length, data: classrooms });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single classroom
// @route   GET /api/classrooms/:id
// @access  Private
const getClassroom = async (req, res, next) => {
  try {
    const classroom = await Classroom.findByPk(req.params.id);
    if (!classroom) {
      return res.status(404).json({ success: false, message: 'Classroom not found' });
    }
    res.status(200).json({ success: true, data: classroom });
  } catch (error) {
    next(error);
  }
};

// @desc    Create classroom
// @route   POST /api/classrooms
// @access  Private/Admin
const createClassroom = async (req, res, next) => {
  try {
    const { name, capacity, type } = req.body;
    const classroom = await Classroom.create({ name, capacity, type });
    res.status(201).json({ success: true, data: classroom });
  } catch (error) {
    next(error);
  }
};

// @desc    Update classroom
// @route   PUT /api/classrooms/:id
// @access  Private/Admin
const updateClassroom = async (req, res, next) => {
  try {
    const { name, capacity, type } = req.body;

    let classroom = await Classroom.findByPk(req.params.id);
    if (!classroom) {
      return res.status(404).json({ success: false, message: 'Classroom not found' });
    }

    classroom = await classroom.update({ name, capacity, type });
    res.status(200).json({ success: true, data: classroom });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete classroom
// @route   DELETE /api/classrooms/:id
// @access  Private/Admin
const deleteClassroom = async (req, res, next) => {
  try {
    const classroom = await Classroom.findByPk(req.params.id);
    if (!classroom) {
      return res.status(404).json({ success: false, message: 'Classroom not found' });
    }
    await classroom.destroy();
    res.status(200).json({ success: true, message: 'Classroom deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getClassrooms,
  getClassroom,
  createClassroom,
  updateClassroom,
  deleteClassroom
};
