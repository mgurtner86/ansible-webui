import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import Layout from '../components/Layout';
import { ArrowLeft, Plus, Pencil, Trash2, Server, Key } from 'lucide-react';

interface Host {
  id: string;
  hostname: string;
  vars: Record<string, string>;
  groups: string[];
  enabled: boolean;
}

interface Inventory {
  id: string;
  name: string;
  description: string;
  source: string;
  created_at: string;
  credential_name?: string;
  credential_type?: string;
}

export default function InventoryDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [inventory, setInventory] = useState<Inventory | null>(null);
  const [hosts, setHosts] = useState<Host[]>([]);
  const [loading, setLoading] = useState(true);
  const [showHostForm, setShowHostForm] = useState(false);
  const [editingHost, setEditingHost] = useState<Host | null>(null);
  const [isWindowsHost, setIsWindowsHost] = useState(false);
  const [hostForm, setHostForm] = useState({
    hostname: '',
    vars: {} as Record<string, string>,
    groups: [] as string[],
    enabled: true,
  });

  useEffect(() => {
    loadData();
  }, [id]);

  async function loadData() {
    try {
      const [inventoryData, hostsData] = await Promise.all([
        api.inventories.get(id!),
        api.inventories.getHosts(id!),
      ]);
      setInventory(inventoryData);
      setHosts(hostsData);
    } catch (error) {
      console.error('Failed to load inventory:', error);
    } finally {
      setLoading(false);
    }
  }

  function handleAddHost() {
    setEditingHost(null);
    setIsWindowsHost(false);
    setHostForm({
      hostname: '',
      vars: {},
      groups: [],
      enabled: true,
    });
    setShowHostForm(true);
  }

  function handleEditHost(host: Host) {
    setEditingHost(host);
    const isWin = host.vars?.ansible_connection === 'winrm';
    setIsWindowsHost(isWin);
    setHostForm({
      hostname: host.hostname,
      vars: host.vars || {},
      groups: host.groups || [],
      enabled: host.enabled,
    });
    setShowHostForm(true);
  }

  function handleWindowsHostToggle(checked: boolean) {
    setIsWindowsHost(checked);
    if (checked) {
      setHostForm({
        ...hostForm,
        vars: {
          ...hostForm.vars,
          ansible_connection: 'winrm',
          ansible_port: '5986',
          ansible_winrm_transport: 'ntlm',
          ansible_winrm_server_cert_validation: 'ignore',
        },
      });
    } else {
      const newVars = { ...hostForm.vars };
      delete newVars.ansible_connection;
      delete newVars.ansible_port;
      delete newVars.ansible_winrm_transport;
      delete newVars.ansible_winrm_server_cert_validation;
      setHostForm({
        ...hostForm,
        vars: newVars,
      });
    }
  }

  async function handleSaveHost() {
    try {
      if (editingHost) {
        await api.inventories.updateHost(id!, editingHost.id, hostForm);
      } else {
        await api.inventories.createHost(id!, hostForm);
      }
      await loadData();
      setShowHostForm(false);
    } catch (error) {
      console.error('Failed to save host:', error);
      alert('Failed to save host');
    }
  }

  async function handleDeleteHost(hostId: string, hostname: string) {
    if (!confirm(`Delete host "${hostname}"?`)) return;
    try {
      await api.inventories.deleteHost(id!, hostId);
      await loadData();
    } catch (error) {
      console.error('Failed to delete host:', error);
      alert('Failed to delete host');
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

  if (!inventory) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-gray-500">Inventory not found</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/inventories')}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{inventory.name}</h1>
              <p className="text-gray-600 mt-1">{inventory.description}</p>
            </div>
          </div>
          <button
            onClick={handleAddHost}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Host
          </button>
        </div>

        {inventory.credential_name && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center space-x-3">
              <Key className="w-5 h-5 text-gray-400" />
              <div>
                <h3 className="text-sm font-medium text-gray-900">Default Credential</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {inventory.credential_name} ({inventory.credential_type})
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Hosts ({hosts.length})</h2>
          </div>
          {hosts.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              No hosts in this inventory. Add a host to get started.
            </div>
          ) : (
            <div className="divide-y">
              {hosts.map((host) => (
                <div key={host.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                  <div className="flex items-center space-x-4 flex-1">
                    <Server className="w-5 h-5 text-gray-400" />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-900">{host.hostname}</span>
                        {host.vars?.ansible_connection === 'winrm' && (
                          <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">Windows</span>
                        )}
                      </div>
                      {Object.keys(host.vars || {}).length > 0 && (
                        <div className="text-sm text-gray-500 mt-1">
                          {Object.entries(host.vars)
                            .filter(([key]) => !key.startsWith('ansible_'))
                            .map(([key, value]) => (
                              <span key={key} className="mr-3">
                                {key}: {value}
                              </span>
                            ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      {!host.enabled && (
                        <span className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded">Disabled</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleEditHost(host)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteHost(host.id, host.hostname)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showHostForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {editingHost ? 'Edit Host' : 'Add Host'}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hostname / IP *</label>
                <input
                  type="text"
                  required
                  value={hostForm.hostname}
                  onChange={(e) => setHostForm({ ...hostForm, hostname: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="server.example.com or 192.168.1.10"
                />
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="enabled"
                    checked={hostForm.enabled}
                    onChange={(e) => setHostForm({ ...hostForm, enabled: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="enabled" className="text-sm font-medium text-gray-700">
                    Enabled
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="windows"
                    checked={isWindowsHost}
                    onChange={(e) => handleWindowsHostToggle(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="windows" className="text-sm font-medium text-gray-700">
                    Windows Host (WinRM)
                  </label>
                </div>
              </div>
              {isWindowsHost && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                  <p className="text-sm text-blue-800 font-medium">Windows Host Configuration</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">WinRM Port</label>
                      <input
                        type="text"
                        value={hostForm.vars.ansible_port || '5986'}
                        onChange={(e) => setHostForm({
                          ...hostForm,
                          vars: { ...hostForm.vars, ansible_port: e.target.value }
                        })}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">5986 (HTTPS) or 5985 (HTTP)</p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Transport</label>
                      <select
                        value={hostForm.vars.ansible_winrm_transport || 'ntlm'}
                        onChange={(e) => setHostForm({
                          ...hostForm,
                          vars: { ...hostForm.vars, ansible_winrm_transport: e.target.value }
                        })}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="ntlm">NTLM</option>
                        <option value="basic">Basic</option>
                        <option value="kerberos">Kerberos</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="cert-validation"
                      checked={hostForm.vars.ansible_winrm_server_cert_validation !== 'validate'}
                      onChange={(e) => setHostForm({
                        ...hostForm,
                        vars: {
                          ...hostForm.vars,
                          ansible_winrm_server_cert_validation: e.target.checked ? 'ignore' : 'validate'
                        }
                      })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="cert-validation" className="text-xs text-gray-700">
                      Ignore SSL certificate validation (recommended for self-signed certs)
                    </label>
                  </div>
                </div>
              )}
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowHostForm(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveHost}
                disabled={!hostForm.hostname.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {editingHost ? 'Update' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
