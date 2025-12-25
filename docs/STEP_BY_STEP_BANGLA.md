# 🎬 Street Bites Backend - ভিডিও টিউটোরিয়াল স্টাইল গাইড

একদম শুরু থেকে শেষ পর্যন্ত, প্রতিটি ক্লিক বুঝিয়ে বলা হয়েছে।

---

## 🎯 আমরা কি করব?

একটি সম্পূর্ণ Food Delivery Backend তৈরি করব যেখানে থাকবে:
- ✅ User Login/Registration
- ✅ Restaurant/Stall Management  
- ✅ Food Items Management
- ✅ Order Processing
- ✅ Payment Tracking
- ✅ Employee Management
- ✅ Inventory Management

**Total Time:** 30-45 মিনিট

---

## 📥 Step 1: Node.js Download & Install (5 মিনিট)

### Windows User দের জন্য:

1. **Browser খুলুন** (Chrome/Firefox)
2. যান: `https://nodejs.org`
3. **বড় সবুজ button** দেখবেন যেখানে লেখা "20.x.x LTS" - এটাতে click করুন
4. Download শুরু হবে (50-60 MB file)
5. Download শেষ হলে file টিতে **double click** করুন
6. Installer window আসবে:
   - **Next** click করুন
   - **Accept** checkbox tick করুন
   - **Next** click করুন (3-4 বার)
   - **Install** click করুন
   - Administrator permission চাইলে **Yes** click করুন
   - শেষ হলে **Finish** click করুন

7. **Verify করুন:** 
   - Windows button press করুন
   - Type করুন: `cmd`
   - Enter press করুন (কালো window আসবে)
   - Type করুন: `node --version`
   - Enter press করুন
   - দেখাবে: `v20.x.x` ✅

---

## 📂 Step 2: Project Folder তৈরি করুন (2 মিনিট)

### Windows এ:

1. **File Explorer** খুলুন (Windows + E)
2. যেকোনো drive select করুন (যেমন: D:)
3. একটা folder বানান যেমন: `Projects`
4. সেই folder এ ঢুকুন
5. **Right Click** করুন খালি জায়গায়
6. **New** > **Folder** select করুন
7. নাম দিন: `street-bites-backend`
8. Enter press করুন

এখন আপনার path হবে: `D:\Projects\street-bites-backend`

---

## 💻 Step 3: VS Code Install করুন (5 মিনিট)

1. Browser এ যান: `https://code.visualstudio.com`
2. বড় নীল button "Download for Windows" - click করুন
3. Download হলে file টিতে double click করুন
4. Install করুন (Next > Next > Install)
5. শেষ হলে **Launch VS Code** tick mark দিয়ে Finish করুন

**VS Code খোলার পর:**
1. **File** menu > **Open Folder** click করুন
2. আপনার তৈরি করা `street-bites-backend` folder select করুন
3. **Select Folder** click করুন
4. Trust করার জন্য জিজ্ঞেস করলে **Yes, I trust** click করুন

---

## ⚙️ Step 4: Project Initialize করুন (3 মিনিট)

### Terminal খুলুন:
- VS Code এ উপরে **Terminal** menu > **New Terminal** click করুন
- নিচে একটা panel খুলবে যেখানে লেখা থাকবে `PS D:\Projects\street-bites-backend>`

### Commands run করুন:

**Command 1:** Package.json তৈরি
```bash
npm init -y
```
Enter press করুন। দেখাবে: "Wrote to package.json" ✅

**Command 2:** Folder structure তৈরি
```bash
mkdir src
mkdir src\config
mkdir src\models  
mkdir src\controllers
mkdir src\routes
mkdir src\middleware
mkdir src\utils
```
প্রতিটি line এ Enter press করুন।

বাম পাশে Explorer এ এখন দেখাবে:
```
📁 street-bites-backend
  📁 src
    📁 config
    📁 models
    📁 controllers
    📁 routes
    📁 middleware
    📁 utils
```

---

## 📦 Step 5: Dependencies Install করুন (5 মিনিট)

### Package.json update করুন:

1. বাম পাশে `package.json` file এ click করুন
2. **সব content delete** করুন (Ctrl + A, তারপর Delete)
3. এই content paste করুন:

