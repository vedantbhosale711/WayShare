import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../api/index.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    const token = localStorage.getItem('ws_token');
    if (!token) { setLoading(false); return; }
    try {
      const res = await authApi.getMe();
      setUser(res.data);
    } catch {
      localStorage.removeItem('ws_token');
      localStorage.removeItem('ws_user');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadUser(); }, [loadUser]);

  const login = async (email, password) => {
    const res = await authApi.login({ email, password });
    localStorage.setItem('ws_token', res.data.token);
    setUser(res.data.user);
    return res.data.user;
  };

  const register = async (data) => {
    const res = await authApi.register(data);
    localStorage.setItem('ws_token', res.data.token);
    setUser(res.data.user);
    return res.data.user;
  };

  const logout = () => {
    localStorage.removeItem('ws_token');
    localStorage.removeItem('ws_user');
    setUser(null);
  };

  const refreshUser = async () => {
    const res = await authApi.getMe();
    setUser(res.data);
    return res.data;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
