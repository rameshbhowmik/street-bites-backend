# 🚀 Street Bites Backend - সম্পূর্ণ Setup Guide

এই guide অনুসরণ করে আপনি শূন্য থেকে সম্পূর্ণ project setup করতে পারবেন।

---

## 📋 Part 1: প্রয়োজনীয় Software Install

### ১.১ Node.js Install করুন

**Windows:**
1. https://nodejs.org এ যান
2. LTS version (v20.x.x) download করুন
3. Installer run করুন এবং Next > Next করে install করুন
4. CMD/PowerShell খুলে verify করুন:
```bash
node --version
npm --version
```

**Mac/Linux:**
```bash
# Using nvm (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 20
nvm use 20
```

### ১.২ Git Install করুন (Optional)

**Windows:**
1. https://git-scm.com/download/win
2. Installer download করে install করুন

**Mac:**
```bash
brew install git
```

### ১.৩ Code Editor Install করুন

**VS Code (Recommended):**
1. https://code.visualstudio.com/
2. Download এবং install করুন
3. Extensions install করুন:
   - JavaScript (ES6) code snippets
   - ESLint
   - Prettier
   - PostgreSQL

---

## 📁 Part 2: Project Folder তৈরি করুন

### ২.১ নতুন Folder তৈরি করুন

**Windows (File Explorer):**
1. যেকোনো জায়গায় (যেমন: D:\Projects\) right click করুন
2. "New" > "Folder" click করুন
3. নাম দিন: `street-bites-backend`

**Mac/Linux (Terminal):**
```bash
mkdir -p ~/Projects/street-bites-backend
cd ~/Projects/street-bites-backend
```

### ২.২ VS Code এ Open করুন

