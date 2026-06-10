const { Subject, Faculty, Department } = require('../models');

// @desc    Get all subjects
// @route   GET /api/subjects
// @access  Private
const getSubjects = async (req, res, next) => {
  try {
    const subjects = await Subject.findAll({
      include: [
        { model: Department, attributes: ['id', 'name', 'code'] },
        { model: Faculty, attributes: ['id', 'name', 'email'] }
      ],
      order: [['name', 'ASC']]
    });
    res.status(200).json({ success: true, count: subjects.length, data: subjects });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single subject
// @route   GET /api/subjects/:id
// @access  Private
const getSubject = async (req, res, next) => {
  try {
    const subject = await Subject.findByPk(req.params.id, {
      include: [
        { model: Department, attributes: ['id', 'name', 'code'] },
        { model: Faculty, attributes: ['id', 'name', 'email'] }
      ]
    });
    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found' });
    }
    res.status(200).json({ success: true, data: subject });
  } catch (error) {
    next(error);
  }
};

// @desc    Create subject
// @route   POST /api/subjects
// @access  Private/Admin
const createSubject = async (req, res, next) => {
  try {
    const { name, code, classesPerWeek, semester, facultyId, facultyIds, departmentId } = req.body;

    // Check department
    const dept = await Department.findByPk(departmentId);
    if (!dept) {
      return res.status(400).json({ success: false, message: 'Department not found' });
    }

    // Resolve final facultyIds array
    let resolvedFacultyIds = [];
    if (Array.isArray(facultyIds)) {
      resolvedFacultyIds = facultyIds;
    } else if (facultyId) {
      resolvedFacultyIds = [parseInt(facultyId, 10)];
    }

    // Verify all faculties exist
    if (resolvedFacultyIds.length > 0) {
      const faculties = await Faculty.findAll({ where: { id: resolvedFacultyIds } });
      if (faculties.length !== resolvedFacultyIds.length) {
        return res.status(400).json({ success: false, message: 'One or more faculty members not found' });
      }
    }

    const subject = await Subject.create({
      name,
      code,
      classesPerWeek,
      semester,
      departmentId
    });

    if (resolvedFacultyIds.length > 0) {
      await subject.setFaculties(resolvedFacultyIds);
    }

    // Fetch complete subject with associations for response
    const completeSubject = await Subject.findByPk(subject.id, {
      include: [
        { model: Department, attributes: ['id', 'name', 'code'] },
        { model: Faculty, attributes: ['id', 'name', 'email'] }
      ]
    });

    res.status(201).json({ success: true, data: completeSubject });
  } catch (error) {
    next(error);
  }
};

// @desc    Update subject
// @route   PUT /api/subjects/:id
// @access  Private/Admin
const updateSubject = async (req, res, next) => {
  try {
    const { name, code, classesPerWeek, semester, facultyId, facultyIds, departmentId } = req.body;

    let subject = await Subject.findByPk(req.params.id);
    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found' });
    }

    if (departmentId) {
      const dept = await Department.findByPk(departmentId);
      if (!dept) {
        return res.status(400).json({ success: false, message: 'Department not found' });
      }
    }

    // Resolve final facultyIds array
    let resolvedFacultyIds = null;
    if (Array.isArray(facultyIds)) {
      resolvedFacultyIds = facultyIds;
    } else if (facultyId) {
      resolvedFacultyIds = [parseInt(facultyId, 10)];
    }

    // Verify all faculties exist
    if (resolvedFacultyIds && resolvedFacultyIds.length > 0) {
      const faculties = await Faculty.findAll({ where: { id: resolvedFacultyIds } });
      if (faculties.length !== resolvedFacultyIds.length) {
        return res.status(400).json({ success: false, message: 'One or more faculty members not found' });
      }
    }

    subject = await subject.update({
      name,
      code,
      classesPerWeek,
      semester,
      departmentId
    });

    if (resolvedFacultyIds) {
      await subject.setFaculties(resolvedFacultyIds);
    }

    // Fetch complete subject with associations for response
    const completeSubject = await Subject.findByPk(subject.id, {
      include: [
        { model: Department, attributes: ['id', 'name', 'code'] },
        { model: Faculty, attributes: ['id', 'name', 'email'] }
      ]
    });

    res.status(200).json({ success: true, data: completeSubject });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete subject
// @route   DELETE /api/subjects/:id
// @access  Private/Admin
const deleteSubject = async (req, res, next) => {
  try {
    const subject = await Subject.findByPk(req.params.id);
    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found' });
    }
    await subject.destroy();
    res.status(200).json({ success: true, message: 'Subject deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSubjects,
  getSubject,
  createSubject,
  updateSubject,
  deleteSubject
};
