# Firebase Setup Guide

This guide will help you set up Firebase Authentication for Google Sign-In and OTP generation.

## Prerequisites

1. A Firebase project (create one at https://console.firebase.google.com/)
2. Node.js and npm installed

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or select an existing project
3. Follow the setup wizard

## Step 2: Enable Authentication

1. In Firebase Console, go to **Authentication**
2. Click **Get Started**
3. Enable **Email/Password** authentication
4. Enable **Google** authentication (add your OAuth client ID and secret)

## Step 3: Get Firebase Configuration

1. In Firebase Console, go to **Project Settings** (gear icon)
2. Scroll down to "Your apps" section
3. Click the web icon (`</>`) to add a web app
4. Register your app and copy the Firebase configuration

## Step 4: Backend Setup

### Get Service Account Key

1. In Firebase Console, go to **Project Settings**
2. Go to **Service Accounts** tab
3. Click **Generate New Private Key**
4. Download the JSON file and save it as `serviceAccountKey.json` in the `backend` folder

**⚠️ Important:** Never commit this file to version control!

### Update Backend Environment Variables

Add to `backend/.env`:

```env
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}  # Optional: Paste entire JSON here instead of using file
```

Or simply place `serviceAccountKey.json` in the `backend` folder.

## Step 5: Frontend Setup

Create `frontend/.env` file:

```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_FIREBASE_API_KEY=your-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
REACT_APP_FIREBASE_APP_ID=your-app-id
```

Replace the values with your Firebase configuration from Step 3.

## Step 6: Configure Allowed Domains

Update `backend/.env`:

```env
ALLOWED_DOMAIN=psnacet.edu.in
```

This restricts authentication to emails from your college domain.

## Step 7: Install Dependencies

### Backend
```bash
cd backend
npm install
```

### Frontend
```bash
cd frontend
npm install
```

## Step 8: Configure Authorized Domains

**IMPORTANT:** This step is required to fix the "unauthorized-domain" error!

1. In Firebase Console, go to **Authentication** > **Settings** (gear icon)
2. Scroll down to **Authorized domains** section
3. Click **Add domain** and add:
   - `localhost` (for development)
   - `127.0.0.1` (alternative localhost)
   - Your production domain (when deploying)
4. Save changes (takes effect immediately)

## Step 9: Configure Google OAuth (for Google Sign-In)

1. In Firebase Console, go to **Authentication** > **Sign-in method**
2. Click on **Google** provider
3. Enable it
4. Add your OAuth 2.0 Client ID and Secret (from Google Cloud Console)
5. The authorized domains from Step 8 will apply here too

## Step 9: OTP Email Configuration

The OTP system uses nodemailer to send emails. Configure in `backend/.env`:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-specific-password
```

**Note:** For Gmail, you need to:
1. Enable 2-factor authentication
2. Generate an App Password (not your regular password)
3. Use that App Password in `SMTP_PASS`

## Step 10: Test the Setup

1. Start the backend:
   ```bash
   cd backend
   npm run dev
   ```

2. Start the frontend:
   ```bash
   cd frontend
   npm start
   ```

3. Try signing up with an email ending in `@psnacet.edu.in`
4. Check your email for the OTP
5. Verify the OTP and complete signup
6. Try Google Sign-In

## Troubleshooting

### Firebase Admin SDK Error
- Make sure `serviceAccountKey.json` is in the `backend` folder
- Check that the service account has the correct permissions

### OTP Not Sending
- Verify SMTP credentials are correct
- Check email provider's security settings
- For Gmail, ensure App Password is used (not regular password)

### Google Sign-In Not Working
- Verify Google provider is enabled in Firebase Console
- Check OAuth credentials are correct
- Ensure authorized domains are configured

### Email Domain Restriction
- Update `ALLOWED_DOMAIN` in `backend/.env`
- Restart the backend server after changes

## Security Notes

1. **Never commit** `serviceAccountKey.json` to version control
2. Use environment variables for sensitive data
3. Keep Firebase API keys in frontend `.env` (they're safe for client-side use)
4. Service account keys should only be on the backend
5. Use strong passwords for email accounts used for OTP sending

## Production Deployment

1. Set environment variables in your hosting platform (Render, Railway, etc.)
2. Upload `serviceAccountKey.json` securely or use environment variable
3. Update Firebase authorized domains with your production URL
4. Configure CORS settings in Firebase
5. Use a production email service (SendGrid, AWS SES, etc.) instead of Gmail for OTP

