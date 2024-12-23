const Event = require("../models/EventModel");
const User = require("../models/UserModel");
const Category = require("../models/CategoryModel");
const Conversation = require("../models/ConversationModel");
const {
  deleteFromCloudinary,
  extractPublicId,
} = require("../utils/UploadImage");
const notificationService = require("../services/NotificationService");
const Ticket = require("../models/TicketModel");

class EventService {
  static async createEvent(eventData) {
    try {
      console.log("Input eventData:", JSON.stringify(eventData, null, 2));

      // Kiểm tra collaborators có role event_creator
      if (eventData.collaborators?.length) {
        const collaborators = await User.find({
          _id: { $in: eventData.collaborators },
          role: "event_creator",
        });

        if (collaborators.length !== eventData.collaborators.length) {
          throw new Error("Some collaborators are not event creators");
        }
      }

      // Validate categoryId
      const category = await Category.findById(eventData.categoryId);
      if (!category) {
        throw new Error("Category not found");
      }

      // Validate date
      const eventDate = new Date(eventData.date);
      if (eventDate < new Date()) {
        throw new Error("Event date must be in the future");
      }

      // Validate price and maxAttendees
      if (eventData.price < 0) {
        throw new Error("Price must be positive");
      }
      if (eventData.maxAttendees < 0) {
        throw new Error("Maximum attendees must be positive");
      }

      const newConversation = new Conversation({
        members: [],
        title: eventData.name,
      });
      const savedConversation = await newConversation.save();

      // Liên kết conversation với eventData
      eventData.conversation = savedConversation._id;

      const event = new Event(eventData);

      // Validate thủ công
      const validationError = event.validateSync();
      if (validationError) {
        console.log("Validation errors:", validationError.errors);
        throw validationError;
      }

      console.log("Event before save:", event);
      const savedEvent = await event.save();

      const users = await User.find({
        role: { $in: ["ticket_buyer", "admin"] },
      });

      const tokens = users
        .flatMap((user) => user.fcmTokens)
        .filter(Boolean);

      if (tokens.length) {
        const title = "New Event Created!";
        const body = `Check out the new event: ${eventData.name}`;
        const data = {
          type: "new_event",
          eventId: savedEvent._id.toString(),
        };

        await notificationService.sendNotification(tokens, title, body, data);

        for (const user of users) {
          await notificationService.saveNotification(
            user._id,
            "new_event",
            title,
            body,
            data
          );
        }
      }

      return savedEvent;
    } catch (error) {
      console.log("Detailed error:", {
        message: error.message,
        errors: error.errors,
        code: error.code,
        details: error.errInfo?.details,
      });
      throw error;
    }
  }

  static async getEvents(filters = {}) {
    try {
      const query = { isDeleted: false };

      if (filters.status) query.status = filters.status;
      if (filters.date) query.date = filters.date;
      if (filters.categoryId) query.categoryId = filters.categoryId;
      if (filters.createdBy) query.createdBy = filters.createdBy;
      if (filters.isAfter) query.date = { $gt: new Date() };

      let sortOptions = { createdAt: -1 };
      if (filters.sortBy) {
        switch (filters.sortBy) {
          case "date":
            sortOptions = { date: -1 };
            break;
          case "sold":
            sortOptions = { ticketsSold: -1 };
            break;
          case "price":
            sortOptions = { price: 1 };
            break;
          default:
            sortOptions = { createdAt: -1 };
            break;
        }
      }

      return await Event.find(query)
        .sort(sortOptions) // Sắp xếp theo thời gian tạo mới nhất
        .populate("categoryId", "name")
        .populate("createdBy", "name")
        .populate("conversation", "_id title")
        .populate("collaborators", "_id name")
        .exec()
        // đổi tên categoryId thành category trong data trả về
        .then((events) =>
          events.map((event) => {
            const eventObj = event.toObject();
            eventObj.category = eventObj.categoryId;
            delete eventObj.categoryId;
            return eventObj;
          })
        );
    } catch (error) {
      throw error;
    }
  }

  static async updateEvent(
    eventId,
    userId,
    updateData,
    newImages,
    imagesToDelete
  ) {
    try {
      const event = await Event.findOne({
        _id: eventId,
        createdBy: userId,
        isDeleted: false,
      });

      if (!event) throw new Error("Event not found or unauthorized");

      if (imagesToDelete && imagesToDelete.length > 0) {
        if (typeof imagesToDelete === "string") {
          imagesToDelete = JSON.parse(imagesToDelete);
        }

        for (const image of imagesToDelete) {
          if (typeof image === "string") {
            const publicId = extractPublicId(image);
            console.log("Extracted Public ID:", publicId);

            await deleteFromCloudinary(publicId);

            const index = event.images.indexOf(image);
            if (index > -1) event.images.splice(index, 1);
          } else {
            console.error("Invalid image URL:", image);
          }
        }
      }

      // Thêm ảnh mới vào danh sách ảnh
      if (newImages && newImages.length > 0) {
        event.images.push(...newImages);
      }

      // Kiểm tra collaborators nếu được cập nhật
      if (updateData.collaborators) {
        const collaborators = await User.find({
          _id: { $in: updateData.collaborators },
          role: "event_creator",
        });

        if (collaborators.length !== updateData.collaborators.length) {
          throw new Error("Some collaborators are not event creators");
        }
      }

      Object.assign(event, updateData);
      await event.save();

      const users = await User.find({
        role: { $in: ["ticket_buyer", "admin"] },
      });

      const tokens = users
        .flatMap((user) => user.fcmTokens)
        .filter(Boolean);

      if (tokens.length) {
        const title = "The Event has been changed!";
        const body = `Check out the new update event: ${event.name}`;
        const data = {
          type: "event_update",
          eventId: event._id.toString(),
        };

        await notificationService.sendNotification(tokens, title, body, data);

        for (const user of users) {
          await notificationService.saveNotification(
            user._id,
            "event_update",
            title,
            body,
            data
          );
        }
      }

      return event;
    } catch (error) {
      throw error;
    }
  }

