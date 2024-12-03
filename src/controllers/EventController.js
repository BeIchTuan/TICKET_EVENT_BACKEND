const EventService = require('../services/EventService');

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
      
      console.log('Event data:', eventData);
      
      const event = await EventService.createEvent(eventData);
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
      await EventService.updateEvent(req.params.eventId, req.id, req.body);
      res.status(200).json({
        message: "Event updated successfully."
      });
    } catch (error) {
      res.status(500).json({
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
