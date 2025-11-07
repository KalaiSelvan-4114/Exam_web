import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { format } from 'date-fns';

const ExamList = () => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      const response = await api.get('/exams');
      setExams(response.data);
    } catch (error) {
      console.error('Error fetching exams:', error);
      alert('Failed to fetch exams');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this exam?')) return;
    try {
      await api.delete(`/exams/${id}`);
      fetchExams();
    } catch (error) {
      console.error('Error deleting exam:', error);
      alert('Failed to delete exam');
    }
  };

  const handlePublishToggle = async (exam) => {
    try {
      const path = exam.isPublished ? 'unpublish' : 'publish';
      await api.post(`/exams/${exam._id}/${path}`);
      fetchExams();
    } catch (error) {
      console.error('Error updating publish state:', error);
      alert(error.response?.data?.message || 'Failed to update publish state');
    }
  };

  const handleAllocate = async (exam) => {
    try {
      await api.post(`/exams/${exam._id}/allocate`);
      alert('Allocation completed');
      fetchExams();
    } catch (error) {
      console.error('Error allocating:', error);
      alert(error.response?.data?.message || 'Failed to allocate');
    }
  };

  if (loading) {
    return (
      <div className="card flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600 mb-4"></div>
          <p className="text-gray-600">Loading exams...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="mb-6 pb-4 border-b border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900">All Exams</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Session</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Students</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year Breakdown</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Published</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {exams.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-4 py-8 text-center text-gray-500">
                  No exams found
                </td>
              </tr>
            ) : (
              exams.map((exam) => (
                <tr key={exam._id} className="hover:bg-gray-50">
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{exam.subject?.name}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">{format(new Date(exam.date), 'MMM dd, yyyy')}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">{exam.session}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">{exam.totalStudents}</td>
                  <td className="px-4 py-4 text-sm text-gray-700">
                    {exam.yearBreakdown ? (
                      <div className="text-xs">
                        {[1, 2, 3, 4].map(y => {
                          const count = exam.yearBreakdown[y.toString()] || 0;
                          return count > 0 ? <span key={y} className="mr-2">Y{y}: {count}</span> : null;
                        }).filter(Boolean).length > 0 ? (
                          [1, 2, 3, 4].map(y => {
                            const count = exam.yearBreakdown[y.toString()] || 0;
                            return count > 0 ? <span key={y} className="mr-2">Y{y}: {count}</span> : null;
                          }).filter(Boolean)
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      exam.isPublished 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {exam.isPublished ? 'Published' : 'Unpublished'}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm">
                    <div className="flex flex-wrap gap-2">
                      <button 
                        onClick={() => handlePublishToggle(exam)} 
                        className="btn btn-secondary text-xs px-3 py-1.5"
                      >
                        {exam.isPublished ? 'Unpublish' : 'Publish'}
                      </button>
                      <button 
                        onClick={() => handleAllocate(exam)} 
                        className="btn btn-primary text-xs px-3 py-1.5"
                      >
                        Allocate
                      </button>
                      <button 
                        onClick={() => handleDelete(exam._id)} 
                        className="btn btn-danger text-xs px-3 py-1.5"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ExamList;

