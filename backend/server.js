const app = require('./app');
const { sequelize } = require('./models');

const PORT = process.env.PORT || 5001;

// Sync database and start server
const startServer = async () => {
  try {
    // Sync models (creates tables if they don't exist)
    await sequelize.sync({ force: false }); // force: false avoids deleting existing user accounts on restart
    console.log('Database synchronized.');

    app.listen(PORT, () => {
      console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
