const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

// Define Quiz model
const Quiz = sequelize.define('Quiz', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Quiz title is required' }
    }
  },
  theme: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Quiz theme is required' }
    }
  }
}, {
  timestamps: true
});

// Define Question model
const Question = sequelize.define('Question', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  text: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Question text is required' }
    }
  }
}, {
  timestamps: false
});

// Define Option model
const Option = sequelize.define('Option', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  text: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Answer option text is required' }
    }
  },
  isCorrect: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  }
}, {
  timestamps: false
});

// Define relationships
Quiz.hasMany(Question, {
  foreignKey: {
    name: 'quizId',
    allowNull: false
  },
  onDelete: 'CASCADE'
});

Question.belongsTo(Quiz, {
  foreignKey: 'quizId'
});

Question.hasMany(Option, {
  foreignKey: {
    name: 'questionId',
    allowNull: false
  },
  onDelete: 'CASCADE'
});

Option.belongsTo(Question, {
  foreignKey: 'questionId'
});

module.exports = { Quiz, Question, Option };
