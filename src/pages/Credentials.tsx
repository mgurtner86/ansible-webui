import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import Layout from '../components/Layout';
import { Plus, Key, X } from 'lucide-react';

export default function Credentials() {
  const [credentials, setCredentials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    type: 'ssh',
    name: '',
    description: '',
    secret: {
      username: '',
      password: '',
      privateKey: '',
    },
    scope: 'user',
  });

  useEffect(() => {
    loadCredentials();
  }, []);

  async function loadCredentials() {
    try {
      const data = await api.credentials.list();
      setCredentials(data);
    } catch (error) {
      console.error('Failed to load credentials:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api.credentials.create(formData);
      await loadCredentials();
      setShowForm(false);
      setFormData({
        type: 'ssh',
        name: '',
        description: '',
        secret: { username: '', password: '', privateKey: '' },
        scope: 'user',
      });
    } catch (error) {
      console.error('Failed to create credential:', error);
      alert('Failed to create credential');
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Credentials</h1>
            <p className="text-gray-600 mt-1">Secure credential storage for SSH, API keys, and more</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Credential
          </button>
        </div>

        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Create New Credential</h2>
                <button
                  onClick={() => setShowForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="ssh">SSH</option>
                    <option value="vault">Vault</option>
                    <option value="api_token">API Token</option>
                    <option value="cloud">Cloud</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows={2}
                  />
                </div>
                {formData.type === 'ssh' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                      <input
                        type="text"
                        value={formData.secret.username}
                        onChange={(e) => setFormData({
                          ...formData,
                          secret: { ...formData.secret, username: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                      <input
                        type="password"
                        value={formData.secret.password}
                        onChange={(e) => setFormData({
                          ...formData,
                          secret: { ...formData.secret, password: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Private Key</label>
                      <textarea
                        value={formData.secret.privateKey}
                        onChange={(e) => setFormData({
                          ...formData,
                          secret: { ...formData.secret, privateKey: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-xs"
                        rows={4}
                        placeholder="-----BEGIN RSA PRIVATE KEY-----"
                      />
                    </div>
                  </>
                )}
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Create
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4">
          {credentials.map((credential) => (
            <div key={credential.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <Key className="w-5 h-5 text-gray-400 mt-1" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{credential.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{credential.description}</p>
                    <div className="flex items-center space-x-3 mt-2 text-sm text-gray-500">
                      <span className="px-2 py-1 bg-gray-100 rounded">{credential.type}</span>
                      <span>•</span>
                      <span>{credential.scope}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {credentials.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No credentials yet. Create one to get started.
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
