const request = require('supertest');
const express = require('express');
const quizRoutes = require('../../src/routes/quizRoutes');
const quizController = require('../../src/controllers/quizController');
const submissionController = require('../../src/controllers/submissionController');

// Mock the controllers
jest.mock('../../src/controllers/quizController');
jest.mock('../../src/controllers/submissionController');

// Create an Express app for testing
const app = express();
app.use(express.json());
app.use('/api/quizzes', quizRoutes);

describe('Quiz Routes', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Setup default mock implementations
    quizController.createQuiz.mockImplementation((req, res) => {
      res.status(201).json({ success: true, data: { id: 1, title: 'Test Quiz' } });
    });
    
    quizController.getQuizzes.mockImplementation((req, res) => {
      res.status(200).json({ success: true, data: [] });
    });
    
    quizController.getQuiz.mockImplementation((req, res) => {
      res.status(200).json({ success: true, data: { id: 1, title: 'Test Quiz' } });
    });
    
    submissionController.submitQuizAnswers.mockImplementation((req, res) => {
      res.status(201).json({ success: true, data: { score: '3/5', percentage: 60 } });
    });
    
    submissionController.getQuizSubmissions.mockImplementation((req, res) => {
      res.status(200).json({ success: true, data: [] });
    });
  });

  describe('POST /api/quizzes', () => {
    it('should handle internal server errors with 500 status code', async () => {
      // Override mock implementation to simulate internal server error
      quizController.createQuiz.mockImplementation((req, res) => {
        res.status(500).json({ 
          success: false, 
          error: 'Server Error' 
        });
      });

      // Test data
      const quizData = {
        title: 'Test Quiz',
        theme: 'Testing',
        questions: [
          {
            text: 'Question 1',
            options: [
              { text: 'Option 1', isCorrect: true },
              { text: 'Option 2', isCorrect: false }
            ]
          }
        ]
      };

      // Make the request
      const response = await request(app)
        .post('/api/quizzes')
        .send(quizData)
        .expect('Content-Type', /json/)
        .expect(500);

      // Assertions
      expect(quizController.createQuiz).toHaveBeenCalledTimes(1);
      expect(response.body).toEqual({
        success: false,
        error: 'Server Error'
      });
    });
    
    it('should call createQuiz controller with request body', async () => {
      // Test data
      const quizData = {
        title: 'Test Quiz',
        theme: 'Testing',
        questions: [
          {
            text: 'Question 1',
            options: [
              { text: 'Option 1', isCorrect: true },
              { text: 'Option 2', isCorrect: false }
            ]
          },
          {
            text: 'Question 2',
            options: [
              { text: 'Option 1', isCorrect: true },
              { text: 'Option 2', isCorrect: false }
            ]
          },
          {
            text: 'Question 3',
            options: [
              { text: 'Option 1', isCorrect: true },
              { text: 'Option 2', isCorrect: false }
            ]
          }
        ]
      };

      // Make the request
      const response = await request(app)
        .post('/api/quizzes')
        .send(quizData)
        .expect('Content-Type', /json/)
        .expect(201);

      // Assertions
      expect(quizController.createQuiz).toHaveBeenCalledTimes(1);
      expect(response.body).toEqual({
        success: true,
        data: { id: 1, title: 'Test Quiz' }
      });
    });

    it('should handle validation errors', async () => {
      // Override the mock to simulate validation error
      quizController.createQuiz.mockImplementation((req, res) => {
        res.status(400).json({ 
          success: false, 
          error: 'Quiz must contain between 3 and 10 questions' 
        });
      });

      // Invalid quiz data (no questions)
      const invalidQuizData = {
        title: 'Invalid Quiz',
        theme: 'Testing',
        questions: []
      };

      // Make the request
      const response = await request(app)
        .post('/api/quizzes')
        .send(invalidQuizData)
        .expect('Content-Type', /json/)
        .expect(400);

      // Assertions
      expect(quizController.createQuiz).toHaveBeenCalledTimes(1);
      expect(response.body).toEqual({
        success: false,
        error: 'Quiz must contain between 3 and 10 questions'
      });
    });
  });

  describe('GET /api/quizzes', () => {
    it('should handle internal server errors with 500 status code', async () => {
      // Override mock implementation to simulate internal server error
      quizController.getQuizzes.mockImplementation((req, res) => {
        res.status(500).json({ 
          success: false, 
          error: 'Server Error' 
        });
      });

      // Make the request
      const response = await request(app)
        .get('/api/quizzes')
        .expect('Content-Type', /json/)
        .expect(500);

      // Assertions
      expect(quizController.getQuizzes).toHaveBeenCalledTimes(1);
      expect(response.body).toEqual({
        success: false,
        error: 'Server Error'
      });
    });
    
    it('should return all quizzes', async () => {
      // Mock data
      const mockQuizzes = [
        { id: 1, title: 'Quiz 1', theme: 'Theme 1' },
        { id: 2, title: 'Quiz 2', theme: 'Theme 2' }
      ];

      // Override mock implementation
      quizController.getQuizzes.mockImplementation((req, res) => {
        res.status(200).json({ 
          success: true, 
          count: mockQuizzes.length,
          data: mockQuizzes 
        });
      });

      // Make the request
      const response = await request(app)
        .get('/api/quizzes')
        .expect('Content-Type', /json/)
        .expect(200);

      // Assertions
      expect(quizController.getQuizzes).toHaveBeenCalledTimes(1);
      expect(response.body).toEqual({
        success: true,
        count: 2,
        data: mockQuizzes
      });
    });
  });

  describe('GET /api/quizzes/:id', () => {
    it('should handle internal server errors with 500 status code', async () => {
      // Override mock implementation to simulate internal server error
      quizController.getQuiz.mockImplementation((req, res) => {
        res.status(500).json({ 
          success: false, 
          error: 'Server Error' 
        });
      });

      // Make the request
      const response = await request(app)
        .get('/api/quizzes/1')
        .expect('Content-Type', /json/)
        .expect(500);

      // Assertions
      expect(quizController.getQuiz).toHaveBeenCalledTimes(1);
      expect(response.body).toEqual({
        success: false,
        error: 'Server Error'
      });
    });
    
    it('should return a specific quiz', async () => {
      // Mock data
      const mockQuiz = { 
        id: 1, 
        title: 'Test Quiz', 
        theme: 'Testing',
        questions: [
          { 
            id: 1, 
            text: 'Question 1',
            options: [
              { id: 1, text: 'Option 1', isCorrect: true },
              { id: 2, text: 'Option 2', isCorrect: false }
            ]
          }
        ]
      };

      // Override mock implementation
      quizController.getQuiz.mockImplementation((req, res) => {
        res.status(200).json({ 
          success: true, 
          data: mockQuiz 
        });
      });

      // Make the request
      const response = await request(app)
        .get('/api/quizzes/1')
        .expect('Content-Type', /json/)
        .expect(200);

      // Assertions
      expect(quizController.getQuiz).toHaveBeenCalledTimes(1);
      expect(response.body).toEqual({
        success: true,
        data: mockQuiz
      });
    });

    it('should handle not found quiz', async () => {
      // Override mock implementation
      quizController.getQuiz.mockImplementation((req, res) => {
        res.status(404).json({ 
          success: false, 
          error: 'Quiz not found' 
        });
      });

      // Make the request
      const response = await request(app)
        .get('/api/quizzes/999')
        .expect('Content-Type', /json/)
        .expect(404);

      // Assertions
      expect(quizController.getQuiz).toHaveBeenCalledTimes(1);
      expect(response.body).toEqual({
        success: false,
        error: 'Quiz not found'
      });
    });
  });

  describe('POST /api/quizzes/:id/submit', () => {
    it('should handle internal server errors with 500 status code', async () => {
      // Override mock implementation to simulate internal server error
      submissionController.submitQuizAnswers.mockImplementation((req, res) => {
        res.status(500).json({ 
          success: false, 
          error: 'Server Error' 
        });
      });

      // Test data
      const submissionData = {
        answers: [
          { questionId: 1, selectedOptionId: 2 }
        ]
      };

      // Make the request
      const response = await request(app)
        .post('/api/quizzes/1/submit')
        .send(submissionData)
        .expect('Content-Type', /json/)
        .expect(500);

      // Assertions
      expect(submissionController.submitQuizAnswers).toHaveBeenCalledTimes(1);
      expect(response.body).toEqual({
        success: false,
        error: 'Server Error'
      });
    });
    
    it('should submit answers to a quiz', async () => {
      // Test data
      const submissionData = {
        answers: [
          { questionId: 1, selectedOptionId: 2 },
          { questionId: 2, selectedOptionId: 3 },
          { questionId: 3, selectedOptionId: 6 }
        ]
      };

      // Make the request
      const response = await request(app)
        .post('/api/quizzes/1/submit')
        .send(submissionData)
        .expect('Content-Type', /json/)
        .expect(201);

      // Assertions
      expect(submissionController.submitQuizAnswers).toHaveBeenCalledTimes(1);
      expect(response.body).toEqual({
        success: true,
        data: { score: '3/5', percentage: 60 }
      });
    });

    it('should handle invalid submission data', async () => {
      // Override mock implementation
      submissionController.submitQuizAnswers.mockImplementation((req, res) => {
        res.status(400).json({ 
          success: false, 
          error: 'Each answer must include questionId and selectedOptionId' 
        });
      });

      // Invalid submission data
      const invalidSubmissionData = {
        answers: [
          { questionId: 1 } // Missing selectedOptionId
        ]
      };

      // Make the request
      const response = await request(app)
        .post('/api/quizzes/1/submit')
        .send(invalidSubmissionData)
        .expect('Content-Type', /json/)
        .expect(400);

      // Assertions
      expect(submissionController.submitQuizAnswers).toHaveBeenCalledTimes(1);
      expect(response.body).toEqual({
        success: false,
        error: 'Each answer must include questionId and selectedOptionId'
      });
    });
  });

  describe('GET /api/quizzes/:id/submissions', () => {
    it('should return all submissions for a quiz', async () => {
      // Mock data
      const mockSubmissions = [
        { id: 1, quizId: 1, score: 3, totalQuestions: 5 },
        { id: 2, quizId: 1, score: 4, totalQuestions: 5 }
      ];

      // Override mock implementation
      submissionController.getQuizSubmissions.mockImplementation((req, res) => {
        res.status(200).json({ 
          success: true, 
          count: mockSubmissions.length,
          data: mockSubmissions 
        });
      });

      // Make the request
      const response = await request(app)
        .get('/api/quizzes/1/submissions')
        .expect('Content-Type', /json/)
        .expect(200);

      // Assertions
      expect(submissionController.getQuizSubmissions).toHaveBeenCalledTimes(1);
      expect(response.body).toEqual({
        success: true,
        count: 2,
        data: mockSubmissions
      });
    });
  });
});
