import React, { useState } from 'react';
import { Routes, Route, NavLink, Navigate } from 'react-router-dom';
import Navbar from '../Navbar';
import ExamSchedule from './ExamSchedule';
import ExamPreferences from './ExamPreferences';
import ExamCalendar from './ExamCalendar';
import HallPlanView from './HallPlanView';

const StaffDashboard = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Staff Dashboard</h1>
        </div>
        <div className="flex flex-col lg:flex-row gap-6">
          <nav className="lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-sm p-2 space-y-1">
              <NavLink 
                to="/staff/exams" 
                className={({ isActive }) => 
                  `block px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive 
                      ? 'bg-primary-600 text-white' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`
                }
              >
                My Exams
              </NavLink>
              <NavLink 
                to="/staff/preferences" 
                className={({ isActive }) => 
                  `block px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive 
                      ? 'bg-primary-600 text-white' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`
                }
              >
                Preferences
              </NavLink>
              <NavLink 
                to="/staff/calendar" 
                className={({ isActive }) => 
                  `block px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive 
                      ? 'bg-primary-600 text-white' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`
                }
              >
                Calendar
              </NavLink>
              <NavLink 
                to="/staff/hall-plan" 
                className={({ isActive }) => 
                  `block px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive 
                      ? 'bg-primary-600 text-white' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`
                }
              >
                Hall Plan & Seating
              </NavLink>
            </div>
          </nav>
          <div className="flex-1 min-w-0">
            <Routes>
              <Route path="exams" element={<ExamSchedule />} />
              <Route path="preferences" element={<ExamPreferences />} />
              <Route path="calendar" element={<ExamCalendar />} />
              <Route path="hall-plan" element={<HallPlanView />} />
              <Route path="/" element={<Navigate to="/staff/exams" replace />} />
            </Routes>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffDashboard;

