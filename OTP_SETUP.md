# OTP Email Setup Guide

## Problem: "Failed to send OTP" Error

This error occurs when SMTP (email) configuration is missing or incorrect.

## Solution Options

### Option 1: Configure SMTP (Recommended for Production)

#### For Gmail:

1. **Enable 2-Factor Authentication** on your Gmail account
   - Go to: https://myaccount.google.com/security
   - Enable 2-Step Verification

2. **Generate App Password**
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" and "Other (Custom name)"
   - Enter name: "Exam Schedule System"
   - Click "Generate"
   - Copy the 16-character password (no spaces)

3. **Update `backend/.env` file:**
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=selvankalai4114@gmail.com
   SMTP_PASS=fecj favz uujj ezbc
   ```

4. **Restart backend server:**
   ```bash
   cd backend
   npm run dev
   ```

#### For Other Email Providers:

**Outlook/Hotmail:**
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-password
```

**Yahoo:**
```env
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=587
SMTP_USER=your-email@yahoo.com
SMTP_PASS=your-app-password
```

**Custom SMTP:**
```env
SMTP_HOST=your-smtp-server.com
SMTP_PORT=587
SMTP_USER=your-email@domain.com
SMTP_PASS=your-password
```

### Option 2: Development Mode (No Email Setup Required)

If you don't want to configure email right now, the system will:
- ✅ Generate OTP successfully
- ✅ Store OTP in database
- ✅ Log OTP to console (check backend terminal)
- ⚠️  Not send actual email

**To use OTP:**
1. Try to sign up
2. Check the **backend terminal/console** where you ran `npm run dev`
3. Look for a message like:
   ```
   ═══════════════════════════════════════════════════════
   📧 OTP EMAIL (Development Mode - SMTP not configured)
   ═══════════════════════════════════════════════════════
   To: your-email@psnacet.edu.in
   OTP: 123456
   ═══════════════════════════════════════════════════════
   ```
4. Use that OTP to verify your account

### Option 3: Use Firebase Email Sending (Advanced)

If you want to use Firebase for sending emails, you can:
1. Set up Firebase Cloud Functions
2. Install Firebase Extensions (Trigger Email)
3. Update the code to use Firebase email service

## Quick Test

After configuring SMTP:

1. **Check backend terminal** for any SMTP errors
2. **Try signing up** with a test email
3. **Check your email inbox** (and spam folder)
4. **Check backend console** if email fails (OTP will be logged there)

## Troubleshooting

### "Invalid login credentials" error
- ❌ Wrong email or password
- ✅ Use App Password for Gmail (not regular password)
- ✅ Check SMTP_USER matches your email

### "Connection timeout" error
- ❌ Firewall blocking port 587
- ❌ Wrong SMTP_HOST
- ✅ Try port 465 with `secure: true`

### "Authentication failed" error
- ❌ Wrong password
- ❌ 2FA not enabled (for Gmail)
- ✅ Use App Password, not regular password

### Email not received
- Check spam/junk folder
- Verify email address is correct
- Check backend console for errors
- In development mode, OTP is logged to console

## Current Status

The system is configured to:
- ✅ **Work in development mode** (OTP logged to console)
- ✅ **Send emails when SMTP is configured**
- ✅ **Show helpful error messages**

## Next Steps

1. **For Development:** Use Option 2 (check console for OTP)
2. **For Production:** Configure SMTP using Option 1
3. **Test:** Try signing up and check where OTP appears

