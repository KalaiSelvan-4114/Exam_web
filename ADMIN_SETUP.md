# Admin Account Setup Guide

## How to Create Admin (Exam Coordinator) Account

The admin account (Exam Coordinator) has full access to manage users, exams, departments, and view all reports. Follow these steps to create the first admin account.

### Method 1: Using the Setup Script (Recommended)

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Make sure MongoDB is running** and your `.env` file is configured.

3. **Run the admin creation script:**
   ```bash
   npm run create-admin
   ```

   This will create an admin with:
   - **Email**: `selvankalai5654@gmail.com`
   - **Password**: `admin123` (default)
   - **Role**: `exam_coordinator`

4. **Or specify custom credentials:**
   ```bash
   npm run create-admin selvankalai5654@gmail.com YourPassword123 Admin Name
   ```

### Method 2: Using Environment Variables

1. **Add to your `backend/.env` file:**
   ```env
   ADMIN_EMAIL=selvankalai5654@gmail.com
   ADMIN_PASSWORD=YourSecurePassword123
   ADMIN_NAME=Admin User
   ```

2. **Run the script:**
   ```bash
   npm run create-admin
   ```

### Method 3: Direct Signup (If enabled)

If you've enabled `exam_coordinator` role in signup, you can sign up directly at:
- Go to: http://localhost:3000/signup
- Use email: `selvankalai5654@gmail.com`
- Select role: `Exam Coordinator` (if available in dropdown)

**Note:** By default, the signup form only allows `student`, `staff`, and `department_coordinator` roles for security reasons.

## Login as Admin

After creating the admin account:

1. **Go to the login page:**
   ```
   http://localhost:3000/login
   ```

2. **Enter credentials:**
   - Email: `selvankalai5654@gmail.com`
   - Password: `admin123` (or the password you set)

3. **You'll be redirected to the Exam Coordinator Dashboard** with full admin privileges.

## Admin Features

Once logged in as Exam Coordinator, you can:

- ✅ Create and manage exam schedules
- ✅ Create and manage user accounts (change roles, activate/deactivate)
- ✅ Create and manage departments
- ✅ View all hall allocations and schedules
- ✅ Generate comprehensive reports and summaries
- ✅ Assign halls to departments
- ✅ Manage all system data

## Important Security Notes

⚠️ **Change the default password immediately after first login!**

1. After logging in, go to User Management
2. Find your admin account
3. Update the password (you may need to implement a password change feature, or update it directly in the database)

## Troubleshooting

### "Admin user already exists" error
- The admin account is already created
- Try logging in with the existing credentials
- To reset, delete the user from MongoDB and run the script again

### "MongoDB connection error"
- Make sure MongoDB is running
- Check your `MONGODB_URI` in `.env` file
- Verify MongoDB connection string is correct

### "Email domain restriction" error
- The script bypasses domain restrictions for admin creation
- If you see this error, check the script is running correctly

## Quick Commands

```bash
# Create admin with default credentials
cd backend
npm run create-admin

# Create admin with custom email and password
npm run create-admin selvankalai5654@gmail.com MyPassword123 Admin Name
```

