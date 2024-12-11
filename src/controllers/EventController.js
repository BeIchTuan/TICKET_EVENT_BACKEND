const EventService = require('../services/EventService');
const {
  uploadToCloudinary,
  deleteFromCloudinary,
} = require("../utils/UploadImage");
const multer = require('multer');
const upload = multer();

class EventController {
  static async createEvent(req, res) {
    try {
      console.log('Headers:', req.headers);
      console.log('User ID:', req.id);
      console.log('Request body:', req.body);
      
      const eventData = {
        ...req.body,
        createdBy: req.id,
        status: 'active',
        isDeleted: false
      };

      const imageUrls = [];
      if (req.files) {
        for (const file of req.files) {
          const result = await uploadToCloudinary(file, "events");
          imageUrls.push(result.secure_url); 
        }
      }
      
      console.log('Event data:', eventData);
      
      const event = await EventService.createEvent({...eventData, images: imageUrls});
      res.status(201).json({
        success: true,
        message: "Event created successfully.",
        data: event
      });
    } catch (error) {
      console.log('Validation error:', error);
      
      const errorDetails = error.errInfo?.details?.schemaRulesNotSatisfied || [];
      const formattedError = {
        message: error.message,
        validationErrors: errorDetails.map(detail => ({
          field: detail.propertyName,
          reason: detail.description
        }))
      };

      res.status(400).json({
        success: false,
        ...formattedError
      });
    }
  }

  static async getEvents(req, res) {
    try {
      const event = await EventService.getEvents(req.query);
      res.status(200).json(event);
    } catch (error) {
      res.status(500).json({
        message: error.message
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
        maxAttendees: req.body.maxAttendees ? Number(req.body.maxAttendees) : undefined,
        categoryId: req.body.categoryId ? JSON.parse(req.body.categoryId) : undefined,
      };

      // Xử lý upload ảnh mới (nếu có)
      if (req.files && req.files.length > 0) {
        const imageUrls = [];
        for (const file of req.files) {
          const result = await uploadToCloudinary(file, "events");
          imageUrls.push(result.secure_url);
        }
        eventData.images = imageUrls;
      }

      // Lọc bỏ các trường undefined
      Object.keys(eventData).forEach(key => 
        eventData[key] === undefined && delete eventData[key]
      );

      const updatedEvent = await EventService.updateEvent(
        req.params.eventId,
        req.id,
        eventData
      );

      res.status(200).json({
        success: true,
        message: "Event updated successfully",
        data: updatedEvent
      });
    } catch (error) {
      console.error('Error updating event:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  static async deleteEvent(req, res) {
    try {
      await EventService.deleteEvent(req.params.eventId, req.id);
      res.status(200).json({
        message: "Event deleted successfully."
      });
    } catch (error) {
      res.status(500).json({
        message: error.message
      });
    }
  }

  static async getEventDetails(req, res) {
    try {
      const event = await EventService.getEventDetails(req.params.eventId);
      res.status(200).json(event);
    } catch (error) {
      res.status(500).json({
        message: error.message
      });
    }
  }

  static async searchEvents(req, res) {
    try {
      const event = await EventService.searchEvents(req.query);
      res.status(200).json(event);
    } catch (error) {
      res.status(500).json({
        message: error.message
      });
    }
  }
}

module.exports = EventController;
