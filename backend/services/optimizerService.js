const axios = require('axios');
require('dotenv').config();

const OPTIMIZER_URL = process.env.OPTIMIZER_URL || 'http://127.0.0.1:8000';

/**
 * Trigger CP-SAT Optimization Solver service
 * @param {Object} data - Contains subjects, faculty, classrooms, days, slots_per_day, fixed_entries
 * @returns {Promise<Object>} The resolved timetable schedule
 */
const generateTimetableSchedule = async (data) => {
  try {
    const response = await axios.post(`${OPTIMIZER_URL}/api/v1/optimize`, data, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 30000 // 30 seconds timeout
    });
    
    return response.data;
  } catch (error) {
    console.error('Error contacting Python optimization service:', error.message);
    if (error.response) {
      throw new Error(`Optimization Service Error: ${error.response.data.detail || error.response.statusText}`);
    } else if (error.code === 'ECONNREFUSED') {
      throw new Error('Optimization Service is currently offline. Please ensure the Python service is running.');
    }
    throw error;
  }
};

module.exports = {
  generateTimetableSchedule
};
