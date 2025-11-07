# Deployment Guide for Render.com

This guide will help you deploy the Exam Schedule Management System to Render.com.

## Prerequisites

1. **MongoDB Database**: You'll need a MongoDB instance. Options:
   - MongoDB Atlas (free tier available): https://www.mongodb.com/cloud/atlas
   - Render.com MongoDB (if available in your plan)

2. **Firebase Project**: Already set up with service account key

3. **GitHub Repository**: Push your code to GitHub

## Step 1: Prepare MongoDB

1. Create a MongoDB Atlas account or use Render's MongoDB
2. Create a database cluster
3. Get your connection string (e.g., `mongodb+srv://username:password@cluster.mongodb.net/exam_schedule_db`)
4. Whitelist Render.com IPs (or use 0.0.0.0/0 for all IPs - less secure but easier)

## Step 2: Deploy Backend to Render.com

1. **Create a new Web Service** on Render.com:
   - Connect your GitHub repository
   - Select the repository
   - Choose "Web Service"

2. **Configure Backend Service**:
   - **Name**: `exam-schedule-backend` (or your preferred name)
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Choose based on your needs (Free tier available)

3. **Set Environment Variables** in Render Dashboard:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/exam_schedule_db
   JWT_SECRET=your-very-secure-random-secret-key-here
   ALLOWED_DOMAIN=psnacet.edu.in
   PORT=10000
   NODE_ENV=production
   
   # Email configuration (optional but recommended)
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-specific-password
   
   # Staff per hall (optional, defaults to 1)
   STAFF_PER_HALL=1
   
   # Firebase Admin SDK (if using Firebase)
   # You'll need to upload serviceAccountKey.json or use environment variables
   ```

4. **Upload Firebase Service Account Key**:
   - Option 1: Upload `serviceAccountKey.json` via Render's file upload (if available)
   - Option 2: Convert JSON to environment variables (see Firebase setup section)

5. **Deploy**: Click "Create Web Service"

6. **Note the Backend URL**: Render will provide a URL like `https://exam-schedule-backend.onrender.com`

## Step 3: Deploy Frontend to Render.com

1. **Create a new Static Site** on Render.com:
   - Connect your GitHub repository
   - Select the repository
   - Choose "Static Site"

2. **Configure Frontend Service**:
   - **Name**: `exam-schedule-frontend` (or your preferred name)
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `build`
   - **Environment**: `Node`

3. **Set Environment Variables** in Render Dashboard:
   ```
   REACT_APP_API_URL=https://exam-schedule-backend.onrender.com/api
   REACT_APP_FIREBASE_API_KEY=your-firebase-api-key
   REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   REACT_APP_FIREBASE_PROJECT_ID=your-project-id
   REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
   REACT_APP_FIREBASE_APP_ID=your-app-id
   ```

4. **Deploy**: Click "Create Static Site"

## Step 4: Post-Deployment Setup

### Create Admin Account

After backend is deployed, you can create the admin account using Render's Shell:

1. Go to your backend service on Render
2. Click "Shell" tab
3. Run:
   ```bash
   npm run create-admin
   ```
   Or with custom credentials:
   ```bash
   npm run create-admin your-email@example.com YourPassword123 Admin Name
   ```

### Update Firebase Authorized Domains

1. Go to Firebase Console → Authentication → Settings
2. Add your Render frontend domain to "Authorized domains"
   - Example: `exam-schedule-frontend.onrender.com`

### Update CORS (if needed)

The backend already has CORS enabled, but if you encounter CORS issues:

1. Check `backend/server.js` - CORS should allow all origins in development
2. For production, you may want to restrict to your frontend domain

## Step 5: Verify Deployment

1. **Test Backend Health**:
   - Visit: `https://your-backend-url.onrender.com/api/health`
   - Should return: `{"status":"OK","message":"Server is running"}`

2. **Test Frontend**:
   - Visit your frontend URL
   - Try logging in with admin credentials

3. **Test API Connection**:
   - Open browser console on frontend
   - Check for any API connection errors

## Troubleshooting

### Backend Issues

- **MongoDB Connection Failed**: 
  - Check MONGODB_URI is correct
  - Verify IP whitelist in MongoDB Atlas
  - Check MongoDB connection string format

- **Port Issues**:
  - Render provides PORT via environment variable
  - Backend should use `process.env.PORT || 5000`

- **Firebase Admin SDK Error**:
  - Ensure serviceAccountKey.json is uploaded or environment variables are set
  - Check Firebase project ID matches

### Frontend Issues

- **API Connection Failed**:
  - Verify REACT_APP_API_URL points to your backend URL
  - Check CORS settings on backend
  - Ensure backend is running

- **Build Failures**:
  - Check Node version compatibility
  - Review build logs in Render dashboard

### Common Render.com Issues

- **Free Tier Limitations**:
  - Services spin down after 15 minutes of inactivity
  - First request after spin-down may take 30-60 seconds
  - Consider upgrading to paid plan for always-on service

- **Environment Variables**:
  - Changes require redeployment
  - Double-check variable names (case-sensitive)

## Environment Variables Summary

### Backend (.env)
```
MONGODB_URI=your-mongodb-connection-string
JWT_SECRET=your-secret-key
ALLOWED_DOMAIN=psnacet.edu.in
PORT=10000
NODE_ENV=production
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
STAFF_PER_HALL=1
```

### Frontend (.env)
```
REACT_APP_API_URL=https://your-backend-url.onrender.com/api
REACT_APP_FIREBASE_API_KEY=your-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-domain
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
REACT_APP_FIREBASE_APP_ID=your-app-id
```

## Additional Notes

- **Database Indexes**: Run `npm run fix-staff-pref-indexes` after first deployment if needed
- **SSL/HTTPS**: Render provides SSL certificates automatically
- **Custom Domain**: You can add custom domains in Render dashboard
- **Logs**: Check Render dashboard logs for debugging

## Support

If you encounter issues:
1. Check Render service logs
2. Verify all environment variables are set
3. Test backend health endpoint
4. Check MongoDB connection
5. Verify Firebase configuration

