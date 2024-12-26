const Ticket = require("../models/TicketModel");
const TransferTicket = require("../models/TransferTicketModel");
const QRCode = require("qrcode");
const crypto = require("crypto");
const mongoose = require("mongoose");
const Event = require("../models/EventModel");
const { generateQRCode } = require("../utils/QRCodeGenerator");
const notificationService = require("../services/NotificationService");
const User = require("../models/UserModel");

class TicketService {
  static generateBookingCode() {
    return "TICKET-" + Math.random().toString(36).substr(2, 9).toUpperCase();
  }

  static async generateQRCode(bookingCode) {
    return await QRCode.toDataURL(bookingCode);
  }

  static async bookTicket(eventId, buyerId) {
    const event = await Event.findById(eventId);
    if (!event) {
      throw new Error("Event not found");
    }

    // Kiểm tra số lượng vé còn lại
    if (event.maxAttendees && event.ticketsSold >= event.maxAttendees) {
      throw new Error("Event is fully booked");
    }

    const bookingCode = this.generateBookingCode();
    const qrCode = await generateQRCode(bookingCode);

    const ticket = new Ticket({
      eventId,
      buyerId,
      bookingCode,
      qrCode,
      status: "booked",
      paymentStatus: "pending",
    });

    await ticket.save();
    await ticket.populate("eventId", "_id name");

    // Cập nhật số lượng vé đã bán
    event.ticketsSold += 1;
    await event.save();

    const buyer = await User.findById(buyerId);
    if (!buyer) {
      throw new Error("Buyer not found");
    }

    const tokens = buyer.fcmTokens?.filter(Boolean);
    if (tokens?.length) {
      const title = "Ticket Booking Successful!";
      const body = `You have successfully booked a ticket for the event: ${event.name}.`;
      const data = {
        type: "ticket_booking",
        ticketId: ticket._id.toString(),
      };

      await notificationService.sendNotification(tokens, title, body, data);

      // Lưu thông báo vào cơ sở dữ liệu
      await notificationService.saveNotification(
        buyer._id,
        "ticket_booking",
        title,
        body,
        data
      );
    }

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

    if (ticket.status === "cancelled") {
      throw new Error("Ticket is already cancelled");
    }

    // Cập nhật trạng thái và lý do hủy vé
    ticket.status = "cancelled";
    ticket.cancelReason = reason;
    await ticket.save();

    // Có thể thêm logic để cập nhật số lượng vé đã bán của sự kiện
    const event = await Event.findById(ticket.eventId);
    if (event) {
      event.ticketsSold = Math.max(0, event.ticketsSold - 1);
      await event.save();
    }

    const buyer = await User.findById(userId);
    if (!buyer) {
      throw new Error("Buyer not found");
    }

    const tokens = buyer.fcmTokens?.filter(Boolean);
    if (tokens?.length) {
      const title = "Ticket Cancelled Successful!";
      const body = `You have cancelled a ticket for the event: ${event.name}.`;
      const data = {
        type: "ticket_cancel",
        ticketId: ticket._id.toString(),
      };

      await notificationService.sendNotification(tokens, title, body, data);

      await notificationService.saveNotification(
        buyer._id,
        "ticket_cancel",
        title,
        body,
        data
      );
    }
  }

  static async checkInTicket(ticketId) {
    try {
      const ticket = await Ticket.findById(ticketId);
      if (!ticket) throw new Error("Ticket not found");

      if (ticket.status !== "booked")
        throw new Error("Ticket is not valid for check-in");

      ticket.status = "checked-in";
      await ticket.save();

      return ticket;
    } catch (error) {
      throw error;
    }
  }

  static async getTicketsByUser(buyerId) {
    return await Ticket.find({
      buyerId,
      isDeleted: false,
    }).populate("eventId");
  }

