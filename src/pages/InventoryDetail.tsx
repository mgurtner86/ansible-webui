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
          <div className="text-slate-500 dark:text-slate-400">Loading...</div>
        </div>
      </Layout>
    );
  }

  if (!inventory) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-slate-500 dark:text-slate-400">Inventory not found</p>
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
              className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-4xl font-light text-slate-900 dark:text-slate-100">{inventory.name}</h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">{inventory.description}</p>
            </div>
          </div>
          <button
            onClick={handleAddHost}
            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 shadow-md transition-all duration-200"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Host
          </button>
        </div>

        {inventory.credential_name && (
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 border border-slate-200/60 dark:border-slate-700/60">
            <div className="flex items-center space-x-3">
              <Key className="w-5 h-5 text-slate-400 dark:text-slate-500" />
              <div>
                <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100">Default Credential</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  {inventory.credential_name} ({inventory.credential_type})
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md border border-slate-200/60 dark:border-slate-700/60">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-2xl font-light text-slate-900 dark:text-slate-100">Hosts ({hosts.length})</h2>
          </div>
          {hosts.length === 0 ? (
            <div className="p-12 text-center text-slate-500 dark:text-slate-400">
              No hosts in this inventory. Add a host to get started.
            </div>
          ) : (
            <div className="divide-y divide-slate-200 dark:divide-slate-700">
              {hosts.map((host) => (
                <div key={host.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                  <div className="flex items-center space-x-4 flex-1">
                    <Server className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-slate-900 dark:text-slate-100">{host.hostname}</span>
                        {host.vars?.ansible_connection === 'winrm' && (
                          <span className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">Windows</span>
                        )}
                      </div>
                      {Object.keys(host.vars || {}).length > 0 && (
                        <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">
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
                        <span className="px-2 py-1 text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded">Disabled</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleEditHost(host)}
                      className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteHost(host.id, host.hostname)}
                      className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl transition-colors"
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
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl p-6 w-full max-w-2xl border border-slate-200/60 dark:border-slate-700/60">
            <h2 className="text-2xl font-light text-slate-900 dark:text-slate-100 mb-4">
              {editingHost ? 'Edit Host' : 'Add Host'}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Hostname / IP *</label>
                <input
                  type="text"
                  required
                  value={hostForm.hostname}
                  onChange={(e) => setHostForm({ ...hostForm, hostname: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-slate-100 dark:placeholder-slate-400"
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
                    className="rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="enabled" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Enabled
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="windows"
                    checked={isWindowsHost}
                    onChange={(e) => handleWindowsHostToggle(e.target.checked)}
                    className="rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="windows" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Windows Host (WinRM)
                  </label>
                </div>
              </div>
              {isWindowsHost && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 space-y-3">
                  <p className="text-sm text-blue-800 dark:text-blue-300 font-medium">Windows Host Configuration</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">WinRM Port</label>
                      <input
                        type="text"
                        value={hostForm.vars.ansible_port || '5986'}
                        onChange={(e) => setHostForm({
                          ...hostForm,
                          vars: { ...hostForm.vars, ansible_port: e.target.value }
                        })}
                        className="w-full px-2 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-slate-100"
                      />
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">5986 (HTTPS) or 5985 (HTTP)</p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Transport</label>
                      <select
                        value={hostForm.vars.ansible_winrm_transport || 'ntlm'}
                        onChange={(e) => setHostForm({
                          ...hostForm,
                          vars: { ...hostForm.vars, ansible_winrm_transport: e.target.value }
                        })}
                        className="w-full px-2 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-slate-100"
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
                      className="rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="cert-validation" className="text-xs text-slate-700 dark:text-slate-300">
                      Ignore SSL certificate validation (recommended for self-signed certs)
                    </label>
                  </div>
                </div>
              )}
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowHostForm(false)}
                className="px-4 py-2 text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveHost}
                disabled={!hostForm.hostname.trim()}
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 shadow-md transition-all duration-200"
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
