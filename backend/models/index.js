const sequelize = require('../config/database');
const User = require('./user');
const Department = require('./department');
const Faculty = require('./faculty');
const Subject = require('./subject');
const Classroom = require('./classroom');
const Timetable = require('./timetable');
const TimetableEntry = require('./timetableEntry');

// 1. Department <-> Faculty
Department.hasMany(Faculty, { foreignKey: 'departmentId', onDelete: 'CASCADE' });
Faculty.belongsTo(Department, { foreignKey: 'departmentId' });

// 2. Department <-> Subject
Department.hasMany(Subject, { foreignKey: 'departmentId', onDelete: 'CASCADE' });
Subject.belongsTo(Department, { foreignKey: 'departmentId' });

// 3. Faculty <-> Subject (Assigned faculty for a course)
Faculty.belongsToMany(Subject, { through: 'SubjectFaculty', foreignKey: 'facultyId', otherKey: 'subjectId', onDelete: 'CASCADE' });
Subject.belongsToMany(Faculty, { through: 'SubjectFaculty', foreignKey: 'subjectId', otherKey: 'facultyId', onDelete: 'CASCADE' });

// 4. Department <-> Timetable
Department.hasMany(Timetable, { foreignKey: 'departmentId', onDelete: 'CASCADE' });
Timetable.belongsTo(Department, { foreignKey: 'departmentId' });

// 5. Timetable <-> TimetableEntry
Timetable.hasMany(TimetableEntry, { foreignKey: 'timetableId', onDelete: 'CASCADE' });
TimetableEntry.belongsTo(Timetable, { foreignKey: 'timetableId' });

// 6. Subject <-> TimetableEntry
Subject.hasMany(TimetableEntry, { foreignKey: 'subjectId', onDelete: 'CASCADE' });
TimetableEntry.belongsTo(Subject, { foreignKey: 'subjectId' });

// 7. Faculty <-> TimetableEntry
Faculty.hasMany(TimetableEntry, { foreignKey: 'facultyId', onDelete: 'CASCADE' });
TimetableEntry.belongsTo(Faculty, { foreignKey: 'facultyId' });

// 8. Classroom <-> TimetableEntry
Classroom.hasMany(TimetableEntry, { foreignKey: 'classroomId', onDelete: 'CASCADE' });
TimetableEntry.belongsTo(Classroom, { foreignKey: 'classroomId' });

module.exports = {
  sequelize,
  User,
  Department,
  Faculty,
  Subject,
  Classroom,
  Timetable,
  TimetableEntry
};
