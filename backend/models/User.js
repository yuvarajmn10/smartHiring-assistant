const mongoose = require('mongoose');
const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Name is required'],
            trim: true,
            // trim removes accidental spaces: " Ravi " → "Ravi"
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            // unique: true means no two users can have the same email
            lowercase: true,
            // lowercase: saves "Ravi@Gmail.com" as "ravi@gmail.com"
            trim: true,
        },
        password: {
            type: String,
            required: [true, 'Password is required'],
            minlength: [6, 'Password must be at least 6 characters'],
        },
        role: {
            type: String,
            enum: ['recruiter', 'candidate'],
            // enum means: only these two values are allowed
            default: 'candidate',
            // if no role is given, user is a candidate by default
        },
    },
    {
        timestamps: true,
        // timestamps: true auto-adds createdAt and updatedAt fields
    }
);
const User = mongoose.model('User', userSchema);
// 'User' → MongoDB creates a collection called "users" (lowercase + plural)
module.exports = User;