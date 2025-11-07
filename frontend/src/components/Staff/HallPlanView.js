import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { format } from 'date-fns';

const HallPlanView = () => {
  const [exams, setExams] = useState([]);
  const [selectedExam, setSelectedExam] = useState(null);
  const [seatingData, setSeatingData] = useState({}); // hallId -> seating data
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    // Automatically fetch seating for selected exam's halls
    if (selectedExam && selectedExam.halls) {
      selectedExam.halls.forEach(hall => {
        // Only fetch if range is set and seating config exists (rows/cols)
        if (hall.rangeStart && hall.rangeEnd && hall.seatingRows && hall.seatingCols) {
          // Check if we already have this seating data
          if (!seatingData[hall.hallId]) {
            fetchSeating(selectedExam.exam._id, hall.hallId);
          }
        }
      });
    }
  }, [selectedExam]);

  const fetchData = async () => {
    try {
      const response = await api.get('/hall-assignments/staff/my-halls');
      setExams(response.data || []);
      if (response.data && response.data.length > 0) {
        setSelectedExam(response.data[0]);
      }
    } catch (error) {
      console.error('Error fetching hall plans:', error);
      alert('Failed to fetch hall plans');
    } finally {
      setLoading(false);
    }
  };

  const fetchSeating = async (examId, hallId) => {
    try {
      const response = await api.get(`/hall-assignments/staff/seating/${examId}/${hallId}`);
      setSeatingData(prev => ({
        ...prev,
        [hallId]: response.data
      }));
    } catch (error) {
      console.error('Error fetching seating:', error);
      alert(error.response?.data?.message || 'Failed to fetch seating arrangement');
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="hall-plan-seating">
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Hall Plan & Seating Arrangement</h2>
          <p style={{ color: '#6b7280', marginTop: '0.5rem' }}>
            View your assigned halls and seating arrangements for exams
          </p>
        </div>

        {/* Exam Selection */}
        {exams.length > 0 && (
          <div style={{ marginBottom: '2rem' }}>
            <h3>Select Exam</h3>
            <div className="exam-list">
              {exams.map((item, idx) => (
                <div
                  key={item.exam._id}
                  className={`exam-card ${selectedExam?.exam?._id === item.exam._id ? 'active' : ''}`}
                  onClick={() => setSelectedExam(item)}
                >
                  <div>
                    <strong>{item.exam.subject}</strong>
                    <div style={{ fontSize: '0.9rem', color: '#6b7280', marginTop: '4px' }}>
                      {format(new Date(item.exam.date), 'MMM dd, yyyy')} • {item.exam.session} • {item.exam.totalStudents} students
                    </div>
                    {item.exam.yearBreakdown && (
                      <div style={{ fontSize: '0.85rem', color: '#3b82f6', marginTop: '4px' }}>
                        {[1, 2, 3, 4].map(y => {
                          const count = item.exam.yearBreakdown[y.toString()] || 0;
                          return count > 0 ? `Y${y}: ${count} ` : null;
                        }).filter(Boolean).join('• ')}
                      </div>
                    )}
                    <div style={{ fontSize: '0.85rem', color: '#059669', marginTop: '4px' }}>
                      {item.halls?.length || 0} hall(s) assigned to you
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedExam && (
          <div>
            <h3>Your Assigned Halls</h3>
            {selectedExam.halls.map((hall) => {
              const seating = seatingData[hall.hallId];
              const hasSeating = seating && seating.seats;

              return (
                <div key={hall.hallId} className="seating-section">
                  <h4>
                    {hall.hallName} {hall.hallNumber && `(${hall.hallNumber})`}
                    {hall.hallLocation && ` - ${hall.hallLocation}`}
                  </h4>
                  
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
                      <div>
                        <strong>Capacity:</strong> {hall.capacity}
                      </div>
                      {hall.rangeStart && hall.rangeEnd && (
                        <div>
                          <strong>Student Range:</strong> {hall.rangeStart} - {hall.rangeEnd} ({hall.totalSeats} seats)
                        </div>
                      )}
                    </div>

                    {!hall.rangeStart || !hall.rangeEnd ? (
                      <div style={{ padding: '1rem', background: '#fef3c7', borderRadius: '6px', color: '#92400e' }}>
                        Hall plan not yet set by coordinator
                      </div>
                    ) : (
                      <div>
                        {/* Show loading state while fetching seating */}
                        {hall.seatingRows && hall.seatingCols && !hasSeating && !seating && (
                          <div style={{ padding: '1rem', color: '#6b7280' }}>
                            Loading seating arrangement...
                          </div>
                        )}

                        {/* Show message if seating not generated yet */}
                        {seating && seating.message && !seating.seats && (
                          <div style={{ padding: '1rem', background: '#fef3c7', borderRadius: '6px', color: '#92400e' }}>
                            {seating.message}
                          </div>
                        )}

                        {/* Show seating matrix if available */}
                        {hasSeating && (
                          <div>
                            <h5 style={{ marginBottom: '1rem', color: '#1f2937' }}>Seating Arrangement</h5>
                            <div className="seating-matrix-container">
                              <div className="seating-matrix">
                                {seating.seats.map((row, rowIdx) => (
                                  <div key={rowIdx} className="seating-row">
                                    {row.map((seat, colIdx) => (
                                      <div
                                        key={colIdx}
                                        className={`seating-seat ${seat ? 'occupied' : 'empty'}`}
                                      >
                                        {seat || ''}
                                      </div>
                                    ))}
                                  </div>
                                ))}
                              </div>
                              <div style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#6b7280' }}>
                                Total seats: {seating.totalSeats} | Layout: {seating.rows} rows × {seating.cols} columns
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Show manual fetch button if seating config exists but not loaded yet */}
                        {hall.seatingRows && hall.seatingCols && !hasSeating && seating && !seating.seats && (
                          <button
                            className="btn btn-secondary"
                            onClick={() => fetchSeating(selectedExam.exam._id, hall.hallId)}
                            style={{ marginTop: '1rem' }}
                          >
                            Retry Loading Seating
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {exams.length === 0 && (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
            No hall assignments found. You will see your assigned halls here once the coordinator assigns them.
          </div>
        )}
      </div>
    </div>
  );
};

export default HallPlanView;

