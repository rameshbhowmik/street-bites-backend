// backend/src/utils/emailTemplates.js

/**
 * Email Templates for Street Bites
 * All templates in HTML format with inline CSS for better email client compatibility
 */

// Base template wrapper
const baseTemplate = (content, title = 'Street Bites') => `
<!DOCTYPE html>
<html lang="bn">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background-color: #f4f4f4;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 20px auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
    }
    .content {
      padding: 30px;
      color: #333333;
      line-height: 1.6;
    }
    .footer {
      background-color: #f8f8f8;
      padding: 20px;
      text-align: center;
      font-size: 12px;
      color: #666666;
    }
    .button {
      display: inline-block;
      padding: 12px 30px;
      background-color: #667eea;
      color: white;
      text-decoration: none;
      border-radius: 5px;
      margin: 15px 0;
    }
    .otp-box {
      background-color: #f0f0f0;
      border: 2px dashed #667eea;
      padding: 20px;
      text-align: center;
      font-size: 32px;
      font-weight: bold;
      letter-spacing: 5px;
      margin: 20px 0;
      border-radius: 8px;
    }
    .info-box {
      background-color: #fff3cd;
      border-left: 4px solid #ffc107;
      padding: 15px;
      margin: 15px 0;
    }
    .danger-box {
      background-color: #f8d7da;
      border-left: 4px solid #dc3545;
      padding: 15px;
      margin: 15px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🍔 Street Bites</h1>
    </div>
    ${content}
    <div class="footer">
      <p>&copy; 2026 Street Bites. All rights reserved.</p>
      <p>Balurghat, West Bengal, India</p>
    </div>
  </div>
</body>
</html>
`;

/**
 * Welcome Email Template
 */
const welcomeEmail = (userName, userEmail) => {
  const content = `
    <div class="content">
      <h2>স্বাগতম ${userName}! 👋</h2>
      <p>Street Bites পরিবারে আপনাকে স্বাগত জানাই!</p>
      <p>আপনার একাউন্ট সফলভাবে তৈরি হয়েছে।</p>
      
      <div class="info-box">
        <strong>একাউন্ট তথ্য:</strong><br>
        📧 ইমেইল: ${userEmail}<br>
        ✅ স্ট্যাটাস: সক্রিয়
      </div>

      <p>এখন আপনি আমাদের সুস্বাদু খাবার অর্ডার করতে পারবেন!</p>
      
      <a href="${process.env.CLIENT_URL}/menu" class="button">মেনু দেখুন</a>

      <p>কোন সমস্যা হলে আমাদের সাথে যোগাযোগ করুন।</p>
    </div>
  `;

  return baseTemplate(content, 'স্বাগতম - Street Bites');
};

/**
 * OTP Email Template
 */
const otpEmail = (userName, otp, expiryMinutes = 10) => {
  const content = `
    <div class="content">
      <h2>OTP Verification</h2>
      <p>হ্যালো ${userName},</p>
      <p>আপনার একাউন্ট verify করার জন্য নিচের OTP ব্যবহার করুন:</p>
      
      <div class="otp-box">
        ${otp}
      </div>

      <div class="info-box">
        ⏰ এই OTP ${expiryMinutes} মিনিটের জন্য valid থাকবে।
      </div>

      <p><strong>নিরাপত্তা টিপস:</strong></p>
      <ul>
        <li>এই OTP কাউকে শেয়ার করবেন না</li>
        <li>কোন কর্মচারী কখনো OTP জিজ্ঞাসা করবে না</li>
        <li>সন্দেহজনক কিছু দেখলে অবিলম্বে জানান</li>
      </ul>
    </div>
  `;

  return baseTemplate(content, 'OTP Verification - Street Bites');
};

/**
 * Password Reset Email Template
 */
