import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createUserWithEmailAndPassword, sendEmailVerification, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../config/firebase';
import api from '../services/api';

const Signup = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: form, 2: OTP verification
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student',
    department: '',
    year: ''
  });
  const [departments, setDepartments] = useState([]);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [firebaseUid, setFirebaseUid] = useState(null);

  // Fetch departments on mount
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await api.get('/departments/public');
        setDepartments(response.data);
      } catch (error) {
        console.error('Error fetching departments:', error);
        // Don't show error to user, just log it
      }
    };
    fetchDepartments();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setError('');
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const response = await api.post('/auth/signup/send-otp', formData);
      
      if (response.data.developmentMode) {
        setSuccess(`OTP generated! Check your backend console/terminal for the OTP code. Then enter it below.`);
      } else {
        setSuccess(response.data.message);
      }
      
      setStep(2);
    } catch (error) {
      const errorMsg = error.response?.data?.message || 
                      error.response?.data?.errors?.[0]?.msg || 
                      'Failed to send OTP';
      setError(errorMsg);
      
      // If it mentions checking console, show helpful message
      if (errorMsg.includes('console') || errorMsg.includes('SMTP')) {
        setSuccess('OTP was generated. Please check your backend terminal/console for the OTP code.');
        setStep(2); // Still allow them to proceed to OTP step
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await api.post('/auth/signup/verify-otp', {
        email: formData.email,
        otp
      });

      // Store token and user data
      localStorage.setItem('token', response.data.token);
      
      // Redirect to dashboard
      navigate('/dashboard');
      // Reload to trigger auth context update
      setTimeout(() => window.location.reload(), 100);
    } catch (error) {
      setError(error.response?.data?.message || 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await api.post('/auth/resend-otp', {
        email: formData.email
      });
      setSuccess(response.data.message);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  if (step === 1) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-500 via-primary-600 to-purple-600 px-4 py-8">
        <div className="w-full max-w-md bg-white rounded-xl shadow-2xl p-6 sm:p-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Exam Schedule Management System</h1>
            <p className="text-gray-600 text-sm sm:text-base">Create your account</p>
          </div>

          {error && <div className="alert alert-error mb-4">{error}</div>}
          {success && <div className="alert alert-success mb-4">{success}</div>}

          <form onSubmit={handleSendOTP} className="space-y-4">
            <div>
              <label className="form-label">Full Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="form-input"
                required
                placeholder="Enter your full name"
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
                placeholder="yourname@psnacet.edu.in"
              />
              <small className="block mt-1 text-xs text-gray-500">Only @psnacet.edu.in emails are allowed</small>
            </div>

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
              <label className="form-label">Department *</label>
              <select
                name="department"
                value={formData.department}
                onChange={handleChange}
                className="form-select"
                required
              >
                <option value="">Select Department</option>
                {departments.map((dept) => (
                  <option key={dept._id} value={dept._id}>
                    {dept.name} {dept.code ? `(${dept.code})` : ''}
                  </option>
                ))}
              </select>
              {departments.length === 0 && (
                <small className="block mt-1 text-xs text-red-600">
                  No departments available. Please contact administrator.
                </small>
              )}
            </div>

            {formData.role === 'student' && (
              <div>
                <label className="form-label">Year *</label>
                <select
                  name="year"
                  value={formData.year}
                  onChange={handleChange}
                  className="form-select"
                  required
                >
                  <option value="">Select Year</option>
                  <option value="1">Year 1</option>
                  <option value="2">Year 2</option>
                  <option value="3">Year 3</option>
                  <option value="4">Year 4</option>
                </select>
              </div>
            )}

            <div>
              <label className="form-label">Password *</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="form-input"
                required
                minLength={6}
                placeholder="Minimum 6 characters"
              />
            </div>

            <div>
              <label className="form-label">Confirm Password *</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="form-input"
                required
                placeholder="Re-enter your password"
              />
            </div>

            <button type="submit" className="btn btn-primary w-full" disabled={loading}>
              {loading ? 'Sending OTP...' : 'Send OTP'}
            </button>

            <div className="text-center pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                Already have an account? <Link to="/login" className="text-primary-600 hover:text-primary-700 hover:underline font-medium">Login here</Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-500 via-primary-600 to-purple-600 px-4 py-8">
      <div className="w-full max-w-md bg-white rounded-xl shadow-2xl p-6 sm:p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Verify Your Email</h1>
          <p className="text-gray-600 text-sm sm:text-base">Enter the OTP sent to {formData.email}</p>
        </div>

        {error && <div className="alert alert-error mb-4">{error}</div>}
        {success && <div className="alert alert-success mb-4">{success}</div>}

        <form onSubmit={handleVerifyOTP} className="space-y-4">
          <div>
            <label className="form-label">OTP *</label>
            <input
              type="text"
              value={otp}
              onChange={(e) => {
                setOtp(e.target.value.replace(/\D/g, '').slice(0, 6));
                setError('');
              }}
              className="form-input text-center text-2xl tracking-widest"
              required
              maxLength={6}
              placeholder="Enter 6-digit OTP"
            />
          </div>

          <button type="submit" className="btn btn-primary w-full" disabled={loading}>
            {loading ? 'Verifying...' : 'Verify OTP'}
          </button>

          <div className="text-center pt-4 border-t border-gray-200 space-y-2">
            <p className="text-sm text-gray-600">
              Didn't receive OTP?{' '}
              <button
                type="button"
                onClick={handleResendOTP}
                className="text-primary-600 hover:text-primary-700 hover:underline font-medium"
                disabled={loading}
              >
                Resend OTP
              </button>
            </p>
            <p>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-sm text-primary-600 hover:text-primary-700 hover:underline font-medium"
                disabled={loading}
              >
                ← Back to signup
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Signup;

