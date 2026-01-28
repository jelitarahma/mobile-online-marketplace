import React, { createContext, useState, useContext, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import api, { setUnauthorizedListener } from '../services/api';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Cek token saat app pertama kali dibuka
  useEffect(() => {
    loadStoredAuth();
    
    // Register unauthorized listener
    setUnauthorizedListener(() => {
      logout();
    });
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await SecureStore.getItemAsync('userToken');
      const storedUser = await SecureStore.getItemAsync('userData');
      
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.log('Error loading auth:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token: newToken, user: userData } = response.data;

      // Simpan ke SecureStore
      await SecureStore.setItemAsync('userToken', newToken);
      await SecureStore.setItemAsync('userData', JSON.stringify(userData));

      setToken(newToken);
      setUser(userData);

      return { success: true, user: userData };
    } catch (error) {
      console.log('Login error:', error.response?.data || error.message);
      const message = error.response?.data?.error || error.response?.data?.message || 'Login gagal';
      return { success: false, message };
    }
  };

  const register = async (username, email, password, role = 'customer') => {
    try {
      const response = await api.post('/auth/register', { 
        username, 
        email, 
        password, 
        role 
      });
      
      // Setelah register, auto login jika backend mengembalikan token
      if (response.data.token) {
        const { token: newToken, user: userData } = response.data;
        await SecureStore.setItemAsync('userToken', newToken);
        await SecureStore.setItemAsync('userData', JSON.stringify(userData));
        setToken(newToken);
        setUser(userData);
        return { success: true, autoLogin: true };
      }

      return { success: true, autoLogin: false };
    } catch (error) {
      console.log('Register error:', error.response?.data || error.message);
      const message = error.response?.data?.error || error.response?.data?.message || 'Registrasi gagal';
      return { success: false, message };
    }
  };

  const logout = async () => {
    try {
      await SecureStore.deleteItemAsync('userToken');
      await SecureStore.deleteItemAsync('userData');
      setToken(null);
      setUser(null);
    } catch (error) {
      console.log('Error logout:', error);
    }
  };

  const isAdmin = () => {
    return user?.role === 'admin';
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isLoggedIn: !!token,
        isAdmin: isAdmin(),
        login,
        register,
        logout,
      }}
    >
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
