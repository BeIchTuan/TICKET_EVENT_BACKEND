const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const categorySchema = new Schema({
    name: { 
        type: String, 
        required: true 
    },
    isDeleted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true,
    collection: 'category'
});

const Category = mongoose.model('Category', categorySchema);
module.exports = Category;
