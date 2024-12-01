const Ticket = require('../models/TicketModel');
const TransferTicket = require('../models/TransferTicketModel');
const QRCode = require('qrcode');
const crypto = require('crypto');
const mongoose = require('mongoose');

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

      const transfer = new TransferTicket({
        ticket: ticketId,
        fromUser: fromUserId,
        toUser: toUserId,
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
}

module.exports = TicketService;
