# 🍔 Street Bites Backend API

Street Bites একটি ফুড ডেলিভারি অ্যাপ্লিকেশনের সম্পূর্ণ Backend API। এটি Node.js, Express.js, PostgreSQL এবং Cloudinary দিয়ে তৈরি।

## 🚀 Features

- ✅ JWT Authentication
- ✅ PostgreSQL Database (Supabase)
- ✅ Cloudinary Image Upload
- ✅ Role-based Authorization
- ✅ Error Handling Middleware
- ✅ File Upload with Multer
- ✅ CORS Configuration
- ✅ Input Validation
- ✅ Password Encryption
- ✅ Helper Functions

## 📁 Project Structure

```
street-bites-backend/
├── src/
│   ├── config/
│   │   ├── database.js          # Database configuration
│   │   └── cloudinary.js        # Cloudinary configuration
│   ├── middleware/
│   │   ├── auth.js              # Authentication middleware
│   │   ├── errorHandler.js      # Error handling middleware
│   │   └── upload.js            # File upload middleware
│   ├── utils/
│   │   └── helpers.js           # Helper functions
│   └── index.js                 # Main server file
├── .env.example                 # Environment variables example
├── .gitignore                   # Git ignore file
├── package.json                 # Dependencies
└── README.md                    # Documentation
```

## 🛠️ Installation

### 1. Repository Clone করুন

```bash
git clone <your-repository-url>
cd street-bites-backend
```

### 2. Dependencies Install করুন

```bash
npm install
```

### 3. Environment Variables Setup করুন

`.env.example` ফাইলটি copy করে `.env` নামে একটি নতুন ফাইল তৈরি করুন:

```bash
cp .env.example .env
```

এরপর `.env` ফাইলে আপনার credentials গুলো দিন।

### 4. Database Setup করুন

Supabase এ যান এবং একটি নতুন project তৈরি করুন। তারপর database credentials গুলো `.env` ফাইলে যোগ করুন।

### 5. Cloudinary Setup করুন

[Cloudinary](https://cloudinary.com/) এ account তৈরি করুন এবং API credentials গুলো `.env` ফাইলে যোগ করুন।

## 🎯 Running the Application

### Development Mode

```bash
npm run dev
```

### Production Mode

```bash
npm start
```

Server চালু হবে: `http://localhost:5000`

## 📡 API Endpoints

### Health Check

```
GET /
```

Response:
```json
{
  "success": true,
  "message": "Street Bites API সফলভাবে চালু আছে! 🚀",
  "version": "1.0.0",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Status Check

```
GET /api/status
```

Response:
```json
{
  "success": true,
  "message": "System status",
  "data": {
    "server": "Running",
    "database": "Connected",
    "cloudinary": "Configured",
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

## 🔐 Environment Variables

প্রয়োজনীয় environment variables:

```env
# Server
PORT=5000
NODE_ENV=development

# Database (Supabase)
DB_HOST=your-supabase-host
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=your-password
DB_SSL=true

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRE=7d

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

## 🧩 Available Middleware

### Authentication Middleware

```javascript
const { authenticateToken, authorizeRoles } = require('./middleware/auth');

// Protected route
router.get('/profile', authenticateToken, controller);

// Role-based route
router.post('/admin', authenticateToken, authorizeRoles('admin'), controller);
```

### File Upload Middleware

```javascript
const { uploadSingleImage, uploadMultipleImages } = require('./middleware/upload');

// Single image upload
router.post('/upload', uploadSingleImage('image'), controller);

// Multiple images upload
router.post('/upload-multiple', uploadMultipleImages('images', 5), controller);
```

### Error Handler

```javascript
const { asyncHandler, AppError } = require('./middleware/errorHandler');

// Async route handler
router.get('/data', asyncHandler(async (req, res) => {
  // Your code
}));

// Custom error
throw new AppError('Error message', 400);
```

## 🛠️ Helper Functions

```javascript
const {
  hashPassword,
  comparePassword,
  generateToken,
  successResponse,
  errorResponse,
  getPagination,
  isValidEmail,
  isValidPhone
} = require('./utils/helpers');
```

## 🔒 Security Features

- ✅ JWT Token Authentication
- ✅ Password Hashing (bcrypt)
- ✅ CORS Protection
- ✅ Input Sanitization
- ✅ File Type Validation
- ✅ File Size Limit
- ✅ SQL Injection Prevention

## 📝 Next Steps

পরবর্তী পর্যায়ে এই features গুলো add করতে হবে:

1. ✅ Database Models তৈরি করা
2. ✅ Authentication Routes (Register, Login, Logout)
3. ✅ User Management
4. ✅ Restaurant Management
5. ✅ Food Items Management
6. ✅ Order Management
7. ✅ Review System
8. ✅ Payment Integration

## 🤝 Contributing

Contributions সবসময় স্বাগত!

## 📄 License

## Copyright & License

Copyright (c) 2025 <RAS India Private Limited / Street Bites>. All Rights Reserved.

Unauthorized copying, modification, or commercial use of this project is strictly prohibited.
## 👨‍💻 Author

RAS India Private Limited

---

Made with ❤️ for Street Bites