import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';

const CreateExam = () => {
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [formData, setFormData] = useState({
    department: '',
    subject: '',
    date: '',
    session: 'FN',
    totalStudents: '',
    yearBreakdown: {
      '1': 0,
      '2': 0,
      '3': 0,
      '4': 0
    }
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
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
      const [subjectsRes, departmentsRes] = await Promise.all([
        api.get('/subjects'),
        api.get('/departments')
      ]);
      setSubjects(subjectsRes.data);
      setDepartments(departmentsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleYearChange = (year, value) => {
    const num = parseInt(value, 10) || 0;
    setFormData({
      ...formData,
      yearBreakdown: {
        ...formData.yearBreakdown,
        [year]: num
      }
    });
  };

  const calculateTotalFromYears = () => {
    return Object.values(formData.yearBreakdown).reduce((sum, count) => sum + (parseInt(count, 10) || 0), 0);
  };

  const autoFillTotal = () => {
    const total = calculateTotalFromYears();
    setFormData({ ...formData, totalStudents: total.toString() });
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await api.get('/upload/template/exams', {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'exams_template.xlsx');
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

      const response = await api.post('/upload/exams', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setUploadResults(response.data);
      setUploadFile(null);
      document.getElementById('exam-file-input').value = '';
      if (response.data.results.success.length > 0) {
        setTimeout(() => navigate('/exam-coordinator/exams'), 2000);
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadError(error.response?.data?.message || 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const totalFromYears = calculateTotalFromYears();
      const totalStudents = parseInt(formData.totalStudents) || 0;
      
      // Validate that year breakdown sums to total students
      if (totalFromYears !== totalStudents && totalFromYears > 0) {
        if (!window.confirm(`Year breakdown (${totalFromYears}) doesn't match total students (${totalStudents}). Use year breakdown total?`)) {
          return;
        }
      }

      const examData = {
        department: formData.department,
        subject: formData.subject,
        date: formData.date,
        session: formData.session,
        totalStudents: totalFromYears > 0 ? totalFromYears : totalStudents,
        yearBreakdown: formData.yearBreakdown
      };

      await api.post('/exams', examData);
      alert('Exam created successfully!');
      navigate('/exam-coordinator/exams');
    } catch (error) {
      console.error('Error creating exam:', error);
      alert(error.response?.data?.message || 'Failed to create exam');
    } finally {
      setSubmitting(false);
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
        <div className="mb-6 pb-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Create Exam</h2>
          <button onClick={() => setShowUpload(!showUpload)} className="btn btn-secondary">
            {showUpload ? 'Hide Upload' : 'Upload'}
          </button>
        </div>

        {showUpload && (
          <div className="mb-6 p-6 bg-primary-50 rounded-lg">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Upload Exams</h3>
            <div className="mb-4 p-4 bg-primary-100 rounded-lg">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div>
                  <strong className="text-gray-900">Download Sample Template</strong>
                  <p className="mt-1 text-sm text-gray-600">
                    Download the Excel template to see the required format
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
                  id="exam-file-input"
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileChange}
                  className="form-input"
                  required
                />
                <small className="block mt-1 text-xs text-gray-500">
                  Maximum file size: 10MB. Columns: Subject, Department, Date, Session, TotalStudents, Year1-4
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
                          Row {item.row}: {item.subject} - {item.date} ({item.session})
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
      </div>

      <div className="card">
        <div className="mb-6 pb-4 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Create Single Exam</h2>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="form-label">Department *</label>
            <select
              name="department"
              value={formData.department}
              onChange={handleChange}
              className="form-select"
              required
            >
              <option value="">Select Department</option>
              {departments.map((d) => (
                <option key={d._id} value={d._id}>{d.name} {d.code ? `(${d.code})` : ''}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label">Subject *</label>
            <select
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              className="form-select"
              required
            >
              <option value="">Select Subject</option>
              {subjects.map((s) => (
                <option key={s._id} value={s._id}>{s.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="form-label">Date *</label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className="form-input"
              required
            />
          </div>

          <div>
            <label className="form-label">Session *</label>
            <select
              name="session"
              value={formData.session}
              onChange={handleChange}
              className="form-select"
              required
            >
              <option value="FN">FN</option>
              <option value="AN">AN</option>
            </select>
          </div>
        </div>

        <div>
          <label className="form-label">Total Students *</label>
          <input
            type="number"
            name="totalStudents"
            value={formData.totalStudents}
            onChange={handleChange}
            className="form-input"
            min="1"
            required
          />
          <small className="block mt-1 text-xs text-gray-500">Or fill year breakdown below to auto-calculate</small>
        </div>

        <div>
          <label className="form-label">Year-wise Student Breakdown</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-2">
            {[1, 2, 3, 4].map(year => (
              <div key={year}>
                <label className="form-label text-sm">
                  Year {year}
                </label>
                <input
                  type="number"
                  value={formData.yearBreakdown[year.toString()]}
                  onChange={(e) => handleYearChange(year.toString(), e.target.value)}
                  className="form-input"
                  min="0"
                  placeholder="0"
                />
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <small className="text-xs text-gray-500">
              Year total: <strong className="text-gray-900">{calculateTotalFromYears()}</strong>
            </small>
            {calculateTotalFromYears() > 0 && (
              <button
                type="button"
                onClick={autoFillTotal}
                className="btn btn-secondary text-xs px-3 py-1"
              >
                Use as Total
              </button>
            )}
          </div>
          <small className="block mt-1 text-xs text-gray-500">
            Enter student count for each year. Can be all from one year or mixed (e.g., 15 from Year 3, 15 from Year 4).
          </small>
        </div>

        <button type="submit" className="btn btn-primary w-full sm:w-auto" disabled={submitting}>
          {submitting ? 'Creating...' : 'Create Exam'}
        </button>
      </form>
      </div>
    </div>
  );
};

export default CreateExam;

