import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { format } from 'date-fns';

const HallPlanSeating = () => {
  const [exams, setExams] = useState([]);
  const [assignments, setAssignments] = useState({});
  const [selectedExam, setSelectedExam] = useState(null);
  const [ranges, setRanges] = useState({}); // hallId -> { rangeStart, rangeEnd }
  const [seatingConfig, setSeatingConfig] = useState({}); // hallId -> { rows, cols }
  const [seatingData, setSeatingData] = useState({}); // hallId -> { seats, rows, cols }
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState(null);
  const [uploadError, setUploadError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const examsRes = await api.get('/exams/department/published');
      const examList = examsRes.data || [];
      setExams(examList);

      const assignMap = {};
      for (const exam of examList) {
        try {
          const assignRes = await api.get(`/hall-assignments/${exam._id}`);
          if (assignRes.data) {
            assignMap[exam._id] = assignRes.data;
            // Initialize ranges from existing data
            const r = {};
            assignRes.data.halls?.forEach(h => {
              if (h.rangeStart && h.rangeEnd) {
                r[h.hall?._id || h.hall] = { rangeStart: h.rangeStart, rangeEnd: h.rangeEnd };
              }
            });
            setRanges(prev => ({ ...prev, [exam._id]: r }));
          }
        } catch (e) {
          // No assignment yet
        }
      }
      setAssignments(assignMap);
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectExam = (exam) => {
    setSelectedExam(exam);
    const assign = assignments[exam._id];
    if (assign) {
      const r = {};
      assign.halls?.forEach(h => {
        const hallId = h.hall?._id || h.hall;
        r[hallId] = {
          rangeStart: h.rangeStart || '',
          rangeEnd: h.rangeEnd || ''
        };
      });
      setRanges(prev => ({ ...prev, [exam._id]: r }));
    }
  };

  const updateRange = (hallId, field, value) => {
    if (!selectedExam) return;
    const num = value === '' ? '' : parseInt(value, 10);
    if (value !== '' && (isNaN(num) || num < 1)) return;
    
    setRanges(prev => ({
      ...prev,
      [selectedExam._id]: {
        ...(prev[selectedExam._id] || {}),
        [hallId]: {
          ...(prev[selectedExam._id]?.[hallId] || {}),
          [field]: num
        }
      }
    }));
  };

  const savePlan = async () => {
    if (!selectedExam) return;
    const assign = assignments[selectedExam._id];
    if (!assign) {
      alert('No hall assignment found. Assign halls first.');
      return;
    }

    const examRanges = ranges[selectedExam._id] || {};
    const plans = assign.halls
      .filter(h => {
        const hallId = h.hall?._id || h.hall;
        const r = examRanges[hallId];
        return r && r.rangeStart && r.rangeEnd;
      })
      .map(h => {
        const hallId = h.hall?._id || h.hall;
        const r = examRanges[hallId];
        return {
          hallId,
          rangeStart: r.rangeStart,
          rangeEnd: r.rangeEnd
        };
      });

    if (plans.length === 0) {
      alert('Set ranges for at least one hall');
      return;
    }

    // Validate ranges
    const sorted = [...plans].sort((a, b) => a.rangeStart - b.rangeStart);
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i].rangeStart <= sorted[i - 1].rangeEnd) {
        alert('Ranges must not overlap');
        return;
      }
    }

    setSaving(true);
    try {
      await api.put('/hall-assignments/plan', {
        examId: selectedExam._id,
        plans
      });
      alert('Hall plan saved successfully!');
      await fetchData();
    } catch (error) {
      console.error('Error saving plan:', error);
      alert(error.response?.data?.message || 'Failed to save hall plan');
    } finally {
      setSaving(false);
    }
  };

  const generateSeating = async (hallId) => {
    if (!selectedExam) return;
    const config = seatingConfig[hallId];
    if (!config || !config.rows || !config.cols) {
      alert('Set rows and columns first');
      return;
    }

    try {
      const res = await api.post('/hall-assignments/seating', {
        examId: selectedExam._id,
        hallId,
        rows: config.rows,
        cols: config.cols
      });
      setSeatingData(prev => ({
        ...prev,
        [hallId]: res.data
      }));
    } catch (error) {
      console.error('Error generating seating:', error);
      alert(error.response?.data?.message || 'Failed to generate seating arrangement');
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await api.get('/upload/template/hall-plans', {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'hall_plans_template.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading template:', error);
      alert('Failed to download template');
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.size > 10 * 1024 * 1024) {
        setUploadError('File size must be less than 10MB');
        return;
      }
      setUploadFile(selectedFile);
      setUploadError('');
      setUploadResults(null);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!uploadFile) {
      setUploadError('Please select a file');
      return;
    }

    setUploading(true);
    setUploadError('');
    setUploadResults(null);

    try {
      const formData = new FormData();
      formData.append('file', uploadFile);

      const response = await api.post('/upload/hall-plans', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setUploadResults(response.data);
      setUploadFile(null);
      document.getElementById('hall-plan-file-input').value = '';
      await fetchData(); // Refresh data
    } catch (error) {
      console.error('Upload error:', error);
      setUploadError(error.response?.data?.message || 'Failed to upload file');
    } finally {
      setUploading(false);
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
    <div className="space-y-6">
      <div className="card">
        <div className="mb-6 pb-4 border-b border-gray-200 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <h2 className="text-2xl font-bold text-gray-900">Hall Plan & Seating Arrangement</h2>
          <button onClick={() => setShowUpload(!showUpload)} className="btn btn-secondary whitespace-nowrap">
            {showUpload ? 'Hide Upload' : 'Upload'}
          </button>
        </div>

        {showUpload && (
          <div className="mb-6 p-6 bg-primary-50 rounded-lg">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Upload Hall Plans</h3>
            <div className="mb-4 p-4 bg-primary-100 rounded-lg">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div>
                  <strong className="text-gray-900">Download Sample Template</strong>
                  <p className="mt-1 text-sm text-gray-600">
                    Download the Excel template. Use Subject, Date, Session, and Hall Number to identify the exam-hall combination.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="btn btn-secondary whitespace-nowrap"
                >
                  Download Template
                </button>
              </div>
            </div>

            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="form-label">Select Excel File (.xlsx, .xls) *</label>
                <input
                  id="hall-plan-file-input"
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileChange}
                  className="form-input"
                  required
                />
                <small className="block mt-1 text-xs text-gray-500">
                  Maximum file size: 10MB. Columns: Subject, Date (YYYY-MM-DD), Session (FN/AN), HallNumber, RangeStart, RangeEnd, Rows, Cols
                </small>
              </div>

              {uploadError && (
                <div className="alert alert-error">
                  {uploadError}
                </div>
              )}

              <button
                type="submit"
                className="btn btn-primary"
                disabled={uploading || !uploadFile}
              >
                {uploading ? 'Uploading...' : 'Upload File'}
              </button>
            </form>

            {uploadResults && (
              <div className="mt-6 space-y-4">
                <div className="alert alert-success">
                  {uploadResults.message}
                </div>

                {uploadResults.results.success.length > 0 && (
                  <div>
                    <strong className="text-green-700">Successful ({uploadResults.results.success.length})</strong>
                    <div className="mt-2 max-h-40 overflow-y-auto border border-gray-300 rounded-lg p-2 bg-white">
                      {uploadResults.results.success.slice(0, 10).map((item, idx) => (
                        <div key={idx} className="text-sm py-1">
                          Row {item.row}: {item.subject} - Hall {item.hallNumber} - Range: {item.rangeStart}-{item.rangeEnd}
                        </div>
                      ))}
                      {uploadResults.results.success.length > 10 && (
                        <div className="text-sm text-gray-500">
                          ... and {uploadResults.results.success.length - 10} more
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {uploadResults.results.errors.length > 0 && (
                  <div>
                    <strong className="text-red-700">Errors ({uploadResults.results.errors.length})</strong>
                    <div className="mt-2 max-h-40 overflow-y-auto border border-gray-300 rounded-lg p-2 bg-white">
                      {uploadResults.results.errors.slice(0, 10).map((item, idx) => (
                        <div key={idx} className="text-sm text-red-600 py-1">
                          Row {item.row}: {item.error}
                        </div>
                      ))}
                      {uploadResults.results.errors.length > 10 && (
                        <div className="text-sm text-gray-500">
                          ... and {uploadResults.results.errors.length - 10} more
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Exam Selection */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Exam</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {exams.map(exam => {
              const assign = assignments[exam._id];
              const hasHalls = assign && assign.halls && assign.halls.length > 0;
              const isSelected = selectedExam?._id === exam._id;
              return (
                <div
                  key={exam._id}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    isSelected
                      ? 'border-primary-600 bg-primary-50'
                      : hasHalls
                      ? 'border-gray-300 bg-white hover:border-primary-500 hover:shadow-md'
                      : 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed'
                  }`}
                  onClick={() => hasHalls && handleSelectExam(exam)}
                >
                  <div>
                    <strong className="text-gray-900">{exam.subject?.name}</strong>
                    <div className="text-sm text-gray-600 mt-1">
                      {format(new Date(exam.date), 'MMM dd, yyyy')} • {exam.session} • {exam.totalStudents} students
                    </div>
                    {exam.yearBreakdown && (
                      <div className="text-xs text-primary-600 mt-1">
                        {[1, 2, 3, 4].map(y => {
                          const count = exam.yearBreakdown[y.toString()] || 0;
                          return count > 0 ? `Y${y}: ${count} ` : null;
                        }).filter(Boolean).join('• ')}
                      </div>
                    )}
                    {assign && (
                      <div className="text-xs text-green-600 mt-1">
                        {assign.halls?.length || 0} hall(s) assigned
                      </div>
                    )}
                    {!hasHalls && (
                      <div className="text-xs text-red-600 mt-1">
                        No halls assigned
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {selectedExam && assignments[selectedExam._id] && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Hall Plan - Set Student Ranges</h3>
              <p className="text-gray-600 mb-4">
                Assign student number ranges to each hall (e.g., Hall 1: 1-30, Hall 2: 31-60)
              </p>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hall</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Capacity</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Range Start</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Range End</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Seats</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {assignments[selectedExam._id].halls.map(h => {
                      const hallId = h.hall?._id || h.hall;
                      const hallName = h.hall?.name || 'Unknown';
                      const capacity = h.hall?.capacity || 0;
                      const r = ranges[selectedExam._id]?.[hallId] || {};
                      const total = r.rangeStart && r.rangeEnd ? (r.rangeEnd - r.rangeStart + 1) : 0;
                      return (
                        <tr key={hallId} className="hover:bg-gray-50">
                          <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900"><strong>{hallName}</strong></td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">{capacity}</td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <input
                              type="number"
                              min="1"
                              max={selectedExam.totalStudents}
                              value={r.rangeStart || ''}
                              onChange={(e) => updateRange(hallId, 'rangeStart', e.target.value)}
                              className="form-input w-24"
                              placeholder="Start"
                            />
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <input
                              type="number"
                              min="1"
                              max={selectedExam.totalStudents}
                              value={r.rangeEnd || ''}
                              onChange={(e) => updateRange(hallId, 'rangeEnd', e.target.value)}
                              className="form-input w-24"
                              placeholder="End"
                            />
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm">
                            {total > 0 ? (
                              <span className={total <= capacity ? 'text-green-600' : 'text-red-600'}>
                                {total} {total > capacity && '(exceeds capacity)'}
                              </span>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <button
                className="btn btn-primary mt-4"
                onClick={savePlan}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Hall Plan'}
              </button>
            </div>

            {/* Seating Arrangement */}
            <div className="mt-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Seating Arrangement - Generate Matrix</h3>
              <p className="text-gray-600 mb-4">
                Set rows and columns to generate seating matrix for each hall
              </p>

              {assignments[selectedExam._id].halls.map(h => {
                const hallId = h.hall?._id || h.hall;
                const hallName = h.hall?.name || 'Unknown';
                const r = ranges[selectedExam._id]?.[hallId] || {};
                const config = seatingConfig[hallId] || { rows: '', cols: '' };
                const seating = seatingData[hallId];

                if (!r.rangeStart || !r.rangeEnd) {
                  return (
                    <div key={hallId} className="p-6 border border-gray-200 rounded-lg bg-gray-50 opacity-50 mb-4">
                      <h4 className="text-lg font-semibold text-gray-700">{hallName} - Set range first</h4>
                    </div>
                  );
                }

                return (
                  <div key={hallId} className="p-6 border border-gray-200 rounded-lg bg-gray-50 mb-4">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">{hallName} (Students {r.rangeStart}-{r.rangeEnd})</h4>
                    <div className="flex flex-wrap gap-4 mb-4 items-end">
                      <div>
                        <label className="form-label">Rows</label>
                        <input
                          type="number"
                          min="1"
                          max="20"
                          value={config.rows || ''}
                          onChange={(e) => setSeatingConfig(prev => ({
                            ...prev,
                            [hallId]: { ...config, rows: parseInt(e.target.value, 10) || '' }
                          }))}
                          className="form-input w-24"
                          placeholder="e.g., 5"
                        />
                      </div>
                      <div>
                        <label className="form-label">Columns</label>
                        <input
                          type="number"
                          min="1"
                          max="20"
                          value={config.cols || ''}
                          onChange={(e) => setSeatingConfig(prev => ({
                            ...prev,
                            [hallId]: { ...config, cols: parseInt(e.target.value, 10) || '' }
                          }))}
                          className="form-input w-24"
                          placeholder="e.g., 6"
                        />
                      </div>
                      
                      <button
                        className="btn btn-secondary"
                        onClick={() => generateSeating(hallId)}
                        disabled={!config.rows || !config.cols}
                      >
                        Generate Seating
                      </button>
                    </div>

                    {seating && (
                      <div className="mt-4">
                        <div className="inline-block border-2 border-gray-800 rounded p-2 bg-white">
                          {seating.seats.map((row, rowIdx) => (
                            <div key={rowIdx} className="flex gap-1 mb-1 last:mb-0">
                              {row.map((seat, colIdx) => (
                                <div
                                  key={colIdx}
                                  className={`w-12 h-12 flex items-center justify-center border rounded text-sm font-medium ${
                                    seat 
                                      ? 'bg-primary-100 text-primary-800 border-primary-500' 
                                      : 'bg-gray-50 text-gray-400 border-gray-300'
                                  }`}
                                >
                                  {seat || ''}
                                </div>
                              ))}
                            </div>
                          ))}
                        </div>
                        <div className="mt-4 text-sm text-gray-600">
                          Total seats: {seating.total} | Layout: {seating.rows} rows × {seating.cols} columns
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {selectedExam && !assignments[selectedExam._id] && (
          <div className="p-8 text-center text-gray-500 bg-gray-50 rounded-lg">
            No halls assigned to this exam. Please assign halls first.
          </div>
        )}

        {exams.length === 0 && (
          <div className="p-8 text-center text-gray-500 bg-gray-50 rounded-lg">
            No published exams found for your department.
          </div>
        )}
      </div>
    </div>
  );
};

export default HallPlanSeating;

