import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import Layout from '../components/Layout';
import { Plus, Calendar, X } from 'lucide-react';

export default function Schedules() {
  const [schedules, setSchedules] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api.schedules.create(formData);
      await loadSchedules();
      setShowForm(false);
      setFormData({
        template_id: '',
        name: '',
        description: '',
        cron: '0 0 * * *',
        timezone: 'UTC',
        enabled: true,
      });
    } catch (error) {
      console.error('Failed to create schedule:', error);
      alert('Failed to create schedule');
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
            <h1 className="text-2xl font-bold text-gray-900">Schedules</h1>
            <p className="text-gray-600 mt-1">Automated job execution schedules</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Schedule
          </button>
        </div>

        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Create New Schedule</h2>
                <button
                  onClick={() => setShowForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Template</label>
                  <select
                    required
                    value={formData.template_id}
                    onChange={(e) => setFormData({ ...formData, template_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cron Expression</label>
                  <input
                    type="text"
                    required
                    value={formData.cron}
                    onChange={(e) => setFormData({ ...formData, cron: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono"
                    placeholder="0 0 * * *"
                  />
                  <p className="text-xs text-gray-500 mt-1">Daily at midnight: 0 0 * * *</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
                  <input
                    type="text"
                    value={formData.timezone}
                    onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="enabled"
                    checked={formData.enabled}
                    onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="enabled" className="ml-2 text-sm text-gray-700">
                    Enabled
                  </label>
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
          {schedules.map((schedule) => (
            <div key={schedule.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <Calendar className="w-5 h-5 text-gray-400 mt-1" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{schedule.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">Template: {schedule.template_name}</p>
                    <div className="flex items-center space-x-3 mt-2 text-sm text-gray-500">
                      <span className="font-mono bg-gray-100 px-2 py-1 rounded">{schedule.cron}</span>
                      <span className={`px-2 py-1 rounded ${schedule.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                        {schedule.enabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {schedules.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No schedules yet. Create one to get started.
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
