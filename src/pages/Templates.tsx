import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import Layout from '../components/Layout';
import { Plus, Play, X, Trash2, Pencil } from 'lucide-react';
import type { Template } from '../types';

export default function Templates() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [inventories, setInventories] = useState<any[]>([]);
  const [credentials, setCredentials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    playbook_id: '',
    inventory_id: '',
    credential_id: '',
    forks: 5,
    verbosity: 0,
    become: false,
  });

  useEffect(() => {
    loadTemplates();
    loadProjects();
    loadInventories();
    loadCredentials();
  }, []);

  async function loadTemplates() {
    try {
      const data = await api.templates.list();
      setTemplates(data);
    } catch (error) {
      console.error('Failed to load templates:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadProjects() {
    try {
      const data = await api.playbooks.list();
      setProjects(data);
    } catch (error) {
      console.error('Failed to load playbooks:', error);
    }
  }

  async function loadInventories() {
    try {
      const data = await api.inventories.list();
      setInventories(data);
    } catch (error) {
      console.error('Failed to load inventories:', error);
    }
  }

  async function loadCredentials() {
    try {
      const data = await api.credentials.list();
      setCredentials(data);
    } catch (error) {
      console.error('Failed to load credentials:', error);
    }
  }

  function handleEdit(template: Template) {
    setEditingId(template.id);
    setFormData({
      name: template.name,
      description: template.description || '',
      playbook_id: template.playbook_id,
      inventory_id: template.inventory_id,
      credential_id: template.credential_id || '',
      forks: template.forks || 5,
      verbosity: template.verbosity || 0,
      become: template.become || false,
    });
    setShowForm(true);
  }

  function handleCancel() {
    setShowForm(false);
    setEditingId(null);
    setFormData({
      name: '',
      description: '',
      playbook_id: '',
      inventory_id: '',
      credential_id: '',
      forks: 5,
      verbosity: 0,
      become: false,
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (editingId) {
        await api.templates.update(editingId, formData);
      } else {
        await api.templates.create(formData);
      }
      await loadTemplates();
      handleCancel();
    } catch (error) {
      console.error('Failed to save template:', error);
      alert('Failed to save template');
    }
  }

  async function handleLaunch(id: string) {
    try {
      await api.templates.launch(id, {});
      alert('Job launched successfully!');
    } catch (error) {
      console.error('Failed to launch template:', error);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;
    try {
      await api.templates.delete(id);
      await loadTemplates();
    } catch (error) {
      console.error('Failed to delete template:', error);
      alert('Failed to delete template');
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
            <h1 className="text-2xl font-bold text-gray-900">Templates</h1>
            <p className="text-gray-600 mt-1">Job templates for running playbooks</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Template
          </button>
        </div>

        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  {editingId ? 'Edit Template' : 'Create New Template'}
                </h2>
                <button
                  onClick={handleCancel}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Playbook</label>
                  <select
                    required
                    value={formData.playbook_id}
                    onChange={(e) => setFormData({ ...formData, playbook_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a playbook...</option>
                    {projects.map((playbook: any) => (
                      <option key={playbook.id} value={playbook.id}>
                        {playbook.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Inventory</label>
                  <select
                    required
                    value={formData.inventory_id}
                    onChange={(e) => setFormData({ ...formData, inventory_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select an inventory...</option>
                    {inventories.map((inventory) => (
                      <option key={inventory.id} value={inventory.id}>
                        {inventory.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Credential (Optional)</label>
                  <select
                    value={formData.credential_id}
                    onChange={(e) => setFormData({ ...formData, credential_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">No credential</option>
                    {credentials.map((credential) => (
                      <option key={credential.id} value={credential.id}>
                        {credential.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Forks</label>
                    <input
                      type="number"
                      value={formData.forks}
                      onChange={(e) => setFormData({ ...formData, forks: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      min="1"
                      max="100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Verbosity</label>
                    <select
                      value={formData.verbosity}
                      onChange={(e) => setFormData({ ...formData, verbosity: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="0">0 (Normal)</option>
                      <option value="1">1 (-v)</option>
                      <option value="2">2 (-vv)</option>
                      <option value="3">3 (-vvv)</option>
                      <option value="4">4 (-vvvv)</option>
                    </select>
                  </div>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="become"
                    checked={formData.become}
                    onChange={(e) => setFormData({ ...formData, become: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="become" className="ml-2 text-sm text-gray-700">
                    Enable privilege escalation (become)
                  </label>
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    {editingId ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4">
          {templates.map((template) => (
            <div key={template.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">{template.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                  <div className="flex items-center space-x-4 mt-3 text-sm text-gray-600">
                    <span>Playbook: {template.playbook_name}</span>
                    <span>•</span>
                    <span>Inventory: {template.inventory_name}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleLaunch(template.id)}
                    className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Launch
                  </button>
                  <button
                    onClick={() => handleEdit(template)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Edit template"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(template.id, template.name)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete template"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {templates.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No templates yet. Create one to get started.
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
