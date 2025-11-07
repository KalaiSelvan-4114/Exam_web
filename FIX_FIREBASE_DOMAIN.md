# Fix Firebase Unauthorized Domain Error

## Problem
You're seeing: `Firebase: Error (auth/unauthorized-domain)`

This happens when your domain (localhost or your production domain) isn't authorized in Firebase Console.

## Solution: Add Authorized Domains

### Step 1: Open Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project

### Step 2: Navigate to Authentication Settings

1. Click on **Authentication** in the left sidebar
2. Click on the **Settings** tab (gear icon at the top)
3. Scroll down to **Authorized domains**

### Step 3: Add Your Domains

Click **Add domain** and add these domains:

#### For Development:
- `localhost`
- `127.0.0.1`

#### For Production (when deploying):
- Your production domain (e.g., `yourdomain.com`)
- Your production subdomain (e.g., `www.yourdomain.com`)

### Step 4: Save Changes

After adding domains, they should appear in the list. Changes take effect immediately.

## Current Authorized Domains

By default, Firebase includes:
- ✅ `localhost` (should already be there)
- ✅ Your project's Firebase domain (e.g., `your-project.firebaseapp.com`)

## Quick Steps Summary

1. Firebase Console → Your Project
2. Authentication → Settings tab
3. Scroll to "Authorized domains"
4. Click "Add domain"
5. Enter: `localhost`
6. Click "Add"
7. If using 127.0.0.1, add that too
8. Save/Close

## Verify It's Working

After adding the domain:
1. Restart your frontend development server
2. Clear browser cache or use incognito mode
3. Try logging in again

## Additional Notes

- **localhost** should work for development
- For **production**, add your actual domain
- Firebase allows up to a certain number of authorized domains
- Changes are immediate (no need to wait)

## Troubleshooting

### Still seeing the error?

1. **Check the domain in the error message** - Make sure you're adding the exact domain shown
2. **Clear browser cache** - Sometimes cached config causes issues
3. **Restart dev server** - `npm start` in frontend
4. **Check Firebase project** - Make sure you're using the correct project
5. **Verify Firebase config** - Check `frontend/.env` has correct Firebase credentials

### For Production Deployments

If deploying to:
- **Vercel**: Add your Vercel domain (e.g., `your-app.vercel.app`)
- **Firebase Hosting**: Already authorized
- **Netlify**: Add your Netlify domain (e.g., `your-app.netlify.app`)
- **Custom Domain**: Add your custom domain

## Example Firebase Console Path

```
Firebase Console
  → Your Project
    → Authentication (left sidebar)
      → Settings tab (gear icon)
        → Authorized domains (scroll down)
          → Add domain button
```

After adding `localhost`, the error should be resolved!

