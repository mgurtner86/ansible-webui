import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit, GitBranch, RefreshCw, ChevronDown, ChevronRight, FileText } from 'lucide-react';
import { api } from '../lib/api';

export function Projects() {
  const [projects, setProjects] = useState<any[]>([]);
  const [expandedProject, setExpandedProject] = useState<string | null>(null);
  const [playbooks, setPlaybooks] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showPlaybookForm, setShowPlaybookForm] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '', scm_type: 'git', scm_url: '', scm_branch: 'main' });
  const [playbookFormData, setPlaybookFormData] = useState({ name: '', path: '', description: '' });
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const data = await api.getProjects();
      setProjects(data);
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPlaybooks = async (projectId: string) => {
    try {
      const data = await api.getPlaybooks(projectId);
      setPlaybooks(prev => ({ ...prev, [projectId]: data }));
    } catch (error) {
      console.error('Failed to load playbooks:', error);
    }
  };

  const toggleProject = (projectId: string) => {
    if (expandedProject === projectId) {
      setExpandedProject(null);
    } else {
      setExpandedProject(projectId);
      if (!playbooks[projectId]) {
        loadPlaybooks(projectId);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.updateProject(editingId, formData);
      } else {
        await api.createProject(formData);
      }
      setShowForm(false);
      setFormData({ name: '', description: '', scm_type: 'git', scm_url: '', scm_branch: 'main' });
      setEditingId(null);
      loadProjects();
    } catch (error) {
      console.error('Failed to save project:', error);
      alert('Failed to save project');
    }
  };

  const handleEdit = (project: any) => {
    setFormData({ name: project.name, description: project.description || '', scm_type: project.scm_type, scm_url: project.scm_url, scm_branch: project.scm_branch });
    setEditingId(project.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return;
    try {
      await api.deleteProject(id);
      loadProjects();
    } catch (error) {
      console.error('Failed to delete project:', error);
      alert('Failed to delete project');
    }
  };

  const handleSync = async (id: string) => {
    try {
      await api.syncProject(id);
      loadProjects();
      alert('Project synced successfully');
    } catch (error) {
      console.error('Failed to sync project:', error);
      alert('Failed to sync project');
    }
  };

  const handlePlaybookSubmit = async (e: React.FormEvent, projectId: string) => {
    e.preventDefault();
    try {
      await api.createPlaybook(projectId, playbookFormData);
      setShowPlaybookForm(null);
      setPlaybookFormData({ name: '', path: '', description: '' });
      loadPlaybooks(projectId);
    } catch (error) {
      console.error('Failed to save playbook:', error);
      alert('Failed to save playbook');
    }
  };

  if (loading) return <div className="text-center py-8">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
          <p className="text-gray-600 mt-1">Manage Git repositories containing Ansible playbooks</p>
        </div>
        <button onClick={() => { setFormData({ name: '', description: '', scm_type: 'git', scm_url: '', scm_branch: 'main' }); setEditingId(null); setShowForm(true); }} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          <Plus className="w-5 h-5" />New Project
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4">{editingId ? 'Edit Project' : 'Create New Project'}</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SCM Type</label>
              <select value={formData.scm_type} onChange={(e) => setFormData({ ...formData, scm_type: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="git">Git</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Repository URL</label>
              <input type="url" required value={formData.scm_url} onChange={(e) => setFormData({ ...formData, scm_url: e.target.value })} placeholder="https://github.com/user/repo.git" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Branch</label>
              <input type="text" value={formData.scm_branch} onChange={(e) => setFormData({ ...formData, scm_branch: e.target.value })} placeholder="main" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">{editingId ? 'Update' : 'Create'}</button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-4">
        {projects.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <GitBranch className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">No projects yet. Create one to get started.</p>
          </div>
        ) : (
          projects.map((project) => (
            <div key={project.id} className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <button onClick={() => toggleProject(project.id)} className="text-gray-400 hover:text-gray-600">
                      {expandedProject === project.id ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                    </button>
                    <GitBranch className="w-5 h-5 text-blue-600" />
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">{project.name}</h3>
                      {project.description && <p className="text-sm text-gray-600 mt-0.5">{project.description}</p>}
                      <div className="flex gap-4 mt-2 text-sm text-gray-500">
                        <span>URL: {project.scm_url}</span>
                        <span>Branch: {project.scm_branch}</span>
                        <span>{project.playbook_count} playbooks</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleSync(project.id)} className="p-2 text-green-600 hover:bg-green-50 rounded-lg"><RefreshCw className="w-5 h-5" /></button>
                    <button onClick={() => handleEdit(project)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit className="w-5 h-5" /></button>
                    <button onClick={() => handleDelete(project.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-5 h-5" /></button>
                  </div>
                </div>

                {expandedProject === project.id && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-sm font-semibold text-gray-700">Playbooks</h4>
                      <button onClick={() => { setPlaybookFormData({ name: '', path: '', description: '' }); setShowPlaybookForm(project.id); }} className="flex items-center gap-1 text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700">
                        <Plus className="w-4 h-4" />Add Playbook
                      </button>
                    </div>

                    {showPlaybookForm === project.id && (
                      <div className="bg-gray-50 rounded-lg p-4 mb-4">
                        <h5 className="text-sm font-semibold mb-3">Add New Playbook</h5>
                        <form onSubmit={(e) => handlePlaybookSubmit(e, project.id)} className="space-y-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Name</label>
                            <input type="text" required value={playbookFormData.name} onChange={(e) => setPlaybookFormData({ ...playbookFormData, name: e.target.value })} placeholder="Deploy Web Server" className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Path</label>
                            <input type="text" required value={playbookFormData.path} onChange={(e) => setPlaybookFormData({ ...playbookFormData, path: e.target.value })} placeholder="playbooks/deploy.yml" className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                            <textarea value={playbookFormData.description} onChange={(e) => setPlaybookFormData({ ...playbookFormData, description: e.target.value })} rows={2} className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                          </div>
                          <div className="flex gap-2 justify-end">
                            <button type="button" onClick={() => setShowPlaybookForm(null)} className="px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-200 rounded-lg">Cancel</button>
                            <button type="submit" className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">Add</button>
                          </div>
                        </form>
                      </div>
                    )}

                    {playbooks[project.id] && playbooks[project.id].length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-4">No playbooks yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {playbooks[project.id]?.map((playbook) => (
                          <div key={playbook.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                            <FileText className="w-4 h-4 text-blue-600" />
                            <div className="flex-1">
                              <span className="text-sm font-medium text-gray-900">{playbook.name}</span>
                              <p className="text-xs text-gray-500">{playbook.path}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
