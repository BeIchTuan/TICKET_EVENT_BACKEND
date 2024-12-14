const TicketService = require('../services/TicketService');
const MomoService = require('../services/MomoService');
const Event = require('../models/EventModel');
const Ticket = require('../models/TicketModel');
const EmailService = require('../services/EmailService');
const User = require('../models/UserModel');
const mongoose = require('mongoose');

class TicketController {
  static async bookTicket(req, res) {
    try {
      const { eventId } = req.body;
      const buyerId = req.id;

      // Lấy thông tin sự kiện để biết giá vé
      const event = await Event.findById(eventId);
      if (!event) {
        throw new Error('Event not found');
      }

      // Kiểm tra user tồn tại
      const user = await User.findById(buyerId);
      if (!user) {
        throw new Error('User not found');
      }

      // Đặt vé
      const ticket = await TicketService.bookTicket(eventId, buyerId);

      // Kiểm tra nếu vé miễn phí (price = 0 hoặc null)
      if (!event.price || event.price === 0) {
        // Cập nhật trạng thái thanh toán thành công ngay lập tức
        ticket.paymentStatus = 'paid';
        await ticket.save();

        // Thêm ticket vào ticketsBought của user
        user.ticketsBought.push(ticket._id);
        await user.save();
        console.log('Added ticket to user ticketsBought:', buyerId);

        

        // Gửi email xác nhận ngay
        try {
          await EmailService.sendPaymentSuccessEmail(ticket);
          console.log('Free ticket confirmation email sent');
        } catch (emailError) {
          console.error('Error sending free ticket email:', emailError);
        }

        // Trả về thông tin vé khi đặt miễn phí
        return res.status(201).json(ticket);
      }

      // Nếu không phải vé miễn phí, xử lý thanh toán như bình thường
      const orderInfo = `Thanh toán vé sự kiện: ${event.name}`;
      const paymentResult = await MomoService.createPayment(event.price, orderInfo);

      // Cập nhật thông tin thanh toán vào vé
      await Ticket.findByIdAndUpdate(ticket._id, {
        paymentData: paymentResult
      });

      // Thêm ticket vào ticketsBought của user
      user.ticketsBought.push(ticket._id);
      await user.save();
      console.log('Added ticket to user ticketsBought:', buyerId);

      res.status(201).json({
        _id: ticket._id,
        eventId: ticket.eventId,
        buyerId: ticket.buyerId,
        bookingCode: ticket.bookingCode,
        //qrCode: ticket.qrCode,
        status: ticket.status,
        paymentStatus: ticket.paymentStatus,
        paymentData: paymentResult,
        createdAt: ticket.createdAt,
        updatedAt: ticket.updatedAt,
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: error.message
      });
    }
  }

  static async cancelTicket(req, res) {
    try {
      const { ticketId } = req.params;
      const { cancelReason } = req.body;
      const userId = req.id;

      if (!cancelReason) {
        return res.status(400).json({
          status: "error",
          message: "Reason is required for cancellation"
        });
      }

      await TicketService.cancelTicket(ticketId, userId, cancelReason);
      
      res.status(200).json({
        message: "Ticket cancelled successfully."
      });
    } catch (error) {
      res.status(500).json({
        message: error.message
      });
    }
  }

  static async transferTicket(req, res) {
    try {
      const { ticketId } = req.params;
      const { newOwnerId } = req.body;
      const currentOwnerId = req.id;

      await TicketService.transferTicket(ticketId, currentOwnerId, newOwnerId);

      res.status(200).json({
        message: "Ticket transfer initiated. Waiting for confirmation."
      });
    } catch (error) {
      res.status(500).json({
        message: error.message
      });
    }
  }

  static async confirmTransfer(req, res) {
    try {
      const { ticketId } = req.params;
      const newOwnerId = req.id;

      await TicketService.confirmTransfer(ticketId, newOwnerId);

      res.status(200).json({
        message: "Ticket transferred successfully."
      });
    } catch (error) {
      res.status(500).json({
        message: error.message
      });
    }
  }

  static async rejectTransfer(req, res) {
    try {
      const { ticketId } = req.params;
      const userId = req.id;

      await TicketService.rejectTransfer(ticketId, userId);

      res.status(200).json({
        message: "Ticket transfer rejected."
      });
    } catch (error) {
      res.status(500).json({
        message: error.message
      });
    }
  }

