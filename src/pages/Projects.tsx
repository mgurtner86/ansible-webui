import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import Layout from '../components/Layout';
import { Plus, GitBranch, RefreshCw } from 'lucide-react';
import type { Project } from '../types';

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    git_url: '',
    git_branch: 'main',
  });

  useEffect(() => {
    loadProjects();
  }, []);

  async function loadProjects() {
    try {
      const data = await api.projects.list();
      setProjects(data);
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api.projects.create(formData);
      await loadProjects();
      setShowForm(false);
      setFormData({ name: '', description: '', git_url: '', git_branch: 'main' });
    } catch (error) {
      console.error('Failed to create project:', error);
    }
  }

  async function handleSync(id: string) {
    try {
      await api.projects.sync(id);
      await loadProjects();
    } catch (error) {
      console.error('Failed to sync project:', error);
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
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-light tracking-tight text-slate-800 dark:text-slate-100">Projects</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg">Git repositories containing Ansible playbooks</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-200 shadow-md"
          >
            <Plus className="w-5 h-5" />
            <span className="font-medium">New Project</span>
          </button>
        </div>

        {showForm && (
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-8 border border-slate-200/60 dark:border-slate-700/60">
            <h2 className="text-2xl font-light text-slate-800 dark:text-slate-100 mb-6 tracking-tight">Create New Project</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Git URL</label>
                <input
                  type="url"
                  required
                  value={formData.git_url}
                  onChange={(e) => setFormData({ ...formData, git_url: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="https://github.com/user/repo.git"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Branch</label>
                <input
                  type="text"
                  required
                  value={formData.git_branch}
                  onChange={(e) => setFormData({ ...formData, git_branch: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-6 py-3 text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:shadow-lg transition-all"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div key={project.id} className="group bg-white dark:bg-slate-800 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 p-6 border border-slate-200/60 dark:border-slate-700/60">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-xl font-medium text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{project.name}</h3>
                <button
                  onClick={() => handleSync(project.id)}
                  className="p-2 text-slate-500 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-all"
                  title="Sync project"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-slate-600 mb-6 line-clamp-2 leading-relaxed">{project.description}</p>
              <div className="space-y-3">
                <div className="flex items-center text-slate-600 bg-slate-50 px-3 py-2 rounded-lg">
                  <GitBranch className="w-4 h-4 mr-2 text-slate-400" />
                  <span className="font-mono text-xs">{project.git_branch}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600 font-medium">
                    <span className="text-2xl font-light text-slate-900">{project.playbook_count}</span> playbooks
                  </span>
                  <span className={`px-3 py-1.5 rounded-lg text-xs font-medium shadow-sm ${
                    project.sync_status === 'success' ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white' :
                    project.sync_status === 'failed' ? 'bg-gradient-to-r from-red-500 to-red-600 text-white' :
                    'bg-gradient-to-r from-amber-500 to-amber-600 text-white'
                  }`}>
                    {project.sync_status}
                  </span>
                </div>
              </div>
            </div>
          ))}
          {projects.length === 0 && !showForm && (
            <div className="col-span-full text-center py-16">
              <GitBranch className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 text-lg">No projects yet. Create one to get started.</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
