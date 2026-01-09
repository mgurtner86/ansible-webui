import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import Layout from '../components/Layout';
import { Plus, Server } from 'lucide-react';
import type { Inventory } from '../types';

export default function Inventories() {
  const [inventories, setInventories] = useState<Inventory[]>([]);
  const [loading, setLoading] = useState(true);

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
          <button className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            New Inventory
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {inventories.map((inventory) => (
            <div key={inventory.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{inventory.name}</h3>
                <Server className="w-5 h-5 text-gray-400" />
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
