# 📚 Models Usage Guide

Street Bites Backend Models এর সম্পূর্ণ ব্যবহার নির্দেশিকা

---

## 📁 Files যা তৈরি করতে হবে:

```
src/models/
├── User.js          ✅ Created
├── Investor.js      ✅ Created
├── Employee.js      ✅ Created
├── Stall.js         ✅ Created
├── Product.js       ✅ Created
├── Order.js         ✅ Created
├── Transaction.js   ✅ Created
└── index.js         ✅ Created (সব models export করে)
```

---

## 🚀 Setup Instructions

### 1. Models Files তৈরি করুন

প্রতিটি model file উপরের artifacts থেকে copy করুন এবং সঠিক location এ রাখুন।

### 2. Test করুন

```bash
# Root folder এ test-models.js file তৈরি করুন
# তারপর run করুন:
node test-models.js
```

---

## 📖 Usage Examples

### 1. User Model

```javascript
const { User } = require('./src/models');

// নতুন user তৈরি করা
const newUser = await User.create({
  email: 'customer@example.com',
  password_hash: 'hashed_password_here',
  phone: '01712345678',
  full_name: 'রহিম মিয়া',
  role: 'customer'
});

// Email দিয়ে user খোঁজা
const user = await User.findByEmail('customer@example.com');

// সব customers দেখা
const customers = await User.findByRole('customer', 50, 0);

// User update করা
const updated = await User.update(userId, {
  full_name: 'নতুন নাম',
  phone: '01898765432'
});

// User statistics
const stats = await User.getStatistics();
```

### 2. Stall Model

```javascript
const { Stall } = require('./src/models');

// নতুন stall তৈরি করা
const newStall = await Stall.create({
  stall_name: 'ঢাকা স্টল',
  stall_code: 'STL001',
  location: 'মিরপুর ১০, ঢাকা',
  latitude: 23.8103,
  longitude: 90.4125,
  opening_time: '09:00:00',
  closing_time: '22:00:00'
});

// Active stalls দেখা
const activeStalls = await Stall.getActiveStalls();

// Employees সহ stall info
const stallWithEmployees = await Stall.getStallWithEmployees(stallId);

// Nearby stalls খোঁজা (GPS based)
const nearbyStalls = await Stall.findNearby(23.8103, 90.4125, 5);

// Stall statistics
const stallStats = await Stall.getStatistics(stallId);
```

### 3. Employee Model

```javascript
const { Employee } = require('./src/models');

// নতুন employee তৈরি করা
const newEmployee = await Employee.create({
  user_id: userId,
  employee_id: 'EMP001',
  designation: 'Manager',
  salary: 25000,
  assigned_stall_id: stallId,
  shift_timing: 'full_day'
});

// Employee খোঁজা
const employee = await Employee.findByEmployeeId('EMP001');

// Stall এর সব employees
const stallEmployees = await Employee.getByStall(stallId);

// Salary update করা
await Employee.updateSalary(employeeId, 30000);

// Stall এ assign করা
await Employee.assignToStall(employeeId, newStallId);
```

### 4. Product Model

```javascript
const { Product } = require('./src/models');

// নতুন product তৈরি করা
const newProduct = await Product.create({
  product_name: 'Burger',
  product_name_bengali: 'বার্গার',
  category: 'fast_food',
  base_price: 150,
  description: 'Delicious beef burger',
  image_url: 'https://cloudinary.com/...'
});

// সব products দেখা
const products = await Product.findAll({
  category: 'fast_food',
  is_available: true,
  limit: 20
});

// Product search করা
const searchResults = await Product.search('burger');

// Popular products
const popularProducts = await Product.getPopularProducts(10);

// Availability toggle করা
await Product.updateAvailability(productId, false);

// Price update করা
await Product.updatePrice(productId, 180);
```

### 5. Order Model

```javascript
const { Order } = require('./src/models');

// Order number generate করা
const orderNumber = await Order.generateOrderNumber();
// Output: ORD202412190001

// নতুন order তৈরি করা
const newOrder = await Order.create({
  order_number: orderNumber,
  customer_id: customerId,
  stall_id: stallId,
  order_type: 'delivery',
  total_amount: 500,
  payment_method: 'bkash',
  delivery_address: 'মিরপুর ১০, ঢাকা'
});

// Order items সহ details
const orderDetails = await Order.getWithItems(orderId);

// Customer এর orders
const customerOrders = await Order.getCustomerOrders(customerId, 20);

// Status update করা
await Order.updateStatus(orderId, 'preparing');

// Payment status update করা
await Order.updatePaymentStatus(orderId, 'paid', 'bkash');

// Today's stats
const todayStats = await Order.getTodayStats(stallId);
```

### 6. Transaction Model

