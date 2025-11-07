import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { format } from 'date-fns';

const ExamSchedule = () => {
  const { user } = useAuth();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      const response = await api.get('/staff/exams');
      setExams(response.data);
    } catch (error) {
      console.error('Error fetching exams:', error);
      alert('Failed to fetch exams');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmReject = async (examId, status) => {
    try {
      await api.put(`/staff/exams/${examId}/confirm`, { status });
      alert(`Exam ${status} successfully!`);
      fetchExams();
    } catch (error) {
      console.error('Error updating exam status:', error);
      alert(error.response?.data?.message || 'Failed to update exam status');
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

  const getMyStatus = (exam) => {
    if (!user) return 'pending';
    const userId = user._id || user.id;
    const assignment = exam.assignedStaff.find(
      item => {
        if (!item.staff) return false;
        const staffId = typeof item.staff === 'string' ? item.staff : item.staff._id;
        return staffId === userId || staffId === user._id || staffId === user.id;
      }
    );
    return assignment?.status || 'pending';
  };

  return (
    <div className="card">
      <div className="mb-6 pb-4 border-b border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900">My Exam Schedule</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hall</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {exams.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                  No exams assigned
                </td>
              </tr>
            ) : (
              exams.map((exam) => {
                const myStatus = getMyStatus(exam);
                return (
                  <tr key={exam._id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{exam.subject?.name}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">{format(new Date(exam.date), 'MMM dd, yyyy')}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">{exam.startTime} - {exam.endTime}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">{exam.hall?.name} ({exam.hall?.number})</td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        myStatus === 'confirmed' ? 'bg-green-100 text-green-800' :
                        myStatus === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {myStatus}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm">
                      <div className="flex flex-wrap gap-2">
                        {myStatus === 'pending' && (
                          <>
                            <button
                              onClick={() => handleConfirmReject(exam._id, 'confirmed')}
                              className="btn btn-success text-xs px-3 py-1.5"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => handleConfirmReject(exam._id, 'rejected')}
                              className="btn btn-danger text-xs px-3 py-1.5"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {myStatus === 'confirmed' && (
                          <button
                            onClick={() => handleConfirmReject(exam._id, 'rejected')}
                            className="btn btn-danger text-xs px-3 py-1.5"
                          >
                            Reject
                          </button>
                        )}
                        {myStatus === 'rejected' && (
                          <button
                            onClick={() => handleConfirmReject(exam._id, 'confirmed')}
                            className="btn btn-success text-xs px-3 py-1.5"
                          >
                            Confirm
                          </button>
                        )}
                      </div>
                    </td>
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

export default ExamSchedule;