const passwordResetEmail = (userName, resetToken, expiryMinutes = 15) => {
  const resetLink = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;

  const content = `
    <div class="content">
      <h2>🔑 Password Reset</h2>
      <p>হ্যালো ${userName},</p>
      <p>আপনার পাসওয়ার্ড রিসেট করার জন্য অনুরোধ পাওয়া গেছে।</p>

      <div class="info-box">
        নিচের বাটনে ক্লিক করে নতুন পাসওয়ার্ড সেট করুন:
      </div>

      <a href="${resetLink}" class="button">পাসওয়ার্ড রিসেট করুন</a>

      <p>অথবা এই লিংকটি কপি করে ব্রাউজারে পেস্ট করুন:</p>
      <p style="word-break: break-all; background-color: #f0f0f0; padding: 10px; border-radius: 5px;">
        ${resetLink}
      </p>

      <div class="danger-box">
        ⚠️ এই লিংক ${expiryMinutes} মিনিটের জন্য valid থাকবে।
      </div>

      <p><strong>আপনি যদি এই অনুরোধ না করে থাকেন:</strong></p>
      <ul>
        <li>এই ইমেইল ignore করুন</li>
        <li>আপনার পাসওয়ার্ড পরিবর্তন হবে না</li>
        <li>নিরাপত্তার জন্য একাউন্ট চেক করুন</li>
      </ul>
    </div>
  `;

  return baseTemplate(content, 'Password Reset - Street Bites');
};

/**
 * Password Changed Confirmation Email
 */
const passwordChangedEmail = (userName, changedAt) => {
  const content = `
    <div class="content">
      <h2>✅ Password Changed Successfully</h2>
      <p>হ্যালো ${userName},</p>
      <p>আপনার একাউন্টের পাসওয়ার্ড সফলভাবে পরিবর্তন হয়েছে।</p>

      <div class="info-box">
        📅 পরিবর্তনের সময়: ${new Date(changedAt).toLocaleString('bn-BD')}
      </div>

      <p>এখন থেকে নতুন পাসওয়ার্ড দিয়ে login করতে হবে।</p>

      <div class="danger-box">
        <strong>⚠️ আপনি যদি এই পরিবর্তন না করে থাকেন:</strong><br>
        অবিলম্বে আমাদের support team এর সাথে যোগাযোগ করুন।<br>
        আপনার একাউন্ট হ্যাক হতে পারে।
      </div>

      <a href="${process.env.CLIENT_URL}/contact" class="button">Support এ যোগাযোগ করুন</a>
    </div>
  `;

  return baseTemplate(content, 'Password Changed - Street Bites');
};

/**
 * 2FA Setup Email Template
 */
const twoFactorSetupEmail = (userName, backupCodes) => {
  const content = `
    <div class="content">
      <h2>🔐 Two-Factor Authentication Setup</h2>
      <p>হ্যালো ${userName},</p>
      <p>আপনার 2FA সফলভাবে সক্রিয় করা হয়েছে। 🎉</p>

      <div class="info-box">
        <strong>Backup Codes:</strong><br>
        এই codes গুলো নিরাপদ জায়গায় সংরক্ষণ করুন। যদি আপনার authenticator app access না থাকে তখন এই codes ব্যবহার করতে পারবেন।
      </div>

      <div style="background-color: #f0f0f0; padding: 15px; border-radius: 5px; margin: 15px 0;">
        ${backupCodes.map((code, index) => `<div style="font-family: monospace; margin: 5px 0;">${index + 1}. ${code}</div>`).join('')}
      </div>

      <div class="danger-box">
        <strong>গুরুত্বপূর্ণ:</strong>
        <ul>
          <li>প্রতিটি backup code শুধুমাত্র একবার ব্যবহার করা যাবে</li>
          <li>এই codes কাউকে শেয়ার করবেন না</li>
          <li>নিরাপদ জায়গায় সংরক্ষণ করুন (password manager recommended)</li>
        </ul>
      </div>

      <p>এখন থেকে login করার সময় authenticator code দিতে হবে।</p>
    </div>
  `;

  return baseTemplate(content, '2FA Setup - Street Bites');
};

/**
 * Suspicious Login Alert Email
 */