```json
{
  "name": "street-bites-backend",
  "version": "1.0.0",
  "main": "src/index.js",
  "scripts": {
    "start": "node src/index.js",
    "dev": "nodemon src/index.js"
  },
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

4. **Save করুন** (Ctrl + S)

### Install command run করুন:

Terminal এ type করুন:
```bash
npm install
```
Enter press করুন।

⏳ **2-3 মিনিট অপেক্ষা করুন।** 

Installing দেখাবে... শেষ হলে দেখাবে:
```
added 150 packages
```

বাম পাশে `node_modules` নামে একটা বড় folder তৈরি হবে। ✅

---

## 📝 Step 6: Files তৈরি করুন (10 মিনিট)

### File তৈরির নিয়ম:
1. যে folder এ file তৈরি করতে চান সেখানে **Right Click**
2. **New File** select করুন
3. File এর নাম লিখুন
4. Enter press করুন
5. File খুলবে
6. Content paste করুন
7. **Save করুন** (Ctrl + S)

### এই files গুলো তৈরি করুন:

**1. Root folder এ `.env.example`:**
```env
PORT=5000
NODE_ENV=development

DB_HOST=your-supabase-host.supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=your-password
DB_SSL=true

JWT_SECRET=your-secret-key
JWT_EXPIRE=7d

CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

ALLOWED_ORIGINS=http://localhost:3000
```

**2. Root folder এ `.gitignore`:**
```
node_modules/
.env
.env.local
*.log
.DS_Store
```

**3. `src/config/database.js`:**
- উপরের **artifact 4** থেকে পুরো code copy করুন
- Paste করুন
- Save করুন

**4. `src/config/cloudinary.js`:**
- **Artifact 5** থেকে copy paste

**5. `src/middleware/auth.js`:**
- **Artifact 6** থেকে copy paste

**6. `src/middleware/errorHandler.js`:**
- **Artifact 7** থেকে copy paste

**7. `src/middleware/upload.js`:**
- **Artifact 8** থেকে copy paste

**8. `src/utils/helpers.js`:**
- **Artifact 9** থেকে copy paste

**9. `src/index.js`:**
- **Artifact 10** থেকে copy paste

**10. Root folder এ `README.md`:**
- **Artifact 11** থেকে copy paste

✅ **Total 10টি file তৈরি হয়েছে!**

---

## 🗄️ Step 7: Supabase Database Setup (10 মিনিট)

### Account তৈরি:

1. Browser এ যান: `https://supabase.com`
2. **Start your project** button click করুন
3. **Continue with GitHub** click করুন
4. GitHub এ login করুন (না থাকলে GitHub account বানান)
5. Authorize করুন

### Project তৈরি:

1. **New project** button (সবুজ) click করুন
2. Form fill up করুন:
   - **Name:** `street-bites`
   - **Database Password:** একটা strong password দিন (মনে রাখবেন!) যেমন: `MyStrong@Pass123`
   - **Region:** `Southeast Asia (Singapore)` select করুন
   - **Pricing plan:** `Free` select করুন
3. **Create new project** click করুন
4. ⏳ 2-3 মিনিট অপেক্ষা করুন...

### Database Credentials নিন:

1. Project তৈরি হলে বাম পাশে **Settings** (⚙️ icon) click করুন
2. **Database** click করুন
3. নিচে scroll করে **Connection string** section খুঁজুন
4. **URI** tab select করুন
5. String টা এরকম দেখাবে:
   ```
   postgresql://postgres.[PASSWORD]@db.xxx.supabase.co:5432/postgres
   ```
6. এটা copy করুন

### Database Schema তৈরি করুন:

1. বাম পাশে **SQL Editor** (📊 icon) click করুন
2. **New query** button click করুন
3. উপরের **Artifact 15** (`00_complete_database_setup.sql`) এর **সম্পূর্ণ code** copy করুন
4. SQL Editor এ paste করুন
5. নিচে **RUN** button (বা F5) click করুন
6. ⏳ 10-20 সেকেন্ড অপেক্ষা করুন...
7. ✅ Success দেখাবে!

