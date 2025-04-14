const { Sequelize } = require('sequelize');
const path = require('path');

// Configure SQLite in-memory database for testing
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: ':memory:',
  logging: false
});

// Mock transaction method
sequelize.transaction = jest.fn(() => Promise.resolve({
  commit: jest.fn(),
  rollback: jest.fn()
}));

module.exports = { 
  sequelize,
  connectDB: async () => {
    try {
      await sequelize.authenticate();
      console.log('SQLite in-memory database connected successfully');
    } catch (error) {
      console.error('Unable to connect to the test database:', error);
      process.exit(1);
    }
  }
};
