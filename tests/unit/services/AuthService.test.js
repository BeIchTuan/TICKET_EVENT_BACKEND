const AuthService = require('../../../src/services/AuthService');
const User = require('../../../src/models/UserModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Mock các dependencies
jest.mock('../../../src/models/UserModel');
jest.mock('bcrypt');
jest.mock('jsonwebtoken');

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockUser = {
    email: 'test@example.com',
    password: 'Password123!',
    name: 'Test User',
    role: 'ticket_buyer'
  };

  describe('createUser', () => {
    it('should register a new user successfully', async () => {
      // Arrange
      const hashedPassword = 'hashedPassword123';
      bcrypt.hash.mockResolvedValue(hashedPassword);
      User.findOne.mockResolvedValue(null);
      
      const mockCreatedUser = {
        ...mockUser,
        password: hashedPassword,
        _id: 'mockUserId'
      };
      
      User.create.mockResolvedValue(mockCreatedUser);

      // Mock chuỗi populate mới
      const populatedUser = {
        ...mockCreatedUser,
        university: { name: 'Test University' },
        faculty: { name: 'Test Faculty' },
        major: { name: 'Test Major' }
      };

      const mockPopulateChain = {
        populate: jest.fn().mockReturnThis(),
      };
      mockPopulateChain.populate.mockReturnValueOnce(mockPopulateChain)
        .mockReturnValueOnce(mockPopulateChain)
        .mockReturnValueOnce(populatedUser);

      User.findById.mockReturnValue(mockPopulateChain);

      // Act
      const result = await AuthService.createUser(mockUser);

      // Assert
      expect(result.status).toBe('success');
      expect(result.message).toBe('User registered successfully');
      expect(result.data).toBeDefined();
      expect(User.findById).toHaveBeenCalledWith(mockCreatedUser._id);
      expect(mockPopulateChain.populate).toHaveBeenNthCalledWith(1, 'university', 'name');
      expect(mockPopulateChain.populate).toHaveBeenNthCalledWith(2, 'faculty', 'name');
      expect(mockPopulateChain.populate).toHaveBeenNthCalledWith(3, 'major', 'name');
    });

    it('should return error if user already exists', async () => {
      // Arrange
      User.findOne.mockResolvedValue(mockUser);

      // Act
      const result = await AuthService.createUser(mockUser);

      // Assert
      expect(result.status).toBe('error');
      expect(result.message).toBe('The email and role already exists');
    });
  });

  describe('loginUser', () => {
    it('should login successfully with correct credentials', async () => {
      // Arrange
      const hashedPassword = 'hashedPassword123';
      const mockToken = 'mockJWTToken';
      const mockUserWithId = { 
        ...mockUser, 
        _id: 'userId123', 
        password: hashedPassword,
        save: jest.fn()
      };

      User.findOne.mockResolvedValue(mockUserWithId);
      bcrypt.compareSync.mockReturnValue(true);
      jwt.sign.mockReturnValue(mockToken);

      // Act
      const result = await AuthService.loginUser({
        email: mockUser.email,
        password: mockUser.password
      });

      // Assert
      expect(result.status).toBe('success');
      expect(result.message).toBe('Login successful');
      expect(result.access_token).toBeDefined();
    });

    it('should return error if user not found', async () => {
      // Arrange
      User.findOne.mockResolvedValue(null);

      // Act
      const result = await AuthService.loginUser({
        email: mockUser.email,
        password: mockUser.password
      });

      // Assert
      expect(result.status).toBe('error');
      expect(result.message).toBe('Email not found, please register');
    });

    it('should return error if password is incorrect', async () => {
      // Arrange
      User.findOne.mockResolvedValue(mockUser);
      bcrypt.compareSync.mockReturnValue(false);

      // Act
      const result = await AuthService.loginUser({
        email: mockUser.email,
        password: 'wrongPassword'
      });

      // Assert
      expect(result.status).toBe('error');
      expect(result.message).toBe('Invalid email or password');
    });
  });
});
