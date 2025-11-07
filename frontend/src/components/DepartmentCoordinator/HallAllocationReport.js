import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { format } from 'date-fns';

const HallAllocationReport = () => {
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

      const response = await api.get('/reports/hall-allocation', { params });
      setReport(response.data);
    } catch (error) {
      console.error('Error fetching report:', error);
      alert('Failed to fetch report');
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

  const handleDownloadReport = () => {
    // Simple CSV export
    let csv = 'Hall,Number,Location,Capacity,Subject,Date,Session,Students,Staff\n';
    report.forEach(hallData => {
      hallData.exams.forEach(exam => {
        csv += `"${hallData.hall.name}","${hallData.hall.number}","${hallData.hall.location}",${hallData.hall.capacity},"${exam.subject}","${format(new Date(exam.date), 'yyyy-MM-dd')}","${exam.session}",${exam.students},"${exam.staff.map(s => s.name).join(', ')}"\n`;
      });
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hall-allocation-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
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
    <div className="space-y-6">
      <div className="card">
        <div className="mb-6 pb-4 border-b border-gray-200 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <h2 className="text-2xl font-bold text-gray-900">Hall Plan & Report</h2>
          <button onClick={handleDownloadReport} className="btn btn-primary whitespace-nowrap">
            Download Report
          </button>
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
            No hall allocations found.
          </div>
        ) : (
          <div className="space-y-6">
            {report.map((hallData, index) => (
              <div key={index} className="card">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{hallData.hall.name} ({hallData.hall.number})</h3>
                <p className="text-sm text-gray-600 mb-1"><strong>Location:</strong> {hallData.hall.location}</p>
                <p className="text-sm text-gray-600 mb-4"><strong>Capacity:</strong> {hallData.hall.capacity}</p>
                
                {hallData.exams.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Session</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Students</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Staff</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {hallData.exams.map((exam, idx) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{exam.subject}</td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">{format(new Date(exam.date), 'MMM dd, yyyy')}</td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">{exam.session}</td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">{exam.students}</td>
                            <td className="px-4 py-4 text-sm text-gray-700">
                              <div className="space-y-1">
                                {exam.staff.map((s, i) => (
                                  <div key={i}>
                                    {s.name} ({s.status})
                                  </div>
                                ))}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="mt-4 text-gray-500">No exams scheduled</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HallAllocationReport;
