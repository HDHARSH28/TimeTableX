const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Classroom = sequelize.define(
  'Classroom',
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false, unique: true },
    capacity: { type: DataTypes.INTEGER, allowNull: false },
  },
  { tableName: 'classrooms', underscored: true }
);

module.exports = Classroom;
