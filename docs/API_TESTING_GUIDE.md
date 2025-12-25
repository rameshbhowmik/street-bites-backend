# 🧪 Street Bites API - Complete Testing Guide

সম্পূর্ণ API test করার step-by-step নির্দেশিকা

---

## 📋 API Endpoints Summary

### Authentication (`/api/auth`)
- ✅ POST `/register` - Registration
- ✅ POST `/login` - Login
- ✅ GET `/profile` - Get profile
- ✅ POST `/change-password` - Change password
- ✅ POST `/logout` - Logout

### Users (`/api/users`)
- ✅ GET `/profile` - নিজের profile
- ✅ PUT `/profile` - Profile update
- ✅ POST `/upload-picture` - Picture upload
- ✅ GET `/` - All users (Admin)
- ✅ PUT `/:userId/status` - Status update (Admin)

### Products (`/api/products`)
- ✅ GET `/` - All products
- ✅ GET `/:id` - Product details
- ✅ GET `/search?q=burger` - Search
- ✅ GET `/popular` - Popular products
- ✅ GET `/category/:category` - By category
- ✅ POST `/` - Create (Admin)
- ✅ PUT `/:id` - Update (Admin)
- ✅ DELETE `/:id` - Delete (Admin)

### Stalls (`/api/stalls`)
- ✅ GET `/` - All stalls
- ✅ GET `/:id` - Stall details
- ✅ GET `/active` - Active stalls
- ✅ GET `/nearby?latitude=23.8&longitude=90.4` - Nearby
- ✅ GET `/:id/inventory` - Inventory (Employee/Owner)
- ✅ POST `/` - Create (Owner)
- ✅ PUT `/:id` - Update (Owner)

### Orders (`/api/orders`)
- ✅ POST `/` - Create order
- ✅ GET `/my` - My orders
- ✅ GET `/:id` - Order details
- ✅ GET `/stall/:stallId` - Stall orders
- ✅ PUT `/:id/status` - Update status (Employee/Owner)
- ✅ POST `/:id/cancel` - Cancel order

---

## 🚀 Quick Start Testing

### 1. Server Run করুন
```bash
npm run dev
```

### 2. Health Check
```bash
curl http://localhost:5000/api/health
```

**Expected Response:**
```json
{
  "success": true,
  "message": "API is running",
  "timestamp": "2024-12-19T..."
}
```

---

## 📝 Step-by-Step Testing Flow

### Step 1: User Registration & Login

#### A. Register Customer
```bash
POST http://localhost:5000/api/auth/register

Body:
{
  "email": "customer@test.com",
  "phone": "01712345678",
  "password": "Test@1234",
  "full_name": "Test Customer",
  "role": "customer"
}
```

**Save the token from response!**

#### B. Login
```bash
POST http://localhost:5000/api/auth/login

Body:
{
  "identifier": "customer@test.com",
  "password": "Test@1234"
}
```

---

### Step 2: User Profile Management

#### A. Get Profile
```bash
GET http://localhost:5000/api/users/profile

Headers:
Authorization: Bearer YOUR_TOKEN
```

#### B. Update Profile
```bash
PUT http://localhost:5000/api/users/profile

Headers:
Authorization: Bearer YOUR_TOKEN

Body:
{
  "full_name": "Updated Name",
  "phone": "01798765432"
}
```

#### C. Upload Profile Picture
```bash
POST http://localhost:5000/api/users/upload-picture

Headers:
Authorization: Bearer YOUR_TOKEN
Content-Type: multipart/form-data

Form Data:
profile_picture: [SELECT IMAGE FILE]
```

---

### Step 3: Product Management

#### A. Get All Products (Public)
```bash
GET http://localhost:5000/api/products
GET http://localhost:5000/api/products?category=fast_food
GET http://localhost:5000/api/products?is_available=true
```

#### B. Search Products
```bash
GET http://localhost:5000/api/products/search?q=burger
```

#### C. Get Product Details
```bash
GET http://localhost:5000/api/products/1
```

#### D. Create Product (Admin/Owner only)

**First, register an owner:**
```bash
POST http://localhost:5000/api/auth/register

Body:
{
  "email": "owner@test.com",
  "phone": "01898765432",
  "password": "Owner@1234",
  "full_name": "Test Owner",
  "role": "owner"
}
```

**Then create product:**
```bash
POST http://localhost:5000/api/products

Headers:
Authorization: Bearer OWNER_TOKEN
Content-Type: multipart/form-data

Form Data:
product_name: Burger
product_name_bengali: বার্গার
category: fast_food
base_price: 150
description: Delicious beef burger
image: [SELECT IMAGE FILE]
is_available: true
```

#### E. Update Product
```bash
PUT http://localhost:5000/api/products/1

Headers:
Authorization: Bearer OWNER_TOKEN

Body:
{
  "product_name": "Special Burger",
  "base_price": 180
}
```

---

### Step 4: Stall Management

#### A. Get All Stalls
```bash
GET http://localhost:5000/api/stalls
GET http://localhost:5000/api/stalls?status=active
```

#### B. Get Active Stalls
```bash
GET http://localhost:5000/api/stalls/active
```

