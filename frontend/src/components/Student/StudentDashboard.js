import React from 'react';
import { Routes, Route, NavLink, Navigate } from 'react-router-dom';
import Navbar from '../Navbar';
import ExamTimetable from './ExamTimetable';

const StudentDashboard = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Student Dashboard</h1>
        </div>
        <div className="flex flex-col lg:flex-row gap-6">
          <nav className="lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-sm p-2 space-y-1">
              <NavLink 
                to="/student/timetable" 
                className={({ isActive }) => 
                  `block px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive 
                      ? 'bg-primary-600 text-white' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`
                }
              >
                Exam Timetable
              </NavLink>
            </div>
          </nav>
          <div className="flex-1 min-w-0">
            <Routes>
              <Route path="timetable" element={<ExamTimetable />} />
              <Route path="/" element={<Navigate to="/student/timetable" replace />} />
            </Routes>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;

