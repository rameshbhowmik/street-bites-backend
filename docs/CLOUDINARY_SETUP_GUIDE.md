# 🖼️ Cloudinary Image Upload - Complete Setup Guide

## 📋 সূচিপত্র
1. [Cloudinary Account Setup](#1-cloudinary-account-setup)
2. [Dependencies Install](#2-dependencies-install)
3. [Environment Variables](#3-environment-variables)
4. [Files Structure](#4-files-structure)
5. [Testing Guide](#5-testing-guide)
6. [API Endpoints](#6-api-endpoints)
7. [Usage Examples](#7-usage-examples)

---

## 1. Cloudinary Account Setup

### Step 1: Account তৈরি করুন
1. **https://cloudinary.com** এ যান
2. **Sign Up** button click করুন
3. Email দিয়ে account তৈরি করুন (Free tier যথেষ্ট)

### Step 2: Credentials নিন
1. Dashboard এ লগইন করুন
2. **Dashboard** → **Account Details** এ যান
3. নিচের তথ্য copy করুন:
   - **Cloud Name**
   - **API Key**
   - **API Secret**

### Step 3: Upload Presets (Optional)
1. **Settings** → **Upload** এ যান
2. **Add upload preset** click করুন
3. Preset name: `street-bites-uploads`
4. Signing Mode: `Unsigned` (বা `Signed` যদি বেশি security চান)
5. Folder: `street-bites`

---

## 2. Dependencies Install

### নতুন Dependencies:
```bash
npm install cloudinary multer streamifier
```

### সব Dependencies একসাথে:
```bash
npm install express dotenv pg bcryptjs jsonwebtoken cors helmet express-rate-limit express-validator morgan cloudinary multer streamifier
```

### Dev Dependencies:
```bash
npm install -D nodemon jest
```

---

## 3. Environment Variables

### `.env` ফাইলে যোগ করুন:
```env
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name_here
CLOUDINARY_API_KEY=your_api_key_here
CLOUDINARY_API_SECRET=your_api_secret_here
```

### Example:
```env
CLOUDINARY_CLOUD_NAME=dxyz12345
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=abcdefghijklmnopqrstuvwxyz123456
```

---

## 4. Files Structure

### প্রয়োজনীয় Files:

```
src/
├── config/
│   └── cloudinary.js              ✅ Cloudinary config
├── middleware/
│   └── upload.js                  ✅ Multer middleware (Updated)
├── utils/
│   └── uploadUtils.js             ✅ Upload helper functions
├── controllers/
│   ├── productImageController.js  ✅ Product images
│   ├── profilePictureController.js ✅ Profile pictures
│   ├── stallPhotoController.js    ✅ Stall photos
│   ├── receiptUploadController.js ✅ Receipt images
│   └── reviewImageController.js   ✅ Review images
└── routes/
    └── imageUploadRoutes.js       ✅ All image routes

```

---

## 5. Testing Guide

### Method 1: Postman দিয়ে Test

#### A. Profile Picture Upload
```
POST http://localhost:5000/api/images/profile/upload
Headers:
  Authorization: Bearer YOUR_JWT_TOKEN
Body (form-data):
  profile_picture: [SELECT IMAGE FILE]
```

#### B. Product Image Upload
```
POST http://localhost:5000/api/images/products/1/upload
Headers:
  Authorization: Bearer YOUR_JWT_TOKEN
Body (form-data):
  image: [SELECT IMAGE FILE]
```

#### C. Multiple Product Images
```
POST http://localhost:5000/api/images/products/1/upload-multiple
Headers:
  Authorization: Bearer YOUR_JWT_TOKEN
Body (form-data):
  images: [SELECT MULTIPLE FILES - up to 5]
```

#### D. Stall Photo Upload
```
POST http://localhost:5000/api/images/stalls/1/upload
Headers:
  Authorization: Bearer YOUR_JWT_TOKEN
Body (form-data):
  photo: [SELECT IMAGE FILE]
```

#### E. Hygiene Photos Upload
```
POST http://localhost:5000/api/images/stalls/1/hygiene
Headers:
  Authorization: Bearer YOUR_JWT_TOKEN
Body (form-data):
  photos: [SELECT MULTIPLE FILES - up to 5]
```

#### F. Receipt Upload
```
POST http://localhost:5000/api/images/receipts/upload
Headers:
  Authorization: Bearer YOUR_JWT_TOKEN
Body (form-data):
  receipt: [SELECT IMAGE/PDF FILE]
  expense_id: 1
```

#### G. Review Images Upload
```
POST http://localhost:5000/api/images/reviews/upload
Headers:
  Authorization: Bearer YOUR_JWT_TOKEN
Body (form-data):
  images: [SELECT MULTIPLE FILES - up to 3]
  review_id: 1
```

---

### Method 2: cURL দিয়ে Test

#### Profile Picture Upload:
```bash
curl -X POST http://localhost:5000/api/images/profile/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "profile_picture=@/path/to/image.jpg"
```

#### Product Image Upload:
```bash
curl -X POST http://localhost:5000/api/images/products/1/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "image=@/path/to/product.jpg"
```

---

## 6. API Endpoints

### 📸 Product Images
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/images/products/:id/upload` | Single product image | Owner, Employee |
| POST | `/api/images/products/:id/upload-multiple` | Multiple images (max 5) | Owner |
| DELETE | `/api/images/products/:id` | Delete product image | Owner |

### 👤 Profile Pictures
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/images/profile/upload` | Upload profile picture | Authenticated |
| DELETE | `/api/images/profile` | Delete profile picture | Authenticated |

### 🏪 Stall Photos
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/images/stalls/:id/upload` | Stall photo | Owner, Employee |
| POST | `/api/images/stalls/:id/hygiene` | Hygiene photos (max 5) | Owner, Employee |

### 🧾 Receipts
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/images/receipts/upload` | Receipt image/PDF | Owner, Employee |
| DELETE | `/api/images/receipts` | Delete receipt | Owner, Employee |

### ⭐ Reviews
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/images/reviews/upload` | Review images (max 3) | Authenticated |
| DELETE | `/api/images/reviews` | Delete review image | Authenticated |

---

## 7. Usage Examples

### Example 1: Frontend থেকে Product Image Upload

```javascript
const uploadProductImage = async (productId, imageFile) => {
  try {
    const formData = new FormData();
    formData.append('image', imageFile);
    
    const response = await fetch(
      `http://localhost:5000/api/images/products/${productId}/upload`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      }
    );
    
    const data = await response.json();
    
    if (data.success) {
      console.log('Image uploaded:', data.data.image.url);
      // UI update করুন
    }
  } catch (error) {
    console.error('Upload error:', error);
  }
};
```

### Example 2: Multiple Images Upload

```javascript
const uploadMultipleImages = async (productId, imageFiles) => {
  try {
    const formData = new FormData();
    
    // সব images append করুন
    for (const file of imageFiles) {
      formData.append('images', file);
    }
    
    const response = await fetch(
      `http://localhost:5000/api/images/products/${productId}/upload-multiple`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      }
    );
    
    const data = await response.json();
    
    if (data.success) {
      console.log('Images uploaded:', data.data.images);
    }
  } catch (error) {
    console.error('Upload error:', error);
  }
};
```

### Example 3: React Component

```javascript
import React, { useState } from 'react';

const ImageUploader = ({ productId }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState('');

  const handleFileSelect = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    
    setUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('image', selectedFile);
      
      const response = await fetch(
        `http://localhost:5000/api/images/products/${productId}/upload`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: formData
        }
      );
      
      const data = await response.json();
      
      if (data.success) {
        setImageUrl(data.data.image.url);
        alert('Image uploaded successfully!');
      }
    } catch (error) {
      alert('Upload failed: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <input type="file" accept="image/*" onChange={handleFileSelect} />
      <button onClick={handleUpload} disabled={uploading}>
        {uploading ? 'Uploading...' : 'Upload Image'}
      </button>
      {imageUrl && <img src={imageUrl} alt="Uploaded" style={{ width: 200 }} />}
    </div>
  );
};

export default ImageUploader;
```

---

## 8. Response Format

### Success Response:
```json
{
  "success": true,
  "message": "Image সফলভাবে upload হয়েছে",
  "data": {
    "image": {
      "url": "https://res.cloudinary.com/...",
      "public_id": "street-bites/products/product_1_1234567890",
      "responsive_urls": {
        "thumbnail": "https://res.cloudinary.com/.../w_200,h_200...",
        "small": "https://res.cloudinary.com/.../w_400...",
        "medium": "https://res.cloudinary.com/.../w_800...",
        "large": "https://res.cloudinary.com/.../w_1200...",
        "original": "https://res.cloudinary.com/..."
      }
    }
  }
}
```

### Error Response:
```json
{
  "success": false,
  "message": "File size অনেক বড়",
  "error": "File size limit exceeded"
}
```

---

## 9. File Size Limits

- **Profile Pictures:** 5MB
- **Product Images:** 5MB
- **Stall Photos:** 5MB
- **Hygiene Photos:** 5MB
- **Receipts:** 10MB (PDF allowed)
- **Review Images:** 5MB

---

## 10. Allowed File Types

### Images:
- JPG/JPEG
- PNG
- WebP

### Receipts:
- JPG/JPEG
- PNG
- WebP
- PDF

---

## 11. Cloudinary Folders Structure

```
street-bites/
├── profiles/           # Profile pictures
├── products/          # Product images
├── stalls/           # Stall photos
├── hygiene/          # Hygiene checklist photos
├── receipts/         # Receipt images
└── reviews/          # Review images
```

---

## 12. Troubleshooting

### Problem 1: "Cloudinary connection failed"
**Solution:**
- `.env` এ credentials check করুন
- Internet connection check করুন
- Cloudinary dashboard এ যান এবং credentials verify করুন

### Problem 2: "File size limit exceeded"
**Solution:**
- Image compress করুন (TinyPNG, ImageOptim)
- Maximum size: 5MB (receipts: 10MB)

### Problem 3: "Invalid file type"
**Solution:**
- শুধুমাত্র JPG, PNG, WebP allowed
- File extension check করুন

### Problem 4: Upload slow
**Solution:**
- Internet speed check করুন
- Image আগে compress করুন
- Smaller images use করুন

---

## 13. Best Practices

### ✅ করুন:
- সবসময় image optimize করে upload করুন
- Proper error handling implement করুন
- User কে upload progress দেখান
- Image preview দিন upload এর আগে
- File size validation করুন frontend এ

### ❌ করবেন না:
- অনেক বড় images upload করবেন না
- Multiple uploads একসাথে করবেন না
- Error handling skip করবেন না
- Public ID manually set করবেন না (automatic হতে দিন)

---

## 14. Next Steps

এখন আপনি:
1. ✅ সব ধরনের images upload করতে পারবেন
2. ✅ Responsive URLs generate করতে পারবেন
3. ✅ Images delete করতে পারবেন
4. ✅ Thumbnails তৈরি করতে পারবেন

### পরবর্তী Feature যোগ করতে চান?
- Image compression before upload
- Progress bar
- Image cropping
- Watermark adding
- Bulk upload
- Image gallery management

কোন সমস্যা হলে বলুন! 😊