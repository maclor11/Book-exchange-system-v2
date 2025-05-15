const mongoose = require('mongoose');

const TradeSchema = new mongoose.Schema({
    user1_id: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User',
        required: true
    },
    user2_id: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User',
        required: true
    },
    status: { 
        type: String, 
        enum: ['pending', 'accepted', 'rejected', 'completed'],
        default: 'pending'
    },
    reviewed: { 
        type: Boolean, 
        default: false 
    }
});

module.exports = mongoose.model('Trade', TradeSchema);