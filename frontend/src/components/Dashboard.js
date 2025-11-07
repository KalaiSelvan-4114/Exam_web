import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from './Navbar';

const Dashboard = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (user) {
        // Redirect based on role
        switch (user.role) {
          case 'exam_coordinator':
            navigate('/exam-coordinator', { replace: true });
            break;
          case 'department_coordinator':
            navigate('/department-coordinator', { replace: true });
            break;
          case 'staff':
            navigate('/staff', { replace: true });
            break;
          case 'student':
            navigate('/student', { replace: true });
            break;
          default:
            navigate('/login', { replace: true });
        }
      } else {
        // No user, redirect to login
        navigate('/login', { replace: true });
      }
    }
  }, [user, loading, navigate]);

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

  return (
    <div>
      <Navbar />
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600 mb-4"></div>
          <p className="text-gray-600">Redirecting...</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

