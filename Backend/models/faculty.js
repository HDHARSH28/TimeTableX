const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Faculty = sequelize.define(
  'Faculty',
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    max_classes_per_day: { type: DataTypes.INTEGER, allowNull: false },
  },
  { tableName: 'faculties', underscored: true }
);

module.exports = Faculty;
