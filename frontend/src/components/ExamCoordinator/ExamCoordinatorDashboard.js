import React, { useState } from 'react';
import { Routes, Route, NavLink, Navigate } from 'react-router-dom';
import Navbar from '../Navbar';
import ExamList from './ExamList';
import CreateExam from './CreateExam';
import UserManagement from './UserManagement';
import DepartmentManagement from './DepartmentManagement';
import HallAllocations from './HallAllocations';
import ScheduleSummary from './ScheduleSummary';

const ExamCoordinatorDashboard = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Exam Coordinator Dashboard</h1>
        </div>
        <div className="flex flex-col lg:flex-row gap-6">
          <nav className="lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-sm p-2 space-y-1">
              <NavLink 
                to="/exam-coordinator/exams" 
                className={({ isActive }) => 
                  `block px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive 
                      ? 'bg-primary-600 text-white' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`
                }
              >
                Exams
              </NavLink>
              <NavLink 
                to="/exam-coordinator/create-exam" 
                className={({ isActive }) => 
                  `block px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive 
                      ? 'bg-primary-600 text-white' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`
                }
              >
                Create Exam
              </NavLink>
              <NavLink 
                to="/exam-coordinator/users" 
                className={({ isActive }) => 
                  `block px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive 
                      ? 'bg-primary-600 text-white' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`
                }
              >
                Users
              </NavLink>
              <NavLink 
                to="/exam-coordinator/departments" 
                className={({ isActive }) => 
                  `block px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive 
                      ? 'bg-primary-600 text-white' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`
                }
              >
                Departments
              </NavLink>
              <NavLink 
                to="/exam-coordinator/hall-allocations" 
                className={({ isActive }) => 
                  `block px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive 
                      ? 'bg-primary-600 text-white' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`
                }
              >
                Hall Allocations
              </NavLink>
              <NavLink 
                to="/exam-coordinator/summary" 
                className={({ isActive }) => 
                  `block px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive 
                      ? 'bg-primary-600 text-white' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`
                }
              >
                Summary
              </NavLink>
            </div>
          </nav>
          <div className="flex-1 min-w-0">
            <Routes>
              <Route path="exams" element={<ExamList />} />
              <Route path="create-exam" element={<CreateExam />} />
              <Route path="users" element={<UserManagement />} />
              <Route path="departments" element={<DepartmentManagement />} />
              <Route path="hall-allocations" element={<HallAllocations />} />
              <Route path="summary" element={<ScheduleSummary />} />
              <Route path="/" element={<Navigate to="/exam-coordinator/exams" replace />} />
            </Routes>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamCoordinatorDashboard;

