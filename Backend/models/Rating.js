const mongoose = require('mongoose');

const RatingSchema = new mongoose.Schema({
    user_id: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User',
        required: true
    },
    trade_id: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Trade',
        required: false  // TODO: change to true once Trades have been added
    },
    message: { 
        type: String 
    },
    stars: { 
        type: Number,
        min: 1,
        max: 5
    }
}, {timestamps: true});

module.exports = mongoose.model('Rating', RatingSchema);