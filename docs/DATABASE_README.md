# 🗄️ Street Bites Database Schema Documentation

এটি Street Bites ফুড ডেলিভারি ব্যবসার সম্পূর্ণ PostgreSQL Database Schema।

## 📋 Database Overview

### Tables Summary

| # | Table Name | Purpose | Row Count (Est.) |
|---|------------|---------|------------------|
| 1 | users | সব user এর তথ্য | 1000+ |
| 2 | investors | বিনিয়োগকারী তথ্য | 10-20 |
| 3 | employees | কর্মচারী তথ্য | 50-100 |
| 4 | stalls | স্টলের তথ্য | 5-10 |
| 5 | products | পণ্যের তথ্য | 100-200 |
| 6 | inventory_production | উৎপাদন inventory | 500+ |
| 7 | inventory_stall | স্টল inventory | 500+ |
| 8 | orders | অর্ডার তথ্য | 10,000+ |
| 9 | order_items | অর্ডার items | 30,000+ |
| 10 | transactions | লেনদেন রেকর্ড | 15,000+ |
| 11 | expenses | খরচ রেকর্ড | 1,000+ |
| 12 | attendance | উপস্থিতি রেকর্ড | 5,000+ |
| 13 | reviews | রিভিউ ও রেটিং | 5,000+ |
| 14 | wastage | নষ্ট পণ্য রেকর্ড | 500+ |

## 🚀 Setup Instructions

### Step 1: Supabase Project তৈরি করুন

1. [Supabase](https://supabase.com) এ যান
2. নতুন project তৈরি করুন
3. Database credentials copy করুন

### Step 2: Database Schema Run করুন

Supabase SQL Editor তে যান এবং এই scripts গুলো **ক্রমানুসারে** run করুন:

```sql
-- 1. প্রথমে complete setup script run করুন
00_complete_database_setup.sql

-- 2. এরপর individual table scripts (যদি প্রয়োজন হয়)
01_users_table.sql
02_investors_table.sql
03_employees_table.sql
... (বাকি files)
```

### Step 3: Verification

Setup সফল হয়েছে কিনা check করুন:

```sql
-- সব tables আছে কিনা check করুন
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Expected result: 14 tables
```

## 📊 Database Schema Diagram

### Core Relationships

```
users (1) ----< (N) investors
users (1) ----< (N) employees
users (1) ----< (N) orders
users (1) ----< (N) reviews

stalls (1) ----< (N) employees
stalls (1) ----< (N) orders
stalls (1) ----< (N) inventory_stall
stalls (1) ----< (N) attendance
stalls (1) ----< (N) wastage

products (1) ----< (N) inventory_production
products (1) ----< (N) inventory_stall
products (1) ----< (N) order_items

orders (1) ----< (N) order_items
orders (1) ---- (1) reviews
```

## 🔑 Key Features

### 1. Enum Types
সব enum types একবারে define করা হয়েছে:
- `user_role`, `user_status`
- `order_status`, `payment_status`
- `expense_category`, `wastage_reason`
- আরও অনেক...

### 2. Indexes
সব important columns এ indexes তৈরি করা হয়েছে:
- Primary keys
- Foreign keys
- Search fields (email, phone, order_number)
- Date fields (date range queries এর জন্য)

### 3. Triggers
Automatic operations এর জন্য triggers:
- `updated_at` auto-update
- Order থেকে transaction তৈরি
- Inventory auto-deduction
- Status validation

### 4. Functions
Business logic এর জন্য stored functions:
- Sales reports
- Inventory management
- Attendance tracking
- Analytics queries

## 📝 Common Queries

### User Management

```sql
-- নতুন customer তৈরি করা
INSERT INTO users (email, password_hash, phone, full_name, role)
VALUES ('customer@example.com', 'hashed_password', '01712345678', 'নাম', 'customer');

-- Active employees দেখা
SELECT u.full_name, e.designation, s.stall_name
FROM employees e
JOIN users u ON e.user_id = u.id
LEFT JOIN stalls s ON e.assigned_stall_id = s.id
WHERE e.status = 'active';
```

### Order Management

```sql
-- আজকের orders দেখা
SELECT order_number, u.full_name, s.stall_name, total_amount, status
FROM orders o
JOIN users u ON o.customer_id = u.id
JOIN stalls s ON o.stall_id = s.id
WHERE DATE(o.created_at) = CURRENT_DATE
ORDER BY o.created_at DESC;

-- Specific order এর items
SELECT * FROM get_order_items_details(123);
```

### Inventory Management

```sql
-- Specific stall এর inventory
SELECT * FROM get_stall_inventory(1);

-- Low stock items
SELECT * FROM get_low_stock_items(1, 10);

-- Expired inventory
SELECT * FROM get_expired_inventory();
```

### Sales & Analytics

```sql
-- আজকের sales
SELECT * FROM get_daily_revenue(CURRENT_DATE);

-- Monthly report
SELECT * FROM get_monthly_report(2024, 1);

-- Popular products
SELECT * FROM get_popular_products(10, CURRENT_DATE - INTERVAL '30 days');
```

### Attendance

```sql
-- আজকের attendance
SELECT * FROM get_today_attendance();

-- Specific employee এর attendance
SELECT * FROM get_employee_attendance(1, CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE);
```

## 🔒 Security Considerations

### Row Level Security (RLS)

Supabase এ RLS enable করার জন্য:

```sql
-- Enable RLS for users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own data
CREATE POLICY "Users can view own data"
ON users FOR SELECT
USING (auth.uid() = id::text);

-- Similar policies for other tables...
```

### API Security

Backend code এ:
- ✅ Password hashing (bcryptjs)
- ✅ JWT authentication
- ✅ Input validation (express-validator)
- ✅ SQL injection prevention (parameterized queries)

## 🛠️ Maintenance

### Backup

```bash
# Database backup নেওয়া
pg_dump -h your-host -U postgres -d your-database > backup.sql

# Restore করা
psql -h your-host -U postgres -d your-database < backup.sql
```

### Performance Monitoring

```sql
-- Table sizes check করা
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Unused indexes খুঁজে বের করা
SELECT * FROM pg_stat_user_indexes WHERE idx_scan = 0;
```

## 📈 Future Enhancements

পরবর্তীতে add করা যেতে পারে:

- [ ] Loyalty program table
- [ ] Coupons & discounts table
- [ ] Delivery partner tracking
- [ ] Push notification logs
- [ ] Audit trails for all tables
- [ ] Analytics materialized views

## 🆘 Troubleshooting

### Common Issues

**Issue 1: Foreign key constraint violation**
```
Error: insert or update on table violates foreign key constraint
```
**Solution:** নিশ্চিত করুন referenced table এ data আছে।

**Issue 2: Unique constraint violation**
```
Error: duplicate key value violates unique constraint
```
**Solution:** Email/phone/order_number ইতিমধ্যে exist করছে কিনা check করুন।

**Issue 3: Check constraint violation**
```
Error: new row violates check constraint
```
**Solution:** Data validation rules follow করছে কিনা verify করুন।

## 📞 Support

কোন সমস্যা হলে:
1. Error message সম্পূর্ণ পড়ুন
2. Constraint names দেখুন
3. Foreign key references check করুন
4. Data types match করছে কিনা verify করুন

---

Made with ❤️ for Street Bites