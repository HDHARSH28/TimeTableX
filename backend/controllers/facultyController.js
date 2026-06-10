const { Faculty, Department } = require('../models');

// @desc    Get all faculty
// @route   GET /api/faculty
// @access  Private
const getFaculties = async (req, res, next) => {
  try {
    const faculties = await Faculty.findAll({
      include: [{ model: Department, attributes: ['id', 'name', 'code'] }],
      order: [['name', 'ASC']]
    });
    res.status(200).json({ success: true, count: faculties.length, data: faculties });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single faculty member
// @route   GET /api/faculty/:id
// @access  Private
const getFaculty = async (req, res, next) => {
  try {
    const faculty = await Faculty.findByPk(req.params.id, {
      include: [{ model: Department, attributes: ['id', 'name', 'code'] }]
    });
    if (!faculty) {
      return res.status(404).json({ success: false, message: 'Faculty member not found' });
    }
    res.status(200).json({ success: true, data: faculty });
  } catch (error) {
    next(error);
  }
};

// @desc    Create faculty member
// @route   POST /api/faculty
// @access  Private/Admin
const createFaculty = async (req, res, next) => {
  try {
    const { name, email, maxClassesPerDay, departmentId } = req.body;

    // Check if department exists
    const dept = await Department.findByPk(departmentId);
    if (!dept) {
      return res.status(400).json({ success: false, message: 'Department not found' });
    }

    const faculty = await Faculty.create({
      name,
      email,
      maxClassesPerDay,
      departmentId
    });

    res.status(201).json({ success: true, data: faculty });
  } catch (error) {
    next(error);
  }
};

// @desc    Update faculty member
// @route   PUT /api/faculty/:id
// @access  Private/Admin
const updateFaculty = async (req, res, next) => {
  try {
    const { name, email, maxClassesPerDay, departmentId } = req.body;

    let faculty = await Faculty.findByPk(req.params.id);
    if (!faculty) {
      return res.status(404).json({ success: false, message: 'Faculty member not found' });
    }

    if (departmentId) {
      const dept = await Department.findByPk(departmentId);
      if (!dept) {
        return res.status(400).json({ success: false, message: 'Department not found' });
      }
    }

    faculty = await faculty.update({
      name,
      email,
      maxClassesPerDay,
      departmentId
    });

    res.status(200).json({ success: true, data: faculty });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete faculty member
// @route   DELETE /api/faculty/:id
// @access  Private/Admin
const deleteFaculty = async (req, res, next) => {
  try {
    const faculty = await Faculty.findByPk(req.params.id);
    if (!faculty) {
      return res.status(404).json({ success: false, message: 'Faculty member not found' });
    }
    await faculty.destroy();
    res.status(200).json({ success: true, message: 'Faculty member deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getFaculties,
  getFaculty,
  createFaculty,
  updateFaculty,
  deleteFaculty
};
