import { useState, useCallback } from 'react';
import { api } from '../services/api';

export const useAnalytics = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState({
    overview: null,
    attendance: null,
    performance: null,
    demographics: null,
    departments: null,
    activity: null,
    notifications: null,
    trends: null
  });

  const fetchAnalytics = useCallback(async (endpoint, filters = {}) => {
    setLoading(true);
    setError(null);
    try {
      const queryStr = Object.keys(filters)
        .filter(k => filters[k] !== undefined && filters[k] !== '')
        .map(k => `${k}=${encodeURIComponent(filters[k])}`)
        .join('&');
        
      const res = await api.get(`/analytics/${endpoint}?${queryStr}`);
      
      setData(prev => ({
        ...prev,
        [endpoint]: res.data
      }));
      
      return res.data;
    } catch (err) {
      setError(err.response?.data?.message || `Failed to load ${endpoint} analytics`);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const exportReport = useCallback(async (type, format, filters = {}) => {
    setLoading(true);
    setError(null);
    try {
      const queryStr = Object.keys(filters)
        .filter(k => filters[k] !== undefined && filters[k] !== '')
        .map(k => `${k}=${encodeURIComponent(filters[k])}`)
        .join('&');
        
      // For CSV/Excel (Blob download) using registered download handler
      const downloadRes = await api.download('/analytics/export', `?type=${type}&format=${format}&${queryStr}`);
      
      // Create a download link for the blob
      const url = window.URL.createObjectURL(downloadRes.blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', downloadRes.filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
    } catch (err) {
      setError(err.message || 'Failed to export report');
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    data,
    loading,
    error,
    fetchAnalytics,
    exportReport
  };
};
