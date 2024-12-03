const express = require('express');
const router = express.Router();
const EventController = require('../controllers/EventController');
const { authMiddleware } = require('../middlewares/AuthMiddleware');

// Public routes
router.get('/', EventController.getEvents);
router.get('/search', EventController.searchEvents);
router.get('/:eventId', EventController.getEventDetails);

// Protected routes
router.post('/create', 
  authMiddleware(['event_creator', 'admin']), 
  EventController.createEvent
);

router.put('/:eventId', 
  authMiddleware(['event_creator', 'admin']), 
  EventController.updateEvent
);

router.delete('/:eventId', 
  authMiddleware(['admin', 'event_creator']), 
  EventController.deleteEvent
);

module.exports = router;
