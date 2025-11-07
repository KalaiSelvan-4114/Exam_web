import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const SubjectManagement = () => {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    semester: ''
  });
  const [showUpload, setShowUpload] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState(null);
  const [uploadError, setUploadError] = useState('');

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      const response = await api.get('/subjects');
      setSubjects(response.data);
    } catch (error) {
      console.error('Error fetching subjects:', error);
      alert('Failed to fetch subjects');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/subjects', {
        ...formData,
        semester: parseInt(formData.semester)
      });
      alert('Subject created successfully!');
      setShowForm(false);
      setFormData({ name: '', code: '', semester: '' });
      fetchSubjects();
    } catch (error) {
      console.error('Error creating subject:', error);
      alert(error.response?.data?.message || 'Failed to create subject');
    }
  };

  const handleDelete = async (subjectId) => {
    if (!window.confirm('Are you sure you want to delete this subject?')) return;

    try {
      await api.delete(`/subjects/${subjectId}`);
      fetchSubjects();
    } catch (error) {
      console.error('Error deleting subject:', error);
      alert(error.response?.data?.message || 'Failed to delete subject');
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await api.get('/upload/template/subjects', {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'subjects_template.xlsx');
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

      const response = await api.post('/upload/subjects', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setUploadResults(response.data);
      setUploadFile(null);
      document.getElementById('subject-file-input').value = '';
      fetchSubjects();
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
          <h2 className="text-2xl font-bold text-gray-900">Subject Management</h2>
          <div className="flex gap-2">
            <button onClick={() => setShowUpload(!showUpload)} className="btn btn-secondary">
              {showUpload ? 'Cancel Upload' : 'Upload'}
            </button>
            <button onClick={() => setShowForm(!showForm)} className="btn btn-primary">
              {showForm ? 'Cancel' : 'Add Subject'}
            </button>
          </div>
        </div>

        {showUpload && (
          <div className="mb-6 p-6 bg-primary-50 rounded-lg">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Upload Subjects</h3>
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
                  id="subject-file-input"
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileChange}
                  className="form-input"
                  required
                />
                <small className="block mt-1 text-xs text-gray-500">
                  Maximum file size: 10MB. Columns: Name, Code, Department, Semester
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
                          Row {item.row}: {item.name} ({item.code})
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

        {showForm && (
          <form onSubmit={handleSubmit} className="mb-6 p-6 bg-gray-50 rounded-lg space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Subject Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
              </div>

              <div>
                <label className="form-label">Subject Code *</label>
                <input
                  type="text"
                  name="code"
                  value={formData.code}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
              </div>
            </div>

            <div>
              <label className="form-label">Semester *</label>
              <select
                name="semester"
                value={formData.semester}
                onChange={handleChange}
                className="form-select"
                required
              >
                <option value="">Select Semester</option>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                  <option key={sem} value={sem}>
                    Semester {sem}
                  </option>
                ))}
              </select>
            </div>

            <button type="submit" className="btn btn-primary">
              Create Subject
            </button>
          </form>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Semester</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {subjects.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-4 py-8 text-center text-gray-500">
                    No subjects found
                  </td>
                </tr>
              ) : (
                subjects.map((subject) => (
                  <tr key={subject._id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{subject.name}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">{subject.code}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">Semester {subject.semester}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">{subject.department?.name || '-'}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => handleDelete(subject._id)}
                        className="btn btn-danger text-xs px-3 py-1.5"
                      >
                        Delete
                      </button>
                    </td>
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

export default SubjectManagement;
