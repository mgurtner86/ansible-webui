const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'manager' | 'operator' | 'viewer';
  mfa_enabled: boolean;
  created_at: string;
  last_login: string | null;
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

  async register(email: string, password: string, username: string): Promise<AuthResponse> {
    return this.request<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, username }),
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
}

export const api = new ApiClient(API_BASE_URL);
export type { User, Session, AuthResponse };
