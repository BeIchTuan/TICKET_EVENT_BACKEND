const mongoose = require('mongoose');
const Event = require('../../../src/models/EventModel');
const User = require('../../../src/models/UserModel');
const Category = require('../../../src/models/CategoryModel');
const Conversation = require('../../../src/models/ConversationModel');
const EventService = require('../../../src/services/EventService');
const notificationService = require('../../../src/services/NotificationService');
const Ticket = require('../../../src/models/TicketModel');
const TransferTicket = require('../../../src/models/TransferTicketModel');
const UserService = require('../../../src/services/UserService');

// Mock các dependencies
jest.mock('../../../src/models/EventModel');
jest.mock('../../../src/models/UserModel');
jest.mock('../../../src/models/CategoryModel');
jest.mock('../../../src/models/ConversationModel');
jest.mock('../../../src/services/NotificationService');
jest.mock('../../../src/models/TicketModel');
jest.mock('../../../src/models/TransferTicketModel');
jest.mock('../../../src/services/UserService');

describe('EventService', () => {
  const mockEvent = {
    _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439011'),
    name: 'Test Event',
    description: 'Test Description',
    location: 'Test Location',
    date: new Date('2024-12-31'),
    price: 100000,
    maxAttendees: 100,
    categoryId: ['category123'],
    images: ['image1.jpg'],
    createdBy: 'user123',
    collaborators: ['collaborator123'],
    status: 'active',
    isDeleted: false,
    conversation: 'conversation123',
    ticketsSold: 0
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createEvent', () => {
    it('should create event successfully and update eventsCreated for creator and collaborators', async () => {
      // Arrange
      const eventData = {
        name: mockEvent.name,
        description: mockEvent.description,
        location: mockEvent.location,
        date: mockEvent.date,
        price: mockEvent.price,
        maxAttendees: mockEvent.maxAttendees,
        categoryId: mockEvent.categoryId,
        createdBy: mockEvent.createdBy,
        collaborators: mockEvent.collaborators
      };

      // Mock collaborators check
      User.find.mockResolvedValueOnce([
        { _id: 'collaborator123', role: 'event_creator' }
      ]).mockResolvedValueOnce([
        { _id: 'user1', fcmTokens: ['token1'] },
        { _id: 'user2', fcmTokens: ['token2'] }
      ]);
      
      // Mock category check
      Category.findById.mockResolvedValue({ _id: 'category123', name: 'Test Category' });

      // Mock conversation creation
      const mockConversation = {
        _id: 'conversation123',
        save: jest.fn().mockResolvedValue({ _id: 'conversation123' })
      };
      Conversation.mockImplementation(() => mockConversation);

      // Mock event creation
      const mockEventInstance = {
        ...eventData,
        validateSync: jest.fn().mockReturnValue(null),
        save: jest.fn().mockResolvedValue(mockEvent)
      };
      Event.mockImplementation(() => mockEventInstance);

      // Mock user updates
      User.findByIdAndUpdate.mockResolvedValue({});
      User.updateMany.mockResolvedValue({});

      // Act
      const result = await EventService.createEvent(eventData);

      // Assert
      expect(result).toBeDefined();
      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        eventData.createdBy,
        { $push: { eventsCreated: result._id } }
      );
      expect(User.updateMany).toHaveBeenCalledWith(
        { _id: { $in: eventData.collaborators } },
        { $push: { eventsCreated: result._id } }
      );
      expect(notificationService.sendNotification).toHaveBeenCalled();
    });
  });

  describe('deleteEvent', () => {
    it('should soft delete event and update related records', async () => {
      // Arrange
      const eventId = mockEvent._id.toString();
      const userId = 'user123';

      const mockEventToDelete = {
        ...mockEvent,
        save: jest.fn().mockResolvedValue({ 
          ...mockEvent, 
          isDeleted: true, 
          status: 'cancelled' 
        })
      };

      // Mock tickets
      const mockTickets = [
        { _id: 'ticket1' },
        { _id: 'ticket2' }
      ];

      // Mock users for notification
      const mockUsers = [
        { _id: 'user1', fcmTokens: ['token1'] },
        { _id: 'user2', fcmTokens: ['token2'] }
      ];

      // Setup mocks
      Event.findById.mockResolvedValue(mockEventToDelete);
      UserService.getUser.mockResolvedValue({ role: 'event_creator' });
      Ticket.find.mockResolvedValue(mockTickets);
      Ticket.updateMany.mockResolvedValue({});
      TransferTicket.updateMany.mockResolvedValue({});
      Conversation.deleteMany.mockResolvedValue({});
      // Add mock for User.find
      User.find.mockResolvedValue(mockUsers);

      // Act
      const result = await EventService.deleteEvent(eventId, userId);

      // Assert
      expect(result.isDeleted).toBe(true);
      expect(result.status).toBe('cancelled');
      expect(Ticket.updateMany).toHaveBeenCalledWith(
        { eventId },
        {
          $set: {
            status: "cancelled",
            cancelReason: "Event has been deleted by organizer"
          },
          $unset: {
            transferTo: "",
            transferRequestTime: ""
          }
        }
      );
      expect(TransferTicket.updateMany).toHaveBeenCalledWith(
        { ticket: { $in: ['ticket1', 'ticket2'] } },
        {
          $set: {
            status: "cancelled",
            cancelReason: "Original event has been deleted"
          }
        }
      );
      expect(Conversation.deleteMany).toHaveBeenCalledWith({ eventId });
      expect(User.find).toHaveBeenCalledWith({
        role: { $in: ["ticket_buyer", "admin"] }
      });
      expect(notificationService.sendNotification).toHaveBeenCalled();
    });

    it('should throw error if user does not have permission', async () => {
      // Arrange
      const eventId = mockEvent._id.toString();
      const userId = 'different_user';

      Event.findById.mockResolvedValue({
        ...mockEvent,
        createdBy: 'original_user'
      });
      UserService.getUser.mockResolvedValue({ role: 'event_creator' });

      // Act & Assert
      await expect(
        EventService.deleteEvent(eventId, userId)
      ).rejects.toThrow("You don't have permission to delete this event");
    });
  });

  describe('getEvents', () => {
    it('should get all active events with filters', async () => {
      // Arrange
      const filters = {
        status: 'active',
        date: new Date('2024-12-31'),
        categoryId: 'category123',
        createdBy: 'user123',
        isAfter: true,
        sortBy: 'date'
      };

      const mockEvents = [{
        ...mockEvent,
        toObject: () => ({
          ...mockEvent,
          categoryId: { _id: 'category123', name: 'Test Category' }
        })
      }];

      Event.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockEvents)
      });

      // Act
      const result = await EventService.getEvents(filters);

      // Assert
      expect(Event.find).toHaveBeenCalledWith({
        isDeleted: false,
        status: 'active',
        date: filters.date,
        categoryId: 'category123',
        createdBy: 'user123',
        date: { $gt: expect.any(Date) }
      });
      expect(result[0].category).toBeDefined();
      expect(result[0].categoryId).toBeUndefined();
    });
  });

  describe('updateEvent', () => {
    it('should update event successfully with new images', async () => {
      // Arrange
      const eventId = mockEvent._id;
      const userId = mockEvent.createdBy;
      const updateData = {
        name: 'Updated Event',
        collaborators: ['newCollaborator123']
      };
      const newImages = ['newImage1.jpg'];
      const imagesToDelete = ['image1.jpg'];

      const mockEventToUpdate = {
        ...mockEvent,
        images: ['image1.jpg'],
        save: jest.fn().mockResolvedValue({
          ...mockEvent,
          name: updateData.name,
          images: newImages
        })
      };

      Event.findOne.mockResolvedValue(mockEventToUpdate);
      UserService.getUser.mockResolvedValue({ role: 'event_creator' });
      User.find.mockResolvedValueOnce([
        { _id: 'newCollaborator123', role: 'event_creator' }
      ]).mockResolvedValueOnce([
        { _id: 'user1', fcmTokens: ['token1'] }
      ]);

      // Act
      const result = await EventService.updateEvent(
        eventId,
        userId,
        updateData,
        newImages,
        imagesToDelete
      );

      // Assert
      expect(result.name).toBe(updateData.name);
      expect(result.images).toEqual(newImages);
      expect(notificationService.sendNotification).toHaveBeenCalled();
    });
  });

  describe('searchEvents', () => {
    it('should search events with various parameters', async () => {
      // Arrange
      const searchParams = {
        name: 'test',
        location: 'location',
        date: '2024-12-31',
        categoryId: 'category123',
        status: 'active'
      };

      const mockEvents = [{
        ...mockEvent,
        toObject: () => ({
          ...mockEvent,
          categoryId: { _id: 'category123', name: 'Test Category' }
        })
      }];

      Event.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockEvents)
      });

      // Act
      const result = await EventService.searchEvents(searchParams);

      // Assert
      expect(Event.find).toHaveBeenCalledWith({
        isDeleted: false,
        name: { $regex: 'test', $options: 'i' },
        location: { $regex: 'location', $options: 'i' },
        date: {
          $gte: expect.any(Date),
          $lt: expect.any(Date)
        },
        categoryId: 'category123',
        status: 'active'
      });
    });
  });

  describe('getManagedEvents', () => {
    it('should return events managed by event creator', async () => {
      // Arrange
      const userId = 'user123';
      const mockEvents = [{
        ...mockEvent,
        toObject: () => ({
          ...mockEvent,
          categoryId: [{ _id: 'category123', name: 'Test Category' }]
        })
      }];

      UserService.getUser.mockResolvedValue({ role: 'event_creator' });
      Event.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockEvents)
      });

      // Act
      const result = await EventService.getManagedEvents(userId);

      // Assert
      expect(Event.find).toHaveBeenCalledWith({
        isDeleted: false,
        $or: [{ createdBy: userId }, { collaborators: userId }]
      });
      expect(result[0].category).toBeDefined();
      expect(result[0].categoryId).toBeUndefined();
    });
  });

  describe('getEventParticipants', () => {
    it('should return unique list of participants', async () => {
      // Arrange
      const eventId = mockEvent._id;
      const mockTickets = [
        { 
          buyerId: { 
            _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439011'),
            name: 'User 1' 
          } 
        },
        { 
          buyerId: { 
            _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439012'),
            name: 'User 2' 
          } 
        },
        { 
          buyerId: { 
            _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439011'),
            name: 'User 1' 
          } 
        }
      ];

      Ticket.find.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockTickets)
      });

      // Act
      const result = await EventService.getEventParticipants(eventId);

      // Assert
      expect(result).toHaveLength(2); // Should have unique participants
      expect(Ticket.find).toHaveBeenCalledWith({
        eventId,
        status: 'booked',
        paymentStatus: { $in: ['paid'] }
      });
    });
  });
});
