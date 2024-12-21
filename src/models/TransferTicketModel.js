const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const transferTicketSchema = new Schema({
  ticket: {
    type: Schema.Types.ObjectId,
    ref: 'Ticket',
    required: true
  },
  fromUser: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  toUser: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'success', 'rejected'],
    default: 'pending',
    required: true
  }
}, {
  timestamps: true,
  collection: 'transfer_tickets'
});

// Tạo index cho các trường thường được tìm kiếm
transferTicketSchema.index({ ticket: 1 });
transferTicketSchema.index({ fromUser: 1, toUser: 1 });
transferTicketSchema.index({ status: 1 });

// Đảm bảo một vé chỉ có một yêu cầu chuyển nhượng đang pending
transferTicketSchema.index(
  { ticket: 1, status: 1 },
  { 
    unique: true,
    partialFilterExpression: { status: 'pending' }
  }
);

// Thêm middleware pre-save để log
transferTicketSchema.pre('save', function(next) {
  console.log('Saving transfer ticket:', this.toObject());
  next();
});

const TransferTicket = mongoose.model('TransferTicket', transferTicketSchema);

module.exports = TransferTicket;
