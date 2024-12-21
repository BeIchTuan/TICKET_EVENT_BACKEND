const Ticket = require('../models/TicketModel');
const TransferTicket = require('../models/TransferTicketModel');
const QRCode = require('qrcode');
const crypto = require('crypto');
const mongoose = require('mongoose');
const Event = require('../models/EventModel');
const { generateQRCode } = require('../utils/QRCodeGenerator');

class TicketService {
  static generateBookingCode() {
    return 'TICKET-' + Math.random().toString(36).substr(2, 9).toUpperCase();
  }

  static async generateQRCode(bookingCode) {
    return await QRCode.toDataURL(bookingCode);
  }

  static async bookTicket(eventId, buyerId) {
    const event = await Event.findById(eventId);
    if (!event) {
      throw new Error('Event not found');
    }

    // Kiểm tra số lượng vé còn lại
    if (event.maxAttendees && event.ticketsSold >= event.maxAttendees) {
      throw new Error('Event is fully booked');
    }

    const bookingCode = this.generateBookingCode();
    const qrCode = await generateQRCode(bookingCode);

    const ticket = new Ticket({
      eventId,
      buyerId,
      bookingCode,
      qrCode,
      status: 'booked',
      paymentStatus: 'pending'
    });

    await ticket.save();
    ticket.populate('eventId', '_id name');
    
    // Cập nhật số lượng vé đã bán
    event.ticketsSold += 1;
    await event.save();

    return ticket;
  }

  static async cancelTicket(ticketId, userId, reason) {
    const ticket = await Ticket.findById(ticketId);
    
    if (!ticket) {
      throw new Error("Ticket not found");
    }
    
    if (ticket.buyerId.toString() !== userId) {
      throw new Error("You are not authorized to cancel this ticket");
    }
    
    if (ticket.status === 'cancelled') {
      throw new Error("Ticket is already cancelled");
    }
    
    // Cập nhật trạng thái và lý do hủy vé
    ticket.status = 'cancelled';
    ticket.cancelReason = reason;
    await ticket.save();
    
    // Có thể thêm logic để cập nhật số lượng vé đã bán của sự kiện
    const event = await Event.findById(ticket.eventId);
    if (event) {
      event.ticketsSold = Math.max(0, event.ticketsSold - 1);
      await event.save();
    }
  }

  static async checkInTicket(ticketId) {
    try {
      const ticket = await Ticket.findById(ticketId);
      if (!ticket) throw new Error('Ticket not found');
      
      if (ticket.status !== 'booked') 
        throw new Error('Ticket is not valid for check-in');

      ticket.status = 'checked-in';
      return await ticket.save();
    } catch (error) {
      throw error;
    }
  }

  static async getTicketsByUser(buyerId) {
    return await Ticket.find({ 
      buyerId, 
      isDeleted: false 
    }).populate('eventId');
  }

  static async transferTicket(ticketId, fromUserId, toUserId) {
    try {
      const ticket = await Ticket.findOne({ 
        _id: ticketId, 
        buyerId: fromUserId,
        status: 'booked'
      });
      
      if (!ticket) throw new Error('Ticket not found or not available for transfer');

      const transfer = new TransferTicket({
        ticket: ticketId,
        fromUser: fromUserId,
        toUser: toUserId,
        status: 'pending'
      });

      ticket.paymentStatus = 'transferring';

      await ticket.save();

      await transfer.save();
      return transfer;
    } catch (error) {
      throw error;
    }
  }

  static async confirmTransfer(ticketId, toUserId) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const transfer = await TransferTicket.findOne({
        ticket: ticketId,
        toUser: toUserId,
        status: 'pending'
      });

      if (!transfer) throw new Error('Transfer request not found');

      const ticket = await Ticket.findById(ticketId);
      if (!ticket) throw new Error('Ticket not found');

      // Cập nhật người sở hữu mới
      ticket.buyerId = toUserId;
      ticket.paymentStatus = "transferred";
      await ticket.save({ session });

      // Cập nhật trạng thái chuyển
      transfer.status = 'success';
      await transfer.save({ session });

      await session.commitTransaction();
      return ticket;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  static async rejectTransfer(ticketId, toUserId) {
    try {
      const transfer = await TransferTicket.findOne({
        ticketId,
        toUserId,
        status: 'pending'
      });

      if (!transfer) throw new Error('Transfer request not found');

      transfer.status = 'cancelled';
      await transfer.save();
      return transfer;
    } catch (error) {
      throw error;
    }
  }

  static async checkInByQR(qrCode) {
    try {
      const ticket = await Ticket.findOne({ qrCode });
      
      if (!ticket) {
        throw new Error('Invalid QR code or ticket not found');
      }

      if (ticket.status === 'cancelled') {
        throw new Error('This ticket has been cancelled');
      }

      if (ticket.status === 'checked-in') {
        throw new Error('This ticket has already been checked in');
      }

      ticket.status = 'checked-in';
      await ticket.save();

      return ticket;
    } catch (error) {
      throw error;
    }
  }

  static async getTransferingTickets(userId) {
    try {
      const transferTickets = await TransferTicket.find({
        $or: [
          { toUser: userId }, // Lấy các vé mà người dùng nhận được
        ],
        status: 'pending' // Chỉ lấy các vé đang trong trạng thái pending
      })
      .populate('ticket', '-qrCode -paymentData -isDeleted -createdAt -updatedAt -__v')
      .populate({
        path: 'ticket',
        populate: {
          path: 'eventId',
          select: 'name',
          model: 'Event'
        },
        select: '-qrCode -paymentData -isDeleted -createdAt -updatedAt -__v'
      })
      .populate('fromUser', '_id name avatar studentId')
      .populate('toUser', '_id')
      .sort({ createdAt: -1 });

      // Format lại dữ liệu theo yêu cầu
      return transferTickets;

    } catch (error) {
      console.error('Error in getTransferingTickets:', error);
      throw new Error('Error getting transfering tickets: ' + error.message);
    }
  }
}

module.exports = TicketService;
