const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    username: { 
        type: String, 
        required: true,
        unique: true
    },
    password: { 
        type: String, 
        required: true
    },
    is_admin: { 
        type: Boolean, 
        default: false
    },
    profilePicturePath: {
        type: String,
        default: null
    }
});

// Hash password before saving
UserSchema.pre('save', async function(next) {
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 10);
    }
    next();
});

module.exports = mongoose.model('User', UserSchema);