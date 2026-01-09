# 🍔 Street Bites - স্ট্রিট ফুড ই-কমার্স ম্যানেজমেন্ট সিস্টেম

একটি সম্পূর্ণ ডিজিটাল ম্যানেজমেন্ট সিস্টেম স্ট্রিট ফুড ব্যবসার জন্য।

## 📋 প্রজেক্ট সম্পর্কে

Street Bites হলো একটি full-stack e-commerce এবং management system যা বিশেষভাবে street food ব্যবসার জন্য ডিজাইন করা হয়েছে। এতে রয়েছে customer-facing website, mobile app এবং একটি comprehensive admin panel।

## 🛠️ Technology Stack

### Frontend (Web)
- **React.js** - UI library
- **Material-UI** - Component library
- **React Router** - Navigation
- **Axios** - API calls
- **React Query** - Data fetching & caching
- **React Hook Form** - Form management

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB Atlas** - Database
- **Mongoose** - ODM (Object Data Modeling)
- **JWT** - Authentication
- **Supabase Auth** - Additional auth features
- **Cloudinary** - Image storage

### Mobile
- **React Native** - Mobile framework
- **Expo** - Development platform

### Hosting & Deployment
- **Vercel** - Frontend hosting
- **Render.com** - Backend hosting
- **MongoDB Atlas** - Database (Free tier)
- **Cloudinary** - File storage (Free tier)

## 📁 প্রজেক্ট স্ট্রাকচার

```
street-bites/
├── frontend/          # React.js web application
├── backend/           # Node.js + Express API
├── mobile/            # React Native mobile app
└── README.md          # এই ফাইল
```

## 🚀 শুরু করার পদ্ধতি

### Prerequisites (প্রয়োজনীয় সফটওয়্যার)

1. **Node.js** (v18 বা তার উপরে) - [Download](https://nodejs.org/)
2. **Git** - [Download](https://git-scm.com/)
3. **Code Editor** (VS Code recommended) - [Download](https://code.visualstudio.com/)

### Installation (ইনস্টলেশন)

#### 1. Repository Clone করুন

```bash
git clone <your-repository-url>
cd street-bites
```

#### 2. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# .env file এ আপনার API keys যোগ করুন
npm run dev
```

Backend চলবে: `http://localhost:5000`

#### 3. Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
# .env file এ আপনার configuration যোগ করুন
npm start
```

Frontend চলবে: `http://localhost:3000`

#### 4. Mobile Setup (Optional - পরে করবেন)

```bash
cd mobile
npm install
npm start
```

## 🔑 API Keys পাওয়ার গাইড

### MongoDB Atlas
1. [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) এ account তৈরি করুন
2. Free M0 cluster create করুন
3. Database user তৈরি করুন
4. Connection string কপি করুন

### Supabase
1. [Supabase](https://supabase.com/) এ account তৈরি করুন
2. New project তৈরি করুন
3. API settings থেকে URL এবং Keys কপি করুন

### Cloudinary
1. [Cloudinary](https://cloudinary.com/) এ account তৈরি করুন
2. Dashboard থেকে Cloud Name, API Key, API Secret কপি করুন

## 📚 Features (ফিচার সমূহ)

### Customer Features
- ✅ Product browsing and search
- ✅ Shopping cart management
- ✅ User authentication (signup/login)
- ✅ Order placement
- ✅ Order tracking
- ✅ Payment integration
- ✅ User profile management
- ✅ Reviews and ratings

### Admin Features
- ✅ Dashboard with analytics
- ✅ Product management (CRUD)
- ✅ Order management
- ✅ Customer management
- ✅ Category management
- ✅ Sales reports
- ✅ Inventory tracking

### Vendor Features (Optional)
- ✅ Vendor dashboard
- ✅ Product management
- ✅ Order fulfillment
- ✅ Sales tracking

## 🗂️ Database Schema

### Collections:
- **Users** - Customer & admin information
- **Products** - Food items details
- **Categories** - Product categories
- **Orders** - Order information
- **Reviews** - Product reviews
- **Payments** - Payment records

## 📱 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Products
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Create product (Admin)
- `PUT /api/products/:id` - Update product (Admin)
- `DELETE /api/products/:id` - Delete product (Admin)

### Orders
- `GET /api/orders` - Get all orders
- `GET /api/orders/:id` - Get single order
- `POST /api/orders` - Create order
- `PUT /api/orders/:id` - Update order status

(আরো endpoints backend development এর সময় যোগ করা হবে)

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Input validation
- Rate limiting
- CORS configuration
- Helmet security headers
- XSS protection

## 📈 Development Roadmap

### Phase 1: Setup & Basic Features ✅
- [x] Project structure setup
- [x] Database models
- [x] Authentication system
- [ ] Product CRUD
- [ ] Order management

### Phase 2: Frontend Development
- [ ] Homepage design
- [ ] Product listing
- [ ] Cart functionality
- [ ] Checkout process
- [ ] User dashboard

### Phase 3: Admin Panel
- [ ] Admin dashboard
- [ ] Product management UI
- [ ] Order management UI
- [ ] Analytics and reports

### Phase 4: Mobile App
- [ ] Mobile UI design
- [ ] Core features implementation
- [ ] Push notifications
- [ ] Location services

### Phase 5: Testing & Deployment
- [ ] Testing
- [ ] Bug fixes
- [ ] Performance optimization
- [ ] Deployment

## 🤝 Contributing

যদি আপনি এই প্রজেক্টে contribute করতে চান:

1. Repository টি Fork করুন
2. Feature branch তৈরি করুন (`git checkout -b feature/AmazingFeature`)
3. Changes commit করুন (`git commit -m 'Add some AmazingFeature'`)
4. Branch এ push করুন (`git push origin feature/AmazingFeature`)
5. Pull Request খুলুন

## 📞 Support

সমস্যা হলে বা প্রশ্ন থাকলে:
- GitHub Issues তৈরি করুন
- Email করুন: [your-email@example.com]

## 📄 License

এই প্রজেক্ট MIT License এর অধীনে লাইসেন্সকৃত।

---

**Made with ❤️ for Street Food Businesses**

## 🎯 Next Steps

1. Backend এর database models তৈরি করুন
2. API endpoints implement করুন
3. Frontend components তৈরি করুন
4. Frontend এবং Backend connect করুন
5. Testing এবং deployment

---

## 📝 Notes for Beginners

- প্রতিটি file এ বাংলা comment যোগ করা হয়েছে
- একটা একটা feature করে শিখুন
- Code না বুঝলে comment পড়ুন
- Error হলে terminal/console এ message পড়ুন
- Google এ search করুন: "how to [your problem] in [technology name]"

**Happy Coding! 🚀**