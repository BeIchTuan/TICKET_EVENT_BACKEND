const TicketService = require('../../../src/services/TicketService');
const Ticket = require('../../../src/models/TicketModel');
const Event = require('../../../src/models/EventModel');
const User = require('../../../src/models/UserModel');
const TransferTicket = require('../../../src/models/TransferTicketModel');
const notificationService = require('../../../src/services/NotificationService');
const mongoose = require('mongoose');
const QRCode = require('qrcode');

jest.mock('../../../src/models/TicketModel');
jest.mock('../../../src/models/EventModel');
jest.mock('../../../src/models/UserModel');
jest.mock('../../../src/models/TransferTicketModel');
jest.mock('../../../src/services/NotificationService');

describe('TicketService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockBuyer = {
    _id: '675c247a149d30a05a605ca8',
    email: 'tuan.vohoang0108@gmail.com',
    name: 'Võ Hoàng Tuấn',
    role: 'ticket_buyer',
    fcmTokens: []
  };

  const mockRecipient = {
    _id: '6746e922730bcb30c5f3b874',
    email: 'buyer5@gmail.com',
    name: 'Ticket Buyer',
    role: 'ticket_buyer'
  };

  const mockEvent = {
    _id: '676af15aa1613e8601d0826c',
    name: 'test create event',
    maxAttendees: 100,
    ticketsSold: 19,
    save: jest.fn()
  };

  describe('bookTicket', () => {
    it('should book ticket successfully', async () => {
      // Arrange
      Event.findById.mockResolvedValue(mockEvent);
      User.findById.mockResolvedValue(mockBuyer);
      
      // Tạo populated ticket trước
      const populatedTicket = {
        _id: 'ticket123',
        eventId: {
          _id: mockEvent._id,
          name: mockEvent.name
        },
        buyerId: mockBuyer._id,
        bookingCode: 'TICKET-ABC123XYZ',
        qrCode: 'data:image/png;base64,...',
        status: 'booked',
        paymentStatus: 'pending',
      };

      const mockCreatedTicket = {
        _id: 'ticket123',
        eventId: mockEvent._id,
        buyerId: mockBuyer._id,
        bookingCode: 'TICKET-ABC123XYZ',
        qrCode: 'data:image/png;base64,...',
        status: 'booked',
        paymentStatus: 'pending',
        populate: jest.fn().mockResolvedValue(populatedTicket)
      };

      // Mock Ticket constructor và save
      Ticket.mockImplementation(() => ({
        ...mockCreatedTicket,
        save: jest.fn().mockResolvedValue(mockCreatedTicket)
      }));

      // Act
      const result = await TicketService.bookTicket(mockEvent._id, mockBuyer._id);

      // Assert
      expect(result).toBeDefined();
      expect(result.eventId).toBeDefined();
      expect(result.eventId).toBe(mockEvent._id);
    });

    it('should throw error when event is fully booked', async () => {
      // Arrange
      const fullyBookedEvent = {
        ...mockEvent,
        ticketsSold: 100
      };
      Event.findById.mockResolvedValue(fullyBookedEvent);

      // Act & Assert
      await expect(TicketService.bookTicket(mockEvent._id, mockBuyer._id))
        .rejects
        .toThrow('Event is fully booked');
    });
  });

  describe('cancelTicket', () => {
    it('should cancel ticket successfully', async () => {
      // Arrange
      const mockTicket = {
        _id: 'ticket123',
        eventId: mockEvent._id,
        buyerId: mockBuyer._id,
        status: 'booked',
        save: jest.fn().mockResolvedValue(true)
      };

      const updatedEvent = {
        ...mockEvent,
        ticketsSold: 19,
        save: jest.fn().mockImplementation(function() {
          return Promise.resolve(this);
        })
      };

      Ticket.findById.mockResolvedValue(mockTicket);
      Event.findById.mockResolvedValue(updatedEvent);
      User.findById.mockResolvedValue(mockBuyer);

      // Act
      await TicketService.cancelTicket('ticket123', mockBuyer._id, 'Personal reasons');

      // Assert
      expect(mockTicket.status).toBe('cancelled');
      expect(mockTicket.cancelReason).toBe('Personal reasons');
      expect(updatedEvent.ticketsSold).toBe(18);
      expect(updatedEvent.save).toHaveBeenCalled();
    });

    it('should throw error when ticket is already cancelled', async () => {
      // Arrange
      const mockCancelledTicket = {
        _id: 'ticket123',
        buyerId: mockBuyer._id,
        status: 'cancelled'
      };
      Ticket.findById.mockResolvedValue(mockCancelledTicket);

      // Act & Assert
      await expect(TicketService.cancelTicket('ticket123', mockBuyer._id, 'reason'))
        .rejects
        .toThrow('Ticket is already cancelled');
    });
  });

  describe('transferTicket', () => {
    it('should initiate ticket transfer successfully', async () => {
      // Arrange
      const mockTicket = {
        _id: 'ticket123',
        eventId: mockEvent._id,
        buyerId: mockBuyer._id,
        status: 'booked',
        save: jest.fn().mockResolvedValue(true)
      };

      const mockTransferData = {
        _id: 'transfer123',
        ticket: mockTicket._id,
        fromUser: mockBuyer._id,
        toUser: mockRecipient._id,
        status: 'pending',
        save: jest.fn().mockResolvedValue(true)
      };

      Ticket.findOne.mockResolvedValue(mockTicket);
      User.findById
        .mockResolvedValueOnce(mockBuyer)
        .mockResolvedValueOnce(mockRecipient);

      // Mock TransferTicket constructor
      TransferTicket.mockImplementation(() => mockTransferData);

      // Act
      const result = await TicketService.transferTicket(
        'ticket123',
        mockBuyer._id,
        mockRecipient._id
      );

      // Assert
      expect(result).toBeDefined();
      expect(result._id).toBe('transfer123');
      expect(result.ticket).toBe(mockTicket._id);
      expect(result.status).toBe('pending');
      expect(mockTicket.status).toBe('transferring');
    });
  });

  describe('confirmTransfer', () => {
    it('should confirm ticket transfer successfully', async () => {
      // Arrange
      const mockSession = {
        startTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        endSession: jest.fn()
      };
      mongoose.startSession = jest.fn().mockResolvedValue(mockSession);

      const mockTransfer = {
        ticket: 'ticket123',
        fromUser: { _id: mockBuyer._id },
        toUser: mockRecipient._id,
        status: 'pending',
        save: jest.fn().mockResolvedValue(true)
      };

      const mockTicket = {
        _id: 'ticket123',
        status: 'transferring',
        save: jest.fn().mockResolvedValue(true)
      };

      TransferTicket.findOne.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockTransfer)
      });
      Ticket.findById.mockResolvedValue(mockTicket);
      User.findById.mockResolvedValue(mockRecipient);
      User.findByIdAndUpdate.mockResolvedValue({});

      // Act
      const result = await TicketService.confirmTransfer('ticket123', mockRecipient._id);

      // Assert
      expect(result).toBeDefined();
      expect(mockTicket.status).toBe('transferred');
      expect(mockTicket.buyerId).toBe(mockRecipient._id);
      expect(mockSession.commitTransaction).toHaveBeenCalled();
    });
  });

  describe('rejectTransfer', () => {
    it('should reject ticket transfer successfully', async () => {
      // Arrange
      const mockSession = {
        startTransaction: jest.fn().mockResolvedValue(undefined),
        commitTransaction: jest.fn().mockResolvedValue(undefined),
        endSession: jest.fn().mockResolvedValue(undefined),
        abortTransaction: jest.fn().mockResolvedValue(undefined)
      };

      const mockTransfer = {
        _id: 'transfer123',
        ticket: 'ticket123',
        fromUser: {
          _id: mockBuyer._id,
          fcmTokens: []
        },
        toUser: mockRecipient._id,
        status: 'pending',
        save: jest.fn().mockImplementation(async function() {
          this.status = 'cancelled';
          return this;
        })
      };

      const mockTicket = {
        _id: 'ticket123',
        status: 'transferring',
        save: jest.fn().mockImplementation(async function() {
          this.status = 'booked';
          return this;
        })
      };

      // Mock mongoose session
      mongoose.startSession.mockResolvedValue(mockSession);

      // Mock TransferTicket.findOne và populate
      TransferTicket.findOne.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockTransfer)
      });

      // Mock Ticket.findById
      Ticket.findById.mockResolvedValue(mockTicket);

      // Mock notification service
      notificationService.sendNotification.mockResolvedValue();
      notificationService.saveNotification.mockResolvedValue();

      // Act
      await TicketService.rejectTransfer('ticket123', mockRecipient._id);

      console.log("mockTicket:", mockTicket)
      console.log("mockTransfer:", mockTransfer)
      // Assert
      expect(mockTicket.status).toBe('booked');
      expect(mockTransfer.status).toBe('cancelled');
      expect(mockTicket.save).toHaveBeenCalled();
      expect(mockTransfer.save).toHaveBeenCalled();
      expect(mockSession.startTransaction).toHaveBeenCalled();
      expect(mockSession.endSession).toHaveBeenCalled();
    });
  });
});
