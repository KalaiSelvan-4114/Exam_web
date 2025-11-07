# Exam Schedule Management System

A comprehensive web application for managing exam schedules, hall allocations, and user roles in an educational institution.

## Features

### User Roles

1. **Exam Coordinator**
   - Create and manage exam schedules
   - Assign halls to departments or staff
   - Create and manage user accounts
   - View all hall allocations and schedules
   - Generate reports and summaries

2. **Department Coordinator**
   - Create and manage halls (capacity, location, etc.)
   - Assign halls to exams
   - Add and manage subjects under their department
   - Send hall plan & report

3. **Staff**
   - View exam schedules assigned to them
   - Book hall invigilation preferences
   - Confirm or reject hall duties
   - View upcoming exam duty calendar

4. **Students**
   - View their exam timetable (subject, date, time)
   - View hall number and location
   - Access read-only data

## Tech Stack

- **Frontend**: React.js
- **Backend**: Node.js + Express.js
- **Database**: MongoDB (via Mongoose)
- **Authentication**: Firebase Authentication
  - Google Sign-In (restricted to college domain, e.g., @psnacet.edu.in)
  - Email/Password with OTP verification

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or MongoDB Atlas)
- Firebase project (see [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) for detailed setup)
- Email service for OTP (Gmail or other SMTP service)

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up Firebase (see [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) for detailed instructions):
   - Download Firebase service account key and save as `serviceAccountKey.json` in the backend folder
   - Or set `FIREBASE_SERVICE_ACCOUNT` environment variable with the JSON content

4. Create a `.env` file in the backend directory:
   ```env
   MONGODB_URI=mongodb://localhost:27017/exam_schedule_db
   JWT_SECRET=your-secret-key-change-this-in-production
   ALLOWED_DOMAIN=psnacet.edu.in
   PORT=5000
   
   # Email configuration for OTP
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-specific-password
   ```

5. Start the backend server:
   ```bash
   npm run dev
   ```

   The server will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the frontend directory:
   ```env
   REACT_APP_API_URL=http://localhost:5000/api
   REACT_APP_FIREBASE_API_KEY=your-firebase-api-key
   REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   REACT_APP_FIREBASE_PROJECT_ID=your-project-id
   REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
   REACT_APP_FIREBASE_APP_ID=your-app-id
   ```

5. Start the frontend development server:
   ```bash
   npm start
   ```

   The application will open in your browser at `http://localhost:3000`

### Firebase Setup

Please refer to [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) for detailed Firebase setup instructions.

Quick steps:
1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Email/Password and Google authentication
3. Download service account key and place it in `backend/serviceAccountKey.json`
4. Copy Firebase config to frontend `.env` file
5. Configure Google OAuth in Firebase Console

## Project Structure

```
Exam_Web/
├── backend/
│   ├── middleware/
│   │   ├── auth.js
│   │   └── googleAuth.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Exam.js
│   │   ├── Hall.js
│   │   ├── Department.js
│   │   ├── Subject.js
│   │   ├── StaffPreference.js
│   │   └── StudentExam.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── users.js
│   │   ├── exams.js
│   │   ├── halls.js
│   │   ├── departments.js
│   │   ├── subjects.js
│   │   ├── staff.js
│   │   └── reports.js
│   ├── server.js
│   └── package.json
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   ├── ExamCoordinator/
│   │   │   ├── DepartmentCoordinator/
│   │   │   ├── Staff/
│   │   │   ├── Student/
│   │   │   ├── Login.js
│   │   │   ├── Dashboard.js
│   │   │   └── Navbar.js
│   │   ├── context/
│   │   │   └── AuthContext.js
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── App.js
│   │   ├── App.css
│   │   ├── index.js
│   │   └── index.css
│   └── package.json
└── README.md
```

## API Endpoints

### Authentication
- `POST /api/auth/google` - Google Sign-In
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout

### Exams
- `GET /api/exams` - Get all exams (filtered by role)
- `GET /api/exams/:id` - Get exam by ID
- `POST /api/exams` - Create exam (Exam Coordinator only)
- `PUT /api/exams/:id` - Update exam (Exam Coordinator only)
- `DELETE /api/exams/:id` - Delete exam (Exam Coordinator only)

### Users
- `GET /api/users` - Get all users (Exam Coordinator only)
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create user (Exam Coordinator only)
- `PUT /api/users/:id` - Update user (Exam Coordinator only)
- `DELETE /api/users/:id` - Delete user (Exam Coordinator only)

### Halls
- `GET /api/halls` - Get all halls
- `GET /api/halls/:id` - Get hall by ID
- `POST /api/halls` - Create hall (Department Coordinator only)
- `PUT /api/halls/:id` - Update hall (Department Coordinator only)
- `DELETE /api/halls/:id` - Delete hall (Department Coordinator only)

### Departments
- `GET /api/departments` - Get all departments
- `GET /api/departments/:id` - Get department by ID
- `POST /api/departments` - Create department (Exam Coordinator only)
- `PUT /api/departments/:id` - Update department (Exam Coordinator only)
- `DELETE /api/departments/:id` - Delete department (Exam Coordinator only)

### Subjects
- `GET /api/subjects` - Get all subjects
- `GET /api/subjects/:id` - Get subject by ID
- `POST /api/subjects` - Create subject (Department Coordinator only)
- `PUT /api/subjects/:id` - Update subject (Department Coordinator only)
- `DELETE /api/subjects/:id` - Delete subject (Department Coordinator only)

### Staff
- `GET /api/staff/exams` - Get staff's assigned exams
- `GET /api/staff/preferences` - Get staff's exam preferences
- `POST /api/staff/preferences` - Set preference for an exam
- `PUT /api/staff/exams/:examId/confirm` - Confirm or reject exam duty
- `GET /api/staff/calendar` - Get upcoming exam duties calendar

### Reports
- `GET /api/reports/hall-allocation` - Get hall allocation report (Department Coordinator)
- `GET /api/reports/all-hall-allocations` - Get all hall allocations (Exam Coordinator)
- `GET /api/reports/schedule-summary` - Get exam schedule summary

## Deployment

### Backend Deployment (Render/Railway)

1. Push your code to GitHub
2. Connect your repository to Render or Railway
3. Set environment variables in the platform
4. Deploy the backend

### Frontend Deployment (Firebase Hosting/Vercel)

1. Build the frontend:
   ```bash
   cd frontend
   npm run build
   ```

2. Deploy to Firebase Hosting or Vercel
3. Update the `REACT_APP_API_URL` to point to your deployed backend

## License

This project is licensed under the ISC License.

