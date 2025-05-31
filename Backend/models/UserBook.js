const mongoose = require('mongoose');

const UserBookSchema = new mongoose.Schema({
    user_id: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User',
        required: true
    },
    book_id: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Book', 
        required: true
    },
    owned_date: { 
        type: Date, 
        default: Date.now 
    },
	locked_by_trade: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Trade',
        default: null
    }
});

module.exports = mongoose.model('UserBook', UserBookSchema);