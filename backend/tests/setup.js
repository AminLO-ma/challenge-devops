// This file is used to setup the test environment
// It will be executed before each test file
process.env.NODE_ENV = 'test';
process.env.DB_NAME = 'quiz_app_test';
process.env.DB_USER = 'root';
process.env.DB_PASSWORD = '';
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '3306';

const { sequelize } = require('../src/config/db');

beforeAll(async () => {
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  await sequelize.close();
});
