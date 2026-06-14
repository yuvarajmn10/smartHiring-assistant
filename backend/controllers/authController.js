const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
// Helper — generate a JWT token for a user
const generateToken = (userId) => {
    return jwt.sign(
        { id: userId },
        // payload — what's stored inside the token
        process.env.JWT_SECRET,
        // secret — used to sign the token
        { expiresIn: '7d' }
        // token expires in 7 days — user must log in again after
    );
};
// ─── REGISTER ───────────────────────────────────────
const register = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        // Pull data from request body
        if (!name || !email || !password) {
            return res.status(400).json({ message: 'All fields are required' });
        }
        if (password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters' });
        }
        // 1. Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already registered' });
        }
        // 2. Hash the password
        const salt = await bcrypt.genSalt(10);
        // salt = random data added before hashing — makes each hash unique
        const hashedPassword = await bcrypt.hash(password, salt);
        // 3. Create user in DB with hashed password
        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            // NEVER save plain password
            role,
        });
        // 4. Generate token and send response
        const token = generateToken(user._id);
        res.status(201).json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
// ─── LOGIN ──────────────────────────────────────────
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: 'All fields are required' });
        }
        // 1. Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }
        // Note: we say "Invalid email or password" not "Email not found"
        // Never tell attackers which part was wrong
        // 2. Compare entered password with hashed password in DB
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }
        // 3. Password correct — generate token and respond
        const token = generateToken(user._id);
        res.json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET /api/auth/me — returns the currently logged-in user
const getMe = async (req, res) => {
    res.json({ user: req.user });
    // req.user was attached by the protect middleware
    // This route just returns it — no DB call needed
};

module.exports = { register, login, getMe };