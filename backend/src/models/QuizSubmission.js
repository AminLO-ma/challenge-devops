const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

// Define QuizSubmission model
const QuizSubmission = sequelize.define('QuizSubmission', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  quizId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  score: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  totalQuestions: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  timestamps: true,
  createdAt: 'submittedAt',
  updatedAt: false
});

// Define UserAnswer model for storing individual answers
const UserAnswer = sequelize.define('UserAnswer', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  submissionId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  questionId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  selectedOptionId: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  timestamps: false
});

// Define relationships
QuizSubmission.hasMany(UserAnswer, {
  foreignKey: {
    name: 'submissionId',
    allowNull: false
  },
  onDelete: 'CASCADE'
});

UserAnswer.belongsTo(QuizSubmission, {
  foreignKey: 'submissionId'
});

module.exports = { QuizSubmission, UserAnswer };
