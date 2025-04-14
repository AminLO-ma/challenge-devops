const { Sequelize } = require('sequelize');

// Initialize Sequelize with MySQL connection
const sequelize = new Sequelize(
  process.env.DB_NAME || 'quiz_app',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    dialect: 'mysql',
    port: process.env.DB_PORT || 3306,
    logging: false // Set to console.log to see SQL queries in console
  }
);

// Test the connection
const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('MySQL database connection established successfully');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };
