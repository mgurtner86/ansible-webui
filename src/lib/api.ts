const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

async function request(endpoint: string, options: RequestInit = {}) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }

  return response.json();
}

export const api = {
  auth: {
    login: (email: string, password: string) =>
      request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),
    register: (email: string, password: string, full_name: string) =>
      request('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password, full_name }),
      }),
    logout: () => request('/auth/logout', { method: 'POST' }),
    getSession: () => request('/auth/session'),
  },

  projects: {
    list: () => request('/projects'),
    get: (id: string) => request(`/projects/${id}`),
    create: (data: any) => request('/projects', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => request(`/projects/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => request(`/projects/${id}`, { method: 'DELETE' }),
    sync: (id: string) => request(`/projects/${id}/sync`, { method: 'POST' }),
    getPlaybooks: (id: string) => request(`/projects/${id}/playbooks`),
  },

  playbooks: {
    list: () => request('/playbooks'),
    get: (id: string) => request(`/playbooks/${id}`),
    create: (data: any) => request('/playbooks', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => request(`/playbooks/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => request(`/playbooks/${id}`, { method: 'DELETE' }),
  },

  inventories: {
    list: () => request('/inventories'),
    get: (id: string) => request(`/inventories/${id}`),
    create: (data: any) => request('/inventories', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => request(`/inventories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => request(`/inventories/${id}`, { method: 'DELETE' }),
    getHosts: (id: string) => request(`/inventories/${id}/hosts`),
    createHost: (id: string, data: any) => request(`/inventories/${id}/hosts`, { method: 'POST', body: JSON.stringify(data) }),
    updateHost: (inventoryId: string, hostId: string, data: any) =>
      request(`/inventories/${inventoryId}/hosts/${hostId}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteHost: (inventoryId: string, hostId: string) =>
      request(`/inventories/${inventoryId}/hosts/${hostId}`, { method: 'DELETE' }),
  },

  templates: {
    list: () => request('/templates'),
    get: (id: string) => request(`/templates/${id}`),
    create: (data: any) => request('/templates', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => request(`/templates/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => request(`/templates/${id}`, { method: 'DELETE' }),
    launch: (id: string, data: any) => request(`/templates/${id}/launch`, { method: 'POST', body: JSON.stringify(data) }),
  },

  jobs: {
    list: () => request('/jobs'),
    get: (id: string) => request(`/jobs/${id}`),
    getEvents: (id: string) => request(`/jobs/${id}/events`),
    cancel: (id: string) => request(`/jobs/${id}/cancel`, { method: 'POST' }),
    delete: (id: string) => request(`/jobs/${id}`, { method: 'DELETE' }),
  },

  credentials: {
    list: () => request('/credentials'),
    get: (id: string) => request(`/credentials/${id}`),
    create: (data: any) => request('/credentials', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => request(`/credentials/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => request(`/credentials/${id}`, { method: 'DELETE' }),
  },

  schedules: {
    list: () => request('/schedules'),
    get: (id: string) => request(`/schedules/${id}`),
    create: (data: any) => request('/schedules', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => request(`/schedules/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => request(`/schedules/${id}`, { method: 'DELETE' }),
  },

  stats: () => request('/stats'),

  hosts: {
    create: (data: any) => request('/hosts', { method: 'POST', body: JSON.stringify(data) }),
  },

  audit: {
    list: (params?: { page?: number; limit?: number; action?: string; target_type?: string; actor_id?: string }) => {
      const query = new URLSearchParams();
      if (params?.page) query.set('page', params.page.toString());
      if (params?.limit) query.set('limit', params.limit.toString());
      if (params?.action) query.set('action', params.action);
      if (params?.target_type) query.set('target_type', params.target_type);
      if (params?.actor_id) query.set('actor_id', params.actor_id);
      return request(`/audit?${query.toString()}`);
    },
    stats: () => request('/audit/stats'),
  },

  settings: {
    list: (category?: string) => request(`/settings${category ? `?category=${category}` : ''}`),
    categories: () => request('/settings/categories'),
    get: (key: string) => request(`/settings/${key}`),
    update: (key: string, value: any) => request(`/settings/${key}`, { method: 'PUT', body: JSON.stringify({ value }) }),
    create: (data: any) => request('/settings', { method: 'POST', body: JSON.stringify(data) }),
    delete: (key: string) => request(`/settings/${key}`, { method: 'DELETE' }),
  },
};

export type { User, Session } from '../types';
