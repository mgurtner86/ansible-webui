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
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-blue-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center px-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -right-1/4 w-96 h-96 bg-blue-400/20 dark:bg-blue-600/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-1/2 -left-1/4 w-96 h-96 bg-cyan-400/20 dark:bg-cyan-600/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl mb-6 shadow-xl">
            <Server className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-5xl font-light tracking-tight text-slate-800 dark:text-slate-100">
            Ansible <span className="font-semibold">Tower</span>
          </h2>
          <p className="mt-3 text-slate-500 dark:text-slate-400 text-lg">Sign in to your account</p>
        </div>

        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md p-10 rounded-2xl shadow-2xl border border-slate-200/60 dark:border-slate-700/60">
          {microsoftEnabled && (
            <div className="flex bg-slate-100/50 rounded-xl p-1 mb-8">
              <button
                type="button"
                onClick={() => setLoginMethod('local')}
                className={`flex-1 py-3 px-4 text-sm font-medium rounded-lg transition-all duration-200 ${
                  loginMethod === 'local'
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                Local Login
              </button>
              <button
                type="button"
                onClick={() => setLoginMethod('microsoft')}
                className={`flex-1 py-3 px-4 text-sm font-medium rounded-lg transition-all duration-200 ${
                  loginMethod === 'microsoft'
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                Microsoft 365
              </button>
            </div>
          )}

          {error && (
            <div className="bg-gradient-to-r from-red-50 to-red-100 border border-red-200 text-red-700 px-5 py-4 rounded-xl text-sm mb-6 shadow-sm">
              {error}
            </div>
          )}

          {loginMethod === 'local' ? (
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-5">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Email address
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-5 py-3.5 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white/50 dark:bg-slate-700/50 dark:text-slate-100 backdrop-blur-sm"
                    placeholder="admin@ansible-tower.local"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-5 py-3.5 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white/50 dark:bg-slate-700/50 dark:text-slate-100 backdrop-blur-sm"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-4 px-6 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:shadow-xl hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg"
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>

              <div className="text-center text-sm">
                <p className="text-slate-600 dark:text-slate-400 mb-2">Default credentials:</p>
                <div className="font-mono text-xs bg-slate-100 dark:bg-slate-700 px-4 py-3 rounded-lg text-slate-700 dark:text-slate-300">
                  admin@ansible-tower.local / admin123
                </div>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              <p className="text-sm text-slate-600 text-center">
                Sign in with your Microsoft 365 account
              </p>
              <button
                onClick={handleMicrosoftLogin}
                disabled={loading}
                className="w-full flex justify-center items-center py-4 px-6 border-2 border-slate-300 rounded-xl shadow-sm text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 hover:shadow-md hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {loading ? (
                  'Redirecting...'
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-3" viewBox="0 0 21 21">
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
