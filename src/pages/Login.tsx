import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Server } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loginMethod, setLoginMethod] = useState<'local' | 'microsoft'>('local');
  const [microsoftEnabled, setMicrosoftEnabled] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    checkMicrosoftAuth();
  }, []);

  async function checkMicrosoftAuth() {
    try {
      const response = await fetch('http://localhost:3001/api/auth/config');
      const config = await response.json();
      setMicrosoftEnabled(config.microsoftEnabled);
    } catch (error) {
      console.error('Failed to check Microsoft auth status:', error);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signIn(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  }

  async function handleMicrosoftLogin() {
    setError('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:3001/api/auth/microsoft/login', {
        credentials: 'include',
      });
      const data = await response.json();

      if (data.authUrl) {
        window.location.href = data.authUrl;
      } else {
        setError('Failed to initiate Microsoft login');
        setLoading(false);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to initiate Microsoft login');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-lg mb-4">
            <Server className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Ansible Tower</h2>
          <p className="mt-2 text-gray-600">Sign in to your account</p>
        </div>

        <div className="bg-white p-8 rounded-xl shadow-lg">
          {microsoftEnabled && (
            <div className="flex border-b border-gray-200 mb-6">
              <button
                type="button"
                onClick={() => setLoginMethod('local')}
                className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
                  loginMethod === 'local'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Local Login
              </button>
              <button
                type="button"
                onClick={() => setLoginMethod('microsoft')}
                className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
                  loginMethod === 'microsoft'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Microsoft 365
              </button>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-6">
              {error}
            </div>
          )}

          {loginMethod === 'local' ? (
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email address
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="admin@ansible-tower.local"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>

              <div className="text-center text-sm text-gray-600">
                <p>Default credentials:</p>
                <p className="mt-1 font-mono text-xs bg-gray-100 px-3 py-2 rounded">
                  admin@ansible-tower.local / admin123
                </p>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              <p className="text-sm text-gray-600 text-center">
                Sign in with your Microsoft 365 account
              </p>
              <button
                onClick={handleMicrosoftLogin}
                disabled={loading}
                className="w-full flex justify-center items-center py-3 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  'Redirecting...'
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 21 21">
                      <rect x="1" y="1" width="9" height="9" fill="#f25022" />
                      <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
                      <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
                      <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
                    </svg>
                    Sign in with Microsoft
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
