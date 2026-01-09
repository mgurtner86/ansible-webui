const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface User {
  id: string;
  full_name: string;
  email: string;
  role: 'admin' | 'manager' | 'operator' | 'viewer';
  mfa_enabled: boolean;
  is_active: boolean;
  created_at: string;
  last_login_at: string | null;
}

interface Session {
  userId: string;
  email: string;
}

interface AuthResponse {
  user: User;
  session: Session;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || `Request failed with status ${response.status}`);
    }

    return response.json();
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    return this.request<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(email: string, password: string, fullName: string): Promise<AuthResponse> {
    return this.request<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, full_name: fullName }),
    });
  }

  async logout(): Promise<void> {
    await this.request('/api/auth/logout', {
      method: 'POST',
    });
  }

  async getSession(): Promise<{ user: User | null; session: Session | null }> {
    return this.request('/api/auth/session');
  }

  async getInventories(): Promise<any[]> {
    return this.request('/api/inventories');
  }

  async getInventory(id: string): Promise<any> {
    return this.request(`/api/inventories/${id}`);
  }

  async createInventory(data: any): Promise<any> {
    return this.request('/api/inventories', { method: 'POST', body: JSON.stringify(data) });
  }

  async updateInventory(id: string, data: any): Promise<any> {
    return this.request(`/api/inventories/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }

  async deleteInventory(id: string): Promise<void> {
    return this.request(`/api/inventories/${id}`, { method: 'DELETE' });
  }

  async getHosts(inventoryId: string): Promise<any[]> {
    return this.request(`/api/inventories/${inventoryId}/hosts`);
  }

  async createHost(inventoryId: string, data: any): Promise<any> {
    return this.request(`/api/inventories/${inventoryId}/hosts`, { method: 'POST', body: JSON.stringify(data) });
  }

  async updateHost(inventoryId: string, hostId: string, data: any): Promise<any> {
    return this.request(`/api/inventories/${inventoryId}/hosts/${hostId}`, { method: 'PUT', body: JSON.stringify(data) });
  }

  async deleteHost(inventoryId: string, hostId: string): Promise<void> {
    return this.request(`/api/inventories/${inventoryId}/hosts/${hostId}`, { method: 'DELETE' });
  }

  async getCredentials(): Promise<any[]> {
    return this.request('/api/credentials');
  }

  async getCredential(id: string): Promise<any> {
    return this.request(`/api/credentials/${id}`);
  }

  async createCredential(data: any): Promise<any> {
    return this.request('/api/credentials', { method: 'POST', body: JSON.stringify(data) });
  }

  async updateCredential(id: string, data: any): Promise<any> {
    return this.request(`/api/credentials/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }

  async deleteCredential(id: string): Promise<void> {
    return this.request(`/api/credentials/${id}`, { method: 'DELETE' });
  }

  async getProjects(): Promise<any[]> {
    return this.request('/api/projects');
  }

  async getProject(id: string): Promise<any> {
    return this.request(`/api/projects/${id}`);
  }

  async createProject(data: any): Promise<any> {
    return this.request('/api/projects', { method: 'POST', body: JSON.stringify(data) });
  }

  async updateProject(id: string, data: any): Promise<any> {
    return this.request(`/api/projects/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }

  async deleteProject(id: string): Promise<void> {
    return this.request(`/api/projects/${id}`, { method: 'DELETE' });
  }

  async syncProject(id: string): Promise<void> {
    return this.request(`/api/projects/${id}/sync`, { method: 'POST' });
  }

  async getPlaybooks(projectId: string): Promise<any[]> {
    return this.request(`/api/projects/${projectId}/playbooks`);
  }

  async createPlaybook(projectId: string, data: any): Promise<any> {
    return this.request(`/api/projects/${projectId}/playbooks`, { method: 'POST', body: JSON.stringify(data) });
  }

  async getTemplates(): Promise<any[]> {
    return this.request('/api/templates');
  }

  async getTemplate(id: string): Promise<any> {
    return this.request(`/api/templates/${id}`);
  }

  async createTemplate(data: any): Promise<any> {
    return this.request('/api/templates', { method: 'POST', body: JSON.stringify(data) });
  }

  async updateTemplate(id: string, data: any): Promise<any> {
    return this.request(`/api/templates/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }

  async deleteTemplate(id: string): Promise<void> {
    return this.request(`/api/templates/${id}`, { method: 'DELETE' });
  }

  async getJobs(): Promise<any[]> {
    return this.request('/api/jobs');
  }

  async getJob(id: string): Promise<any> {
    return this.request(`/api/jobs/${id}`);
  }

  async createJob(data: any): Promise<any> {
    return this.request('/api/jobs', { method: 'POST', body: JSON.stringify(data) });
  }

  async cancelJob(id: string): Promise<any> {
    return this.request(`/api/jobs/${id}/cancel`, { method: 'POST' });
  }

  async getJobEvents(id: string): Promise<any[]> {
    return this.request(`/api/jobs/${id}/events`);
  }

  async getSchedules(): Promise<any[]> {
    return this.request('/api/schedules');
  }

  async getSchedule(id: string): Promise<any> {
    return this.request(`/api/schedules/${id}`);
  }

  async createSchedule(data: any): Promise<any> {
    return this.request('/api/schedules', { method: 'POST', body: JSON.stringify(data) });
  }

  async updateSchedule(id: string, data: any): Promise<any> {
    return this.request(`/api/schedules/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }

  async deleteSchedule(id: string): Promise<void> {
    return this.request(`/api/schedules/${id}`, { method: 'DELETE' });
  }

  async toggleSchedule(id: string): Promise<any> {
    return this.request(`/api/schedules/${id}/toggle`, { method: 'POST' });
  }
}

export const api = new ApiClient(API_BASE_URL);
export type { User, Session, AuthResponse };
