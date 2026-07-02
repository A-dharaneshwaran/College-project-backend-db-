import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// For physical devices testing locally, localhost resolves to the device itself.
// We can use localhost for web and simulator, or allow a fallback mechanism.
const API_URL = process.env.EXPO_PUBLIC_API_URL || (Platform.OS === 'web' 
  ? 'http://localhost:5000/api'
  : 'http://10.0.2.2:5000/api');

let onUnauthorizedCallback = null;

export const setOnUnauthorized = (callback) => {
  onUnauthorizedCallback = callback;
};

let cachedToken = null;

export const setAuthToken = async (token) => {
  cachedToken = token;
  await AsyncStorage.setItem('token', token);
};

export const getAuthToken = async () => {
  if (cachedToken) return cachedToken;
  cachedToken = await AsyncStorage.getItem('token');
  return cachedToken;
};

export const removeAuthToken = async () => {
  cachedToken = null;
  await AsyncStorage.removeItem('token');
};

async function request(method, path, body) {
  const token = await getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json();

    if (response.status === 401 && !path.startsWith('/auth/login') && !path.startsWith('/auth/register')) {
      await removeAuthToken();
      if (onUnauthorizedCallback) onUnauthorizedCallback();
      throw new Error('Unauthorized');
    }

    if (!response.ok) {
      throw new Error(data.message || 'Something went wrong');
    }

    return data;
  } catch (error) {
    console.error(`API Error on ${method} ${path}:`, error.message);
    throw error;
  }
}

/**
 * Upload a file using multipart/form-data (for bulk import).
 * Does NOT set Content-Type — browser sets it automatically with boundary.
 */
async function uploadFile(path, formData, queryParams = '') {
  const token = await getAuthToken();
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const url = `${API_URL}${path}${queryParams}`;
  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: formData,
  });

  const data = await response.json();

  if (response.status === 401) {
    await removeAuthToken();
    if (onUnauthorizedCallback) onUnauthorizedCallback();
    throw new Error('Unauthorized');
  }

  if (!response.ok) {
    throw new Error(data.message || 'Upload failed');
  }

  return data;
}

/**
 * Download a file (export/template). Returns a Blob on web.
 */
async function downloadFile(path, queryParams = '') {
  const token = await getAuthToken();
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const url = `${API_URL}${path}${queryParams}`;
  const response = await fetch(url, { method: 'GET', headers });

  if (response.status === 401) {
    await removeAuthToken();
    if (onUnauthorizedCallback) onUnauthorizedCallback();
    throw new Error('Unauthorized');
  }

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.message || 'Download failed');
  }

  return {
    blob: await response.blob(),
    filename: (response.headers.get('Content-Disposition') || '')
      .split('filename=')[1]?.replace(/"/g, '') || 'download.xlsx',
  };
}

export const api = {
  get: (path) => request('GET', path),
  post: (path, body) => request('POST', path, body),
  put: (path, body) => request('PUT', path, body),
  patch: (path, body) => request('PATCH', path, body),
  delete: (path) => request('DELETE', path),
  upload: (path, formData, queryParams) => uploadFile(path, formData, queryParams),
  download: (path, queryParams) => downloadFile(path, queryParams),
};

export { API_URL };