**Verify করুন:**
নতুন query খুলে run করুন:
```sql
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
```
✅ **14টি table** দেখাবে:
- users
- investors
- employees
- stalls
- products
- ... (আরো 9টি)

---

## ☁️ Step 8: Cloudinary Setup (5 মিনিট)

1. Browser এ যান: `https://cloudinary.com`
2. **Sign Up Free** click করুন
3. Email দিয়ে sign up করুন
4. Email verify করুন
5. Dashboard এ যান
6. **Product Environment Credentials** section দেখুন
7. এই 3টি copy করুন:
   - **Cloud Name:** যেমন `dxxx1234`
   - **API Key:** যেমন `123456789012345`
   - **API Secret:** যেমন `abcd-efgh-1234`

---

## ⚙️ Step 9: .env File তৈরি করুন (3 মিনিট)

1. Root folder এ **New File** তৈরি করুন
2. নাম দিন: `.env` (dot দিয়ে শুরু)
3. `.env.example` এর content copy করুন
4. `.env` file এ paste করুন
5. এখন actual values দিন:

```env
PORT=5000
NODE_ENV=development

# Supabase থেকে নেওয়া
DB_HOST=db.xxxxxxxxxxxxx.supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=MyStrong@Pass123
DB_SSL=true

# Random strong string
JWT_SECRET=my-super-secret-jwt-key-123456
JWT_EXPIRE=7d

# Cloudinary থেকে নেওয়া
CLOUDINARY_CLOUD_NAME=dxxx1234
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=abcd-efgh-1234

ALLOWED_ORIGINS=http://localhost:3000
```

6. **Save করুন** (Ctrl + S)

---

## 🚀 Step 10: Server Run করুন (2 মিনিট)

Terminal এ type করুন:
```bash
npm run dev
```
Enter press করুন।

**✅ সফল হলে দেখাবে:**
```
🔄 Database connection test করা হচ্ছে...
✅ Database এ সফলভাবে connected হয়েছে
✅ Database connection test সফল

========================================
🎉 Street Bites Backend Server
========================================
🚀 Server চালু হয়েছে: http://localhost:5000
📝 Environment: development
🗄️  Database: Connected
📁 Cloudinary: Configured
========================================
```

---

## 🧪 Step 11: Test করুন (2 মিনিট)

### Browser Test:

1. **Chrome/Firefox** খুলুন
2. Address bar এ type করুন: `http://localhost:5000`
3. Enter press করুন

**দেখাবে:**
```json
{
  "success": true,
  "message": "Street Bites API সফলভাবে চালু আছে! 🚀",
  "version": "1.0.0",
  "timestamp": "2024-12-19T..."
}
```

4. এবার যান: `http://localhost:5000/api/status`

**দেখাবে:**
```json
{
  "success": true,
  "message": "System status",
  "data": {
    "server": "Running",
    "database": "Connected",
    "cloudinary": "Configured"
  }
}
```

### ✅ উভয়ই কাজ করলে সফল!

---

## 🎉 অভিনন্দন!

আপনার **Street Bites Backend** সম্পূর্ণরূপে চালু আছে! 🎊

### এখন কি করতে পারবেন:

✅ Database এ 14টি table আছে
✅ Server চলছে
✅ Image upload ready (Cloudinary)
✅ Authentication system ready
✅ Error handling ready

### পরবর্তী পদক্ষেপ:

এখন বলুন:
- "User registration API বানাতে চাই"
- "Login system তৈরি করতে চাই"
- "Product list API বানাতে চাই"

আমি step by step বুঝিয়ে দেব! 😊

---

## 🆘 যদি কোন সমস্যা হয়:

**Server start হচ্ছে না?**
- `.env` file check করুন
- Database password সঠিক আছে কিনা দেখুন
- `npm install` আবার run করুন

**Database connected দেখাচ্ছে না?**
- Supabase project active আছে কিনা check করুন
- Internet connection check করুন
- `.env` এর DB_HOST সঠিক আছে কিনা দেখুন

**Port already in use error?**
- `.env` এ PORT=5001 করে দিন
- Terminal close করে আবার খুলুন

আমাকে বলুন, আমি সাহায্য করব! 💪