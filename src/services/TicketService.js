const Ticket = require('../models/TicketModel');
const QRCode = require('qrcode');
const crypto = require('crypto');
const mongoose = require('mongoose');
const TransferTicket = require('../models/TransferTicketModel');

class TicketService {
  static generateBookingCode() {
    return crypto.randomBytes(4).toString('hex').toUpperCase();
  }

  static async generateQRCode(bookingCode) {
    return await QRCode.toDataURL(bookingCode);
  }

  static async bookTicket(eventId, buyerId) {
    try {
      const bookingCode = this.generateBookingCode();
      const qrCode = await this.generateQRCode(bookingCode);

      const ticket = new Ticket({
        eventId,
        buyerId,
        bookingCode,
        qrCode,
        status: 'booked'
      });

      return await ticket.save();
    } catch (error) {
      throw error;
    }
  }

  static async cancelTicket(ticketId, reason) {
    try {
      const ticket = await Ticket.findById(ticketId);
      if (!ticket) throw new Error('Ticket not found');
      
      if (ticket.status === 'checked-in') 
        throw new Error('Cannot cancel checked-in ticket');

      ticket.status = 'cancelled';
      ticket.cancelReason = reason;
      return await ticket.save();
    } catch (error) {
      throw error;
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

      const transfer = new TicketTransfer({
        ticketId,
        fromUserId,
        toUserId,
        status: 'pending'
      });

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
      const transfer = await TicketTransfer.findOne({
        ticketId,
        toUserId,
        status: 'pending'
      });

      if (!transfer) throw new Error('Transfer request not found');

      const ticket = await Ticket.findById(ticketId);
      if (!ticket) throw new Error('Ticket not found');

      // Cập nhật người sở hữu mới
      ticket.buyerId = toUserId;
      await ticket.save({ session });

      // Cập nhật trạng thái chuyển
      transfer.status = 'accepted';
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
      const transfer = await TicketTransfer.findOne({
        ticketId,
        toUserId,
        status: 'pending'
      });

      if (!transfer) throw new Error('Transfer request not found');

      transfer.status = 'rejected';
      await transfer.save();
      return transfer;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = TicketService;
