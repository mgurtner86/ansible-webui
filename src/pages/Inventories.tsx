import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import Layout from '../components/Layout';
import InventoryWizard from '../components/InventoryWizard';
import { Plus, Server, X, Trash2, Eye } from 'lucide-react';
import type { Inventory } from '../types';

export default function Inventories() {
  const navigate = useNavigate();
  const [inventories, setInventories] = useState<Inventory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWizard, setShowWizard] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    source: 'static',
    content_or_ref: '',
    variables: {},
  });

  useEffect(() => {
    loadInventories();
  }, []);

  async function loadInventories() {
    try {
      const data = await api.inventories.list();
      setInventories(data);
    } catch (error) {
      console.error('Failed to load inventories:', error);
    } finally {
      setLoading(false);
    }
  }

  function handleView(inventory: Inventory) {
    navigate(`/inventories/${inventory.id}`);
  }

  function handleCancel() {
    setShowForm(false);
    setEditingId(null);
    setFormData({
      name: '',
      description: '',
      source: 'static',
      content_or_ref: '',
      variables: {},
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (editingId) {
        await api.inventories.update(editingId, formData);
      } else {
        await api.inventories.create(formData);
      }
      await loadInventories();
      handleCancel();
    } catch (error) {
      console.error('Failed to save inventory:', error);
      alert('Failed to save inventory');
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;
    try {
      await api.inventories.delete(id);
      await loadInventories();
    } catch (error) {
      console.error('Failed to delete inventory:', error);
      alert('Failed to delete inventory');
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
            <h1 className="text-4xl font-light tracking-tight text-slate-800 dark:text-slate-100">Inventories</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg">Host inventories for your infrastructure</p>
          </div>
          <button
            onClick={() => setShowWizard(true)}
            className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-200 shadow-md"
          >
            <Plus className="w-5 h-5" />
            <span className="font-medium">New Inventory</span>
          </button>
        </div>

        {showWizard && (
          <InventoryWizard
            onClose={() => setShowWizard(false)}
            onSuccess={() => {
              setShowWizard(false);
              loadInventories();
            }}
          />
        )}

        {showForm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-slate-200/60 dark:border-slate-700/60">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-light text-slate-800 dark:text-slate-100 tracking-tight">
                  {editingId ? 'Edit Inventory' : 'Create New Inventory'}
                </h2>
                <button
                  onClick={handleCancel}
                  className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 p-2 rounded-lg transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
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
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    rows={2}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Source</label>
                  <select
                    value={formData.source}
                    onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  >
                    <option value="static">Static</option>
                    <option value="git">Git</option>
                    <option value="dynamic">Dynamic</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    {formData.source === 'git' ? 'Git URL' : 'Content'}
                  </label>
                  <textarea
                    value={formData.content_or_ref}
                    onChange={(e) => setFormData({ ...formData, content_or_ref: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-mono text-sm"
                    rows={4}
                    placeholder={formData.source === 'git' ? 'https://github.com/user/inventory.git' : '[webservers]\nweb1.example.com\nweb2.example.com'}
                  />
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-6 py-3 text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:shadow-lg transition-all"
                  >
                    {editingId ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {inventories.map((inventory) => (
            <div key={inventory.id} className="group bg-white dark:bg-slate-800 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 p-6 border border-slate-200/60 dark:border-slate-700/60">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3 flex-1">
                  <div className="p-3 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-lg shadow-md">
                    <Server className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-xl font-medium text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{inventory.name}</h3>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleView(inventory)}
                    className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-all"
                    title="View inventory"
                  >
                    <Eye className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(inventory.id, inventory.name)}
                    className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all"
                    title="Delete inventory"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">{inventory.description}</p>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">Hosts</span>
                  <p className="text-2xl font-light text-slate-900 dark:text-slate-100 mt-1">{inventory.host_count}</p>
                </div>
                <span className="px-3 py-1.5 text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg">{inventory.source}</span>
              </div>
            </div>
          ))}
          {inventories.length === 0 && (
            <div className="col-span-full text-center py-16">
              <Server className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
              <p className="text-slate-500 dark:text-slate-400 text-lg">No inventories yet. Create one to get started.</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
