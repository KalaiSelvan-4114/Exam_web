import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay } from 'date-fns';

const ExamCalendar = () => {
  const { user } = useAuth();
  const [exams, setExams] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCalendar();
  }, [currentDate]);

  const fetchCalendar = async () => {
    try {
      const month = currentDate.getMonth();
      const year = currentDate.getFullYear();
      const response = await api.get('/staff/calendar', {
        params: { month, year }
      });
      setExams(response.data);
    } catch (error) {
      console.error('Error fetching calendar:', error);
      alert('Failed to fetch calendar');
    } finally {
      setLoading(false);
    }
  };

  const getExamsForDate = (date) => {
    return exams.filter(exam => isSameDay(new Date(exam.date), date));
  };

  const isMyExam = (exam) => {
    if (!user) return false;
    const userId = user._id || user.id;
    return exam.assignedStaff?.some(item => {
      if (!item.staff) return false;
      const staffId = typeof item.staff === 'string' ? item.staff : (item.staff._id || item.staff);
      return staffId === userId || staffId === user._id || staffId === user.id;
    });
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
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

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 }); // Start from Sunday
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 }); // End on Saturday
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  return (
    <div className="card">
      <div className="mb-6 pb-4 border-b border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Exam Calendar</h2>
        <div className="flex gap-4 items-center justify-center">
          <button onClick={previousMonth} className="btn btn-secondary">
            ← Previous
          </button>
          <h3 className="text-xl font-semibold text-gray-900">{format(currentDate, 'MMMM yyyy')}</h3>
          <button onClick={nextMonth} className="btn btn-secondary">
            Next →
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2 mt-6">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="p-2 text-center font-bold text-gray-700 bg-gray-100 rounded">
            {day}
          </div>
        ))}
        {days.map((day, index) => {
          const dayExams = getExamsForDate(day);
          const isCurrentMonth = isSameMonth(day, currentDate);
          return (
            <div
              key={index}
              className={`min-h-[100px] p-2 border border-gray-300 rounded ${
                isCurrentMonth ? 'bg-white' : 'bg-gray-50'
              } ${isCurrentMonth ? 'opacity-100' : 'opacity-50'}`}
            >
              <div className="font-bold mb-2 text-gray-900">
                {format(day, 'd')}
              </div>
              {dayExams.map((exam, idx) => {
                const isAssigned = isMyExam(exam);
                return (
                  <div
                    key={idx}
                    className={`text-xs p-1 mb-1 rounded cursor-pointer ${
                      isAssigned 
                        ? 'bg-green-600 text-white hover:bg-green-700' 
                        : 'bg-gray-400 text-white hover:bg-gray-500'
                    }`}
                    title={`${exam.subject?.name} - ${exam.startTime} to ${exam.endTime}${isAssigned ? ' (Your Exam)' : ''}`}
                  >
                    {exam.subject?.name}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      <div className="mt-8">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Upcoming Exams</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hall</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {exams.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-4 py-8 text-center text-gray-500">
                    No exams scheduled
                  </td>
                </tr>
              ) : (
                exams
                  .filter(exam => isMyExam(exam))
                  .slice(0, 10)
                  .map((exam) => (
                    <tr key={exam._id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{exam.subject?.name}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">{format(new Date(exam.date), 'MMM dd, yyyy')}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">{exam.startTime} - {exam.endTime}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">{exam.hall?.name} ({exam.hall?.number})</td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ExamCalendar;
