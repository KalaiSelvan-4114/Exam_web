# Render.com Deployment Checklist

## Pre-Deployment

- [ ] Code pushed to GitHub repository
- [ ] MongoDB Atlas account created (or Render MongoDB)
- [ ] MongoDB connection string ready
- [ ] Firebase project configured
- [ ] Firebase service account key available
- [ ] Gmail app password generated (for SMTP)

## Backend Deployment

- [ ] Create Web Service on Render.com
- [ ] Connect GitHub repository
- [ ] Set Root Directory: `backend`
- [ ] Set Build Command: `npm install`
- [ ] Set Start Command: `npm start`
- [ ] Add Environment Variables:
  - [ ] `MONGODB_URI`
  - [ ] `JWT_SECRET` (strong random string)
  - [ ] `ALLOWED_DOMAIN=psnacet.edu.in`
  - [ ] `NODE_ENV=production`
  - [ ] `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` (optional)
  - [ ] `STAFF_PER_HALL=1` (optional)
- [ ] Upload `serviceAccountKey.json` or set `FIREBASE_SERVICE_ACCOUNT` env var
- [ ] Deploy and note backend URL

## Frontend Deployment

- [ ] Create Static Site on Render.com
- [ ] Connect GitHub repository
- [ ] Set Root Directory: `frontend`
- [ ] Set Build Command: `npm install && npm run build`
- [ ] Set Publish Directory: `build`
- [ ] Add Environment Variables:
  - [ ] `REACT_APP_API_URL` (your backend URL + `/api`)
  - [ ] `REACT_APP_FIREBASE_API_KEY`
  - [ ] `REACT_APP_FIREBASE_AUTH_DOMAIN`
  - [ ] `REACT_APP_FIREBASE_PROJECT_ID`
  - [ ] `REACT_APP_FIREBASE_STORAGE_BUCKET`
  - [ ] `REACT_APP_FIREBASE_MESSAGING_SENDER_ID`
  - [ ] `REACT_APP_FIREBASE_APP_ID`
- [ ] Deploy and note frontend URL

## Post-Deployment

- [ ] Test backend health: `https://your-backend.onrender.com/api/health`
- [ ] Add frontend domain to Firebase Authorized Domains
- [ ] Create admin account via Render Shell:
  ```bash
  npm run create-admin
  ```
- [ ] Test login on frontend
- [ ] Verify API connection works
- [ ] Test exam creation flow
- [ ] Test hall assignment flow
- [ ] Test staff preference booking

## Troubleshooting

If issues occur:
- [ ] Check Render service logs
- [ ] Verify all environment variables are set correctly
- [ ] Test MongoDB connection
- [ ] Verify Firebase configuration
- [ ] Check CORS settings
- [ ] Verify backend URL in frontend env vars

## Quick Commands (Render Shell)

```bash
# Create admin
npm run create-admin

# Reset admin password
npm run reset-admin-password email@example.com NewPassword123

# Fix staff preference indexes (if needed)
npm run fix-staff-pref-indexes
```

