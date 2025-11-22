import { supabase } from './supabase';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001/api';

export const api = {
  async get(endpoint: string, includeAuth: boolean = false) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (includeAuth) {
      const token = localStorage.getItem('supabase.auth.token');
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
    }
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, { headers });
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    return response.json();
  },

  async post(endpoint: string, data: any, includeAuth: boolean = false) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (includeAuth) {
      const token = localStorage.getItem('supabase.auth.token');
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
    }
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    return response.json();
  },
  
  put: async (endpoint: string, data: any) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return response.json();
  },
  
  delete: async (endpoint: string) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
    });
    return response.json();
  },
};