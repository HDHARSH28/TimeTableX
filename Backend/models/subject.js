const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Subject = sequelize.define(
  'Subject',
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    classes_per_week: { type: DataTypes.INTEGER, allowNull: false },
    faculty_id: { type: DataTypes.INTEGER, allowNull: false },
  },
  { tableName: 'subjects', underscored: true }
);

module.exports = Subject;
