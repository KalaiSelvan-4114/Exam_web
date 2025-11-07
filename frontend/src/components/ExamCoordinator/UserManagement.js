import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'student',
    department: ''
  });
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
      const [usersRes, deptsRes] = await Promise.all([
        api.get('/users'),
        api.get('/departments')
      ]);
      setUsers(usersRes.data);
      setDepartments(deptsRes.data);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/users', formData);
      alert('User created successfully!');
      setShowForm(false);
      setFormData({ name: '', email: '', role: 'student', department: '' });
      fetchData();
    } catch (error) {
      console.error('Error creating user:', error);
      alert(error.response?.data?.message || 'Failed to create user');
    }
  };

  const handleToggleActive = async (userId, isActive) => {
    try {
      await api.put(`/users/${userId}`, { isActive: !isActive });
      fetchData();
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Failed to update user');
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;

    try {
      await api.delete(`/users/${userId}`);
      fetchData();
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user');
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await api.get('/upload/template/users', {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'users_template.xlsx');
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

      const response = await api.post('/upload/users', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setUploadResults(response.data);
      setUploadFile(null);
      document.getElementById('user-file-input').value = '';
      fetchData(); // Refresh user list
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

  const getRoleLabel = (role) => {
    const labels = {
      exam_coordinator: 'Exam Coordinator',
      department_coordinator: 'Department Coordinator',
      staff: 'Staff',
      student: 'Student'
    };
    return labels[role] || role;
  };

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="mb-6 pb-4 border-b border-gray-200 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
          <div className="flex gap-2">
            <button onClick={() => setShowUpload(!showUpload)} className="btn btn-secondary">
              {showUpload ? 'Cancel Upload' : 'Upload'}
            </button>
            <button onClick={() => setShowForm(!showForm)} className="btn btn-primary">
              {showForm ? 'Cancel' : 'Add User'}
            </button>
          </div>
        </div>

        {showUpload && (
          <div className="mb-6 p-6 bg-primary-50 rounded-lg">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Upload Users</h3>
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
                  id="user-file-input"
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileChange}
                  className="form-input"
                  required
                />
                <small className="block mt-1 text-xs text-gray-500">
                  Maximum file size: 10MB. Columns: Email, Name, Role, Department, Year, Password
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
                          Row {item.row}: {item.email || item.name}
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
                <label className="form-label">Name *</label>
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
                <label className="form-label">Email *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Role *</label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="form-select"
                  required
                >
                  <option value="student">Student</option>
                  <option value="staff">Staff</option>
                  <option value="department_coordinator">Department Coordinator</option>
                </select>
              </div>

              <div>
                <label className="form-label">Department</label>
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  className="form-select"
                  disabled={formData.role === 'exam_coordinator'}
                >
                  <option value="">Select Department</option>
                  {departments.map((dept) => (
                    <option key={dept._id} value={dept._id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button type="submit" className="btn btn-primary">
              Create User
            </button>
          </form>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.name}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">{user.email}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">{getRoleLabel(user.role)}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">{user.department?.name || '-'}</td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm">
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => handleToggleActive(user._id, user.isActive)}
                          className="btn btn-secondary text-xs px-3 py-1.5"
                        >
                          {user.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => handleDelete(user._id)}
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
    </div>
  );
};

export default UserManagement;

