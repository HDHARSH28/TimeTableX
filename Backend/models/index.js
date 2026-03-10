const sequelize = require('../config/database');
const Faculty = require('./faculty');
const Subject = require('./subject');
const Classroom = require('./classroom');
const Timetable = require('./timetable');
const TimetableEntry = require('./timetableEntry');

// Associations
Faculty.hasMany(Subject, { foreignKey: 'faculty_id', as: 'subjects' });
Subject.belongsTo(Faculty, { foreignKey: 'faculty_id', as: 'faculty' });

Timetable.hasMany(TimetableEntry, { foreignKey: 'timetable_id', as: 'entries' });
TimetableEntry.belongsTo(Timetable, { foreignKey: 'timetable_id', as: 'timetable' });

Classroom.hasMany(TimetableEntry, { foreignKey: 'classroom_id', as: 'timetableEntries' });
TimetableEntry.belongsTo(Classroom, { foreignKey: 'classroom_id', as: 'classroom' });

Subject.hasMany(TimetableEntry, { foreignKey: 'subject_id', as: 'timetableEntries' });
TimetableEntry.belongsTo(Subject, { foreignKey: 'subject_id', as: 'subject' });

Faculty.hasMany(TimetableEntry, { foreignKey: 'faculty_id', as: 'timetableEntries' });
TimetableEntry.belongsTo(Faculty, { foreignKey: 'faculty_id', as: 'faculty' });

module.exports = {
  sequelize,
  Faculty,
  Subject,
  Classroom,
  Timetable,
  TimetableEntry,
};
