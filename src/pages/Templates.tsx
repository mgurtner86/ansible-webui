import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit, FileCheck, Play } from 'lucide-react';
import { api } from '../lib/api';
import { useNavigate } from 'react-router-dom';

export function Templates() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [playbooks, setPlaybooks] = useState<any[]>([]);
  const [inventories, setInventories] = useState<any[]>([]);
  const [credentials, setCredentials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '', project_id: '', playbook_id: '', inventory_id: '', credential_id: '', job_type: 'run', verbosity: 0 });
  const [editingId, setEditingId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [templatesData, projectsData, inventoriesData, credentialsData] = await Promise.all([
        api.getTemplates(),
        api.getProjects(),
        api.getInventories(),
        api.getCredentials()
      ]);
      setTemplates(templatesData);
      setProjects(projectsData);
      setInventories(inventoriesData);
      setCredentials(credentialsData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPlaybooks = async (projectId: string) => {
    try {
      const data = await api.getPlaybooks(projectId);
      setPlaybooks(data);
    } catch (error) {
      console.error('Failed to load playbooks:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.updateTemplate(editingId, formData);
      } else {
        await api.createTemplate(formData);
      }
      setShowForm(false);
      setFormData({ name: '', description: '', project_id: '', playbook_id: '', inventory_id: '', credential_id: '', job_type: 'run', verbosity: 0 });
      setEditingId(null);
      loadData();
    } catch (error) {
      console.error('Failed to save template:', error);
      alert('Failed to save template');
    }
  };

  const handleEdit = (template: any) => {
    setFormData({ name: template.name, description: template.description || '', project_id: template.project_id, playbook_id: template.playbook_id, inventory_id: template.inventory_id, credential_id: template.credential_id || '', job_type: template.job_type, verbosity: template.verbosity });
    loadPlaybooks(template.project_id);
    setEditingId(template.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;
    try {
      await api.deleteTemplate(id);
      loadData();
    } catch (error) {
      console.error('Failed to delete template:', error);
      alert('Failed to delete template');
    }
  };

  const handleLaunch = async (template: any) => {
    try {
      await api.createJob({ job_template_id: template.id, inventory_id: template.inventory_id, project_id: template.project_id, playbook_id: template.playbook_id, credential_id: template.credential_id });
      navigate('/jobs');
    } catch (error) {
      console.error('Failed to launch job:', error);
      alert('Failed to launch job');
    }
  };

  if (loading) return <div className="text-center py-8">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Templates</h1>
          <p className="text-gray-600 mt-1">Reusable job configurations for Ansible playbooks</p>
        </div>
        <button onClick={() => { setFormData({ name: '', description: '', project_id: '', playbook_id: '', inventory_id: '', credential_id: '', job_type: 'run', verbosity: 0 }); setEditingId(null); setShowForm(true); }} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          <Plus className="w-5 h-5" />New Template
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4">{editingId ? 'Edit Template' : 'Create New Template'}</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
                <select required value={formData.project_id} onChange={(e) => { setFormData({ ...formData, project_id: e.target.value, playbook_id: '' }); loadPlaybooks(e.target.value); }} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select a project</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Playbook</label>
                <select required value={formData.playbook_id} onChange={(e) => setFormData({ ...formData, playbook_id: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" disabled={!formData.project_id}>
                  <option value="">Select a playbook</option>
                  {playbooks.map(pb => <option key={pb.id} value={pb.id}>{pb.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Inventory</label>
                <select required value={formData.inventory_id} onChange={(e) => setFormData({ ...formData, inventory_id: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select an inventory</option>
                  {inventories.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Credential</label>
                <select value={formData.credential_id} onChange={(e) => setFormData({ ...formData, credential_id: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select a credential</option>
                  {credentials.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">{editingId ? 'Update' : 'Create'}</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid gap-4">
        {templates.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <FileCheck className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">No templates yet. Create one to get started.</p>
          </div>
        ) : (
          templates.map((template) => (
            <div key={template.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <FileCheck className="w-5 h-5 text-blue-600" />
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">{template.name}</h3>
                    {template.description && <p className="text-sm text-gray-600 mt-0.5">{template.description}</p>}
                    <div className="flex gap-4 mt-2 text-sm text-gray-500">
                      <span>Project: {template.project_name}</span>
                      <span>Playbook: {template.playbook_name}</span>
                      <span>Inventory: {template.inventory_name}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleLaunch(template)} className="p-2 text-green-600 hover:bg-green-50 rounded-lg"><Play className="w-5 h-5" /></button>
                  <button onClick={() => handleEdit(template)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit className="w-5 h-5" /></button>
                  <button onClick={() => handleDelete(template.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-5 h-5" /></button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
