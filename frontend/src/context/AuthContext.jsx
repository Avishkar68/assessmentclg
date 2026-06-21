import React, { createContext, useState, useEffect, useCallback } from 'react';
import authService from '../services/authService';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // Logout handler
  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch (e) {
      console.error('Failed to notify backend of logout:', e);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
      setToken(null);
    }
  }, []);

  // Handshake verification
  const checkAuth = useCallback(async () => {
    const activeToken = localStorage.getItem('token');
    if (!activeToken) {
      setLoading(false);
      return;
    }

    try {
      const response = await authService.getMe();
      if (response && response.success && response.data && response.data.user) {
        setUser(response.data.user);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      } else {
        logout();
      }
    } catch (error) {
      console.error('Auth verification handshake failed:', error);
      logout();
    } finally {
      setLoading(false);
    }
  }, [logout]);

  // Login handler
  const login = async (email, password) => {
    try {
      const response = await authService.login(email, password);
      if (response && response.success && response.data) {
        const { token: newToken, user: newUser } = response.data;
        localStorage.setItem('token', newToken);
        localStorage.setItem('user', JSON.stringify(newUser));
        setToken(newToken);
        setUser(newUser);
        return newUser;
      }
      throw new Error(response.message || 'Login failed.');
    } catch (error) {
      throw error.response?.data?.message || error.message || 'Login failed.';
    }
  };

  // Registration handler
  const register = async (name, email, password, role) => {
    try {
      const response = await authService.register(name, email, password, role);
      if (response && response.success && response.data) {
        const { token: newToken, user: newUser } = response.data;
        localStorage.setItem('token', newToken);
        localStorage.setItem('user', JSON.stringify(newUser));
        setToken(newToken);
        setUser(newUser);
        return newUser;
      }
      throw new Error(response.message || 'Registration failed.');
    } catch (error) {
      throw error.response?.data?.message || error.message || 'Registration failed.';
    }
  };

  useEffect(() => {
    checkAuth();
    
    // Listen for custom logout events dispatched by Axios interceptor
    const handleAuthLogout = () => {
      logout();
    };

    window.addEventListener('auth-logout', handleAuthLogout);
    return () => {
      window.removeEventListener('auth-logout', handleAuthLogout);
    };
  }, [checkAuth, logout]);

  const updateUserLocalState = useCallback((updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  }, []);

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    checkAuth,
    updateUserLocalState,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
