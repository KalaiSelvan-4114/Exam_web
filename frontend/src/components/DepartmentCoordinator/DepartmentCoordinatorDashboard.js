import React from 'react';
import { Routes, Route, NavLink, Navigate } from 'react-router-dom';
import Navbar from '../Navbar';
import HallManagement from './HallManagement';
import SubjectManagement from './SubjectManagement';
import AssignHallToExam from './AssignHallToExam';
import HallAllocationReport from './HallAllocationReport';
import HallPlanSeating from './HallPlanSeating';

const DepartmentCoordinatorDashboard = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Department Coordinator Dashboard</h1>
        </div>
        <div className="flex flex-col lg:flex-row gap-6">
          <nav className="lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-sm p-2 space-y-1">
              <NavLink 
                to="/department-coordinator/halls" 
                className={({ isActive }) => 
                  `block px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive 
                      ? 'bg-primary-600 text-white' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`
                }
              >
                Halls
              </NavLink>
              <NavLink 
                to="/department-coordinator/subjects" 
                className={({ isActive }) => 
                  `block px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive 
                      ? 'bg-primary-600 text-white' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`
                }
              >
                Subjects
              </NavLink>
              <NavLink 
                to="/department-coordinator/assign-hall" 
                className={({ isActive }) => 
                  `block px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive 
                      ? 'bg-primary-600 text-white' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`
                }
              >
                Assign Hall
              </NavLink>
              <NavLink 
                to="/department-coordinator/report" 
                className={({ isActive }) => 
                  `block px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive 
                      ? 'bg-primary-600 text-white' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`
                }
              >
                Hall Plan & Report
              </NavLink>
              <NavLink 
                to="/department-coordinator/seating" 
                className={({ isActive }) => 
                  `block px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive 
                      ? 'bg-primary-600 text-white' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`
                }
              >
                Seating Arrangement
              </NavLink>
            </div>
          </nav>
          <div className="flex-1 min-w-0">
            <Routes>
              <Route path="halls" element={<HallManagement />} />
              <Route path="subjects" element={<SubjectManagement />} />
              <Route path="assign-hall" element={<AssignHallToExam />} />
              <Route path="report" element={<HallAllocationReport />} />
              <Route path="seating" element={<HallPlanSeating />} />
              <Route path="/" element={<Navigate to="/department-coordinator/halls" replace />} />
            </Routes>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DepartmentCoordinatorDashboard;

