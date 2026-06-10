const { sequelize, Department, Classroom, Faculty, Subject } = require('../models');

// @desc    Import Departments from JSON/CSV parsed data
// @route   POST /api/import/departments
// @access  Private/Admin
const importDepartments = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { data } = req.body;
    if (!Array.isArray(data)) {
      return res.status(400).json({ success: false, message: 'Invalid data format. Expected an array of records.' });
    }

    const imported = [];
    for (let i = 0; i < data.length; i++) {
      const item = data[i];
      const name = item.name?.trim();
      const code = item.code?.trim();

      if (!name || !code) {
        throw new Error(`Row ${i + 1}: Name and Code are required.`);
      }

      // Find by code to check existence
      let dept = await Department.findOne({ where: { code }, transaction });
      if (dept) {
        dept.name = name;
        await dept.save({ transaction });
        imported.push(dept);
      } else {
        const newDept = await Department.create({ name, code }, { transaction });
        imported.push(newDept);
      }
    }

    await transaction.commit();
    res.status(200).json({
      success: true,
      count: imported.length,
      message: `${imported.length} departments imported successfully.`
    });
  } catch (error) {
    await transaction.rollback();
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Import Classrooms from JSON/CSV parsed data
// @route   POST /api/import/classrooms
// @access  Private/Admin
const importClassrooms = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { data } = req.body;
    if (!Array.isArray(data)) {
      return res.status(400).json({ success: false, message: 'Invalid data format. Expected an array of records.' });
    }

    const imported = [];
    for (let i = 0; i < data.length; i++) {
      const item = data[i];
      const name = item.name?.trim();
      const capacityVal = parseInt(item.capacity, 10);
      const type = item.type?.trim()?.toLowerCase();

      if (!name || isNaN(capacityVal) || capacityVal <= 0 || !type) {
        throw new Error(`Row ${i + 1}: Name, valid positive Capacity, and Type are required.`);
      }

      if (type !== 'classroom' && type !== 'lab') {
        throw new Error(`Row ${i + 1}: Invalid classroom type "${type}". Type must be either "classroom" or "lab".`);
      }

      let classroom = await Classroom.findOne({ where: { name }, transaction });
      if (classroom) {
        classroom.capacity = capacityVal;
        classroom.type = type;
        await classroom.save({ transaction });
        imported.push(classroom);
      } else {
        const newClassroom = await Classroom.create({ name, capacity: capacityVal, type }, { transaction });
        imported.push(newClassroom);
      }
    }

    await transaction.commit();
    res.status(200).json({
      success: true,
      count: imported.length,
      message: `${imported.length} classrooms imported successfully.`
    });
  } catch (error) {
    await transaction.rollback();
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Import Faculty from JSON/CSV parsed data
// @route   POST /api/import/faculty
// @access  Private/Admin
const importFaculty = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { data } = req.body;
    if (!Array.isArray(data)) {
      return res.status(400).json({ success: false, message: 'Invalid data format. Expected an array of records.' });
    }

    const imported = [];
    for (let i = 0; i < data.length; i++) {
      const item = data[i];
      const name = item.name?.trim();
      const email = item.email?.trim();
      const maxClassesPerDayVal = parseInt(item.maxClassesPerDay, 10);
      const departmentCode = item.departmentCode?.trim();

      if (!name || !email || !departmentCode) {
        throw new Error(`Row ${i + 1}: Name, Email, and Department Code are required.`);
      }

      const maxClasses = isNaN(maxClassesPerDayVal) ? 3 : maxClassesPerDayVal;
      if (maxClasses < 1 || maxClasses > 10) {
        throw new Error(`Row ${i + 1}: maxClassesPerDay must be between 1 and 10.`);
      }

      // Verify email format basically
      if (!email.includes('@')) {
        throw new Error(`Row ${i + 1}: Invalid email address "${email}".`);
      }

      // Resolve department by code
      const dept = await Department.findOne({ where: { code: departmentCode }, transaction });
      if (!dept) {
        throw new Error(`Row ${i + 1}: Department with code "${departmentCode}" not found. Please create or import it first.`);
      }

      let faculty = await Faculty.findOne({ where: { email }, transaction });
      if (faculty) {
        faculty.name = name;
        faculty.maxClassesPerDay = maxClasses;
        faculty.departmentId = dept.id;
        await faculty.save({ transaction });
        imported.push(faculty);
      } else {
        const newFaculty = await Faculty.create({
          name,
          email,
          maxClassesPerDay: maxClasses,
          departmentId: dept.id
        }, { transaction });
        imported.push(newFaculty);
      }
    }

    await transaction.commit();
    res.status(200).json({
      success: true,
      count: imported.length,
      message: `${imported.length} faculty members imported successfully.`
    });
  } catch (error) {
    await transaction.rollback();
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Import Subjects from JSON/CSV parsed data
// @route   POST /api/import/subjects
// @access  Private/Admin
const importSubjects = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { data } = req.body;
    if (!Array.isArray(data)) {
      return res.status(400).json({ success: false, message: 'Invalid data format. Expected an array of records.' });
    }

    const imported = [];
    for (let i = 0; i < data.length; i++) {
      const item = data[i];
      const name = item.name?.trim();
      const code = item.code?.trim();
      const classesPerWeekVal = parseInt(item.classesPerWeek, 10);
      const semesterVal = parseInt(item.semester, 10);
      const departmentCode = item.departmentCode?.trim();
      const type = item.type?.trim()?.toLowerCase() || 'theory';
      const facultyEmailsStr = item.facultyEmails || '';

      if (!name || !code || isNaN(classesPerWeekVal) || isNaN(semesterVal) || !departmentCode) {
        throw new Error(`Row ${i + 1}: Name, Code, classesPerWeek (number), semester (number), and Department Code are required.`);
      }

      if (classesPerWeekVal < 1 || classesPerWeekVal > 10) {
        throw new Error(`Row ${i + 1}: classesPerWeek must be between 1 and 10.`);
      }

      if (semesterVal < 1 || semesterVal > 8) {
        throw new Error(`Row ${i + 1}: semester must be between 1 and 8.`);
      }

      if (type !== 'theory' && type !== 'lab' && type !== 'tutorial' && type !== 'both') {
        throw new Error(`Row ${i + 1}: Invalid subject type "${type}". Type must be "theory", "lab", "tutorial", or "both".`);
      }

      // Resolve department by code
      const dept = await Department.findOne({ where: { code: departmentCode }, transaction });
      if (!dept) {
        throw new Error(`Row ${i + 1}: Department with code "${departmentCode}" not found. Please create or import it first.`);
      }

      // Resolve faculty members by their email list
      const resolvedFacultyIds = [];
      if (facultyEmailsStr.trim()) {
        // Support semicolon or comma separation
        const emails = facultyEmailsStr.split(/[;,]/).map(e => e.trim()).filter(Boolean);
        for (const email of emails) {
          const facultyObj = await Faculty.findOne({ where: { email }, transaction });
          if (!facultyObj) {
            throw new Error(`Row ${i + 1}: Faculty with email "${email}" not found. Please import or create this faculty member first.`);
          }
          resolvedFacultyIds.push(facultyObj.id);
        }
      }

      let subject = await Subject.findOne({ where: { code }, transaction });
      if (subject) {
        subject.name = name;
        subject.classesPerWeek = classesPerWeekVal;
        subject.semester = semesterVal;
        subject.departmentId = dept.id;
        subject.type = type;
        await subject.save({ transaction });
      } else {
        subject = await Subject.create({
          name,
          code,
          classesPerWeek: classesPerWeekVal,
          semester: semesterVal,
          departmentId: dept.id,
          type
        }, { transaction });
      }

      // Sync faculties through the junction table
      await subject.setFaculties(resolvedFacultyIds, { transaction });
      imported.push(subject);
    }

    await transaction.commit();
    res.status(200).json({
      success: true,
      count: imported.length,
      message: `${imported.length} subjects imported successfully.`
    });
  } catch (error) {
    await transaction.rollback();
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = {
  importDepartments,
  importClassrooms,
  importFaculty,
  importSubjects
};
