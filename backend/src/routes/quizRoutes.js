const express = require('express');
const { check } = require('express-validator');
const { createQuiz, getQuizzes, getQuiz } = require('../controllers/quizController');
const { submitQuizAnswers, getQuizSubmissions } = require('../controllers/submissionController');

const router = express.Router();

// Quiz routes
router.post('/', [
  check('title', 'Title is required').not().isEmpty(),
  check('theme', 'Theme is required').not().isEmpty(),
  check('questions', 'Questions array is required').isArray(),
], createQuiz);

router.get('/', getQuizzes);
router.get('/:id', getQuiz);

// Quiz submission routes
router.post('/:id/submit', submitQuizAnswers);
router.get('/:id/submissions', getQuizSubmissions);

module.exports = router;
