const { Quiz, Question, Option } = require('../models/Quiz');
const { sequelize } = require('../config/db');
const { validationResult } = require('express-validator');

// @desc    Create a new quiz
// @route   POST /api/quizzes
// @access  Public
exports.createQuiz = async (req, res) => {
  // Start a transaction for data consistency
  const t = await sequelize.transaction();
  
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, theme, questions } = req.body;

    // First validate quiz length
    if (!questions || !Array.isArray(questions) || questions.length < 3 || questions.length > 10) {
      return res.status(400).json({ 
        success: false, 
        error: 'Quiz must contain between 3 and 10 questions' 
      });
    }

    // Then validate each question's options
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      
      if (!question.options || !Array.isArray(question.options) || 
          question.options.length < 2) {
        return res.status(400).json({ 
          success: false, 
          error: `Question ${i+1} must have at least 2 options` 
        });
      }
      
      if (question.options.length > 5) {
        return res.status(400).json({ 
          success: false, 
          error: `Question ${i+1} cannot have more than 5 options` 
        });
      }
      
      const correctOptionsCount = question.options.filter(opt => opt.isCorrect).length;
      if (correctOptionsCount !== 1) {
        return res.status(400).json({ 
          success: false, 
          error: `Question ${i+1} must have exactly one correct answer` 
        });
      }
    }

    // Create new quiz
    const quiz = await Quiz.create({
      title,
      theme
    }, { transaction: t });

    // Create questions and options for the quiz
    for (const questionData of questions) {
      const question = await Question.create({
        text: questionData.text,
        quizId: quiz.id
      }, { transaction: t });

      // Create options for the question
      for (const optionData of questionData.options) {
        await Option.create({
          text: optionData.text,
          isCorrect: optionData.isCorrect,
          questionId: question.id
        }, { transaction: t });
      }
    }

    // Commit the transaction
    await t.commit();

    // Fetch the complete quiz with questions and options
    const createdQuiz = await Quiz.findByPk(quiz.id, {
      include: [
        {
          model: Question,
          include: [Option]
        }
      ]
    });

    res.status(201).json({
      success: true,
      data: createdQuiz
    });
  } catch (error) {
    // Rollback the transaction in case of error
    await t.rollback();
    
    if (error.name === 'SequelizeValidationError') {
      const messages = error.errors.map(e => e.message);
      return res.status(400).json({
        success: false,
        error: messages
      });
    } else {
      console.error(`Error creating quiz: ${error.message}`);
      res.status(500).json({
        success: false,
        error: 'Server Error'
      });
    }
  }
};

// @desc    Get all quizzes
// @route   GET /api/quizzes
// @access  Public
exports.getQuizzes = async (req, res) => {
  try {
    const quizzes = await Quiz.findAll({
      include: [
        {
          model: Question,
          include: [Option]
        }
      ]
    });

    return res.status(200).json({
      success: true,
      count: quizzes.length,
      data: quizzes
    });
  } catch (error) {
    console.error(`Error fetching quizzes: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Get a single quiz
// @route   GET /api/quizzes/:id
// @access  Public
exports.getQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findByPk(req.params.id, {
      include: [
        {
          model: Question,
          include: [Option]
        }
      ]
    });

    if (!quiz) {
      return res.status(404).json({
        success: false,
        error: 'Quiz not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: quiz
    });
  } catch (error) {
    console.error(`Error fetching quiz: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};
