import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import Layout from '../components/Layout';
import { Plus, Calendar, X, Trash2, Pencil } from 'lucide-react';

export default function Schedules() {
  const [schedules, setSchedules] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    template_id: '',
    name: '',
    description: '',
    cron: '0 0 * * *',
    timezone: 'UTC',
    enabled: true,
  });

  useEffect(() => {
    loadSchedules();
    loadTemplates();
  }, []);

  async function loadSchedules() {
    try {
      const data = await api.schedules.list();
      setSchedules(data);
    } catch (error) {
      console.error('Failed to load schedules:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadTemplates() {
    try {
      const data = await api.templates.list();
      setTemplates(data);
    } catch (error) {
      console.error('Failed to load templates:', error);
    }
  }

  function handleEdit(schedule: any) {
    setEditingId(schedule.id);
    setFormData({
      template_id: schedule.template_id,
      name: schedule.name,
      description: schedule.description || '',
      cron: schedule.cron,
      timezone: schedule.timezone,
      enabled: schedule.enabled,
    });
    setShowForm(true);
  }

  function handleCancel() {
    setShowForm(false);
    setEditingId(null);
    setFormData({
      template_id: '',
      name: '',
      description: '',
      cron: '0 0 * * *',
      timezone: 'UTC',
      enabled: true,
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (editingId) {
        await api.schedules.update(editingId, formData);
      } else {
        await api.schedules.create(formData);
      }
      await loadSchedules();
      handleCancel();
    } catch (error) {
      console.error('Failed to save schedule:', error);
      alert('Failed to save schedule');
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;
    try {
      await api.schedules.delete(id);
      await loadSchedules();
    } catch (error) {
      console.error('Failed to delete schedule:', error);
      alert('Failed to delete schedule');
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
            <h1 className="text-4xl font-light text-slate-900 dark:text-slate-100">Schedules</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">Automated job execution schedules</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 shadow-md transition-all"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Schedule
          </button>
        </div>

        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-black dark:bg-opacity-70 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-slate-200/60 dark:border-slate-700/60">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-light text-slate-900 dark:text-slate-100">
                  {editingId ? 'Edit Schedule' : 'Create New Schedule'}
                </h2>
                <button
                  onClick={handleCancel}
                  className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Template</label>
                  <select
                    required
                    value={formData.template_id}
                    onChange={(e) => setFormData({ ...formData, template_id: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                  >
                    <option value="">Select a template...</option>
                    {templates.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.name}
                      </option>
                    ))}
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
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Cron Expression</label>
                  <input
                    type="text"
                    required
                    value={formData.cron}
                    onChange={(e) => setFormData({ ...formData, cron: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 font-mono bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                    placeholder="0 0 * * *"
                  />
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Daily at midnight: 0 0 * * *</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Timezone</label>
                  <input
                    type="text"
                    value={formData.timezone}
                    onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="enabled"
                    checked={formData.enabled}
                    onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-slate-300 dark:border-slate-600 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="enabled" className="ml-2 text-sm text-slate-700 dark:text-slate-300">
                    Enabled
                  </label>
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

        <div className="grid grid-cols-1 gap-4">
          {schedules.map((schedule) => (
            <div key={schedule.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 border border-slate-200/60 dark:border-slate-700/60">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <Calendar className="w-5 h-5 text-slate-400 dark:text-slate-500 mt-1" />
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{schedule.name}</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Template: {schedule.template_name}</p>
                    <div className="flex items-center space-x-3 mt-2 text-sm text-slate-500 dark:text-slate-400">
                      <span className="font-mono bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-slate-900 dark:text-slate-100">{schedule.cron}</span>
                      <span className={`px-2 py-1 rounded ${schedule.enabled ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'}`}>
                        {schedule.enabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleEdit(schedule)}
                    className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-colors"
                    title="Edit schedule"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(schedule.id, schedule.name)}
                    className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                    title="Delete schedule"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {schedules.length === 0 && (
            <div className="text-center py-12 text-slate-500 dark:text-slate-400">
              No schedules yet. Create one to get started.
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
