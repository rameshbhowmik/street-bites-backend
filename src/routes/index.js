// Main Routes Index
// সব routes একসাথে configure করার file

const express = require('express');
const router = express.Router();

// Import all route modules
const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const productRoutes = require('./productRoutes');
const stallRoutes = require('./stallRoutes');
const orderRoutes = require('./orderRoutes');

// =============================================
// API VERSION 1 ROUTES
// =============================================

// Health check route
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString()
  });
});

// Authentication routes
router.use('/auth', authRoutes);

// User routes
router.use('/users', userRoutes);

// Product routes
router.use('/products', productRoutes);

// Stall routes
router.use('/stalls', stallRoutes);

// Order routes
router.use('/orders', orderRoutes);

// =============================================
// API Documentation route (সংক্ষিপ্ত)
// =============================================
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Street Bites API v1',
    version: '1.0.0',
    endpoints: {
      auth: {
        base: '/api/auth',
        routes: [
          'POST /api/auth/register',
          'POST /api/auth/login',
          'GET /api/auth/profile',
          'POST /api/auth/logout'
        ]
      },
      users: {
        base: '/api/users',
        routes: [
          'GET /api/users/profile',
          'PUT /api/users/profile',
          'POST /api/users/upload-picture'
        ]
      },
      products: {
        base: '/api/products',
        routes: [
          'GET /api/products',
          'GET /api/products/:id',
          'POST /api/products (Admin)',
          'PUT /api/products/:id (Admin)',
          'DELETE /api/products/:id (Admin)'
        ]
      },
      stalls: {
        base: '/api/stalls',
        routes: [
          'GET /api/stalls',
          'GET /api/stalls/:id',
          'POST /api/stalls (Owner)',
          'PUT /api/stalls/:id (Owner)',
          'GET /api/stalls/:id/inventory'
        ]
      },
      orders: {
        base: '/api/orders',
        routes: [
          'POST /api/orders',
          'GET /api/orders/:id',
          'GET /api/orders/my',
          'PUT /api/orders/:id/status (Employee/Owner)'
        ]
      }
    },
    documentation: 'https://docs.streetbites.com'
  });
});

module.exports = router;