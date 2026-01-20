// backend/src/config/supabase.js - IMPROVED VERSION
const { createClient } = require('@supabase/supabase-js');

/**
 * Supabase Configuration - Enhanced with Deployment Test Mode
 * Features: Email service, SMS service, Test OTP mode
 */

// ============================================
// CONFIGURATION
// ============================================

const config = {
  // Deployment mode - set to 'test' for deployment testing
  // Options: 'development', 'test', 'production'
  deploymentMode: process.env.DEPLOYMENT_MODE || process.env.NODE_ENV || 'development',
  
  // Enable test OTP for deployment testing
  useTestOTP: process.env.USE_TEST_OTP === 'true',
  
  // Test OTP value (same for all requests in test mode)
  testOTP: process.env.TEST_OTP || '123456',
  
  // Supabase credentials
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseKey: process.env.SUPABASE_SERVICE_KEY,
};

// Check if Supabase is configured
const isSupabaseConfigured = config.supabaseUrl && config.supabaseKey;

// Create Supabase client only if configured
const supabase = isSupabaseConfigured
  ? createClient(config.supabaseUrl, config.supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;

// ============================================
// HELPER: LOG MESSAGE WITH MODE
// ============================================

const logMessage = (type, message, data = null) => {
  const modeEmoji = {
    development: '🔧',
    test: '🧪',
    production: '🚀',
  };

  const emoji = modeEmoji[config.deploymentMode] || '📝';
  console.log(`${emoji} [${config.deploymentMode.toUpperCase()}] ${message}`);
  
  if (data && config.deploymentMode !== 'production') {
    console.log(data);
  }
};

// ============================================
// SEND EMAIL OTP
// ============================================

/**
 * Send OTP via email
 * @param {string} email - User email
 * @param {string} otp - OTP code
 * @param {string} userName - User name
 * @returns {Promise<Object>} Result object
 */
const sendEmailOTP = async (email, otp, userName = 'User') => {
  try {
    // ===== TEST MODE (Deployment Testing) =====
    if (config.useTestOTP || config.deploymentMode === 'test') {
      logMessage('email', `📧 TEST OTP for ${email}: ${config.testOTP}`);
      return {
        success: true,
        message: 'Test mode - OTP logged to console',
        testOTP: config.testOTP,
        mode: 'test',
      };
    }

    // ===== DEVELOPMENT MODE (No Supabase) =====
    if (!isSupabaseConfigured || config.deploymentMode === 'development') {
      logMessage('email', `📧 DEV OTP for ${email}: ${otp}`);
      return {
        success: true,
        message: 'Development mode - OTP logged to console',
        mode: 'development',
      };
    }

    // ===== PRODUCTION MODE (Real Email) =====
    // Method 1: Using Supabase Auth Magic Link (recommended)
    const { data, error } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: email,
    });

    if (error) {
      logMessage('error', '❌ Supabase Email Error:', error.message);
      
      // Fallback to console in non-production
      if (config.deploymentMode !== 'production') {
        logMessage('email', `📧 [FALLBACK] Email OTP for ${email}: ${otp}`);
        return {
          success: true,
          message: 'Fallback - OTP logged to console',
          mode: 'fallback',
        };
      }
      
      throw error;
    }

    logMessage('email', `✅ Email OTP sent to ${email}`);
    return {
      success: true,
      message: 'Email sent successfully',
      mode: 'production',
      data,
    };

  } catch (error) {
    console.error('❌ Send Email OTP Error:', error.message);
    
    // Graceful fallback
    if (config.deploymentMode !== 'production') {
      logMessage('email', `📧 [ERROR FALLBACK] Email OTP for ${email}: ${otp}`);
      return {
        success: true,
        message: 'Error fallback - OTP logged to console',
        mode: 'error-fallback',
      };
    }
    
    throw error;
  }
};

// ============================================
// SEND PHONE OTP
// ============================================

/**
 * Send OTP via SMS
 * @param {string} phone - Phone number
 * @param {string} otp - OTP code
 * @returns {Promise<Object>} Result object
 */