  static async transferTicket(ticketId, fromUserId, toUserId) {
    try {
      const ticket = await Ticket.findOne({ 
        _id: ticketId, 
        buyerId: fromUserId,
        status: "booked",
      });
      
      if (!ticket) throw new Error('Ticket not found or not available for transfer');

      // Kiểm tra người nhận tồn tại
      const toUser = await User.findById(toUserId);
      console.log('To User:', toUser);
      
      if (!toUser) throw new Error('Recipient user not found');

      // Kiểm tra không tự chuyển cho chính mình
      if (fromUserId.toString() === toUserId.toString()) {
        throw new Error('Cannot transfer ticket to yourself');
      }

      const transfer = new TransferTicket({
        ticket: ticketId,
        fromUser: fromUserId,
        toUser: toUserId,
        status: "pending",
      });

      ticket.status = 'transferring';

      // Save riêng từng object để dễ debug
      await ticket.save();
      console.log('Ticket saved successfully');
      
      await transfer.save();

      const buyer = await User.findById(toUserId);
      if (!buyer) {
        throw new Error("Buyer not found");
      }
  
      const tokens = buyer.fcmTokens?.filter(Boolean);
      if (tokens?.length) {
        const title = "Ticket Transfering";
        const body = `Someone would like to transfor a ticket for you.`;
        const data = {
          type: "ticket_transfer",
          ticketId: ticket._id.toString(),
        };
  
        await notificationService.sendNotification(tokens, title, body, data);
  
        await notificationService.saveNotification(
          buyer._id,
          "ticket_transfer",
          title,
          body,
          data
        );
      }
  
      return transfer;
    } catch (error) {
      console.error('Transfer error:', error);
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
      }).populate('fromUser');

      if (!transfer) throw new Error('Transfer request not found');

      const ticket = await Ticket.findById(ticketId);
      if (!ticket) throw new Error('Ticket not found');

      // Tìm người nhận vé
      const toUser = await User.findById(toUserId);
      if (!toUser) throw new Error('Recipient user not found');

      // Xóa ticket khỏi ticketsBought của người chuyển
      await User.findByIdAndUpdate(
        transfer.fromUser._id,
        { $pull: { ticketsBought: ticketId } },
        { session }
      );

      // Thêm ticket vào ticketsBought của người nhận
      await User.findByIdAndUpdate(
        toUserId,
        { $push: { ticketsBought: ticketId } },
        { session }
      );

      // Cập nhật thông tin vé
      ticket.buyerId = toUserId;
      ticket.status = 'transferred';
      await ticket.save({ session });

      // Cập nhật trạng thái transfer
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

  static async rejectTransfer(ticketId, userId) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const transfer = await TransferTicket.findOne({
        ticket: ticketId,
        toUser: userId,
        status: 'pending'
      }).populate({
        path: "fromUser",
        select: "fcmTokens _id",
      });

      if (!transfer) throw new Error("Transfer request not found");

      const ticket = await Ticket.findById(ticketId);
      if (!ticket) throw new Error('Ticket not found');

      ticket.status = 'booked';
      await ticket.save();
      transfer.status = 'cancelled';
      await transfer.save();

      const oldOwner = transfer.fromUser;

      console.log(oldOwner)

      if (oldOwner?.fcmTokens?.length) {
        const tokens = oldOwner.fcmTokens.filter(Boolean);
        const title = "Ticket Transfer Reject";
        const body = `Your ticket has been rejected!`;
        const data = {
          type: "ticket_transfer",
          ticketId: ticketId.toString(),
        };

        await notificationService.sendNotification(tokens, title, body, data);

        // Lưu thông báo vào cơ sở dữ liệu
        await notificationService.saveNotification(
          oldOwner._id,
          "ticket_transfer",
          title,
          body,
          data
        );
      }

      return transfer;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  static async checkInByQR(qrCode) {
    try {
      const ticket = await Ticket.findOne({ qrCode });

      if (!ticket) {
        throw new Error("Invalid QR code or ticket not found");
      }

      if (ticket.status === "cancelled") {
        throw new Error("This ticket has been cancelled");
      }

      if (ticket.status === "checked-in") {
        throw new Error("This ticket has already been checked in");
      }

      ticket.status = "checked-in";

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
        status: "pending", // Chỉ lấy các vé đang trong trạng thái pending
      })
        .populate(
          "ticket",
          "-qrCode -paymentData -isDeleted -createdAt -updatedAt -__v"
        )
        .populate({
          path: "ticket",
          populate: {
            path: "eventId",
            select: "name",
            model: "Event",
          },
          select: "-qrCode -paymentData -isDeleted -createdAt -updatedAt -__v",
        })
        .populate("fromUser", "_id name avatar studentId")
        .populate("toUser", "_id")
        .sort({ createdAt: -1 });

