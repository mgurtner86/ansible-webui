import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import Layout from '../components/Layout';
import { Plus, Server, X, Trash2, Pencil } from 'lucide-react';
import type { Inventory } from '../types';

export default function Inventories() {
  const [inventories, setInventories] = useState<Inventory[]>([]);
  const [loading, setLoading] = useState(true);
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

  function handleEdit(inventory: Inventory) {
    setEditingId(inventory.id);
    setFormData({
      name: inventory.name,
      description: inventory.description || '',
      source: inventory.source,
      content_or_ref: inventory.content_or_ref || '',
      variables: inventory.variables || {},
    });
    setShowForm(true);
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
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Inventories</h1>
            <p className="text-gray-600 mt-1">Host inventories for your infrastructure</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Inventory
          </button>
        </div>

        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  {editingId ? 'Edit Inventory' : 'Create New Inventory'}
                </h2>
                <button
                  onClick={handleCancel}
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
                  <select
                    value={formData.source}
                    onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="static">Static</option>
                    <option value="git">Git</option>
                    <option value="dynamic">Dynamic</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {formData.source === 'git' ? 'Git URL' : 'Content'}
                  </label>
                  <textarea
                    value={formData.content_or_ref}
                    onChange={(e) => setFormData({ ...formData, content_or_ref: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                    rows={4}
                    placeholder={formData.source === 'git' ? 'https://github.com/user/inventory.git' : '[webservers]\nweb1.example.com\nweb2.example.com'}
                  />
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
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
            <div key={inventory.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex-1">{inventory.name}</h3>
                <div className="flex items-center space-x-2">
                  <Server className="w-5 h-5 text-gray-400" />
                  <button
                    onClick={() => handleEdit(inventory)}
                    className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    title="Edit inventory"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(inventory.id, inventory.name)}
                    className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                    title="Delete inventory"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-4">{inventory.description}</p>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Hosts: {inventory.host_count}</span>
                <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">{inventory.source}</span>
              </div>
            </div>
          ))}
          {inventories.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-500">
              No inventories yet. Create one to get started.
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
