const express = require('express');
const router = express.Router();
const TicketController = require('../controllers/TicketController');
const { authMiddleware } = require('../middlewares/AuthMiddleware');

router.post('/book', 
  authMiddleware(['ticket_buyer']), 
  TicketController.bookTicket
);

router.get('/transferring-ticket', 
  authMiddleware(['ticket_buyer']), 
  TicketController.getTransferingTickets
);

router.delete('/:ticketId/cancel', 
  authMiddleware(['ticket_buyer']), 
  TicketController.cancelTicket
);

router.post('/:ticketId/transfer',
  authMiddleware(['ticket_buyer']),
  TicketController.transferTicket
);

router.post('/:ticketId/confirm',
  authMiddleware(['ticket_buyer']),
  TicketController.confirmTransfer
);

router.post('/:ticketId/reject',
  authMiddleware(['ticket_buyer']),
  TicketController.rejectTransfer
);

router.post('/check-in', 
  authMiddleware(['event_creator']), 
  TicketController.checkIn
);

router.get('/history', 
  authMiddleware(['ticket_buyer']), 
  TicketController.getTicketHistory
);

router.get('/:ticketId', 
  authMiddleware(['ticket_buyer', 'event_creator']), 
  TicketController.getTicketDetail
);

router.post(
  '/check-in-by-student-id',
  authMiddleware(['event_creator']),
  TicketController.checkInByStudentId
);

module.exports = router;