  static async deleteEvent(eventId, userId) {
    try {
      const event = await Event.findOneAndUpdate(
        {
          _id: eventId,
          createdBy: userId,
          isDeleted: false,
          status: "active",
        },
        { isDeleted: true, status: "canceled" },
        { new: true }
      );

      if (!event) throw new Error("Event not found or unauthorized");
      return event;
    } catch (error) {
      throw error;
    }
  }

  static async getEventDetails(eventId) {
    try {
      const event = await Event.findOne({ _id: eventId, isDeleted: false })
        .populate("collaborators", "_id name avatar studentId")
        .populate("createdBy", "_id name avatar studentId")
        .populate("conversation", "_id title")
        .populate({
          path: "createdBy",
          select: "_id name avatar studentId",
        })
        .populate("categoryId", "name");

      // đổi tên categoryId thành category trong data trả về
      if (event) {
        const eventObj = event.toObject();
        eventObj.category = eventObj.categoryId;
        delete eventObj.categoryId;
        return eventObj;
      }

      if (!event) throw new Error("Event not found");
      return event;
    } catch (error) {
      throw error;
    }
  }

  static async searchEvents(searchParams) {
    try {
      console.log("Search query:", searchParams);
      const query = { isDeleted: false };

      // Tìm kiếm theo tên sự kiện (không phân biệt hoa thường)
      if (searchParams.name) {
        query.name = { $regex: searchParams.name, $options: "i" };
      }
      // Tìm kiếm theo địa điểm (không phân biệt hoa thường)
      if (searchParams.location) {
        query.location = { $regex: searchParams.location, $options: "i" };
      }
      // Tìm kiếm theo ngày
      if (searchParams.date) {
        // Chuyển đổi ngày thành đối tượng Date
        const searchDate = new Date(searchParams.date);
        // Tìm các sự kiện trong cùng ngày
        query.date = {
          $gte: new Date(searchDate.setHours(0, 0, 0, 0)),
          $lt: new Date(searchDate.setHours(23, 59, 59, 999))
        };
      }
      // Tìm kiếm theo category
      if (searchParams.categoryId) {
        query.categoryId = searchParams.categoryId;
      }
      // Tìm kiếm theo trạng thái
      if (searchParams.status) {
        query.status = searchParams.status;
      }

      return await Event.find(query)
        .sort({ createdAt: -1 })
        .populate("categoryId", "name")
        .populate("createdBy", "name")
        .populate("conversation", "_id title")
        .populate("collaborators", "_id name")
        .exec()
        // đổi tên categoryId thành category trong data trả về
        .then((events) =>
          events.map((event) => {
            const eventObj = event.toObject();
            eventObj.category = eventObj.categoryId;
            delete eventObj.categoryId;
            return eventObj;
          })
        );
    } catch (error) {
      throw error;
    }
  }

  static async getManagedEvents(userId) {
    try {
      const events = await Event.find({
        $or: [{ createdBy: userId }, { collaborators: userId }],
        isDeleted: false,
      })
        .populate("createdBy", "_id name avatar studentId")
        .populate("collaborators", "_id name")
        .populate({
          path: "categoryId",
          model: "Category",
          select: "_id name",
        })
        .exec();

      return events.map((event) => ({
        ...event.toObject(),
        category: event.categoryId.map((category) => ({
          _id: category._id,
          name: category.name,
        })),
        categoryId: undefined,
      }));
    } catch (error) {
      throw new Error("Error fetching managed events: " + error.message);
    }
  }

  static async getEventParticipants(eventId) {
    try {
      // Tìm tất cả vé đã book thành công cho sự kiện này
      const tickets = await Ticket.find({
        eventId: eventId,
        status: 'booked',
        paymentStatus: { $in: ['paid', 'transferred'] }  // Chỉ lấy vé đã thanh toán hoặc đã chuyển nhượng
      }).populate('buyerId', 'name email phone'); // Lấy thông tin người mua vé

      // Trích xuất thông tin người tham gia từ tickets
      const participants = tickets.map(ticket => ({
        ticketId: ticket._id,
        participant: ticket.buyerId,
        ticketType: ticket.ticketType,
        purchaseDate: ticket.createdAt
      }));
      return participants;
    } catch (error) {
      throw error;
    }
  }

}

module.exports = EventService;