const suspiciousLoginEmail = (userName, loginDetails) => {
  const { location, ipAddress, deviceType, browser, timestamp } = loginDetails;

  const content = `
    <div class="content">
      <h2>⚠️ Suspicious Login Detected</h2>
      <p>হ্যালো ${userName},</p>
      <p>আমরা আপনার একাউন্টে একটি সন্দেহজনক login attempt সনাক্ত করেছি।</p>

      <div class="danger-box">
        <strong>Login Details:</strong><br>
        📅 সময়: ${new Date(timestamp).toLocaleString('bn-BD')}<br>
        📍 স্থান: ${location || 'Unknown'}<br>
        🌐 IP Address: ${ipAddress}<br>
        💻 Device: ${deviceType || 'Unknown'} - ${browser || 'Unknown'}
      </div>

      <p><strong>এটি কি আপনি ছিলেন?</strong></p>
      <ul>
        <li>হ্যাঁ হলে - কোন পদক্ষেপ নেওয়ার প্রয়োজন নেই</li>
        <li>না হলে - অবিলম্বে পাসওয়ার্ড পরিবর্তন করুন</li>
      </ul>

      <a href="${process.env.CLIENT_URL}/change-password" class="button">পাসওয়ার্ড পরিবর্তন করুন</a>

      <div class="info-box">
        <strong>নিরাপত্তা সুপারিশ:</strong>
        <ul>
          <li>একটি শক্তিশালী, unique পাসওয়ার্ড ব্যবহার করুন</li>
          <li>Two-Factor Authentication (2FA) সক্রিয় করুন</li>
          <li>সন্দেহজনক email/SMS এ সাড়া দেবেন না</li>
        </ul>
      </div>
    </div>
  `;

  return baseTemplate(content, 'Security Alert - Street Bites');
};

/**
 * Account Locked Email
 */
const accountLockedEmail = (userName, lockReason, unlockTime) => {
  const content = `
    <div class="content">
      <h2>🔒 Account Locked</h2>
      <p>হ্যালো ${userName},</p>
      <p>নিরাপত্তার কারণে আপনার একাউন্ট সাময়িকভাবে লক করা হয়েছে।</p>

      <div class="danger-box">
        <strong>কারণ:</strong> ${lockReason}<br>
        <strong>আনলক হবে:</strong> ${new Date(unlockTime).toLocaleString('bn-BD')}
      </div>

      <p>সাধারণত এটি অনেকবার ভুল পাসওয়ার্ড দেওয়ার কারণে হয়ে থাকে।</p>

      <div class="info-box">
        <strong>কি করবেন:</strong>
        <ul>
          <li>নির্ধারিত সময় পর্যন্ত অপেক্ষা করুন</li>
          <li>পাসওয়ার্ড মনে না থাকলে reset করুন</li>
          <li>সমস্যা অব্যাহত থাকলে support এ যোগাযোগ করুন</li>
        </ul>
      </div>

      <a href="${process.env.CLIENT_URL}/forgot-password" class="button">পাসওয়ার্ড রিসেট করুন</a>
    </div>
  `;

  return baseTemplate(content, 'Account Locked - Street Bites');
};

/**
 * New Device Login Email
 */
const newDeviceLoginEmail = (userName, deviceDetails) => {
  const { deviceType, browser, os, location, timestamp } = deviceDetails;

  const content = `
    <div class="content">
      <h2>🆕 New Device Login</h2>
      <p>হ্যালো ${userName},</p>
      <p>আপনার একাউন্টে একটি নতুন device থেকে login হয়েছে।</p>

      <div class="info-box">
        <strong>Device Details:</strong><br>
        📅 সময়: ${new Date(timestamp).toLocaleString('bn-BD')}<br>
        💻 Device: ${deviceType || 'Unknown'}<br>
        🌐 Browser: ${browser || 'Unknown'}<br>
        🖥️ OS: ${os || 'Unknown'}<br>
        📍 Location: ${location || 'Unknown'}
      </div>

      <p><strong>এটি কি আপনি ছিলেন?</strong></p>

      <a href="${process.env.CLIENT_URL}/devices" class="button">My Devices দেখুন</a>

      <p>যদি এটি আপনি না হন, অবিলম্বে পাসওয়ার্ড পরিবর্তন করুন এবং এই device টি block করুন।</p>
    </div>
  `;

  return baseTemplate(content, 'New Device Login - Street Bites');
};

module.exports = {
  welcomeEmail,
  otpEmail,
  passwordResetEmail,
  passwordChangedEmail,
  twoFactorSetupEmail,
  suspiciousLoginEmail,
  accountLockedEmail,
  newDeviceLoginEmail,
};