#### C. Find Nearby Stalls (GPS)
```bash
GET http://localhost:5000/api/stalls/nearby?latitude=23.8103&longitude=90.4125&radius=5
```

#### D. Create Stall (Owner only)
```bash
POST http://localhost:5000/api/stalls

Headers:
Authorization: Bearer OWNER_TOKEN

Body:
{
  "stall_name": "Dhaka Stall",
  "stall_code": "STL001",
  "location": "Mirpur 10, Dhaka",
  "latitude": 23.8103,
  "longitude": 90.4125,
  "opening_time": "09:00:00",
  "closing_time": "22:00:00"
}
```

#### E. Get Stall Inventory
```bash
GET http://localhost:5000/api/stalls/1/inventory

Headers:
Authorization: Bearer OWNER_TOKEN
```

---

### Step 5: Order Management

#### A. Create Order
```bash
POST http://localhost:5000/api/orders

Headers:
Authorization: Bearer CUSTOMER_TOKEN

Body:
{
  "stall_id": 1,
  "order_type": "pickup",
  "items": [
    {
      "product_id": 1,
      "quantity": 2,
      "unit_price": 150,
      "customization": {
        "extra_cheese": true,
        "spicy_level": "medium"
      }
    },
    {
      "product_id": 2,
      "quantity": 1,
      "unit_price": 50
    }
  ],
  "payment_method": "cash"
}
```

#### B. Get My Orders
```bash
GET http://localhost:5000/api/orders/my

Headers:
Authorization: Bearer CUSTOMER_TOKEN
```

#### C. Get Order Details
```bash
GET http://localhost:5000/api/orders/1

Headers:
Authorization: Bearer CUSTOMER_TOKEN
```

#### D. Update Order Status (Employee/Owner)
```bash
PUT http://localhost:5000/api/orders/1/status

Headers:
Authorization: Bearer OWNER_TOKEN

Body:
{
  "status": "confirmed"
}
```

Available statuses:
- `pending`
- `confirmed`
- `preparing`
- `ready`
- `out_for_delivery`
- `delivered`
- `completed`
- `cancelled`
- `rejected`

#### E. Update Payment Status
```bash
PUT http://localhost:5000/api/orders/1/payment

Headers:
Authorization: Bearer OWNER_TOKEN

Body:
{
  "payment_status": "paid",
  "payment_method": "bkash"
}
```

#### F. Cancel Order
```bash
POST http://localhost:5000/api/orders/1/cancel

Headers:
Authorization: Bearer CUSTOMER_TOKEN
```

---

## 🎯 Testing Checklist

### Authentication ✅
- [ ] Registration works
- [ ] Login with email works
- [ ] Login with phone works
- [ ] Protected routes blocked without token
- [ ] Token expires correctly

### User Management ✅
- [ ] Profile fetch works
- [ ] Profile update works
- [ ] Picture upload works
- [ ] Admin can see all users
- [ ] Admin can update user status

### Product Management ✅
- [ ] Public can view products
- [ ] Search works
- [ ] Category filter works
- [ ] Admin can create products
- [ ] Admin can update products
- [ ] Admin can delete products
- [ ] Image upload works

### Stall Management ✅
- [ ] Public can view stalls
- [ ] Nearby stalls works (GPS)
- [ ] Owner can create stalls
- [ ] Owner can update stalls
- [ ] Inventory visible to authorized users

### Order Management ✅
- [ ] Customer can create orders
- [ ] Customer can view their orders
- [ ] Customer can cancel pending orders
- [ ] Employee/Owner can update status
- [ ] Payment status updates correctly
- [ ] Today's stats works

---

## 🐛 Common Errors & Solutions

### Error 401: "অ্যাক্সেস টোকেন প্রয়োজন"
**Solution:** Add Authorization header
```
Authorization: Bearer YOUR_TOKEN
```

### Error 403: "আপনার এই resource এ access করার অনুমতি নেই"
**Solution:** User role incorrect. Use owner/employee token.

### Error 404: "পাওয়া যায়নি"
**Solution:** Check if resource exists. Verify ID.

### Error 409: "ইতিমধ্যে ব্যবহৃত হয়েছে"
**Solution:** Email/Phone/Code already exists. Use different values.

### Error 500: "Server error"
**Solution:** Check server logs. Database connection might be down.

---

## 📊 Sample Test Data

### Customers
```json
{
  "email": "customer1@test.com",
  "phone": "01712345678",
  "password": "Test@1234",
  "full_name": "রহিম মিয়া",
  "role": "customer"
}
```

### Products
```json
{
  "product_name": "Burger",
  "product_name_bengali": "বার্গার",
  "category": "fast_food",
  "base_price": 150
}
```

### Stalls
```json
{
  "stall_name": "Dhaka Stall",
  "stall_code": "STL001",
  "location": "Mirpur 10, Dhaka",
  "latitude": 23.8103,
  "longitude": 90.4125
}
```

---

## 🎉 Success!

যদি সব tests pass করে, তাহলে আপনার API সম্পূর্ণভাবে কাজ করছে!

**Next Steps:**
1. Frontend এ connect করুন
2. Real-time notifications add করুন
3. Payment gateway integrate করুন
4. SMS/Email service add করুন

---

Made with ❤️ for Street Bites