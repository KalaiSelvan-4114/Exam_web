import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { format } from 'date-fns';

const HallAllocations = () => {
  const [report, setReport] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    fetchReport();
  }, []);

  const fetchReport = async () => {
    try {
      const params = {};
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;

      const response = await api.get('/reports/all-hall-allocations', { params });
      setReport(response.data);
    } catch (error) {
      console.error('Error fetching report:', error);
      alert('Failed to fetch hall allocations');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({ ...filters, [name]: value });
  };

  const handleApplyFilters = () => {
    setLoading(true);
    fetchReport();
  };

  if (loading) {
    return (
      <div className="card flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600 mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="mb-6 pb-4 border-b border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900">Hall Allocations Report</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="form-label">Start Date</label>
          <input
            type="date"
            name="startDate"
            value={filters.startDate}
            onChange={handleFilterChange}
            className="form-input"
          />
        </div>

        <div>
          <label className="form-label">End Date</label>
          <input
            type="date"
            name="endDate"
            value={filters.endDate}
            onChange={handleFilterChange}
            className="form-input"
          />
        </div>
      </div>

      <button onClick={handleApplyFilters} className="btn btn-primary mb-6">
        Apply Filters
      </button>

      {report.length === 0 ? (
        <div className="p-8 text-center text-gray-500 bg-gray-50 rounded-lg">
          No hall allocations found. Please assign halls to exams first.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Session</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hall</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Students</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Staff</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {report.map((item, idx) => (
                <tr key={`${item.examId}-${idx}`} className="hover:bg-gray-50">
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.subject}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">{format(new Date(item.date), 'MMM dd, yyyy')}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">{item.session || '-'}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">{item.hall.name} {item.hall.number !== '-' && `(${item.hall.number})`}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">{item.hall.department}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">{item.students}</td>
                  <td className="px-4 py-4 text-sm text-gray-700">
                    {item.staff && item.staff.length > 0 ? (
                      <div className="space-y-1">
                        {item.staff.map((s, sIdx) => (
                          <div key={sIdx}>
                            {s.name}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-400">No staff assigned</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default HallAllocations;

