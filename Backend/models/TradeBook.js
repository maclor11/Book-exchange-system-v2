const mongoose = require('mongoose');

const TradeBookSchema = new mongoose.Schema({
    trade_id: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Trade',
        required: true
    },
    book_id: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Book',
        required: true
    },
    owner_id: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User',
        required: true
    }
});

module.exports = mongoose.model('TradeBook', TradeBookSchema);