      // Format lại dữ liệu theo yêu cầu
      return transferTickets;
    } catch (error) {
      console.error("Error in getTransferingTickets:", error);
      throw new Error("Error getting transfering tickets: " + error.message);
    }
  }

  static async checkInByStudentId(studentId, checkInBy) {
    try {
      // 1. Kiểm tra user
      const user = await User.findOne({ studentId });
      console.log("1. Found user:", {
        exists: !!user,
        userId: user?._id,
        studentId
      });

      if (!user) {
        throw new Error("Student ID not found");
      }

      // 2. Tìm tất cả vé của user
      const tickets = await Ticket.find({
        buyerId: user._id,
        status: 'booked',
        paymentStatus: 'paid'
      }).populate({
        path: 'eventId',
        match: { status: 'active' }
      });

      console.log("2. Found tickets:", {
        count: tickets.length,
        ticketIds: tickets.map(t => t._id.toString())
      });

      // 3. Lọc vé có event hợp lệ
      const validTickets = tickets.filter(ticket => ticket.eventId);
      
      console.log("3. Valid tickets:", {
        count: validTickets.length,
        tickets: validTickets.map(t => ({
          ticketId: t._id.toString(),
          eventId: t.eventId._id.toString(),
          eventName: t.eventId.name,
          eventDate: t.eventId.date,
          eventStatus: t.eventId.status
        }))
      });

      if (!validTickets.length) {
        throw new Error("No valid tickets found for this student ID");
      }

      // 4. Tìm vé phù hợp với th���i gian check-in
      const currentTime = new Date();
      let selectedTicket = null;
      let minTimeDiff = Infinity;

      for (const ticket of validTickets) {
        const eventTime = new Date(ticket.eventId.date);
        const timeDiff = Math.abs(eventTime - currentTime);
        const hoursDiff = timeDiff / (1000 * 60 * 60);

        console.log("4. Checking ticket timing:", {
          ticketId: ticket._id.toString(),
          eventTime: eventTime.toISOString(),
          currentTime: currentTime.toISOString(),
          hoursDiff,
          isWithinRange: hoursDiff <= 1 // Giới hạn 1 giờ trước và sau
        });

        // Chỉ cho phép check-in trong khoảng ±1 giờ
        if (hoursDiff <= 1) { // Giới hạn 1 giờ trước và sau
          if (timeDiff < minTimeDiff) {
            minTimeDiff = timeDiff;
            selectedTicket = ticket;
          }
        }
      }

      if (!selectedTicket) {
        throw new Error("No events available for check-in at this time. Please check-in within 1 hour before or after the event start time.");
      }

      console.log("5. Selected ticket for check-in:", {
        ticketId: selectedTicket._id.toString(),
        eventId: selectedTicket.eventId._id.toString(),
        eventName: selectedTicket.eventId.name,
        eventTime: new Date(selectedTicket.eventId.date).toISOString(),
        timeDiff: minTimeDiff
      });

      // Kiểm tra quyền check-in
      const isOrganizer = selectedTicket.eventId.createdBy.toString() === checkInBy;
      const isCollaborator = selectedTicket.eventId.collaborators.some(
        (collaborator) => collaborator.toString() === checkInBy
      );

      console.log("6. Permission check:", {
        checkInBy,
        isOrganizer,
        isCollaborator,
        createdBy: selectedTicket.eventId.createdBy,
        collaborators: selectedTicket.eventId.collaborators
      });

      if (!isOrganizer && !isCollaborator) {
        throw new Error("You don't have permission to check-in this ticket");
      }

      // Cập nhật trạng thái vé
      selectedTicket.status = "checked-in";
      selectedTicket.checkInTime = currentTime;
      selectedTicket.checkedInBy = checkInBy;
      await selectedTicket.save();

      // Gửi thông báo
      if (user.fcmTokens?.length) {
        const tokens = user.fcmTokens.filter(Boolean);
        const title = "Check-in Successfully";
        const body = `Thanks for joining ${selectedTicket.eventId.name}. Wish you have a great experience! 🎉`;
        const data = {
          type: "check_in",
          ticketId: selectedTicket._id.toString(),
          eventId: selectedTicket.eventId._id.toString(),
        };

        await notificationService.sendNotification(tokens, title, body, data);
        await notificationService.saveNotification(
          user._id,
          "check_in",
          title,
          body,
          data
        );
      }

      return selectedTicket;
    } catch (error) {
      console.error('CheckIn Error:', {
        error: error.message,
        studentId,
        checkInBy,
        time: new Date().toISOString()
      });
      throw error;
    }
  }
}

module.exports = TicketService;
