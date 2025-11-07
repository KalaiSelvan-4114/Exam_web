import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { format } from 'date-fns';

const AssignHallToExam = () => {
  const [exams, setExams] = useState([]);
  const [halls, setHalls] = useState([]);
  const [assignments, setAssignments] = useState({}); // examId -> assignment
  const [selected, setSelected] = useState({}); // examId -> hallIds[]
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchAssignments = async (examList) => {
    try {
      const results = await Promise.all(
        examList.map(exam =>
          api
            .get(`/hall-assignments/${exam._id}`)
            .then(res => ({ id: exam._id, data: res.data }))
            .catch(() => ({ id: exam._id, data: null }))
        )
      );
      const map = {};
      const sel = {};
      results.forEach(r => {
        if (r.data) {
          map[r.id] = r.data;
          sel[r.id] = (r.data.halls || []).map(h => h.hall?._id || h.hall);
        }
      });
      setAssignments(map);
      setSelected(sel);
    } catch (e) {
      // ignore; per-exam fetch already handled
    }
  };

  const fetchData = async () => {
    try {
      const [examsRes, hallsRes] = await Promise.all([
        api.get('/exams/department/published'),
        api.get('/halls')
      ]);
      const published = examsRes.data || [];
      setExams(published);
      setHalls(hallsRes.data || []);
      if (published.length > 0) await fetchAssignments(published);
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const toggleHall = (examId, hallId, checked) => {
    setSelected(prev => {
      const current = new Set(prev[examId] || []);
      if (checked) current.add(hallId); else current.delete(hallId);
      return { ...prev, [examId]: Array.from(current) };
    });
  };

  const capacityFor = (examId) => {
    const ids = selected[examId] || [];
    return halls.filter(h => ids.includes(h._id)).reduce((s, h) => s + (h.capacity || 0), 0);
  };

  const handleSave = async (exam) => {
    try {
      const ids = selected[exam._id] || [];
      if (ids.length === 0) {
        alert('Select at least one hall');
        return;
      }
      const totalCap = capacityFor(exam._id);
      if (totalCap < (exam.totalStudents || 0)) {
        if (!window.confirm(`Selected capacity ${totalCap} is less than students ${exam.totalStudents}. Continue?`)) {
          return;
        }
      }
      await api.post('/hall-assignments', { examId: exam._id, hallIds: ids, replace: true });
      await fetchData();
      alert('Halls assigned successfully!');
    } catch (error) {
      console.error('Error assigning halls:', error);
      const msg = error.response?.data?.message || error.message || 'Failed to assign halls';
      alert(msg);
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
        <h2 className="text-2xl font-bold text-gray-900">Assign Halls to Exams</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Session</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Halls</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Students</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[360px]">Select Halls (multi)</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {exams.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-4 py-8 text-center text-gray-500">
                  No published exams found for your department.
                </td>
              </tr>
            ) : (
              exams.map((exam) => {
                const a = assignments[exam._id];
                const current = a?.halls?.map(h => `${h.hall?.name || '—'} (${h.hall?.capacity || 0})`).join(', ') || 'Not assigned';
                const totalCap = a?.totalCapacity || 0;
                const selCap = capacityFor(exam._id);
                const ids = selected[exam._id] || [];
                return (
                  <tr key={exam._id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{exam.subject?.name}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">{format(new Date(exam.date), 'MMM dd, yyyy')}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">{exam.session}</td>
                    <td className="px-4 py-4 text-sm text-gray-700">{current}{a ? ` • Total: ${totalCap}` : ''}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">{exam.totalStudents}</td>
                    <td className="px-4 py-4 text-sm">
                      <div className="space-y-3 min-w-[320px]">
                        {/* Selected halls as chips */}
                        {ids.length > 0 && (
                          <div className="flex flex-wrap gap-2 p-2 bg-primary-50 rounded-lg border border-primary-200">
                            {ids.map(hallId => {
                              const hall = halls.find(h => h._id === hallId);
                              if (!hall) return null;
                              return (
                                <span
                                  key={hallId}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-primary-800 rounded-lg text-xs font-medium shadow-sm border border-primary-200"
                                >
                                  <span className="font-semibold">{hall.name}</span>
                                  <span className="text-primary-600">({hall.capacity})</span>
                                  <button
                                    type="button"
                                    onClick={() => toggleHall(exam._id, hallId, false)}
                                    className="ml-1 text-primary-600 hover:text-primary-800 hover:bg-primary-100 rounded-full w-5 h-5 flex items-center justify-center transition-colors"
                                    title="Remove hall"
                                  >
                                    ×
                                  </button>
                                </span>
                              );
                            })}
                          </div>
                        )}
                        
                        {/* Hall selection list */}
                        <div className="border border-gray-300 rounded-lg bg-white shadow-sm">
                          <div className="p-2 bg-gray-50 border-b border-gray-200 rounded-t-lg">
                            <span className="text-xs font-semibold text-gray-700">
                              {ids.length > 0 ? `${ids.length} hall(s) selected` : 'Select halls'}
                            </span>
                          </div>
                          <div className="max-h-48 overflow-y-auto p-2">
                            {halls.filter(h => h.isActive).length === 0 ? (
                              <p className="text-xs text-gray-500 text-center py-4">No active halls available</p>
                            ) : (
                              <div className="space-y-1">
                                {halls.filter(h => h.isActive).map(hall => {
                                  const isSelected = (ids || []).includes(hall._id);
                                  return (
                                    <label
                                      key={hall._id}
                                      className={`flex items-center gap-3 p-2 cursor-pointer rounded-lg transition-all ${
                                        isSelected
                                          ? 'bg-primary-50 border-2 border-primary-300 shadow-sm'
                                          : 'hover:bg-gray-50 border-2 border-transparent'
                                      }`}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={(e) => toggleHall(exam._id, hall._id, e.target.checked)}
                                        className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 focus:ring-2 cursor-pointer"
                                      />
                                      <div className="flex-1 flex items-center justify-between">
                                        <span className={`text-sm font-medium ${isSelected ? 'text-primary-900' : 'text-gray-900'}`}>
                                          {hall.name}
                                        </span>
                                        <span className={`text-xs px-2 py-0.5 rounded ${
                                          isSelected
                                            ? 'bg-primary-200 text-primary-800 font-medium'
                                            : 'bg-gray-200 text-gray-600'
                                        }`}>
                                          {hall.capacity} seats
                                        </span>
                                      </div>
                                    </label>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Capacity status indicator */}
                        <div className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium ${
                          selCap >= exam.totalStudents
                            ? 'bg-green-50 text-green-800 border border-green-200'
                            : selCap > 0
                            ? 'bg-yellow-50 text-yellow-800 border border-yellow-200'
                            : 'bg-gray-50 text-gray-600 border border-gray-200'
                        }`}>
                          <span>
                            Total Capacity: <strong>{selCap}</strong> / {exam.totalStudents} students
                          </span>
                          {selCap >= exam.totalStudents ? (
                            <span className="text-green-700">✓</span>
                          ) : selCap > 0 ? (
                            <span className="text-yellow-700">⚠</span>
                          ) : null}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm">
                      <button className="btn btn-primary text-xs px-3 py-1.5" onClick={() => handleSave(exam)}>
                        Save
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      {exams.length > 0 && (
        <p className="mt-4 text-sm text-gray-600">
          Note: Multiple halls can be selected. Total capacity should be ≥ total students.
        </p>
      )}
    </div>
  );
};

export default AssignHallToExam;
