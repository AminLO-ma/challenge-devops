const { Quiz, Question, Option } = require('../models/Quiz');
const { QuizSubmission, UserAnswer } = require('../models/QuizSubmission');
const { sequelize } = require('../config/db');

// @desc    Submit answers to a quiz
// @route   POST /api/quizzes/:id/submit
// @access  Public
exports.submitQuizAnswers = async (req, res) => {
  // Start a transaction for data consistency
  const t = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const { answers } = req.body;

    // Check if quiz exists with its questions and options
    const quiz = await Quiz.findByPk(id, {
      include: [{
        model: Question,
        include: [Option]
      }]
    });
    
    if (!quiz) {
      return res.status(404).json({
        success: false,
        error: 'Quiz not found'
      });
    }

    // Validate answers format
    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({
        success: false,
        error: 'Answers must be provided as an array'
      });
    }

    // Get the total number of questions in the quiz
    const totalQuestions = quiz.Questions.length;
    
    // Validate that the quiz has between 3 and 10 questions
    if (totalQuestions < 3 || totalQuestions > 10) {
      return res.status(400).json({
        success: false,
        error: 'Quiz must contain between 3 and 10 questions'
      });
    }
    
    // Map for tracking answered questions
    const answeredQuestions = new Set();
    
    // Calculate score
    let score = 0;

    // Create submission record
    const submission = await QuizSubmission.create({
      quizId: id,
      score: 0, // Initial score, will update after checking answers
      totalQuestions
    }, { transaction: t });

    // Process each submitted answer
    for (const answer of answers) {
      // Validate answer format
      if (!answer.questionId || !answer.selectedOptionId) {
        await t.rollback();
        return res.status(400).json({
          success: false,
          error: 'Each answer must include questionId and selectedOptionId'
        });
      }

      // Check if this question belongs to the quiz
      const question = quiz.Questions.find(q => q.id === parseInt(answer.questionId));
      if (!question) {
        await t.rollback();
        return res.status(400).json({
          success: false,
          error: `Question with id ${answer.questionId} not found in this quiz`
        });
      }

      // Check if question has already been answered
      if (answeredQuestions.has(answer.questionId)) {
        await t.rollback();
        return res.status(400).json({
          success: false,
          error: `Duplicate answer for question ${answer.questionId}`
        });
      }
      answeredQuestions.add(answer.questionId);

      // Find the selected option in the question
      const selectedOption = question.Options.find(o => o.id === parseInt(answer.selectedOptionId));
      if (!selectedOption) {
        await t.rollback();
        return res.status(400).json({
          success: false,
          error: `Option with id ${answer.selectedOptionId} not found in question ${answer.questionId}`
        });
      }

      // Create an entry for this answer
      await UserAnswer.create({
        submissionId: submission.id,
        questionId: answer.questionId,
        selectedOptionId: answer.selectedOptionId
      }, { transaction: t });

      // Increment score if the selected option is correct
      if (selectedOption.isCorrect) {
        score++;
      }
    }

    // Update the submission with the final score
    await submission.update({ score }, { transaction: t });

    // Commit the transaction
    await t.commit();

    res.status(201).json({
      success: true,
      data: {
        score: `${score}/${totalQuestions}`,
        percentage: Math.round((score / totalQuestions) * 100),
        submissionId: submission.id
      }
    });
  } catch (error) {
    // Rollback the transaction in case of error
    await t.rollback();
    console.error(`Error submitting quiz answers: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Get all submissions for a quiz
// @route   GET /api/quizzes/:id/submissions
// @access  Public
exports.getQuizSubmissions = async (req, res) => {
  try {
    const submissions = await QuizSubmission.findAll({ 
      where: { quizId: req.params.id },
      include: [UserAnswer]
    });

    return res.status(200).json({
      success: true,
      count: submissions.length,
      data: submissions
    });
  } catch (error) {
    console.error(`Error fetching submissions: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};
