const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const eventSchema = new Schema({
  name: { 
    type: String, 
    required: true
  },
  description: { 
    type: String, 
  },
  images: [{ 
    type: String 
  }],
  categoryId: [{ 
    type: Schema.Types.ObjectId, 
    ref: 'Category',
    required: true 
  }],
  location: { 
    type: String, 
    required: true 
  },
  date: { 
    type: Date, 
    required: true 
  },
  price: { 
    type: Number, 
  },
  maxAttendees: { 
    type: Number, 
    default: null 
  },
  ticketsSold: {
    type: Number,
    default: 0
  },
  collaborators: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'cancelled'],
    default: 'active'
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  collection: 'event'
});

const Event = mongoose.model('Event', eventSchema);
module.exports = Event;