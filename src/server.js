// backend/src/server.js

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const connectDatabase = require('./config/database');

const app = express();

// ============================================
// Middleware Setup
// ============================================

// Security
app.use(helmet());

// CORS
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));

// Body Parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ============================================
// Database Connection
// ============================================
connectDatabase();

// ============================================
// Routes
// ============================================

// Test route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Street Bites API is running! 🎉',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Import routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const orderRoutes = require('./routes/order.routes');
const stallPerformanceRoutes = require('./routes/stallPerformance.routes');
const deliveryZoneRoutes = require('./routes/deliveryZone.routes');
const investorRoutes = require('./routes/investor.routes');
const expenseRoutes = require('./routes/expense.routes');
const profitLossRoutes = require('./routes/profitLoss.routes');
const payrollRoutes = require('./routes/payroll.routes');

// ⭐ PART 9 - Product Management Routes
const productRoutes = require('./routes/product.routes');
const categoryRoutes = require('./routes/category.routes');

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/profile', userRoutes);
app.use('/api/employees', userRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/stall-performance', stallPerformanceRoutes);
app.use('/api/delivery-zones', deliveryZoneRoutes);
app.use('/api/investors', investorRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/profit-loss', profitLossRoutes);
app.use('/api/payroll', payrollRoutes);

// ⭐ PART 9 - Product & Category Routes
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);

// ============================================
// Error Handling
// ============================================

// 404 Handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: 'Route পাওয়া যায়নি',
    requestedUrl: req.originalUrl
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'সার্ভার এররর',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// ============================================
// Server Start
// ============================================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════╗
║                                               ║
║         🍔 Street Bites API Server 🍔         ║
║                                               ║
║   Server running on: http://localhost:${PORT}   ║
║   Environment: ${process.env.NODE_ENV || 'development'}                    ║
║   Database: MongoDB Connected ✅              ║
║                                               ║
║   API Documentation:                          ║
║   http://localhost:${PORT}/api                    ║
║                                               ║
║   📦 Part 9 - Product Management APIs         ║
║   ✅ Product CRUD (18 endpoints)              ║
║   ✅ Category Management (11 endpoints)       ║
║   ✅ Image Upload (Multiple)                  ║
║   ✅ Search & Filters                         ║
║                                               ║
║   Available Routes:                           ║
║   - GET  /health                              ║
║   - POST /api/auth/register                   ║
║   - POST /api/auth/verify-otp                 ║
║   - POST /api/auth/login                      ║
║   - GET /api/auth/me                          ║
║   - POST /api/auth/refresh-token              ║
║   - POST /api/auth/forgot-password            ║
║   - POST /api/auth/2fa                        ║
║   - GET /api/auth/devices                     ║
║   - GET  /api/users                           ║
║   - GET  /api/profile/me                      ║
║   - POST /api/orders/create                   ║
║   - GET  /api/orders                          ║
║                                               ║
║   ⭐ NEW - Part 9:                            ║
║   - GET  /api/products          (18 APIs)     ║
║   - GET  /api/categories        (11 APIs)     ║
║   - POST /api/products          (+ images)    ║
║   - POST /api/categories        (+ image)     ║
║   - GET  /api/products/search?q=              ║
║   - GET  /api/products/featured               ║
║   - GET  /api/products/trending               ║
║                                               ║
╚═══════════════════════════════════════════════╝
  `);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

module.exports = app;