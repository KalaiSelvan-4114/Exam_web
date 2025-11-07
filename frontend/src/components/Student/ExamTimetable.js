import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { format } from 'date-fns';

const ExamTimetable = () => {
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
      alert('Failed to fetch exam timetable');
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

  // Sort exams by date and time
  const sortedExams = [...exams].sort((a, b) => {
    const dateA = new Date(`${a.date}T${a.startTime}`);
    const dateB = new Date(`${b.date}T${b.startTime}`);
    return dateA - dateB;
  });

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="mb-6 pb-4 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">My Exam Timetable</h2>
        </div>
        {sortedExams.length === 0 ? (
          <p className="text-center py-8 text-gray-500">
            No exams scheduled at the moment.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject Code</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hall</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hall Location</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedExams.map((exam) => (
                  <tr key={exam._id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900"><strong>{exam.subject?.name}</strong></td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">{exam.subject?.code}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">{format(new Date(exam.date), 'MMM dd, yyyy (EEEE)')}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">{exam.startTime} - {exam.endTime}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900"><strong>{exam.hall?.name} ({exam.hall?.number})</strong></td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">{exam.hall?.location}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-8 p-6 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Important Notes:</h3>
          <ul className="mt-4 space-y-2 text-sm text-gray-700 leading-relaxed">
            <li>• Please arrive at the exam hall 15 minutes before the scheduled time.</li>
            <li>• Bring your college ID card for verification.</li>
            <li>• Check the hall number and location before the exam day.</li>
            <li>• Contact the exam coordinator if you have any questions.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ExamTimetable;
