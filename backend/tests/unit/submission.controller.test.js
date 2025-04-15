const { Quiz, Question, Option } = require('../../src/models/Quiz');
const { QuizSubmission, UserAnswer } = require('../../src/models/QuizSubmission');
const submissionController = require('../../src/controllers/submissionController');

// Mock the database and models
jest.mock('../../src/config/db', () => require('../mocks/db.mock'));

// Mock the sequelize models
jest.mock('../../src/models/Quiz', () => {
  const SequelizeMock = require('sequelize-mock');
  const dbMock = new SequelizeMock();

  const QuizMock = dbMock.define('Quiz', {
    id: 1,
    title: 'Test Quiz',
    theme: 'Testing'
  });

  const QuestionMock = dbMock.define('Question', {
    id: 1,
    text: 'Test Question',
    quizId: 1
  });

  const OptionMock = dbMock.define('Option', {
    id: 1,
    text: 'Test Option',
    isCorrect: true,
    questionId: 1
  });

  // Setup model relationships for mocks
  QuizMock.hasMany(QuestionMock);
  QuestionMock.belongsTo(QuizMock);
  QuestionMock.hasMany(OptionMock);
  OptionMock.belongsTo(QuestionMock);

  // Setup mock methods
  QuizMock.findByPk = jest.fn();

  return {
    Quiz: QuizMock,
    Question: QuestionMock,
    Option: OptionMock
  };
});

// Mock QuizSubmission and UserAnswer models
jest.mock('../../src/models/QuizSubmission', () => {
  const SequelizeMock = require('sequelize-mock');
  const dbMock = new SequelizeMock();

  const QuizSubmissionMock = dbMock.define('QuizSubmission', {
    id: 1,
    quizId: 1,
    score: 0,
    totalQuestions: 3
  });

  const UserAnswerMock = dbMock.define('UserAnswer', {
    id: 1,
    submissionId: 1,
    questionId: 1,
    selectedOptionId: 1
  });

  // Setup model relationships for mocks
  QuizSubmissionMock.hasMany(UserAnswerMock);
  UserAnswerMock.belongsTo(QuizSubmissionMock);

  // Setup mock methods
  QuizSubmissionMock.create = jest.fn().mockResolvedValue({
    id: 1,
    quizId: 1,
    score: 0,
    totalQuestions: 3,
    update: jest.fn().mockResolvedValue(true)
  });
  
  QuizSubmissionMock.findAll = jest.fn();
  UserAnswerMock.create = jest.fn().mockResolvedValue({
    id: 1,
    submissionId: 1,
    questionId: 1,
    selectedOptionId: 1
  });

  return {
    QuizSubmission: QuizSubmissionMock,
    UserAnswer: UserAnswerMock
  };
});

// Mock Express request and response
const mockRequest = (data = {}) => {
  return {
    body: data.body || {},
    params: data.params || {},
    query: data.query || {}
  };
};

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

