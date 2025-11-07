import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken && storedToken !== token) {
      setToken(storedToken);
    } else if (token) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchUser = async () => {
    try {
      const response = await api.get('/auth/me');
      
      // Transform user object to match expected structure
      const userData = response.data;
      const userObj = {
        _id: userData._id,
        id: userData._id,
        name: userData.name,
        email: userData.email,
        role: userData.role,
        department: userData.department
      };
      
      setUser(userObj);
    } catch (error) {
      console.error('Error fetching user:', error);
      if (error.response?.status === 401) {
        // Token is invalid, clear it
        logout();
      } else {
        // Other error, but don't logout (might be network issue)
        setLoading(false);
      }
    } finally {
      setLoading(false);
    }
  };


  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
  };

  const value = {
    user,
    loading,
    logout,
    token
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

