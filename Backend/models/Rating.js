const mongoose = require('mongoose');

const RatingSchema = new mongoose.Schema({
    user_id: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User',
        required: true
    },
    rated_user_id: { 
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
        type: String,
        maxlength: 500
    },
    stars: { 
        type: Number,
        min: 1,
        max: 5,
        required: true
    }
});

// Index to prevent duplicate ratings for the same trade by the same user
RatingSchema.index({ user_id: 1, trade_id: 1 }, { unique: true });

// Index for efficient queries when getting ratings for a specific user
RatingSchema.index({ rated_user_id: 1, createdAt: -1 });

module.exports = mongoose.model('Rating', RatingSchema);