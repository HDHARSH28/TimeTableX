const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Timetable = sequelize.define(
  'Timetable',
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    status: { type: DataTypes.STRING, allowNull: false, defaultValue: 'generated' },
  },
  { tableName: 'timetables', underscored: true }
);

module.exports = Timetable;
