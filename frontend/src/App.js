import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/Login';
import ForgotPassword from './components/ForgotPassword';
import Signup from './components/Signup';
import Dashboard from './components/Dashboard';
import ExamCoordinatorDashboard from './components/ExamCoordinator/ExamCoordinatorDashboard';
import DepartmentCoordinatorDashboard from './components/DepartmentCoordinator/DepartmentCoordinatorDashboard';
import StaffDashboard from './components/Staff/StaffDashboard';
import StudentDashboard from './components/Student/StudentDashboard';

const PrivateRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600 mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/signup" element={<Signup />} />
            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/exam-coordinator/*"
              element={
                <PrivateRoute allowedRoles={['exam_coordinator']}>
                  <ExamCoordinatorDashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/department-coordinator/*"
              element={
                <PrivateRoute allowedRoles={['department_coordinator']}>
                  <DepartmentCoordinatorDashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/staff/*"
              element={
                <PrivateRoute allowedRoles={['staff']}>
                  <StaffDashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/student/*"
              element={
                <PrivateRoute allowedRoles={['student']}>
                  <StudentDashboard />
                </PrivateRoute>
              }
            />
            <Route path="/" element={<Navigate to="/login" />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;