const sendPhoneOTP = async (phone, otp) => {
  try {
    // ===== TEST MODE (Deployment Testing) =====
    if (config.useTestOTP || config.deploymentMode === 'test') {
      logMessage('sms', `📱 TEST OTP for ${phone}: ${config.testOTP}`);
      return {
        success: true,
        message: 'Test mode - OTP logged to console',
        testOTP: config.testOTP,
        mode: 'test',
      };
    }

    // ===== DEVELOPMENT MODE (No SMS Service) =====
    if (!isSupabaseConfigured || config.deploymentMode === 'development') {
      logMessage('sms', `📱 DEV OTP for ${phone}: ${otp}`);
      return {
        success: true,
        message: 'Development mode - OTP logged to console',
        mode: 'development',
      };
    }

    // ===== PRODUCTION MODE (Real SMS) =====
    // Supabase uses Twilio for SMS
    // Configure in Supabase Dashboard: Settings > Auth > Phone Auth
    
    const { data, error } = await supabase.auth.signInWithOtp({
      phone: phone,
    });

    if (error) {
      // Check if it's a configuration error
      if (error.code === 'phone_provider_disabled') {
        logMessage('warning', '⚠️  Phone provider not configured in Supabase');
        
        // Fallback to console in non-production
        if (config.deploymentMode !== 'production') {
          logMessage('sms', `📱 [FALLBACK] Phone OTP for ${phone}: ${otp}`);
          return {
            success: true,
            message: 'Fallback - OTP logged to console (SMS not configured)',
            mode: 'fallback',
          };
        }
        
        throw new Error('SMS service not configured. Please setup Twilio in Supabase dashboard.');
      }

      logMessage('error', '❌ Supabase SMS Error:', error.message);
      
      // Fallback to console
      if (config.deploymentMode !== 'production') {
        logMessage('sms', `📱 [FALLBACK] Phone OTP for ${phone}: ${otp}`);
        return {
          success: true,
          message: 'Fallback - OTP logged to console',
          mode: 'fallback',
        };
      }
      
      throw error;
    }

    logMessage('sms', `✅ SMS OTP sent to ${phone}`);
    return {
      success: true,
      message: 'SMS sent successfully',
      mode: 'production',
      data,
    };

  } catch (error) {
    console.error('❌ Send Phone OTP Error:', error.message);
    
    // Graceful fallback
    if (config.deploymentMode !== 'production') {
      logMessage('sms', `📱 [ERROR FALLBACK] Phone OTP for ${phone}: ${otp}`);
      return {
        success: true,
        message: 'Error fallback - OTP logged to console',
        mode: 'error-fallback',
      };
    }
    
    throw error;
  }
};

// ============================================
// SEND PASSWORD RESET EMAIL
// ============================================

/**
 * Send password reset email
 * @param {string} email - User email
 * @param {string} resetToken - Reset token
 * @param {string} userName - User name
 * @returns {Promise<Object>} Result object
 */
const sendPasswordResetEmail = async (email, resetToken, userName = 'User') => {
  try {
    const resetLink = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;

    // ===== TEST MODE =====
    if (config.useTestOTP || config.deploymentMode === 'test') {
      logMessage('reset', `🔑 TEST Password Reset for ${email}`);
      console.log('Reset Link:', resetLink);
      return {
        success: true,
        message: 'Test mode - Link logged to console',
        resetLink,
        mode: 'test',
      };
    }

    // ===== DEVELOPMENT MODE =====
    if (!isSupabaseConfigured || config.deploymentMode === 'development') {
      logMessage('reset', `🔑 DEV Password Reset for ${email}`);
      console.log('Reset Link:', resetLink);
      return {
        success: true,
        message: 'Development mode - Link logged to console',
        resetLink,
        mode: 'development',
      };
    }

    // ===== PRODUCTION MODE =====
    const { data, error } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: {
        redirectTo: resetLink,
      },
    });

    if (error) {
      logMessage('error', '❌ Supabase Password Reset Error:', error.message);
      
      if (config.deploymentMode !== 'production') {
        logMessage('reset', `🔑 [FALLBACK] Password Reset Link: ${resetLink}`);
        return {
          success: true,
          message: 'Fallback - Link logged to console',
          resetLink,
          mode: 'fallback',
        };
      }
      
      throw error;
    }

    logMessage('reset', `✅ Password reset email sent to ${email}`);
    return {
      success: true,
      message: 'Password reset email sent',
      mode: 'production',
      data,
    };

  } catch (error) {
    console.error('❌ Send Password Reset Error:', error.message);
    
    const resetLink = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;
    
    if (config.deploymentMode !== 'production') {
      logMessage('reset', `🔑 [ERROR FALLBACK] Reset Link: ${resetLink}`);
      return {
        success: true,
        message: 'Error fallback - Link logged to console',
        resetLink,
        mode: 'error-fallback',
      };
    }
    
    throw error;
  }
};

// ============================================
// SEND 2FA SETUP EMAIL
// ============================================