```javascript
const { Transaction } = require('./src/models');

// নতুন transaction তৈরি করা
const newTransaction = await Transaction.create({
  transaction_type: 'sale',
  amount: 500,
  reference_id: orderId,
  reference_type: 'order',
  description: 'অর্ডার #ORD202412190001 থেকে বিক্রয়',
  payment_method: 'bkash',
  created_by: userId
});

// Today's transactions
const todayTransactions = await Transaction.getTodayTransactions();

// Daily summary
const dailySummary = await Transaction.getDailySummary('2024-12-19');

// Revenue calculation
const revenue = await Transaction.getRevenue('2024-12-01', '2024-12-19');

// Monthly report
const monthlyReport = await Transaction.getMonthlyReport(2024, 12);

// Payment method statistics
const paymentStats = await Transaction.getPaymentMethodStats(
  '2024-12-01',
  '2024-12-19'
);
```

### 7. Investor Model

```javascript
const { Investor } = require('./src/models');

// নতুন investor তৈরি করা
const newInvestor = await Investor.create({
  user_id: userId,
  investment_amount: 500000,
  ownership_percentage: 20,
  bank_details: {
    account_name: 'রহিম মিয়া',
    account_number: '1234567890',
    bank_name: 'Dutch Bangla Bank'
  }
});

// Active investors
const activeInvestors = await Investor.getActiveInvestors();

// Total investment
const totalInvestment = await Investor.getTotalInvestment();

// Investor statistics
const investorStats = await Investor.getStatistics();
```

---

## 🔗 Combined Usage (Controllers এ)

```javascript
const { User, Order, Product, Stall } = require('../models');

// Example: Order তৈরি করা (complete flow)
async function createOrder(req, res) {
  try {
    // 1. User verify করা
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // 2. Stall verify করা
    const stall = await Stall.findById(req.body.stall_id);
    if (!stall || stall.status !== 'active') {
      return res.status(400).json({ message: 'Stall not available' });
    }

    // 3. Products verify করা
    const products = await Promise.all(
      req.body.items.map(item => Product.findById(item.product_id))
    );

    // 4. Order number generate করা
    const orderNumber = await Order.generateOrderNumber();

    // 5. Order তৈরি করা
    const order = await Order.create({
      order_number: orderNumber,
      customer_id: user.id,
      stall_id: stall.id,
      order_type: req.body.order_type,
      total_amount: req.body.total_amount,
      payment_method: req.body.payment_method,
      delivery_address: req.body.delivery_address
    });

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: order
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
}
```

---

## 🎯 Best Practices

### 1. Error Handling

সব model methods এ try-catch ব্যবহার করা হয়েছে:

```javascript
try {
  const user = await User.findById(id);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  // ...
} catch (error) {
  console.error('Error:', error);
  res.status(500).json({ message: 'Server error' });
}
```

### 2. Validation

Controller এ data validation করুন:

```javascript
const { validationResult } = require('express-validator');

if (!validationResult(req).isEmpty()) {
  return res.status(400).json({
    errors: validationResult(req).array()
  });
}
```

### 3. Transaction Support

Multiple operations এর জন্য database transaction ব্যবহার করুন।

### 4. Pagination

সব list methods এ pagination support আছে:

```javascript
const users = await User.findAll({
  limit: 20,
  offset: 0,
  search: 'রহিম'
});
```

---

## 🧪 Testing

### Manual Testing

```bash
node test-models.js
```

### Example Test Output

```
🧪 Models Testing শুরু হচ্ছে...

📝 1. User Model Test:
   ✅ Total Users: 5
   ✅ User Statistics: [ ... ]

📝 2. Stall Model Test:
   ✅ Total Stalls: 3
   ✅ Active Stalls: 2

📝 3. Product Model Test:
   ✅ Total Products: 15
   ✅ Product Statistics: { ... }

📝 4. Order Model Test:
   ✅ Recent Orders: 5
   ✅ Today's Stats: { ... }

✅ সব Models সঠিকভাবে কাজ করছে! 🎉
```

---

## ⚠️ Common Issues

### Issue 1: Database Connection Failed

**Solution:**
- `.env` file check করুন
- Database credentials সঠিক আছে কিনা verify করুন
- Supabase project active আছে কিনা check করুন

### Issue 2: Model Not Found

**Solution:**
- File path সঠিক আছে কিনা check করুন
- `module.exports` properly করা হয়েছে কিনা verify করুন

### Issue 3: Query Error

**Solution:**
- SQL syntax ঠিক আছে কিনা check করুন
- Parameter count match করছে কিনা verify করুন
- Column names database এর সাথে match করছে কিনা check করুন

---

## 🎉 Next Steps

এখন আপনি:

1. ✅ Controllers তৈরি করতে পারবেন
2. ✅ Routes setup করতে পারবেন
3. ✅ API endpoints তৈরি করতে পারবেন
4. ✅ Frontend এর সাথে connect করতে পারবেন

পরবর্তী step এর জন্য বলুন:
```
"এখন Authentication Controller তৈরি করতে চাই"
```

---

Made with ❤️ for Street Bites