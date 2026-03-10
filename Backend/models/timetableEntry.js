const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TimetableEntry = sequelize.define(
  'TimetableEntry',
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    timetable_id: { type: DataTypes.INTEGER, allowNull: false },
    day: { type: DataTypes.STRING, allowNull: false },
    period: { type: DataTypes.INTEGER, allowNull: false },
    classroom_id: { type: DataTypes.INTEGER, allowNull: false },
    subject_id: { type: DataTypes.INTEGER, allowNull: false },
    faculty_id: { type: DataTypes.INTEGER, allowNull: false },
  },
  { tableName: 'timetable_entries', underscored: true }
);

module.exports = TimetableEntry;
