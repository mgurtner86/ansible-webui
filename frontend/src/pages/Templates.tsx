import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import Layout from '../components/Layout';
import { Plus, Play } from 'lucide-react';
import type { Template } from '../types';

export default function Templates() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTemplates();
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

  async function handleLaunch(id: string) {
    try {
      await api.templates.launch(id, {});
      alert('Job launched successfully!');
    } catch (error) {
      console.error('Failed to launch template:', error);
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
          <button className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            New Template
          </button>
        </div>

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
                <button
                  onClick={() => handleLaunch(template.id)}
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Launch
                </button>
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
