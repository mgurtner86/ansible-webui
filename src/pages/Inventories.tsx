import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit, Server, ChevronDown, ChevronRight } from 'lucide-react';
import { api } from '../lib/api';

export function Inventories() {
  const [inventories, setInventories] = useState<any[]>([]);
  const [expandedInventory, setExpandedInventory] = useState<string | null>(null);
  const [hosts, setHosts] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showHostForm, setShowHostForm] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '', source: 'static' });
  const [hostFormData, setHostFormData] = useState({ hostname: '', vars: '{}', groups: '', enabled: true });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingHostId, setEditingHostId] = useState<string | null>(null);

  useEffect(() => {
    loadInventories();
  }, []);

  const loadInventories = async () => {
    try {
      const data = await api.getInventories();
      setInventories(data);
    } catch (error) {
      console.error('Failed to load inventories:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadHosts = async (inventoryId: string) => {
    try {
      const data = await api.getHosts(inventoryId);
      setHosts(prev => ({ ...prev, [inventoryId]: data }));
    } catch (error) {
      console.error('Failed to load hosts:', error);
    }
  };

  const toggleInventory = (inventoryId: string) => {
    if (expandedInventory === inventoryId) {
      setExpandedInventory(null);
    } else {
      setExpandedInventory(inventoryId);
      if (!hosts[inventoryId]) {
        loadHosts(inventoryId);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.updateInventory(editingId, formData);
      } else {
        await api.createInventory(formData);
      }
      setShowForm(false);
      setFormData({ name: '', description: '', source: 'static' });
      setEditingId(null);
      loadInventories();
    } catch (error) {
      console.error('Failed to save inventory:', error);
      alert('Failed to save inventory');
    }
  };

  const handleEdit = (inventory: any) => {
    setFormData({ name: inventory.name, description: inventory.description || '', source: inventory.source });
    setEditingId(inventory.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this inventory?')) return;
    try {
      await api.deleteInventory(id);
      loadInventories();
    } catch (error) {
      console.error('Failed to delete inventory:', error);
      alert('Failed to delete inventory');
    }
  };

  const handleHostSubmit = async (e: React.FormEvent, inventoryId: string) => {
    e.preventDefault();
    try {
      const data = {
        hostname: hostFormData.hostname,
        vars: JSON.parse(hostFormData.vars || '{}'),
        groups: hostFormData.groups ? hostFormData.groups.split(',').map(g => g.trim()) : [],
        enabled: hostFormData.enabled,
      };
      if (editingHostId) {
        await api.updateHost(inventoryId, editingHostId, data);
      } else {
        await api.createHost(inventoryId, data);
      }
      setShowHostForm(null);
      setHostFormData({ hostname: '', vars: '{}', groups: '', enabled: true });
      setEditingHostId(null);
      loadHosts(inventoryId);
    } catch (error) {
      console.error('Failed to save host:', error);
      alert('Failed to save host. Check JSON format for variables.');
    }
  };

  const handleEditHost = (inventoryId: string, host: any) => {
    setHostFormData({
      hostname: host.hostname,
      vars: JSON.stringify(host.vars || {}, null, 2),
      groups: (host.groups || []).join(', '),
      enabled: host.enabled,
    });
    setEditingHostId(host.id);
    setShowHostForm(inventoryId);
  };

  const handleDeleteHost = async (inventoryId: string, hostId: string) => {
    if (!confirm('Are you sure you want to delete this host?')) return;
    try {
      await api.deleteHost(inventoryId, hostId);
      loadHosts(inventoryId);
    } catch (error) {
      console.error('Failed to delete host:', error);
      alert('Failed to delete host');
    }
  };

  if (loading) return <div className="text-center py-8">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Inventories</h1>
          <p className="text-gray-600 mt-1">Manage your Ansible inventory configurations</p>
        </div>
        <button
          onClick={() => {
            setFormData({ name: '', description: '', source: 'static' });
            setEditingId(null);
            setShowForm(true);
          }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5" />
          New Inventory
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4">{editingId ? 'Edit Inventory' : 'Create New Inventory'}</h3>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
              <select value={formData.source} onChange={(e) => setFormData({ ...formData, source: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="static">Static</option>
                <option value="git">Git</option>
                <option value="dynamic">Dynamic</option>
              </select>
            </div>
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">{editingId ? 'Update' : 'Create'}</button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-4">
        {inventories.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <Server className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">No inventories yet. Create one to get started.</p>
          </div>
        ) : (
          inventories.map((inventory) => (
            <div key={inventory.id} className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <button onClick={() => toggleInventory(inventory.id)} className="text-gray-400 hover:text-gray-600">
                      {expandedInventory === inventory.id ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                    </button>
                    <Server className="w-5 h-5 text-blue-600" />
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">{inventory.name}</h3>
                      {inventory.description && <p className="text-sm text-gray-600 mt-0.5">{inventory.description}</p>}
                      <div className="flex gap-4 mt-2 text-sm text-gray-500">
                        <span>Source: {inventory.source}</span>
                        <span>{inventory.host_count} hosts</span>
                        <span>Owner: {inventory.owner_name}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleEdit(inventory)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit className="w-5 h-5" /></button>
                    <button onClick={() => handleDelete(inventory.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-5 h-5" /></button>
                  </div>
                </div>

                {expandedInventory === inventory.id && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-sm font-semibold text-gray-700">Hosts</h4>
                      <button onClick={() => { setHostFormData({ hostname: '', vars: '{}', groups: '', enabled: true }); setEditingHostId(null); setShowHostForm(inventory.id); }} className="flex items-center gap-1 text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700">
                        <Plus className="w-4 h-4" />Add Host
                      </button>
                    </div>

                    {showHostForm === inventory.id && (
                      <div className="bg-gray-50 rounded-lg p-4 mb-4">
                        <h5 className="text-sm font-semibold mb-3">{editingHostId ? 'Edit Host' : 'Add New Host'}</h5>
                        <form onSubmit={(e) => handleHostSubmit(e, inventory.id)} className="space-y-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Hostname</label>
                            <input type="text" required value={hostFormData.hostname} onChange={(e) => setHostFormData({ ...hostFormData, hostname: e.target.value })} placeholder="192.168.1.10 or server.example.com" className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Variables (JSON)</label>
                            <textarea value={hostFormData.vars} onChange={(e) => setHostFormData({ ...hostFormData, vars: e.target.value })} rows={3} placeholder='{"ansible_user": "ubuntu", "ansible_port": 22}' className="w-full px-3 py-1.5 text-sm font-mono border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Groups (comma-separated)</label>
                            <input type="text" value={hostFormData.groups} onChange={(e) => setHostFormData({ ...hostFormData, groups: e.target.value })} placeholder="webservers, production" className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                          </div>
                          <div className="flex items-center gap-2">
                            <input type="checkbox" id={`enabled-${inventory.id}`} checked={hostFormData.enabled} onChange={(e) => setHostFormData({ ...hostFormData, enabled: e.target.checked })} className="w-4 h-4 text-blue-600" />
                            <label htmlFor={`enabled-${inventory.id}`} className="text-sm text-gray-700">Enabled</label>
                          </div>
                          <div className="flex gap-2 justify-end">
                            <button type="button" onClick={() => { setShowHostForm(null); setEditingHostId(null); }} className="px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-200 rounded-lg">Cancel</button>
                            <button type="submit" className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">{editingHostId ? 'Update' : 'Add'}</button>
                          </div>
                        </form>
                      </div>
                    )}

                    {hosts[inventory.id] && hosts[inventory.id].length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-4">No hosts configured yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {hosts[inventory.id]?.map((host) => (
                          <div key={host.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-900">{host.hostname}</span>
                                {!host.enabled && <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">Disabled</span>}
                              </div>
                              {host.groups && host.groups.length > 0 && (
                                <div className="flex gap-1 mt-1">
                                  {host.groups.map((group: string) => (
                                    <span key={group} className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">{group}</span>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <button onClick={() => handleEditHost(inventory.id, host)} className="p-1.5 text-blue-600 hover:bg-blue-100 rounded"><Edit className="w-4 h-4" /></button>
                              <button onClick={() => handleDeleteHost(inventory.id, host.id)} className="p-1.5 text-red-600 hover:bg-red-100 rounded"><Trash2 className="w-4 h-4" /></button>
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