  static async checkIn(req, res) {
    try {
      const { bookingCode } = req.body;
      const createdBy = req.id; // ID của người tổ chức từ token

      // Validate input
      if (!bookingCode) {
        return res.status(400).json({
          status: "error",
          message: "Booking code is required"
        });
      }

      // Tìm vé với booking code
      const ticket = await Ticket.findOne({ bookingCode })
        .populate('eventId')
        .populate('buyerId');

      if (!ticket) {
        return res.status(404).json({
          status: "error",
          message: "Ticket not found"
        });
      }

      // Kiểm tra quyền của người tổ chức
      if (ticket.eventId.createdBy.toString() !== createdBy) {
        return res.status(403).json({
          status: "error",
          message: "You don't have permission to check-in this ticket"
        });
      }

      // Kiểm tra trạng thái vé
      if (ticket.status === 'checked-in') {
        return res.status(400).json({
          status: "error",
          message: "Ticket already checked-in"
        });
      }

      if (ticket.paymentStatus !== 'paid') {
        return res.status(400).json({
          status: "error",
          message: "Ticket payment not completed"
        });
      }

      // Kiểm tra thời gian sự kiện
      const eventDate = new Date(ticket.eventId.date);
      const now = new Date();
      
      //Khi nào cần chức năng này thì dùng

      // Cho phép check-in trước 1 giờ và sau khi sự kiện bắt đầu 1 giờ
      // const oneHoursBefore = new Date(eventDate.getTime() - 1 * 60 * 60 * 1000);
      // const oneHoursAfter = new Date(eventDate.getTime() + 1 * 60 * 60 * 1000);

      // if (now < oneHoursBefore || now > oneHoursAfter) {
      //   return res.status(400).json({
      //     status: "error",
      //     message: "Check-in is only allowed 1 hours before and 1 hours after event start time"
      //   });
      // }

      // Cập nhật trạng thái vé
      ticket.status = 'checked-in';
      ticket.checkInTime = new Date();
      await ticket.save();

      res.status(200).json({
        status: "success",
        message: "Check-in successful",
        data: {
          ticket: {
            id: ticket._id,
            eventName: ticket.eventId.name,
            buyerName: ticket.buyerId.name,
            checkInTime: ticket.checkInTime
          }
        }
      });

    } catch (error) {
      console.error('Check-in error:', error);
      res.status(500).json({
        status: "error",
        message: error.message
      });
    }
  }

  static async handlePaymentCallback(req, res) {
    try {
      const { orderId, resultCode } = req.body;
      
      // Tìm vé dựa trên orderId trong paymentData
      const ticket = await Ticket.findOne({ "paymentData.orderId": orderId });
      
      if (!ticket) {
        throw new Error('Ticket not found');
      }

      // Cập nhật trạng thái thanh toán
      ticket.paymentStatus = resultCode === 0 ? 'paid' : 'failed';
      await ticket.save();

      res.status(200).json({
        status: "success",
        message: "Payment status updated"
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: error.message
      });
    }
  }

  static async getTicketHistory(req, res) {
    try {
      const userId = req.id; // Lấy ID người dùng từ token

      // Tìm user và populate ticketsBought
      const user = await User.findById(userId)
        .populate({
          path: 'ticketsBought',
          populate: [
            {
              path: 'eventId',
              select: 'name date location price description banner'
            },
            {
              path: 'buyerId',
              select: 'name email'
            }
          ],
          options: { sort: { createdAt: -1 } } // Sắp xếp theo thời gian mua mới nhất
        });

      if (!user) {
        return res.status(404).json({
          status: "error",
          message: "User not found"
        });
      }

      // Format lại dữ liệu trước khi trả về
      const formattedTickets = user.ticketsBought.map((ticket) => ({
        _id: ticket._id,
        bookingCode: ticket.bookingCode,
        event: {
          _id: ticket.eventId._id,
          name: ticket.eventId.name,
          date: ticket.eventId.date,
          location: ticket.eventId.location,
          price: ticket.eventId.price,
          banner: ticket.eventId.banner,
        },
        status: ticket.status,
        paymentStatus: ticket.paymentStatus,
        checkInTime: ticket.checkInTime,
        createAt: ticket.createdAt,
        cancelReason: ticket.cancelReason,
        paymentStatus: ticket.paymentStatus,
        paymentData: ticket.paymentData,
        //qrCode: ticket.qrCode,
      }));

      res.status(200).json(formattedTickets);

    } catch (error) {
      console.error('Get ticket history error:', error);
      res.status(500).json({
        status: "error",
        message: error.message
      });
    }
  }

  static async getTicketDetail(req, res) {
    try {
      const { ticketId } = req.params;

      // Tìm ticket và populate thông tin event và buyer
      const ticket = await Ticket.findById(ticketId)
        .populate({
          path: 'eventId',
          select: 'name description location date price images'
        })
        .populate({
          path: 'buyerId',
          select: 'name email'
        });

      if (!ticket) {
        return res.status(404).json({
          status: "error",
          message: "Ticket not found"
        });
      }

      res.status(200).json({
        status: "success",
        data: {
          ticket: {
            id: ticket._id,
            bookingCode: ticket.bookingCode,
            qrCode: ticket.qrCode,
            status: ticket.status,
            paymentStatus: ticket.paymentStatus,
            event: {
              id: ticket.eventId._id,
              name: ticket.eventId.name,
              description: ticket.eventId.description,
              location: ticket.eventId.location,
              date: ticket.eventId.date,
              price: ticket.eventId.price,
              images: ticket.eventId.images
            },
            buyer: {
              id: ticket.buyerId._id,
              name: ticket.buyerId.name,
              email: ticket.buyerId.email
            },
            createdAt: ticket.createdAt,
            checkInTime: ticket.checkInTime
        }
        }
      });

    } catch (error) {
      console.error('Get ticket detail error:', error);
      res.status(500).json({
        status: "error",
        message: error.message
      });
    }
  }
}

module.exports = TicketController;
