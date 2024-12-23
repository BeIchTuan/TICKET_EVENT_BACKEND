const EventService = require("../services/EventService");
const {
  uploadToCloudinary,
  deleteFromCloudinary,
} = require("../utils/UploadImage");
const multer = require("multer");
const upload = multer();

class EventController {
  static async createEvent(req, res) {
    try {
      console.log("Headers:", req.headers);
      console.log("User ID:", req.id);
      console.log("Request body:", req.body);

      // Parse collaborators từ request body
      let collaborators = [];
      if (req.body.collaborators) {
        collaborators = JSON.parse(req.body.collaborators);
        if (!Array.isArray(collaborators)) {
          return res.status(400).json({
            success: false,
            message: "Collaborators must be an array"
          });
        }
      }

      const eventData = {
        ...req.body,
        createdBy: req.id,
        collaborators: collaborators, // Thêm collaborators vào event data
        status: "active",
        isDeleted: false,
      };

      const imageUrls = [];
      if (req.files) {
        for (const file of req.files) {
          const result = await uploadToCloudinary(file, "events");
          imageUrls.push(result.secure_url);
        }
      }

      console.log("Event data:", eventData);

      const event = await EventService.createEvent({
        ...eventData,
        images: imageUrls,
      });
      res.status(201).json({
        success: true,
        message: "Event created successfully.",
        data: event,
      });
    } catch (error) {
      console.log("Error:", error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  static async getEvents(req, res) {
    try {
      const event = await EventService.getEvents(req.query);
      res.status(200).json(event);
    } catch (error) {
      res.status(500).json({
        message: error.message,
      });
    }
  }

  static async updateEvent(req, res) {
    try {
      // Parse dữ liệu từ form-data
      const eventData = {
        name: req.body.name,
        description: req.body.description,
        location: req.body.location,
        date: req.body.date,
        price: req.body.price ? Number(req.body.price) : undefined,
        maxAttendees: req.body.maxAttendees
          ? Number(req.body.maxAttendees)
          : undefined,
        categoryId: req.body.categoryId
          ? JSON.parse(req.body.categoryId)
          : undefined,
      };

      // Parse và thêm collaborators nếu có
      if (req.body.collaborators) {
        eventData.collaborators = JSON.parse(req.body.collaborators);
        if (!Array.isArray(eventData.collaborators)) {
          return res.status(400).json({
            success: false,
            message: "Collaborators must be an array"
          });
        }
      }

      // Xử lý upload ảnh mới và xóa ảnh cũ
      let newImageUrls = [];
      let imagesToDelete = req.body.imagesToDelete || []; // Danh sách ảnh cần xóa (nếu có)

      // Kiểm tra nếu có file tải lên
      if (req.files && req.files.length > 0) {
        for (const file of req.files) {
          const result = await uploadToCloudinary(file, "events"); // Tải lên Cloudinary
          newImageUrls.push(result.secure_url); // Lưu URL của ảnh mới
        }
      }

      // if (req.files && req.files.length > 0) {
      //   const imageUrls = [];
      //   for (const file of req.files) {
      //     const result = await uploadToCloudinary(file, "events");
      //     imageUrls.push(result.secure_url);
      //   }
      //   eventData.images = imageUrls;
      // }

      // Lọc bỏ các trường undefined
      Object.keys(eventData).forEach(
        (key) => eventData[key] === undefined && delete eventData[key]
      );

      const updatedEvent = await EventService.updateEvent(
        req.params.eventId,
        req.id,
        eventData,
        newImageUrls,
        imagesToDelete
      );

      res.status(200).json({
        success: true,
        message: "Event updated successfully",
        data: updatedEvent,
      });
    } catch (error) {
      console.error("Error updating event:", error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  static async deleteEvent(req, res) {
    try {
      await EventService.deleteEvent(req.params.eventId, req.id);
      res.status(200).json({
        message: "Event deleted successfully.",
      });
    } catch (error) {
      res.status(500).json({
        message: error.message,
      });
    }
  }

  static async getEventDetails(req, res) {
    try {
      const event = await EventService.getEventDetails(req.params.eventId);
      res.status(200).json(event);
    } catch (error) {
      res.status(500).json({
        message: error.message,
      });
    }
  }

  static async searchEvents(req, res) {
    try {
      console.log("Search query:", req.query);
      const event = await EventService.searchEvents(req.query);
      res.status(200).json(event);
    } catch (error) {
      res.status(500).json({
        message: error.message,
      });
    }
  }

  static async getManagedEvents(req, res) {
    try {
      const userId = req.id; 
      const events = await EventService.getManagedEvents(userId);

      return res.status(200).json(events);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Failed to retrieve managed events.' });
    }
  }

  static async getEventParticipants(req, res) {
    try {
      const { eventId } = req.params;
      
      const participants = await EventService.getEventParticipants(eventId);
      
      return res.status(200).json({
        success: true,
        data: participants,
        message: 'Lấy danh sách người tham gia thành công'
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = EventController;
