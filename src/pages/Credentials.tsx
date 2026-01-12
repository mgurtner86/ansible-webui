import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import Layout from '../components/Layout';
import { Plus, Key, X, Trash2, Pencil } from 'lucide-react';

export default function Credentials() {
  const [credentials, setCredentials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
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

  function handleEdit(credential: any) {
    setEditingId(credential.id);
    setFormData({
      type: credential.type,
      name: credential.name,
      description: credential.description || '',
      secret: { username: '', password: '', privateKey: '' },
      scope: credential.scope,
    });
    setShowForm(true);
  }

  function handleCancel() {
    setShowForm(false);
    setEditingId(null);
    setFormData({
      type: 'ssh',
      name: '',
      description: '',
      secret: { username: '', password: '', privateKey: '' },
      scope: 'user',
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (editingId) {
        await api.credentials.update(editingId, formData);
      } else {
        await api.credentials.create(formData);
      }
      await loadCredentials();
      handleCancel();
    } catch (error) {
      console.error('Failed to save credential:', error);
      alert('Failed to save credential');
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;
    try {
      await api.credentials.delete(id);
      await loadCredentials();
    } catch (error) {
      console.error('Failed to delete credential:', error);
      alert('Failed to delete credential');
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-slate-500 dark:text-slate-400">Loading...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-light text-slate-900 dark:text-slate-100">Credentials</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">Secure credential storage for SSH, API keys, and more</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 shadow-md transition-all duration-200"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Credential
          </button>
        </div>

        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-slate-200/60 dark:border-slate-700/60">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-light text-slate-900 dark:text-slate-100">
                  {editingId ? 'Edit Credential' : 'Create New Credential'}
                </h2>
                <button
                  onClick={handleCancel}
                  className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                  >
                    <option value="ssh">SSH</option>
                    <option value="vault">Vault</option>
                    <option value="api_token">API Token</option>
                    <option value="cloud">Cloud</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                    rows={2}
                  />
                </div>
                {formData.type === 'ssh' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Username</label>
                      <input
                        type="text"
                        value={formData.secret.username}
                        onChange={(e) => setFormData({
                          ...formData,
                          secret: { ...formData.secret, username: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Password</label>
                      <input
                        type="password"
                        value={formData.secret.password}
                        onChange={(e) => setFormData({
                          ...formData,
                          secret: { ...formData.secret, password: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Private Key</label>
                      <textarea
                        value={formData.secret.privateKey}
                        onChange={(e) => setFormData({
                          ...formData,
                          secret: { ...formData.secret, privateKey: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 font-mono text-xs"
                        rows={4}
                        placeholder="-----BEGIN RSA PRIVATE KEY-----"
                      />
                    </div>
                  </>
                )}
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-4 py-2 text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 shadow-md transition-all duration-200"
                  >
                    {editingId ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4">
          {credentials.map((credential) => (
            <div key={credential.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 border border-slate-200/60 dark:border-slate-700/60">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <Key className="w-5 h-5 text-slate-400 dark:text-slate-500 mt-1" />
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{credential.name}</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{credential.description}</p>
                    <div className="flex items-center space-x-3 mt-2 text-sm text-slate-500 dark:text-slate-400">
                      <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded">{credential.type}</span>
                      <span>•</span>
                      <span>{credential.scope}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleEdit(credential)}
                    className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-700 rounded-xl transition-colors"
                    title="Edit credential"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(credential.id, credential.name)}
                    className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-slate-700 rounded-xl transition-colors"
                    title="Delete credential"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {credentials.length === 0 && (
            <div className="text-center py-12 text-slate-500 dark:text-slate-400">
              No credentials yet. Create one to get started.
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
