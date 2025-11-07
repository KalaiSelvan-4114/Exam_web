import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { format } from 'date-fns';

const AllocationsView = () => {
  const [exams, setExams] = useState([]);
  const [assignments, setAssignments] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const res = await api.get('/exams/department/published');
      const list = res.data || [];
      setExams(list);
      const results = await Promise.all(
        list.map(e => api.get(`/hall-assignments/${e._id}`).then(r => ({ id: e._id, data: r.data })).catch(() => ({ id: e._id, data: null })))
      );
      const map = {};
      results.forEach(r => { if (r.data) map[r.id] = r.data; });
      setAssignments(map);
    } catch (e) {
      console.error('Error', e);
      alert('Failed to load allocations');
    } finally {
      setLoading(false);
    }
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
        <h2 className="text-2xl font-bold text-gray-900">Hall Allocations (Read-only)</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Session</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Halls</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Allocated Staff</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {exams.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-4 py-8 text-center text-gray-500">
                  No exams found
                </td>
              </tr>
            ) : (
              exams.map(exam => {
                const asg = assignments[exam._id];
                const halls = asg?.halls?.map(h => h.hall?.name).join(', ') || '—';
                const staff = (exam.assignedStaff || []).map(s => s.staff?.name || '—').join(', ') || '—';
                return (
                  <tr key={exam._id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{exam.subject?.name}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">{format(new Date(exam.date), 'MMM dd, yyyy')}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">{exam.session}</td>
                    <td className="px-4 py-4 text-sm text-gray-700">{halls}</td>
                    <td className="px-4 py-4 text-sm text-gray-700">{staff}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AllocationsView;
