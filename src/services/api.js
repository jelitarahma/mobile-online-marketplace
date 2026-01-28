import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// GANTI URL INI dengan URL backend production Anda
const BASE_URL = 'https://backend-online-marketplace.vercel.app';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 detik timeout
});

// Listener mechanism for 401 errors
let unauthorizedListener = null;

export const setUnauthorizedListener = (listener) => {
  unauthorizedListener = listener;
};

// Request Interceptor: Tambahkan Token ke setiap request
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await SecureStore.getItemAsync('userToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.log('Error reading token:', error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle error 401 (Unauthorized)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && error.response.status === 401) {
      // Token expired atau invalid, hapus token dan redirect ke login
      await SecureStore.deleteItemAsync('userToken');
      await SecureStore.deleteItemAsync('userData');
      
      if (unauthorizedListener) {
        unauthorizedListener();
      }
    }
    return Promise.reject(error);
  }
);

export default api;
