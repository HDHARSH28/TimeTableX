const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TimetableEntry = sequelize.define('TimetableEntry', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  dayOfWeek: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 7
    }
  },
  slotIndex: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 10
    }
  },
  batch: {
    type: DataTypes.STRING,
    allowNull: true
  }
});

module.exports = TimetableEntry;
