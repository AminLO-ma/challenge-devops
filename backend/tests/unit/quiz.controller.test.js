const { Quiz, Question, Option } = require('../../src/models/Quiz');
const quizController = require('../../src/controllers/quizController');
const sequelize = require('../../src/config/db');

// Mock the database and models
jest.mock('../../src/config/db', () => {
  const mockSequelize = {
    transaction: jest.fn(() => Promise.resolve({
      commit: jest.fn().mockResolvedValue(true),
      rollback: jest.fn().mockResolvedValue(true)
    }))
  };
  
  return {
    sequelize: mockSequelize,
    connectDB: jest.fn()
  };
});

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
  QuizMock.findAll = jest.fn().mockResolvedValue([]);
  QuizMock.findByPk = jest.fn().mockResolvedValue(null);
  QuizMock.create = jest.fn().mockResolvedValue({ id: 1, title: 'Test Quiz', theme: 'Testing' });

  QuestionMock.create = jest.fn().mockResolvedValue({ id: 1, text: 'Test Question', quizId: 1 });
  OptionMock.create = jest.fn().mockResolvedValue({ id: 1, text: 'Test Option', isCorrect: true, questionId: 1 });

  return {
    Quiz: QuizMock,
    Question: QuestionMock,
    Option: OptionMock
  };
});

// Mock Express validator
jest.mock('express-validator', () => ({
  validationResult: jest.fn(() => ({ isEmpty: () => true }))
}));

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

// Unit tests for Quiz Controller
describe('Quiz Controller', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createQuiz', () => {
    it('should return 400 if questions array is invalid', async () => {
      // Arrange
      const req = mockRequest({
        body: {
          title: 'Test Quiz',
          theme: 'Testing',
          questions: [] // Invalid: too few questions
        }
      });
      const res = mockResponse();

      // Act
      await quizController.createQuiz(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: expect.stringContaining('Quiz must contain between 3 and 10 questions')
      }));
    });

    it('should return 400 if question options are invalid', async () => {
      // Arrange
      const req = mockRequest({
        body: {
          title: 'Test Quiz',
          theme: 'Testing',
          questions: [
            {
              text: 'Question 1',
              options: ['Only one option'] // Invalid - needs at least 2 options
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
        }
      });
      const res = mockResponse();
      
      // Act
      await quizController.createQuiz(req, res);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: expect.stringContaining('Question 1 must have at least 2 options')
      }));
    });

    it('should return 400 if a question has multiple correct answers', async () => {
      // Arrange
      const req = mockRequest({
        body: {
          title: 'Test Quiz',
          theme: 'Testing',
          questions: [
            {
              text: 'Question 1',
              options: [
                { text: 'Option 1', isCorrect: true },
                { text: 'Option 2', isCorrect: true }, // Invalid: multiple correct answers
                { text: 'Option 3', isCorrect: false }
              ]
            },
            {
              text: 'Question 2',
              options: [
                { text: 'Option 1', isCorrect: true },
                { text: 'Option 2', isCorrect: false },
                { text: 'Option 3', isCorrect: false }
              ]
            },
            {
              text: 'Question 3',
              options: [
                { text: 'Option 1', isCorrect: true },
                { text: 'Option 2', isCorrect: false },
                { text: 'Option 3', isCorrect: false }
              ]
            }
          ]
        }
      });
      const res = mockResponse();

      // Act
      await quizController.createQuiz(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: expect.stringContaining('Question 1 must have exactly one correct answer')
      }));
    });

    it('should successfully create a quiz with valid data', async () => {
      // Arrange
      const req = mockRequest({
        body: {
          title: 'Test Quiz',
          theme: 'Testing',
          questions: [
            {
              text: 'Question 1',
              options: [
                { text: 'Option 1', isCorrect: true },
                { text: 'Option 2', isCorrect: false },
                { text: 'Option 3', isCorrect: false }
              ]
            },
            {
              text: 'Question 2',
              options: [
                { text: 'Option 1', isCorrect: true },
                { text: 'Option 2', isCorrect: false },
                { text: 'Option 3', isCorrect: false }
              ]
            },
            {
              text: 'Question 3',
              options: [
                { text: 'Option 1', isCorrect: true },
                { text: 'Option 2', isCorrect: false },
                { text: 'Option 3', isCorrect: false }
              ]
            }
          ]
        }
      });
      const res = mockResponse();

      // Act
      await quizController.createQuiz(req, res);

      // Assert
      expect(Quiz.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Test Quiz',
          theme: 'Testing'
        }),
        expect.any(Object)
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: expect.any(Object)
      }));
    });
  });

  describe('getQuizzes', () => {
    it('should return an empty array when no quizzes exist', async () => {
      // Arrange
      const req = mockRequest();
      const res = mockResponse();
      Quiz.findAll.mockResolvedValue([]);

      // Act
      await quizController.getQuizzes(req, res);

      // Assert
      expect(Quiz.findAll).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        count: 0,
        data: []
      }));
    });

    it('should return all quizzes when they exist', async () => {
      // Arrange
      const req = mockRequest();
      const res = mockResponse();
      const mockQuizzes = [
        { id: 1, title: 'Quiz 1', theme: 'Theme 1', Questions: [] },
        { id: 2, title: 'Quiz 2', theme: 'Theme 2', Questions: [] }
      ];
      Quiz.findAll.mockResolvedValue(mockQuizzes);

      // Act
      await quizController.getQuizzes(req, res);

      // Assert
      expect(Quiz.findAll).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        count: 2,
        data: mockQuizzes
      }));
    });
  });

  describe('getQuiz', () => {
    it('should return 404 if quiz does not exist', async () => {
      // Arrange
      const req = mockRequest({ params: { id: 999 } });
      const res = mockResponse();
      Quiz.findByPk.mockResolvedValue(null);

      // Act
      await quizController.getQuiz(req, res);

      // Assert
      expect(Quiz.findByPk).toHaveBeenCalledWith(999, expect.any(Object));
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: 'Quiz not found'
      }));
    });

    it('should return a quiz when it exists', async () => {
      // Arrange
      const req = mockRequest({ params: { id: 1 } });
      const res = mockResponse();
      const mockQuiz = {
        id: 1,
        title: 'Test Quiz',
        theme: 'Testing',
        Questions: []
      };
      Quiz.findByPk.mockResolvedValue(mockQuiz);

      // Act
      await quizController.getQuiz(req, res);

      // Assert
      expect(Quiz.findByPk).toHaveBeenCalledWith(1, expect.any(Object));
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: mockQuiz
      }));
    });
  });
});
