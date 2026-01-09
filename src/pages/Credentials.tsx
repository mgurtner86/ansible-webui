import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit, Key } from 'lucide-react';
import { api } from '../lib/api';

export function Credentials() {
  const [credentials, setCredentials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ type: 'ssh', name: '', description: '', secret: { username: '', password: '', ssh_key: '' } });
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    loadCredentials();
  }, []);

  const loadCredentials = async () => {
    try {
      const data = await api.getCredentials();
      setCredentials(data);
    } catch (error) {
      console.error('Failed to load credentials:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.updateCredential(editingId, formData);
      } else {
        await api.createCredential(formData);
      }
      setShowForm(false);
      setFormData({ type: 'ssh', name: '', description: '', secret: { username: '', password: '', ssh_key: '' } });
      setEditingId(null);
      loadCredentials();
    } catch (error) {
      console.error('Failed to save credential:', error);
      alert('Failed to save credential');
    }
  };

  const handleEdit = async (credential: any) => {
    try {
      const fullCred = await api.getCredential(credential.id);
      setFormData({ type: fullCred.type, name: fullCred.name, description: fullCred.description || '', secret: fullCred.decrypted_secret ? JSON.parse(fullCred.decrypted_secret) : {} });
      setEditingId(credential.id);
      setShowForm(true);
    } catch (error) {
      console.error('Failed to load credential:', error);
      alert('Failed to load credential');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this credential?')) return;
    try {
      await api.deleteCredential(id);
      loadCredentials();
    } catch (error) {
      console.error('Failed to delete credential:', error);
      alert('Failed to delete credential');
    }
  };

  if (loading) return <div className="text-center py-8">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Credentials</h1>
          <p className="text-gray-600 mt-1">Manage SSH keys, Vault passwords, and API tokens</p>
        </div>
        <button onClick={() => { setFormData({ type: 'ssh', name: '', description: '', secret: { username: '', password: '', ssh_key: '' } }); setEditingId(null); setShowForm(true); }} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          <Plus className="w-5 h-5" />New Credential
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4">{editingId ? 'Edit Credential' : 'Create New Credential'}</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value as any })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="ssh">SSH</option>
                <option value="vault">Ansible Vault</option>
                <option value="api_token">API Token</option>
                <option value="cloud">Cloud Provider</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            {formData.type === 'ssh' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                  <input type="text" value={formData.secret.username || ''} onChange={(e) => setFormData({ ...formData, secret: { ...formData.secret, username: e.target.value } })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <input type="password" value={formData.secret.password || ''} onChange={(e) => setFormData({ ...formData, secret: { ...formData.secret, password: e.target.value } })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">SSH Private Key</label>
                  <textarea value={formData.secret.ssh_key || ''} onChange={(e) => setFormData({ ...formData, secret: { ...formData.secret, ssh_key: e.target.value } })} rows={6} placeholder="-----BEGIN RSA PRIVATE KEY-----" className="w-full px-3 py-2 font-mono text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </>
            )}
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">{editingId ? 'Update' : 'Create'}</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid gap-4">
        {credentials.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <Key className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">No credentials yet. Create one to get started.</p>
          </div>
        ) : (
          credentials.map((credential) => (
            <div key={credential.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <Key className="w-5 h-5 text-blue-600" />
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">{credential.name}</h3>
                    {credential.description && <p className="text-sm text-gray-600 mt-0.5">{credential.description}</p>}
                    <div className="flex gap-4 mt-2 text-sm text-gray-500">
                      <span>Type: {credential.type}</span>
                      <span>Scope: {credential.scope}</span>
                      <span>Owner: {credential.owner_name}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleEdit(credential)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit className="w-5 h-5" /></button>
                  <button onClick={() => handleDelete(credential.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-5 h-5" /></button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
