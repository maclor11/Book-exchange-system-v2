const mongoose = require('mongoose');

const OpinionSchema = new mongoose.Schema({
    user_id: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User',
        required: true
    },
    trade_id: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Trade',
        required: true
    },
    message: { 
        type: String 
    },
    stars: { 
        type: Number,
        min: 1,
        max: 5
    }
});

module.exports = mongoose.model('Opinion', OpinionSchema);