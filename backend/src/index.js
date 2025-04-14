require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { sequelize, connectDB } = require('./config/db');

// Import models to register them with sequelize
require('./models/Quiz');
require('./models/QuizSubmission');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MySQL
connectDB();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.get('/', (req, res) => {
  res.send('Quiz WebApp API is running');
});

// API Routes
app.use('/api/quizzes', require('./routes/quizRoutes'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// Sync database models before starting the server
(async () => {
  try {
    // Use { force: true } to drop and recreate tables (only in development)
    await sequelize.sync({ alter: true });
    console.log('Database synced successfully');
    
    // Start the server after database sync
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to sync database:', error);
  }
})();
