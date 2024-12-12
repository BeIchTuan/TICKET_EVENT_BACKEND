const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ticketSchema = new Schema({
  eventId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Event', 
    required: true 
  },
  buyerId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  bookingCode: { 
    type: String, 
    required: true, 
    unique: true 
  },
  qrCode: { 
    type: String, 
    required: true, 
    unique: true 
  },
  status: { 
    type: String, 
    enum: ['booked', 'cancelled', 'checked-in'],
    default: 'booked'
  },
  cancelReason: String,
  isDeleted: {
    type: Boolean,
    default: false
  },
  paymentStatus: { 
    type: String, 
    enum: ['pending', 'paid', 'failed'],
    default: 'pending'
  },
  paymentData: {
    type: Object,
    default: null
  }
}, {
  timestamps: true, // Tự động thêm createdAt và updatedAt
  collection: 'ticket'
});

// Tạo index cho các trường thường được tìm kiếm
ticketSchema.index({ eventId: 1, buyerId: 1 });
ticketSchema.index({ bookingCode: 1 });
ticketSchema.index({ status: 1 });

const Ticket = mongoose.model('Ticket', ticketSchema);

module.exports = Ticket;
