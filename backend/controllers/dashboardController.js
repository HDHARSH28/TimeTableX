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

    // Classroom utilization calculations.
    // We derive the real number of available slots per timetable from its stored
    // workingDays and slotsPerDay, subtracting break periods so the denominator
    // is always accurate regardless of per-timetable configuration.
    const classrooms = await Classroom.findAll({ order: [['name', 'ASC']] });
    const timetables = await Timetable.findAll({ attributes: ['id', 'workingDays', 'slotsPerDay', 'breaks'] });
    const classroomStats = [];

    // Compute total available (non-break) slots across ALL timetables.
    const totalAvailableSlots = timetables.reduce((sum, tt) => {
      const workingDayCount = tt.workingDays
        ? tt.workingDays.split(',').filter(Boolean).length
        : 5;
      const slotsPerDay = tt.slotsPerDay || 6;
      const breakCount = tt.breaks
        ? tt.breaks.split(',').filter(Boolean).length
        : 0;
      return sum + workingDayCount * (slotsPerDay - breakCount);
    }, 0);

    // Guard against divide-by-zero when no timetables exist yet.
    const divisor = totalAvailableSlots || 1;

    for (const room of classrooms) {
      // Count total scheduled slots for this room across all timetables.
      const entryCount = await TimetableEntry.count({
        where: { classroomId: room.id }
      });

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
