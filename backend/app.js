const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { sequelize } = require('./models');
const errorHandler = require('./middleware/errorMiddleware');

// Routes imports
const authRoutes = require('./routes/authRoutes');
const departmentRoutes = require('./routes/departmentRoutes');
const facultyRoutes = require('./routes/facultyRoutes');
const subjectRoutes = require('./routes/subjectRoutes');
const classroomRoutes = require('./routes/classroomRoutes');
const timetableRoutes = require('./routes/timetableRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Test Database Connection
sequelize.authenticate()
  .then(() => console.log('PostgreSQL database connected successfully via Sequelize.'))
  .catch(err => console.error('Database connection error:', err));

// Routes mount
app.use('/api/auth', authRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/faculty', facultyRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/classrooms', classroomRoutes);
app.use('/api/timetables', timetableRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Base route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to TimeTableX Smart Timetable Optimization System API' });
});

// Error handling middleware
app.use(errorHandler);

module.exports = app;
