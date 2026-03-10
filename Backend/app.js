const express = require('express');
const dotenv = require('dotenv');
dotenv.config();

const app = express();

// Middleware
app.use(express.json());

// Routes
const facultyRoutes = require('./routes/facultyRoutes');
const subjectRoutes = require('./routes/subjectRoutes');
const classroomRoutes = require('./routes/classroomRoutes');
const timetableRoutes = require('./routes/timetableRoutes');

app.use('/api', facultyRoutes);
app.use('/api', subjectRoutes);
app.use('/api', classroomRoutes);
app.use('/api', timetableRoutes);

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({ success: false, message: 'Not Found' });
});

// Error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({ success: false, message: err.message || 'Internal Server Error' });
});

module.exports = app;
