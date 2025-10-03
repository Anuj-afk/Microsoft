import axios from 'axios';

// Base URL configuration - change this to update the entire app
// const BASE_URL = 'http://localhost:3000';
const BASE_URL = 'https://microsoft-bc4e.onrender.com';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: `${BASE_URL}/api`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle common errors
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API endpoints object for better organization
export const API_ENDPOINTS = {
  // Auth endpoints
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    ME: '/auth/me',
    USERS: '/auth/users',
    USER_BY_ID: (id) => `/auth/users/${id}`,
    USER_ROLE: (id) => `/auth/users/${id}/role`,
    USER_PERMISSIONS: (id) => `/auth/users/${id}/permissions`,
    TOGGLE_STATUS: (id) => `/auth/users/${id}/toggle-status`,
  },
  
  // Categories endpoints
  CATEGORIES: {
    BASE: '/categories',
    BY_ID: (id) => `/categories/${id}`,
    BY_SLUG: (slug) => `/categories/by-slug/${slug}`,
  },
  
  // Devices/Products endpoints
  DEVICES: {
    BASE: '/devices',
    FEATURED: '/devices/featured',
    BY_ID: (id) => `/devices/${id}`,
    BY_SLUG: (slug) => `/devices/by-slug/${slug}`,
    BY_CATEGORY: (slug) => `/devices/category/${slug}`,
    ADMIN_CATEGORY: (slug) => `/devices/admin/category/${slug}`,
    STOCK: (id) => `/devices/${id}/stock`,
    FEATURED_TOGGLE: (id) => `/devices/${id}/featured`,
    STATS: '/devices/stats/overview',
  },
  
  // Media endpoints
  MEDIA: {
    BASE: '/media',
    LOGO: '/media/logo',
    DELETE: (id) => `/media/${id}`,
    UPLOAD: '/media/upload',
  },
  
  // Pages endpoints
  PAGES: {
    BASE: '/pages',
    HOME: '/pages/home',
    BY_ID: (id) => `/pages/${id}`,
    BY_SLUG: (slug) => `/pages/by-slug/${slug}`,
  },
  
  // Offers endpoints
  OFFERS: {
    BASE: '/offers',
    FEATURED: '/offers/featured',
    BY_LOCATION: (location) => `/offers/location/${location}`,
    BY_ID: (id) => `/offers/${id}`,
    CLICK: (id) => `/offers/${id}/click`,
    VIEW: (id) => `/offers/${id}/view`,
    DEBUG: '/offers/debug/all',
  },
  
  // Settings endpoints
  SETTINGS: {
    BASE: '/settings',
    BANNER: '/settings/banner',
    OFFER: '/settings/offer',
  },
};

// Helper functions for common API calls
export const apiHelpers = {
  // Generic GET request
  get: (endpoint, config = {}) => api.get(endpoint, config),
  
  // Generic POST request
  post: (endpoint, data = {}, config = {}) => api.post(endpoint, data, config),
  
  // Generic PUT request
  put: (endpoint, data = {}, config = {}) => api.put(endpoint, data, config),
  
  // Generic PATCH request
  patch: (endpoint, data = {}, config = {}) => api.patch(endpoint, data, config),
  
  // Generic DELETE request
  delete: (endpoint, config = {}) => api.delete(endpoint, config),
  
  // File upload helper
  uploadFile: (endpoint, file, additionalData = {}) => {
    const formData = new FormData();
    
    if (file instanceof FileList) {
      // Multiple files
      Array.from(file).forEach(f => formData.append('files', f));
    } else if (file instanceof File) {
      // Single file
      formData.append('file', file);
    }
    
    // Add additional data to form
    Object.keys(additionalData).forEach(key => {
      formData.append(key, additionalData[key]);
    });
    
    return api.post(endpoint, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  
  // Query string builder
  buildQuery: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        query.set(key, value);
      }
    });
    return query.toString() ? `?${query.toString()}` : '';
  },
};

// Environment-specific configurations
export const getApiConfig = () => {
  const env = process.env.NODE_ENV || 'development';
  
  const configs = {
    development: {
      baseURL: 'http://localhost:3000',
      timeout: 10000,
    },
    production: {
      baseURL: 'https://your-production-domain.com', // Change this for production
      timeout: 15000,
    },
    staging: {
      baseURL: 'https://your-staging-domain.com', // Change this for staging
      timeout: 12000,
    },
  };
  
  return configs[env] || configs.development;
};

// Export the configured axios instance as default
export default api;

// Export BASE_URL for direct use if needed
export { BASE_URL };