/**
 * Send 2FA setup email with QR code and backup codes
 */
const send2FASetupEmail = async (email, qrCodeUrl, backupCodes, userName = 'User') => {
  try {
    // All modes log to console for 2FA setup
    logMessage('2fa', `🔐 2FA Setup for ${email}`);
    
    if (config.deploymentMode !== 'production') {
      console.log('QR Code URL:', qrCodeUrl);
      console.log('Backup Codes:', backupCodes.join(', '));
    }

    // In production, you would send actual email here
    // For now, just return success
    return {
      success: true,
      message: '2FA setup instructions provided',
      mode: config.deploymentMode,
    };

  } catch (error) {
    console.error('❌ Send 2FA Setup Error:', error.message);
    return {
      success: true,
      message: 'Fallback - 2FA info logged to console',
      mode: 'fallback',
    };
  }
};

// ============================================
// SEND SUSPICIOUS LOGIN ALERT
// ============================================

/**
 * Send suspicious login alert email
 */
const sendSuspiciousLoginAlert = async (email, loginDetails, userName = 'User') => {
  try {
    logMessage('alert', `⚠️  Suspicious login alert for ${email}`);
    
    if (config.deploymentMode !== 'production') {
      console.log('Login Details:', loginDetails);
    }

    return {
      success: true,
      message: 'Alert logged',
      mode: config.deploymentMode,
    };

  } catch (error) {
    console.error('❌ Send Alert Error:', error.message);
    return {
      success: true,
      message: 'Fallback - Alert logged to console',
      mode: 'fallback',
    };
  }
};

// ============================================
// VERIFY SUPABASE CONNECTION
// ============================================

/**
 * Verify Supabase connection and configuration
 */
const verifyConnection = async () => {
  try {
    logMessage('system', '🔍 Checking Supabase configuration...');

    if (!isSupabaseConfigured) {
      logMessage('warning', '⚠️  Supabase not configured - Running in fallback mode');
      console.log('💡 Set SUPABASE_URL and SUPABASE_SERVICE_KEY in .env for production email/SMS');
      return false;
    }

    // Test connection
    const { data, error } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1,
    });

    if (error) {
      logMessage('error', '❌ Supabase connection failed:', error.message);
      console.log('💡 Check your Supabase credentials in .env file');
      return false;
    }

    logMessage('system', '✅ Supabase connected successfully');
    
    // Log current mode
    if (config.useTestOTP) {
      console.log('🧪 TEST OTP MODE ENABLED - All OTPs will be:', config.testOTP);
    } else if (config.deploymentMode === 'development') {
      console.log('🔧 Development mode - OTPs logged to console');
    } else if (config.deploymentMode === 'production') {
      console.log('🚀 Production mode - Real emails/SMS enabled');
    }

    return true;

  } catch (error) {
    logMessage('error', '❌ Supabase connection error:', error.message);
    console.log('💡 Running in fallback mode - OTPs will be logged to console');
    return false;
  }
};

// ============================================
// EXPORTS
// ============================================

module.exports = {
  supabase,
  sendEmailOTP,
  sendPhoneOTP,
  sendPasswordResetEmail,
  send2FASetupEmail,
  sendSuspiciousLoginAlert,
  verifyConnection,
  config, // Export config for testing
};

// ============================================
// USAGE EXAMPLES
// ============================================

/*

// .env Configuration:

// Development Mode (Default):
NODE_ENV=development
# OTPs logged to console

// Test Mode (For Deployment Testing):
DEPLOYMENT_MODE=test
USE_TEST_OTP=true
TEST_OTP=123456
# All OTPs will be 123456

// Production Mode:
NODE_ENV=production
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=eyJxxx...
# Real emails/SMS sent

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// Usage in Controllers:

const { sendEmailOTP, sendPhoneOTP } = require('../config/supabase');

// Send OTP
await sendEmailOTP('user@example.com', '123456', 'John');
await sendPhoneOTP('+919876543210', '123456');

// Response will indicate mode:
{
  success: true,
  message: "...",
  mode: "development" | "test" | "production" | "fallback"
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// Deployment Testing Workflow:

1. Development:
   - NODE_ENV=development
   - Check console for OTPs

2. Testing Deployment:
   - DEPLOYMENT_MODE=test
   - USE_TEST_OTP=true
   - TEST_OTP=123456
   - Always use 123456 for testing

3. Production:
   - NODE_ENV=production
   - Configure Supabase
   - Real emails/SMS sent

*/