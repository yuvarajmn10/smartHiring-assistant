const express = require('express');
const cors = require('cors');
require('dotenv').config();
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const jobRoutes = require('./routes/jobRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const resumeRoutes = require('./routes/resumeRoutes');
const interviewRoutes = require('./routes/interviewRoutes');
connectDB();
const app = express();
// Middleware — parse incoming JSON bodies

app.use(cors({
    origin: [
        'http://localhost:5173',
        process.env.FRONTEND_URL,
        // ↑ Vercel URL added via env var after Day 25
    ].filter(Boolean),
    // filter(Boolean) removes undefined if FRONTEND_URL not set yet
    credentials: true,
}));
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/resume', resumeRoutes);
app.use('/api/interview', interviewRoutes);
// Test route
app.get('/', (req, res) => {
    res.json({ message: 'Hello World — server is running!' });
});

app.use((req, res) => {
    res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});
app.use((err, req, res, next) => {
    let message = err.message || 'Server error';
    if (err.name === 'CastError') {
        message = 'Invalid ID format';
    }
    res.status(err.status || 500).json({ message });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

