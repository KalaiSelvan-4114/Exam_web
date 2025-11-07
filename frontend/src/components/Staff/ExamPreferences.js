import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { format } from 'date-fns';

const ExamPreferences = () => {
  const [availableSlots, setAvailableSlots] = useState([]);
  const [myPreference, setMyPreference] = useState(null); // { date, session }
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [availableRes, meRes] = await Promise.all([
        api.get('/preferences/available'),
        api.get('/preferences/me')
      ]);
      setAvailableSlots(availableRes.data || []);
      setMyPreference(meRes.data || null);
    } catch (error) {
      console.error('Error fetching preferences:', error);
      alert('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleBook = async (slot) => {
    try {
      setSubmitting(true);
      await api.post('/preferences', {
        date: slot.date,
        session: slot.session
      });
      alert('Preference booked successfully!');
      fetchData();
    } catch (error) {
      console.error('Error booking preference:', error);
      const msg = error.response?.data?.message || error.message || 'Failed to book preference';
      alert(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const renderDate = (d) => format(new Date(d), 'MMM dd, yyyy');

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
        <h2 className="text-2xl font-bold text-gray-900">Slot Preferences</h2>
      </div>

      {myPreference ? (
        <div className="alert alert-success mb-6">
          You have booked: {renderDate(myPreference.date)} — {myPreference.session}
        </div>
      ) : (
        <div className="alert alert-info mb-6">
          Choose one available slot (movie-ticket style). Once taken, it won't be available to others.
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Session</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remaining</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {availableSlots.length === 0 ? (
              <tr>
                <td colSpan="4" className="px-4 py-8 text-center text-gray-500">
                  No available slots right now.
                </td>
              </tr>
            ) : (
              availableSlots.map((slot, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{renderDate(slot.date)}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">{slot.session}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">{slot.remaining}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm">
                    <button
                      className="btn btn-primary text-xs px-3 py-1.5"
                      disabled={submitting || !!myPreference || slot.remaining <= 0}
                      onClick={() => handleBook(slot)}
                    >
                      {myPreference ? 'Booked' : (slot.remaining > 0 ? 'Book' : 'Full')}
                    </button>
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

export default ExamPreferences;
