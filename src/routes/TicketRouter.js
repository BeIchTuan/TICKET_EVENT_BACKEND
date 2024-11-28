const express = require('express');
const router = express.Router();
const TicketController = require('../controllers/TicketController');
const { authMiddleware } = require('../middlewares/AuthMiddleware');

router.post('/book', 
  authMiddleware(['ticket_buyer']), 
  TicketController.bookTicket
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

module.exports = router;
