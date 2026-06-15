import React, { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const response = await fetch('/api/auth/profile', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const result = await response.json();
        
        if (result.success) {
          // Map backend 'name' to frontend 'username' and 'fullName'
          const userData = {
            ...result.data,
            username: result.data.name || result.data.username || '',
            fullName: result.data.name || result.data.fullName || ''
          };
          setUser(userData);
        } else {
          // Token is invalid/expired
          logout();
        }
      } catch (err) {
        console.error('Error validation token:', err);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [token]);

  const login = async (email, password) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });
    const result = await response.json();

    if (result.success) {
      localStorage.setItem('token', result.data.token);
      setToken(result.data.token);
      setUser({
        _id: result.data._id,
        username: result.data.name || result.data.username || '',
        fullName: result.data.name || result.data.fullName || '',
        email: result.data.email
      });
      return { success: true };
    } else {
      return { 
        success: false, 
        errors: result.errors || [{ message: result.error || 'Login failed' }] 
      };
    }
  };

  const register = async (username, email, password) => {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, email, password, name: username })
    });
    const result = await response.json();

    if (result.success) {
      localStorage.setItem('token', result.data.token);
      setToken(result.data.token);
      setUser({
        _id: result.data._id,
        username: result.data.name || result.data.username || '',
        fullName: result.data.name || result.data.fullName || '',
        email: result.data.email
      });
      return { success: true };
    } else {
      return { 
        success: false, 
        errors: result.errors || [{ message: result.error || 'Signup failed' }] 
      };
    }
  };

  const logout = async () => {
    try {
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      }
    } catch (err) {
      console.error('Logout error:', err);
    }
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const authenticatedFetch = async (url, options = {}) => {
    const headers = options.headers || {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return fetch(url, {
      ...options,
      headers
    });
  };

  return (
    <AuthContext.Provider value={{ user, setUser, token, loading, login, register, logout, authenticatedFetch }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
