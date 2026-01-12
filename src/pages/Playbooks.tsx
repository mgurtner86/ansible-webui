import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import Layout from '../components/Layout';
import { Plus, FileText, X, Trash2, Pencil, Play } from 'lucide-react';

export default function Playbooks() {
  const navigate = useNavigate();
  const [playbooks, setPlaybooks] = useState<any[]>([]);
  const [inventories, setInventories] = useState<any[]>([]);
  const [credentials, setCredentials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showRunDialog, setShowRunDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [runningPlaybookId, setRunningPlaybookId] = useState<string | null>(null);
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
  const [runConfig, setRunConfig] = useState({
    inventory_id: '',
    credential_id: '',
  });

  useEffect(() => {
    loadPlaybooks();
    loadInventories();
    loadCredentials();
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

  function handleEdit(playbook: any) {
    setEditingId(playbook.id);
    setFormData({
      name: playbook.name,
      description: playbook.description || '',
      content: playbook.content || '',
    });
    setShowForm(true);
  }

  function handleCancel() {
    setShowForm(false);
    setEditingId(null);
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
  }

  function handleRunClick(playbookId: string) {
    setRunningPlaybookId(playbookId);
    setRunConfig({ inventory_id: '', credential_id: '' });
    setShowRunDialog(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (editingId) {
        await api.playbooks.update(editingId, formData);
      } else {
        await api.playbooks.create(formData);
      }
      await loadPlaybooks();
      handleCancel();
    } catch (error) {
      console.error('Failed to save playbook:', error);
      alert('Failed to save playbook');
    }
  }

  async function handleRunSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!runningPlaybookId || !runConfig.inventory_id) return;

    try {
      const template = {
        name: 'Quick Run',
        playbook_id: runningPlaybookId,
        inventory_id: runConfig.inventory_id,
        credential_id: runConfig.credential_id || undefined,
        forks: 5,
        verbosity: 0,
        become: false,
      };

      const createdTemplate = await api.templates.create(template);
      const job = await api.templates.launch(createdTemplate.id, {});

      setShowRunDialog(false);
      setRunningPlaybookId(null);
      navigate(`/jobs/${job.id}`);
    } catch (error) {
      console.error('Failed to run playbook:', error);
      alert('Failed to run playbook');
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
            <h1 className="text-4xl font-light text-slate-900 dark:text-slate-100">Playbooks</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">Create and manage Ansible playbooks</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 shadow-md transition-all"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Playbook
          </button>
        </div>

        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-slate-200/60 dark:border-slate-700/60">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-light text-slate-900 dark:text-slate-100">
                  {editingId ? 'Edit Playbook' : 'Create New Playbook'}
                </h2>
                <button
                  onClick={handleCancel}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                    placeholder="deploy-web-app"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                    rows={2}
                    placeholder="Deploys the web application to production servers"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Playbook Content (YAML)
                  </label>
                  <textarea
                    required
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 font-mono text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                    rows={16}
                    placeholder="---&#10;- name: My Playbook&#10;  hosts: all&#10;  tasks:&#10;    - name: Task 1&#10;      ..."
                  />
                </div>
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
                    className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 shadow-md transition-all"
                  >
                    {editingId ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showRunDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl p-6 w-full max-w-2xl border border-slate-200/60 dark:border-slate-700/60">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-light text-slate-900 dark:text-slate-100">Run Playbook</h2>
                <button
                  onClick={() => setShowRunDialog(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleRunSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Inventory *</label>
                  <select
                    required
                    value={runConfig.inventory_id}
                    onChange={(e) => setRunConfig({ ...runConfig, inventory_id: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
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
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Credential (Optional)</label>
                  <select
                    value={runConfig.credential_id}
                    onChange={(e) => setRunConfig({ ...runConfig, credential_id: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                  >
                    <option value="">No credential</option>
                    {credentials.map((credential) => (
                      <option key={credential.id} value={credential.id}>
                        {credential.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowRunDialog(false)}
                    className="px-4 py-2 text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 shadow-md transition-all"
                  >
                    Run Now
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4">
          {playbooks.map((playbook) => (
            <div key={playbook.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-md hover:shadow-xl transition-shadow p-6 border border-slate-200/60 dark:border-slate-700/60">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <FileText className="w-5 h-5 text-slate-400 dark:text-slate-500 mt-1" />
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{playbook.name}</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{playbook.description}</p>
                    <div className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                      Created: {new Date(playbook.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleRunClick(playbook.id)}
                    className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 shadow-md transition-all"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Run
                  </button>
                  <button
                    onClick={() => handleEdit(playbook)}
                    className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-700 rounded-xl transition-colors"
                    title="Edit playbook"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(playbook.id, playbook.name)}
                    className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-slate-700 rounded-xl transition-colors"
                    title="Delete playbook"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {playbooks.length === 0 && (
            <div className="text-center py-12 text-slate-500 dark:text-slate-400">
              No playbooks yet. Create one to get started.
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
