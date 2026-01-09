import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit, Calendar, ToggleLeft, ToggleRight } from 'lucide-react';
import { api } from '../lib/api';

export function Schedules() {
  const [schedules, setSchedules] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '', job_template_id: '', cron_expression: '0 0 * * *', timezone: 'UTC', enabled: true });
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [schedulesData, templatesData] = await Promise.all([
        api.getSchedules(),
        api.getTemplates()
      ]);
      setSchedules(schedulesData);
      setTemplates(templatesData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.updateSchedule(editingId, formData);
      } else {
        await api.createSchedule(formData);
      }
      setShowForm(false);
      setFormData({ name: '', description: '', job_template_id: '', cron_expression: '0 0 * * *', timezone: 'UTC', enabled: true });
      setEditingId(null);
      loadData();
    } catch (error) {
      console.error('Failed to save schedule:', error);
      alert('Failed to save schedule');
    }
  };

  const handleEdit = (schedule: any) => {
    setFormData({ name: schedule.name, description: schedule.description || '', job_template_id: schedule.job_template_id, cron_expression: schedule.cron_expression, timezone: schedule.timezone, enabled: schedule.enabled });
    setEditingId(schedule.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this schedule?')) return;
    try {
      await api.deleteSchedule(id);
      loadData();
    } catch (error) {
      console.error('Failed to delete schedule:', error);
      alert('Failed to delete schedule');
    }
  };

  const handleToggle = async (id: string) => {
    try {
      await api.toggleSchedule(id);
      loadData();
    } catch (error) {
      console.error('Failed to toggle schedule:', error);
      alert('Failed to toggle schedule');
    }
  };

  if (loading) return <div className="text-center py-8">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Schedules</h1>
          <p className="text-gray-600 mt-1">Automated job scheduling with cron expressions</p>
        </div>
        <button onClick={() => { setFormData({ name: '', description: '', job_template_id: '', cron_expression: '0 0 * * *', timezone: 'UTC', enabled: true }); setEditingId(null); setShowForm(true); }} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          <Plus className="w-5 h-5" />New Schedule
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4">{editingId ? 'Edit Schedule' : 'Create New Schedule'}</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Template</label>
              <select required value={formData.job_template_id} onChange={(e) => setFormData({ ...formData, job_template_id: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select a template</option>
                {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cron Expression</label>
                <input type="text" required value={formData.cron_expression} onChange={(e) => setFormData({ ...formData, cron_expression: e.target.value })} placeholder="0 0 * * *" className="w-full px-3 py-2 font-mono border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <p className="text-xs text-gray-500 mt-1">Format: minute hour day month weekday</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
                <input type="text" value={formData.timezone} onChange={(e) => setFormData({ ...formData, timezone: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="enabled" checked={formData.enabled} onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })} className="w-4 h-4 text-blue-600" />
              <label htmlFor="enabled" className="text-sm text-gray-700">Enabled</label>
            </div>
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">{editingId ? 'Update' : 'Create'}</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid gap-4">
        {schedules.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">No schedules yet. Create one to get started.</p>
          </div>
        ) : (
          schedules.map((schedule) => (
            <div key={schedule.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold text-gray-900">{schedule.name}</h3>
                      {schedule.enabled ? (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">Active</span>
                      ) : (
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">Inactive</span>
                      )}
                    </div>
                    {schedule.description && <p className="text-sm text-gray-600 mt-0.5">{schedule.description}</p>}
                    <div className="flex gap-4 mt-2 text-sm text-gray-500">
                      <span>Template: {schedule.template_name}</span>
                      <span>Schedule: {schedule.cron_expression}</span>
                      <span>Timezone: {schedule.timezone}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleToggle(schedule.id)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                    {schedule.enabled ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                  </button>
                  <button onClick={() => handleEdit(schedule)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit className="w-5 h-5" /></button>
                  <button onClick={() => handleDelete(schedule.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-5 h-5" /></button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