// Unit tests for Submission Controller
describe('Submission Controller', () => {
  // Original mock implementations
  const originalQuizFindByPk = Quiz.findByPk;
  const originalQuizSubmissionCreate = QuizSubmission.create;
  const originalQuizSubmissionFindAll = QuizSubmission.findAll;
  
  beforeEach(() => {
    // Reset to default mock implementations for each test
    Quiz.findByPk = originalQuizFindByPk;
    QuizSubmission.create = originalQuizSubmissionCreate;
    QuizSubmission.findAll = originalQuizSubmissionFindAll;
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('submitQuizAnswers', () => {
    it('should return 500 when an unexpected error occurs during submission', async () => {
      // Arrange
      const req = mockRequest({
        params: { id: 1 },
        body: {
          answers: [
            { questionId: 1, selectedOptionId: 2 },
            { questionId: 2, selectedOptionId: 4 },
            { questionId: 3, selectedOptionId: 7 }
          ]
        }
      });
      const res = mockResponse();
      
      // Save original implementations
      const db = require('../../src/config/db');
      const originalTransaction = db.sequelize.transaction;
      const originalFindByPk = Quiz.findByPk;
      const originalQuizSubmissionCreate = QuizSubmission.create;
      
      // Mock transaction
      const mockTransaction = { commit: jest.fn(), rollback: jest.fn() };
      db.sequelize.transaction = jest.fn().mockResolvedValue(mockTransaction);
      
      // Mock quiz found with questions and options
      Quiz.findByPk = jest.fn().mockResolvedValue({
        id: 1,
        title: 'Test Quiz',
        theme: 'Testing',
        Questions: [
          {
            id: 1,
            text: 'Question 1',
            Options: [
              { id: 1, text: 'Option 1', isCorrect: true },
              { id: 2, text: 'Option 2', isCorrect: false }
            ]
          },
          {
            id: 2,
            text: 'Question 2',
            Options: [
              { id: 3, text: 'Option 1', isCorrect: false },
              { id: 4, text: 'Option 2', isCorrect: true }
            ]
          },
          {
            id: 3,
            text: 'Question 3',
            Options: [
              { id: 5, text: 'Option 1', isCorrect: false },
              { id: 6, text: 'Option 2', isCorrect: false },
              { id: 7, text: 'Option 3', isCorrect: true }
            ]
          }
        ]
      });
      
      // Simulate an error during submission creation
      QuizSubmission.create = jest.fn().mockImplementation(() => {
        throw new Error('Database connection failed');
      });

      try {
        // Act
        await submissionController.submitQuizAnswers(req, res);

        // Assert
        expect(mockTransaction.rollback).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
          success: false,
          error: 'Server Error'
        }));
      } finally {
        // Restore original implementations
        db.sequelize.transaction = originalTransaction;
        Quiz.findByPk = originalFindByPk;
        QuizSubmission.create = originalQuizSubmissionCreate;
      }
    });
    
    it('should return 404 if quiz does not exist', async () => {
      // Arrange
      const req = mockRequest({
        params: { id: 999 },
        body: { answers: [] }
      });
      const res = mockResponse();
      
      // Mock transaction
      const mockTransaction = { commit: jest.fn(), rollback: jest.fn() };
      require('../../src/config/db').sequelize.transaction = jest.fn().mockResolvedValue(mockTransaction);
      
      // Mock quiz not found
      Quiz.findByPk.mockResolvedValue(null);

      // Act
      await submissionController.submitQuizAnswers(req, res);

      // Assert
      expect(Quiz.findByPk).toHaveBeenCalledWith(999, expect.any(Object));
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: 'Quiz not found'
      }));
      expect(mockTransaction.rollback).not.toHaveBeenCalled();
    });

    it('should return 400 if answers array is missing or invalid', async () => {
      // Arrange
      const req = mockRequest({
        params: { id: 1 },
        body: {} // Missing answers array
      });
      const res = mockResponse();
      
      // Mock transaction
      const mockTransaction = { commit: jest.fn(), rollback: jest.fn() };
      require('../../src/config/db').sequelize.transaction = jest.fn().mockResolvedValue(mockTransaction);
      
      // Mock quiz found
      Quiz.findByPk.mockResolvedValue({
        id: 1,
        title: 'Test Quiz',
        theme: 'Testing',
        Questions: [
          {
            id: 1,
            text: 'Question 1',
            Options: [
              { id: 1, text: 'Option 1', isCorrect: true },
              { id: 2, text: 'Option 2', isCorrect: false },
              { id: 3, text: 'Option 3', isCorrect: false }
            ]
          },
          {
            id: 2,
            text: 'Question 2',
            Options: [
              { id: 4, text: 'Option 1', isCorrect: true },
              { id: 5, text: 'Option 2', isCorrect: false },
              { id: 6, text: 'Option 3', isCorrect: false }
            ]
          },
          {
            id: 3,
            text: 'Question 3',
            Options: [
              { id: 7, text: 'Option 1', isCorrect: true },
              { id: 8, text: 'Option 2', isCorrect: false },
              { id: 9, text: 'Option 3', isCorrect: false }
            ]
          }
        ]
      });

      // Act
      await submissionController.submitQuizAnswers(req, res);

      // Assert
      expect(Quiz.findByPk).toHaveBeenCalledWith(1, expect.any(Object));
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: 'Answers must be provided as an array'
      }));
      expect(mockTransaction.rollback).not.toHaveBeenCalled();
    });

    it('should return 400 if answer format is invalid', async () => {
      // Arrange
      const req = mockRequest({
        params: { id: 1 },
        body: {
          answers: [
            { questionId: 1 } // Missing selectedOptionId
          ]
        }
      });
      const res = mockResponse();
      
      // Save original implementations
      const db = require('../../src/config/db');
      const originalTransaction = db.sequelize.transaction;
      const originalFindByPk = Quiz.findByPk;
      const originalQuizSubmissionCreate = QuizSubmission.create;
      
      // Mock transaction
      const mockTransaction = { commit: jest.fn(), rollback: jest.fn() };
      db.sequelize.transaction = jest.fn().mockResolvedValue(mockTransaction);
      
      // Mock quiz found
      Quiz.findByPk = jest.fn().mockResolvedValue({
        id: 1,
        title: 'Test Quiz',
        theme: 'Testing',
        Questions: [
          {
            id: 1,
            text: 'Question 1',
            Options: [
              { id: 1, text: 'Option 1', isCorrect: true },
              { id: 2, text: 'Option 2', isCorrect: false },
              { id: 3, text: 'Option 3', isCorrect: false }
            ]
          },
          {
            id: 2,
            text: 'Question 2',
            Options: [
              { id: 4, text: 'Option 1', isCorrect: true },
              { id: 5, text: 'Option 2', isCorrect: false },
              { id: 6, text: 'Option 3', isCorrect: false }
            ]
          },
          {
            id: 3,
            text: 'Question 3',
            Options: [
              { id: 7, text: 'Option 1', isCorrect: true },
              { id: 8, text: 'Option 2', isCorrect: false },
              { id: 9, text: 'Option 3', isCorrect: false }
            ]
          }
        ]
      });

      try {
        // Act
        await submissionController.submitQuizAnswers(req, res);

        // Assert
        expect(QuizSubmission.create).toHaveBeenCalled();
        expect(mockTransaction.rollback).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
          success: false,
          error: expect.stringContaining('Each answer must include questionId and selectedOptionId')
        }));
      } finally {
        // Restore original implementations
        db.sequelize.transaction = originalTransaction;
        Quiz.findByPk = originalFindByPk;
      }
    });

    it('should calculate score correctly based on submitted answers', async () => {
      // Arrange
      const req = mockRequest({
        params: { id: 1 },
        body: {
          answers: [
            { questionId: 1, selectedOptionId: 1 }, // Correct answer
            { questionId: 2, selectedOptionId: 5 }, // Incorrect answer
            { questionId: 3, selectedOptionId: 7 }  // Correct answer
          ]
        }
      });
      const res = mockResponse();
      
      // Mock transaction
      const mockTransaction = { commit: jest.fn(), rollback: jest.fn() };
      require('../../src/config/db').sequelize.transaction = jest.fn().mockResolvedValue(mockTransaction);
      
      // Mock quiz found with 3 questions and their options
      Quiz.findByPk.mockResolvedValue({
        id: 1,
        title: 'Test Quiz',
        theme: 'Testing',
        Questions: [
          {
            id: 1,
            text: 'Question 1',
            Options: [
              { id: 1, text: 'Option 1', isCorrect: true },
              { id: 2, text: 'Option 2', isCorrect: false },
              { id: 3, text: 'Option 3', isCorrect: false }
            ]
          },
          {
            id: 2,
            text: 'Question 2',
            Options: [
              { id: 4, text: 'Option 1', isCorrect: true },
              { id: 5, text: 'Option 2', isCorrect: false },
              { id: 6, text: 'Option 3', isCorrect: false }
            ]
          },
          {
            id: 3,
            text: 'Question 3',
            Options: [
              { id: 7, text: 'Option 1', isCorrect: true },
              { id: 8, text: 'Option 2', isCorrect: false },
              { id: 9, text: 'Option 3', isCorrect: false }
            ]
          }
        ]
      });

      // Mock submission object with update method
      const mockSubmission = {
        id: 1,
        quizId: 1,
        score: 0,
        totalQuestions: 3,
        update: jest.fn().mockResolvedValue(true)
      };
      QuizSubmission.create.mockResolvedValue(mockSubmission);

      // Act
      await submissionController.submitQuizAnswers(req, res);

      // Assert
      expect(QuizSubmission.create).toHaveBeenCalledWith(
        expect.objectContaining({
          quizId: 1,
          score: 0,
          totalQuestions: 3
        }),
        expect.objectContaining({ transaction: mockTransaction })
      );

      // Check that score was updated to 2 (2 correct answers out of 3)
      expect(mockSubmission.update).toHaveBeenCalledWith(
        expect.objectContaining({ score: 2 }),
        expect.objectContaining({ transaction: mockTransaction })
      );

      expect(mockTransaction.commit).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          score: '2/3',
          percentage: 67,
          submissionId: 1
        })
      }));
    });
  });

  describe('getQuizSubmissions', () => {
    it('should return 500 when an unexpected error occurs during fetching submissions', async () => {
      // Arrange
      const req = mockRequest({
        params: { id: 1 }
      });
      const res = mockResponse();
      
      // Save original implementation
      const originalFindAll = QuizSubmission.findAll;
      
      // Simulate a database error
      QuizSubmission.findAll = jest.fn().mockImplementation(() => {
        throw new Error('Database connection error');
      });

      try {
        // Act
        await submissionController.getQuizSubmissions(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
          success: false,
          error: 'Server Error'
        }));
      } finally {
        // Restore original implementation
        QuizSubmission.findAll = originalFindAll;
      }
    });
    
    it('should return all submissions for a quiz', async () => {
      // Arrange
      const req = mockRequest({
        params: { id: 1 }
      });
      const res = mockResponse();
      
      const mockSubmissions = [
        {
          id: 1,
          quizId: 1,
          score: 3,
          totalQuestions: 3,
          UserAnswers: [
            { id: 1, questionId: 1, selectedOptionId: 1 },
            { id: 2, questionId: 2, selectedOptionId: 4 },
            { id: 3, questionId: 3, selectedOptionId: 7 }
          ]
        },
        {
          id: 2,
          quizId: 1,
          score: 2,
          totalQuestions: 3,
          UserAnswers: [
            { id: 4, questionId: 1, selectedOptionId: 1 },
            { id: 5, questionId: 2, selectedOptionId: 5 },
            { id: 6, questionId: 3, selectedOptionId: 7 }
          ]
        }
      ];
      QuizSubmission.findAll.mockResolvedValue(mockSubmissions);

      // Act
      await submissionController.getQuizSubmissions(req, res);

      // Assert
      expect(QuizSubmission.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { quizId: 1 },
          include: [UserAnswer]
        })
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        count: 2,
        data: mockSubmissions
      }));
    });
  });
});