1. VS Code খুলুন
2. File > Open Folder
3. `street-bites-backend` folder select করুন
4. Terminal খুলুন (Ctrl + ` বা View > Terminal)

---

## 📦 Part 3: Backend Files তৈরি করুন

### ৩.১ package.json তৈরি করুন

Terminal এ type করুন:
```bash
npm init -y
```

এরপর `package.json` file খুলুন এবং **সম্পূর্ণ content** replace করুন:

```json
{
  "name": "street-bites-backend",
  "version": "1.0.0",
  "description": "Street Bites ফুড ডেলিভারি অ্যাপ্লিকেশনের Backend API",
  "main": "src/index.js",
  "scripts": {
    "start": "node src/index.js",
    "dev": "nodemon src/index.js"
  },
  "keywords": ["food-delivery", "express", "postgresql", "api"],
  "author": "Your Name",
  "license": "ISC",
  "dependencies": {
    "express": "^4.18.2",
    "pg": "^8.11.3",
    "jsonwebtoken": "^9.0.2",
    "bcryptjs": "^2.4.3",
    "dotenv": "^16.3.1",
    "cors": "^2.8.5",
    "multer": "^1.4.5-lts.1",
    "cloudinary": "^1.41.0",
    "express-validator": "^7.0.1"
  },
  "devDependencies": {
    "nodemon": "^3.0.2"
  }
}
```

### ৩.২ Dependencies Install করুন

Terminal এ run করুন:
```bash
npm install
```

⏳ এটি 2-3 মিনিট সময় নিতে পারে। সম্পূর্ণ হলে `node_modules` folder তৈরি হবে।

### ৩.৩ Folder Structure তৈরি করুন

Terminal এ এই commands গুলো run করুন:

**Windows (CMD/PowerShell):**
```bash
mkdir src
mkdir src\config
mkdir src\models
mkdir src\controllers
mkdir src\routes
mkdir src\middleware
mkdir src\utils
```

**Mac/Linux (Terminal):**
```bash
mkdir -p src/{config,models,controllers,routes,middleware,utils}
```

এখন আপনার folder structure এরকম দেখাবে:
```
street-bites-backend/
├── node_modules/
├── src/
│   ├── config/
│   ├── models/
│   ├── controllers/
│   ├── routes/
│   ├── middleware/
│   └── utils/
└── package.json
```

---

## 📝 Part 4: সব Files তৈরি করুন

### ৪.১ .env.example তৈরি করুন

Project root এ নতুন file তৈরি করুন: `.env.example`

**কিভাবে:**
- VS Code এ `New File` click করুন
- নাম দিন: `.env.example`
- উপরের artifact থেকে content copy করে paste করুন
- Save করুন (Ctrl + S)

### ৪.২ .gitignore তৈরি করুন

Project root এ: `.gitignore`
- উপরের artifact থেকে content copy paste করুন

### ৪.৩ Config Files তৈরি করুন

**src/config/database.js:**
- `src/config` folder এ right click
- New File > `database.js`
- উপরের artifact থেকে content copy paste করুন

**src/config/cloudinary.js:**
- একইভাবে `cloudinary.js` তৈরি করুন
- Content copy paste করুন

### ৪.৪ Middleware Files তৈরি করুন

**src/middleware/auth.js:**
- `src/middleware` folder এ `auth.js` তৈরি করুন
- Content copy paste করুন

**src/middleware/errorHandler.js:**
- `errorHandler.js` তৈরি করুন
- Content copy paste করুন

**src/middleware/upload.js:**
- `upload.js` তৈরি করুন
- Content copy paste করুন

### ৪.৫ Utils File তৈরি করুন

**src/utils/helpers.js:**
- `src/utils` folder এ `helpers.js` তৈরি করুন
- Content copy paste করুন

### ৪.৬ Main Server File তৈরি করুন

**src/index.js:**
- `src` folder এ `index.js` তৈরি করুন
- Content copy paste করুন

### ৪.৭ README তৈরি করুন

**README.md:**
- Project root এ `README.md` তৈরি করুন
- Content copy paste করুন

---

## 🗄️ Part 5: Database Setup (Supabase)

### ৫.১ Supabase Account তৈরি করুন

1. https://supabase.com এ যান
2. "Start your project" click করুন
3. GitHub দিয়ে sign up করুন (বা email দিয়ে)

### ৫.২ নতুন Project তৈরি করুন

1. Dashboard এ "New Project" click করুন
2. তথ্য দিন:
   - **Project Name:** street-bites
   - **Database Password:** একটি শক্তিশালী password দিন (এটি মনে রাখুন!)
   - **Region:** Singapore (closest to Bangladesh)
   - **Pricing Plan:** Free
3. "Create new project" click করুন
4. ⏳ 2-3 মিনিট অপেক্ষা করুন

### ৫.৩ Database Credentials নিন

1. Project তৈরি হলে "Settings" > "Database" যান
2. "Connection string" section এ যান
3. "URI" mode select করুন
4. Connection string copy করুন (এরকম দেখাবে):
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres
   ```

### ৫.৪ Database Schema তৈরি করুন

1. Supabase Dashboard এ "SQL Editor" যান
2. "New Query" click করুন
3. উপরের `00_complete_database_setup.sql` এর **সম্পূর্ণ content** copy করুন
4. SQL Editor এ paste করুন
5. "Run" button click করুন (বা F5 press করুন)
6. ✅ Success message দেখাবে

**Verify করুন:**
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';
```
এটি run করলে 14টি table দেখাবে।

---

## ☁️ Part 6: Cloudinary Setup

### ৬.১ Cloudinary Account তৈরি করুন

1. https://cloudinary.com এ যান
2. "Sign Up Free" click করুন
3. Email দিয়ে sign up করুন

### ৬.২ Credentials নিন

1. Dashboard এ যান
2. "Product Environment Credentials" section দেখুন
3. এই তিনটি information copy করুন:
   - **Cloud Name**
   - **API Key**
   - **API Secret**

---

## ⚙️ Part 7: Environment Variables Setup

### ৭.১ .env File তৈরি করুন

1. Project root এ `.env` নামে নতুন file তৈরি করুন
2. `.env.example` এর content copy করুন
3. আপনার actual credentials দিন:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration (Supabase থেকে নেওয়া)
DB_HOST=db.xxxxxxxxxxxxx.supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=your-actual-password-here
DB_SSL=true

# JWT Secret (যেকোনো random string - নিরাপদ রাখুন)
JWT_SECRET=my-super-secret-key-12345-abcdefgh
JWT_EXPIRE=7d

# Cloudinary (Dashboard থেকে নেওয়া)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=your-api-secret-here

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173

# File Upload
MAX_FILE_SIZE=5242880
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/jpg,image/webp
```

**⚠️ Important:**
- `.env` file কখনো GitHub এ upload করবেন না
- এতে sensitive information আছে

---

## 🏃 Part 8: Server Run করুন

### ৮.১ Development Mode এ Run করুন

Terminal এ type করুন:
```bash
npm run dev
```

**সফল হলে দেখাবে:**
```
========================================
🎉 Street Bites Backend Server
========================================
🚀 Server চালু হয়েছে: http://localhost:5000
📝 Environment: development
🗄️  Database: Connected
📁 Cloudinary: Configured
========================================
```

### ৮.২ Browser এ Test করুন

Browser খুলে যান: http://localhost:5000

**দেখাবে:**
```json
{
  "success": true,
  "message": "Street Bites API সফলভাবে চালু আছে! 🚀",
  "version": "1.0.0",
  "timestamp": "2024-12-19T10:30:00.000Z"
}
```

### ৮.৩ Status Check করুন

যান: http://localhost:5000/api/status

**দেখাবে:**
```json
{
  "success": true,
  "message": "System status",
  "data": {
    "server": "Running",
    "database": "Connected",
    "cloudinary": "Configured",
    "timestamp": "..."
  }
}
```

---

## 🐛 Part 9: Common Problems & Solutions

### Problem 1: "npm not found"

**Solution:**
- Node.js properly install হয়নি
- Node.js পুনরায় install করুন
- Computer restart করুন

### Problem 2: "Database connection failed"

**Solution:**
```bash
# .env file check করুন
# DB_HOST, DB_PASSWORD সঠিক আছে কিনা verify করুন
# Supabase project active আছে কিনা check করুন
```

### Problem 3: "Port 5000 already in use"

**Solution:**
```bash
# .env file এ PORT পরিবর্তন করুন
PORT=5001
```

অথবা running process kill করুন:
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID_NUMBER> /F

# Mac/Linux
lsof -i :5000
kill -9 <PID>
```

### Problem 4: "Module not found"

**Solution:**
```bash
# node_modules delete করুন
rm -rf node_modules
# পুনরায় install করুন
npm install
```

### Problem 5: "Cloudinary not configured"

**Solution:**
- এটি warning মাত্র, server চলবে
- পরে Cloudinary credentials add করতে পারবেন
- Image upload কাজ করবে না যতক্ষণ না configure করবেন

---

## ✅ Part 10: Verification Checklist

নিশ্চিত করুন যে:

- [ ] Node.js installed (v16+)
- [ ] All folders created (src, config, etc.)
- [ ] All files created (15+ files)
- [ ] Dependencies installed (node_modules আছে)
- [ ] .env file তৈরি হয়েছে
- [ ] Supabase project তৈরি হয়েছে
- [ ] Database schema run করা হয়েছে
- [ ] 14টি tables তৈরি হয়েছে
- [ ] Server চালু হচ্ছে
- [ ] http://localhost:5000 কাজ করছে
- [ ] Database connected দেখাচ্ছে

---

## 🎯 Part 11: Next Steps

এখন আপনি ready:

1. **Database Models তৈরি করুন** - `src/models/` এ
2. **Controllers লিখুন** - `src/controllers/` এ
3. **Routes তৈরি করুন** - `src/routes/` এ
4. **API Test করুন** - Postman দিয়ে

পরবর্তী prompt এ বলুন:
```
"এখন আমি authentication system তৈরি করতে চাই (register, login, logout)"
```

অথবা:
```
"এখন product management API তৈরি করতে চাই"
```

---

## 📞 Help & Support

কোন সমস্যা হলে:

1. Error message সম্পূর্ণ copy করুন
2. কোন step এ problem হয়েছে বলুন
3. Screenshot share করুন
4. আমি help করব! 😊

---

**🎉 অভিনন্দন! আপনার Backend Setup সম্পূর্ণ হয়েছে!** 🎉