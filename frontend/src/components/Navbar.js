import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getDashboardLink = () => {
    if (!user) return '/dashboard';
    switch (user.role) {
      case 'exam_coordinator':
        return '/exam-coordinator';
      case 'department_coordinator':
        return '/department-coordinator';
      case 'staff':
        return '/staff';
      case 'student':
        return '/student';
      default:
        return '/dashboard';
    }
  };

  const getRoleLabel = (role) => {
    const labels = {
      exam_coordinator: 'Exam Coordinator',
      department_coordinator: 'Department Coordinator',
      staff: 'Staff',
      student: 'Student'
    };
    return labels[role] || role;
  };

  return (
    <nav className="bg-white shadow-md border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div 
            onClick={() => navigate(getDashboardLink())} 
            className="text-xl font-bold text-primary-600 cursor-pointer hover:text-primary-700 transition-colors"
          >
            Exam Schedule System
          </div>
          <div className="flex items-center gap-4">
            {user && (
              <>
                <span className="hidden sm:inline text-sm text-gray-700">
                  {user.name} <span className="text-gray-500">({getRoleLabel(user.role)})</span>
                </span>
                <button 
                  onClick={handleLogout} 
                  className="btn btn-outline text-sm px-3 py-1.5 sm:px-4 sm:py-2"
                >
                  Logout
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

