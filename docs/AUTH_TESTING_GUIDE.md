# 🔐 Authentication System Testing Guide

Street Bites Authentication API test করার সম্পূর্ণ নির্দেশিকা

---

## 📋 API Endpoints

### Public Endpoints (No Token Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | নতুন user registration |
| POST | `/api/auth/login` | User login |
| POST | `/api/auth/forgot-password` | Password reset request |
| POST | `/api/auth/reset-password` | Password reset করা |
| POST | `/api/auth/verify-otp` | OTP verification |
| POST | `/api/auth/refresh-token` | Access token refresh |

### Protected Endpoints (Token Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/auth/profile` | User profile দেখা |
| POST | `/api/auth/change-password` | Password change |
| POST | `/api/auth/logout` | User logout |

---

## 🧪 Testing with Postman/Thunder Client

### 1. Register (নতুন User তৈরি)

**Endpoint:** `POST http://localhost:5000/api/auth/register`

**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "email": "customer@example.com",
  "phone": "01712345678",
  "password": "Test@1234",
  "full_name": "রহিম মিয়া",
  "role": "customer"
}
```

**Expected Response (201):**
```json
{
  "success": true,
  "message": "Registration সফল হয়েছে",
  "data": {
    "user": {
      "id": 1,
      "email": "customer@example.com",
      "phone": "01712345678",
      "full_name": "রহিম মিয়া",
      "role": "customer",
      "status": "active",
      "created_at": "2024-12-19T10:30:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### 2. Login

**Endpoint:** `POST http://localhost:5000/api/auth/login`

**Body (JSON):**
```json
{
  "identifier": "customer@example.com",
  "password": "Test@1234"
}
```

অথবা phone দিয়ে:
```json
{
  "identifier": "01712345678",
  "password": "Test@1234"
}
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Login সফল হয়েছে",
  "data": {
    "user": {
      "id": 1,
      "email": "customer@example.com",
      "phone": "01712345678",
      "full_name": "রহিম মিয়া",
      "role": "customer",
      "status": "active"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**⚠️ Important:** Token টি copy করে রাখুন - পরবর্তী requests এ লাগবে!

---

### 3. Get Profile (Protected)

**Endpoint:** `GET http://localhost:5000/api/auth/profile`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN_HERE
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Profile fetch সফল",
  "data": {
    "id": 1,
    "email": "customer@example.com",
    "phone": "01712345678",
    "full_name": "রহিম মিয়া",
    "role": "customer",
    "profile_picture": null,
    "status": "active",
    "created_at": "2024-12-19T10:30:00.000Z",
    "updated_at": "2024-12-19T10:30:00.000Z"
  }
}
```

---

### 4. Change Password (Protected)

**Endpoint:** `POST http://localhost:5000/api/auth/change-password`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN_HERE
```

**Body (JSON):**
```json
{
  "oldPassword": "Test@1234",
  "newPassword": "NewTest@1234"
}
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Password সফলভাবে পরিবর্তন হয়েছে"
}
```

---

### 5. Forgot Password

**Endpoint:** `POST http://localhost:5000/api/auth/forgot-password`

**Body (JSON):**
```json
{
  "email": "customer@example.com"
}
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Password reset instructions পাঠানো হয়েছে",
  "debug": {
    "otp": "123456",
    "resetToken": "abc123..."
  }
}
```

---

### 6. Refresh Token

**Endpoint:** `POST http://localhost:5000/api/auth/refresh-token`

**Body (JSON):**
```json
{
  "refreshToken": "YOUR_REFRESH_TOKEN_HERE"
}
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Token refresh সফল",
  "data": {
    "token": "NEW_ACCESS_TOKEN_HERE"
  }
}
```

---

### 7. Logout (Protected)

**Endpoint:** `POST http://localhost:5000/api/auth/logout`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN_HERE
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Logout সফল হয়েছে"
}
```

---

## 🧪 Testing with cURL

### Register
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "phone": "01712345678",
    "password": "Test@1234",
    "full_name": "Test User"
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "test@example.com",
    "password": "Test@1234"
  }'
```

