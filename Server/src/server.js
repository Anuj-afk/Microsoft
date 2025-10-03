import express from "express";
import mongoose from "mongoose";
import "dotenv/config";
import cors from "cors";

// Import routes
import authRoutes from './Routes/authRoutes.js';
import categoryRoutes from './Routes/categoryRoutes.js';
import deviceRoutes from './Routes/deviceRoutes.js';
import mediaRoutes from './Routes/mediaRoutes.js';
import pageRoutes from './Routes/pageRoutes.js';
import offerRoutes from './Routes/offerRoutes.js';
import settingsRoutes from './Routes/settingsRoutes.js';

const server = express();

// Middleware
server.use(cors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'https://anuj-afk.github.io/Microsoft', 'https://anuj-afk.github.io'],
    credentials: true
}));
server.use(express.json({ limit: '10mb' }));
server.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Trust proxy for IP addresses
server.set('trust proxy', true);

// Routes
server.use('/api/auth', authRoutes);
server.use('/api/categories', categoryRoutes);
server.use('/api/devices', deviceRoutes);
server.use('/api/media', mediaRoutes);
server.use('/api/pages', pageRoutes);
server.use('/api/offers', offerRoutes);
server.use('/api/settings', settingsRoutes);

// Health check route
server.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString()
    });
});

// Error handling middleware
server.use((error, req, res, next) => {
    console.error('Server Error:', error);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
});

// 404 handler
server.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('Connected to MongoDB');
        
        // Start server
        const PORT = process.env.PORT || 3000;
        server.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    })
    .catch((error) => {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    });

export default server;