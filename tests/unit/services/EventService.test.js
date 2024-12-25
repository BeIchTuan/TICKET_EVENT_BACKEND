const mongoose = require('mongoose');
const Event = require('../../../src/models/EventModel');
const User = require('../../../src/models/UserModel');
const Category = require('../../../src/models/CategoryModel');
const Conversation = require('../../../src/models/ConversationModel');
const EventService = require('../../../src/services/EventService');
const notificationService = require('../../../src/services/NotificationService');
const Ticket = require('../../../src/models/TicketModel');
const TransferTicket = require('../../../src/models/TransferTicketModel');

// Mock các dependencies
jest.mock('../../../src/models/EventModel');
jest.mock('../../../src/models/UserModel');
jest.mock('../../../src/models/CategoryModel');
jest.mock('../../../src/models/ConversationModel');
jest.mock('../../../src/services/NotificationService');
jest.mock('../../../src/models/TicketModel');
jest.mock('../../../src/models/TransferTicketModel');

describe('EventService', () => {
  const mockEvent = {
    _id: 'event123',
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
    it('should create event successfully', async () => {
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
      ]).mockResolvedValueOnce([  // Mock cho notification service
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

      // Mock notification service
      User.find.mockResolvedValueOnce([
        { _id: 'user1', fcmTokens: ['token1'] },
        { _id: 'user2', fcmTokens: ['token2'] }
      ]);

      // Act
      const result = await EventService.createEvent(eventData);

      // Assert
      expect(result).toBeDefined();
      expect(result.name).toBe(mockEvent.name);
      expect(result.status).toBe('active');
      expect(User.find).toHaveBeenCalledWith({
        _id: { $in: eventData.collaborators },
        role: 'event_creator'
      });
      expect(Category.findById).toHaveBeenCalledWith(eventData.categoryId);
      expect(notificationService.sendNotification).toHaveBeenCalled();
    });

    it('should throw error if collaborator is not event creator', async () => {
      // Arrange
      const eventData = {
        ...mockEvent,
        collaborators: ['invalidCollaborator']
      };

      User.find.mockResolvedValue([]);

      // Act & Assert
      await expect(EventService.createEvent(eventData))
        .rejects
        .toThrow('Some collaborators are not event creators');
    });

    it('should throw error if category not found', async () => {
      // Arrange
      const eventData = {
        ...mockEvent
      };

      User.find.mockResolvedValue([{ _id: 'collaborator123', role: 'event_creator' }]);
      Category.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(EventService.createEvent(eventData))
        .rejects
        .toThrow('Category not found');
    });
  });

  describe('getEvents', () => {
    it('should get all active events', async () => {
      // Arrange
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
      const result = await EventService.getEvents();

      // Assert
      expect(result).toHaveLength(1);
      expect(Event.find).toHaveBeenCalledWith({ isDeleted: false });
    });

    it('should filter events by status', async () => {
      // Arrange
      const filters = { status: 'active' };
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
      expect(Event.find).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'active', isDeleted: false })
      );
    });
  });

  describe('updateEvent', () => {
    it('should update event successfully', async () => {
      // Arrange
      const eventId = 'event123';
      const userId = 'user123';
      const updateData = {
        name: 'Updated Event',
        price: 200000
      };

      Event.findOne.mockResolvedValue({
        ...mockEvent,
        images: ['image1.jpg'],
        save: jest.fn().mockResolvedValue({ ...mockEvent, ...updateData })
      });

      // Act
      const result = await EventService.updateEvent(eventId, userId, updateData);

      // Assert
      expect(result.name).toBe(updateData.name);
      expect(result.price).toBe(updateData.price);
      expect(Event.findOne).toHaveBeenCalledWith({
        _id: eventId,
        createdBy: userId,
        isDeleted: false
      });
    });

    it('should throw error if event not found or unauthorized', async () => {
      // Arrange
      Event.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(
        EventService.updateEvent('event123', 'user123', {})
      ).rejects.toThrow('Event not found or unauthorized');
    });
  });

  describe('deleteEvent', () => {
    it('should soft delete event successfully', async () => {
      // Arrange
      const eventId = new mongoose.Types.ObjectId('507f1f77bcf86cd799439011');
      const userId = 'user123';

      const mockEventToDelete = {
        ...mockEvent,
        _id: eventId,
        createdBy: userId,
        save: jest.fn().mockResolvedValue({ 
          ...mockEvent, 
          isDeleted: true, 
          status: 'cancelled' 
        })
      };

      // Mock các tickets
      const mockTickets = [
        { _id: 'ticket1' },
        { _id: 'ticket2' }
      ];
      
      // Setup mocks
      Event.findById.mockResolvedValue(mockEventToDelete);
      Ticket.find.mockResolvedValue(mockTickets);
      Ticket.updateMany.mockResolvedValue({});
      TransferTicket.updateMany.mockResolvedValue({});
      Conversation.deleteMany.mockResolvedValue({});

      // Act
      const result = await EventService.deleteEvent(eventId.toString(), userId);

      // Assert
      expect(result.isDeleted).toBe(true);
      expect(result.status).toBe('cancelled');
      expect(mockEventToDelete.save).toHaveBeenCalled();
      expect(Ticket.updateMany).toHaveBeenCalledWith(
        { eventId: eventId.toString() },
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
      expect(Conversation.deleteMany).toHaveBeenCalledWith({ eventId: eventId.toString() });
    }, 10000);

    it('should throw error if event not found', async () => {
      // Arrange
      Event.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        EventService.deleteEvent('nonexistent', 'user123')
      ).rejects.toThrow('Event not found');
    });
  });
});
