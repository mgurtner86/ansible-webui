import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import Layout from '../components/Layout';
import { Plus, FileText, X, Trash2 } from 'lucide-react';

export default function Playbooks() {
  const [playbooks, setPlaybooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    content: `---
- name: Example Playbook
  hosts: all
  tasks:
    - name: Print message
      debug:
        msg: "Hello from Ansible!"
`,
  });

  useEffect(() => {
    loadPlaybooks();
  }, []);

  async function loadPlaybooks() {
    try {
      const data = await api.playbooks.list();
      setPlaybooks(data);
    } catch (error) {
      console.error('Failed to load playbooks:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api.playbooks.create(formData);
      await loadPlaybooks();
      setShowForm(false);
      setFormData({
        name: '',
        description: '',
        content: `---
- name: Example Playbook
  hosts: all
  tasks:
    - name: Print message
      debug:
        msg: "Hello from Ansible!"
`,
      });
    } catch (error) {
      console.error('Failed to create playbook:', error);
      alert('Failed to create playbook');
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;
    try {
      await api.playbooks.delete(id);
      await loadPlaybooks();
    } catch (error) {
      console.error('Failed to delete playbook:', error);
      alert('Failed to delete playbook');
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
            <h1 className="text-2xl font-bold text-gray-900">Playbooks</h1>
            <p className="text-gray-600 mt-1">Create and manage Ansible playbooks</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Playbook
          </button>
        </div>

        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Create New Playbook</h2>
                <button
                  onClick={() => setShowForm(false)}
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
                    placeholder="deploy-web-app"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows={2}
                    placeholder="Deploys the web application to production servers"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Playbook Content (YAML)
                  </label>
                  <textarea
                    required
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                    rows={16}
                    placeholder="---&#10;- name: My Playbook&#10;  hosts: all&#10;  tasks:&#10;    - name: Task 1&#10;      ..."
                  />
                </div>
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
          {playbooks.map((playbook) => (
            <div key={playbook.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <FileText className="w-5 h-5 text-gray-400 mt-1" />
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">{playbook.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{playbook.description}</p>
                    <div className="mt-3 text-xs text-gray-500">
                      Created: {new Date(playbook.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(playbook.id, playbook.name)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete playbook"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          {playbooks.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No playbooks yet. Create one to get started.
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