### Get Profile
```bash
curl -X GET http://localhost:5000/api/auth/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## ⚠️ Common Errors & Solutions

### Error 1: "অ্যাক্সেস টোকেন প্রয়োজন"

**Problem:** Token পাঠানো হয়নি

**Solution:** 
```
Authorization: Bearer YOUR_TOKEN_HERE
```
Header add করুন

### Error 2: "Token এর মেয়াদ শেষ হয়ে গেছে"

**Problem:** Token expire হয়ে গেছে (24 hours পর)

**Solution:** 
- নতুন করে login করুন, অথবা
- Refresh token use করুন

### Error 3: "Password দুর্বল"

**Problem:** Password requirements meet করছে না

**Solution:** Password এ থাকতে হবে:
- কমপক্ষে ৮ অক্ষর
- একটি বড় হাতের অক্ষর (A-Z)
- একটি ছোট হাতের অক্ষর (a-z)
- একটি সংখ্যা (0-9)
- একটি বিশেষ চিহ্ন (!@#$%^&*)

### Error 4: "এই email ইতিমধ্যে ব্যবহৃত হয়েছে"

**Problem:** Email already exists

**Solution:** 
- ভিন্ন email use করুন, অথবা
- Login করুন existing account এ

---

## 🎯 Testing Checklist

### Registration Testing
- [ ] সঠিক data দিয়ে register করা যাচ্ছে
- [ ] Duplicate email block হচ্ছে
- [ ] Duplicate phone block হচ্ছে
- [ ] Invalid email reject হচ্ছে
- [ ] Weak password reject হচ্ছে
- [ ] Token generate হচ্ছে

### Login Testing
- [ ] Email দিয়ে login করা যাচ্ছে
- [ ] Phone দিয়ে login করা যাচ্ছে
- [ ] Wrong password reject হচ্ছে
- [ ] Inactive user login করতে পারছে না
- [ ] Token generate হচ্ছে

### Protected Routes Testing
- [ ] Token ছাড়া access block হচ্ছে
- [ ] Valid token দিয়ে access পাওয়া যাচ্ছে
- [ ] Expired token reject হচ্ছে
- [ ] Invalid token reject হচ্ছে

### Password Management Testing
- [ ] Password change করা যাচ্ছে
- [ ] Wrong old password reject হচ্ছে
- [ ] Forgot password email পাঠাচ্ছে
- [ ] Reset token কাজ করছে

---

## 📊 Test Data Examples

### Customer User
```json
{
  "email": "customer@streetbites.com",
  "phone": "01712345678",
  "password": "Customer@123",
  "full_name": "রহিম মিয়া",
  "role": "customer"
}
```

### Employee User
```json
{
  "email": "employee@streetbites.com",
  "phone": "01798765432",
  "password": "Employee@123",
  "full_name": "করিম মিয়া",
  "role": "employee"
}
```

### Owner User
```json
{
  "email": "owner@streetbites.com",
  "phone": "01898765432",
  "password": "Owner@123",
  "full_name": "হাসান মিয়া",
  "role": "owner"
}
```

---

## 🔒 Security Testing

### Test Cases:
1. ✅ SQL Injection attempt করলে block হচ্ছে
2. ✅ XSS attempt করলে sanitize হচ্ছে
3. ✅ Token manipulation detect হচ্ছে
4. ✅ Password plaintext store হচ্ছে না
5. ✅ Sensitive data response এ আসছে না

---

## 🚀 Next Steps

Authentication কাজ করছে? এখন:

1. ✅ Frontend এ connect করুন
2. ✅ Role-based routes তৈরি করুন
3. ✅ User profile update করুন
4. ✅ Email/SMS service integrate করুন

---

Made with ❤️ for Street Bites