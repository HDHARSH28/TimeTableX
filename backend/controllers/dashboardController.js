const { Faculty, Classroom, Subject, Timetable, TimetableEntry } = require('../models');

// @desc    Get dashboard analytics
// @route   GET /api/dashboard/analytics
// @access  Private
const getDashboardAnalytics = async (req, res, next) => {
  try {
    const facultyCount = await Faculty.count();
    const classroomCount = await Classroom.count();
    const subjectCount = await Subject.count();
    const timetableCount = await Timetable.count();

    // Classroom utilization calculations
    // Assuming a standard timetable has 5 days * 6 slots = 30 total available slots per room
    const classrooms = await Classroom.findAll({ order: [['name', 'ASC']] });
    const classroomStats = [];

    for (const room of classrooms) {
      // Count total scheduled slots for this room across all timetables
      const entryCount = await TimetableEntry.count({
        where: { classroomId: room.id }
      });

      // Compute occupancy. If there are multiple timetables, each timetable has 30 slots.
      // So total available slots = 30 * timetableCount
      const divisor = 30 * (timetableCount || 1);
      const utilizationRate = Math.min((entryCount / divisor) * 100, 100).toFixed(1);

      classroomStats.push({
        id: room.id,
        name: room.name,
        capacity: room.capacity,
        type: room.type,
        scheduledSlots: entryCount,
        utilizationRate: parseFloat(utilizationRate)
      });
    }

    res.status(200).json({
      success: true,
      data: {
        totals: {
          faculty: facultyCount,
          classrooms: classroomCount,
          subjects: subjectCount,
          timetables: timetableCount
        },
        classroomUtilization: classroomStats
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardAnalytics
};
