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
        enum: ['pending', 'accepted', 'rejected', 'completed', 'cancelled'],
        default: 'pending'
    },
    reviewed: { 
        type: Boolean, 
        default: false 
    },
    pending_user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    user1_confirmed_completion: {
        type: Boolean,
        default: false
    },
    user2_confirmed_completion: {
        type: Boolean,
        default: false
    },
    completion_date: {
        type: Date,
        default: null
    }
});

module.exports = mongoose.model('Trade', TradeSchema);