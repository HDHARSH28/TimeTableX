'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('timetable_entries', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      timetable_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'timetables', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      day: { type: Sequelize.STRING, allowNull: false },
      period: { type: Sequelize.INTEGER, allowNull: false },
      classroom_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'classrooms', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      subject_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'subjects', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      faculty_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'faculties', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    });
    await queryInterface.addIndex('timetable_entries', ['timetable_id']);
    await queryInterface.addIndex('timetable_entries', ['day', 'period']);
  },
  async down(queryInterface) {
    await queryInterface.dropTable('timetable_entries');
  },
};
