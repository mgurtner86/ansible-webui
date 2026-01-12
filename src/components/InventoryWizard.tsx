import { useState } from 'react';
import { X, ChevronRight, ChevronLeft, Plus, Trash2, Server, Key, Eye, EyeOff } from 'lucide-react';
import { api } from '../lib/api';

interface Host {
  hostname: string;
  port?: number;
  vars: Record<string, string>;
}

interface WizardProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function InventoryWizard({ onClose, onSuccess }: WizardProps) {
  const [step, setStep] = useState(1);
  const [inventoryName, setInventoryName] = useState('');
  const [inventoryDescription, setInventoryDescription] = useState('');
  const [osType, setOsType] = useState<'linux' | 'windows'>('linux');
  const [hosts, setHosts] = useState<Host[]>([{ hostname: '', vars: {} }]);
  const [connectionType, setConnectionType] = useState<'ssh' | 'winrm'>('ssh');
  const [username, setUsername] = useState('');
  const [authMethod, setAuthMethod] = useState<'password' | 'key'>('password');
  const [password, setPassword] = useState('');
  const [sshKey, setSshKey] = useState('');
  const [port, setPort] = useState('');
  const [becomeMethod, setBecomeMethod] = useState('');
  const [becomeUser, setBecomeUser] = useState('');
  const [becomePassword, setBecomePassword] = useState('');
  const [credentialName, setCredentialName] = useState('');
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showBecomePassword, setShowBecomePassword] = useState(false);
  const [showSshKey, setShowSshKey] = useState(false);

  function addHost() {
    setHosts([...hosts, { hostname: '', vars: {} }]);
  }

  function removeHost(index: number) {
    setHosts(hosts.filter((_, i) => i !== index));
  }

  function updateHost(index: number, hostname: string) {
    const newHosts = [...hosts];
    newHosts[index] = { ...newHosts[index], hostname };
    setHosts(newHosts);
  }

  function canProceed() {
    switch (step) {
      case 1:
        return inventoryName.trim() !== '';
      case 2:
        return hosts.some(h => h.hostname.trim() !== '');
      case 3:
        return username.trim() !== '' && (authMethod === 'key' ? sshKey.trim() !== '' : password.trim() !== '');
      default:
        return true;
    }
  }

  async function handleFinish() {
    setSaving(true);
    try {
      const defaultPort = osType === 'windows' ? 5986 : 22;
      const actualPort = port ? parseInt(port) : defaultPort;

      const credentialData: Record<string, string> = {
        username,
      };

      if (authMethod === 'password') {
        credentialData.password = password;
      } else {
        credentialData.ssh_key_data = sshKey;
      }

      if (becomeMethod) {
        credentialData.become_method = becomeMethod;
      }
      if (becomeUser) {
        credentialData.become_username = becomeUser;
      }
      if (becomePassword) {
        credentialData.become_password = becomePassword;
      }

      if (osType === 'windows') {
        credentialData.ansible_connection = 'winrm';
        credentialData.ansible_winrm_transport = 'ntlm';
        credentialData.ansible_winrm_server_cert_validation = 'ignore';
      }

      const credential = await api.credentials.create({
        name: credentialName || `${inventoryName} - Credential`,
        description: `Auto-created credential for ${inventoryName}`,
        type: osType === 'windows' ? 'ssh' : 'ssh',
        secret: credentialData,
        scope: 'user',
      });

      const inventory = await api.inventories.create({
        name: inventoryName,
        description: inventoryDescription,
        source: 'static',
        content_or_ref: '',
        variables: {},
        credential_id: credential.id,
      });

      for (const host of hosts) {
        if (host.hostname.trim()) {
          const hostVars: Record<string, string | number> = {
            ansible_port: actualPort.toString(),
          };

          if (osType === 'windows') {
            hostVars.ansible_connection = 'winrm';
            hostVars.ansible_winrm_transport = 'ntlm';
            hostVars.ansible_winrm_server_cert_validation = 'ignore';
          }

          await api.hosts.create({
            inventory_id: inventory.id,
            hostname: host.hostname.trim(),
            vars: hostVars,
            groups: [],
            enabled: true,
          });
        }
      }

      onSuccess();
    } catch (error) {
      console.error('Failed to create inventory:', error);
      alert('Failed to create inventory');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col border border-slate-200/60 dark:border-slate-700/60">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Create Inventory</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Step {step} of 3</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-4">Basic Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Inventory Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={inventoryName}
                      onChange={(e) => setInventoryName(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                      placeholder="Production Servers"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Description
                    </label>
                    <textarea
                      value={inventoryDescription}
                      onChange={(e) => setInventoryDescription(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                      rows={3}
                      placeholder="Description of this inventory..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Operating System Type *
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => {
                          setOsType('linux');
                          setConnectionType('ssh');
                        }}
                        className={`p-4 border-2 rounded-lg text-left transition-all ${
                          osType === 'linux'
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                            : 'border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500'
                        }`}
                      >
                        <Server className="w-6 h-6 mb-2 text-slate-700 dark:text-slate-300" />
                        <div className="font-medium text-slate-900 dark:text-slate-100">Linux</div>
                        <div className="text-sm text-slate-600 dark:text-slate-400">SSH Connection</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setOsType('windows');
                          setConnectionType('winrm');
                        }}
                        className={`p-4 border-2 rounded-lg text-left transition-all ${
                          osType === 'windows'
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                            : 'border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500'
                        }`}
                      >
                        <Server className="w-6 h-6 mb-2 text-slate-700 dark:text-slate-300" />
                        <div className="font-medium text-slate-900 dark:text-slate-100">Windows</div>
                        <div className="text-sm text-slate-600 dark:text-slate-400">WinRM Connection</div>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-4">Add Hosts</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                  Add the hostnames or IP addresses of the servers in this inventory.
                </p>
                <div className="space-y-3">
                  {hosts.map((host, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={host.hostname}
                        onChange={(e) => updateHost(index, e.target.value)}
                        className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                        placeholder="hostname or IP address"
                      />
                      {hosts.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeHost(index)}
                          className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-slate-700 rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addHost}
                    className="inline-flex items-center px-3 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Another Host
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-4">Connection Details</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Credential Name (Optional)
                    </label>
                    <input
                      type="text"
                      value={credentialName}
                      onChange={(e) => setCredentialName(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                      placeholder="Auto-generated if left empty"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Username *
                    </label>
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                      placeholder={osType === 'windows' ? 'Administrator' : 'root'}
                    />
                  </div>

                  {osType === 'linux' && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Authentication Method *
                      </label>
                      <div className="grid grid-cols-2 gap-4">
                        <button
                          type="button"
                          onClick={() => setAuthMethod('password')}
                          className={`p-3 border-2 rounded-lg text-left transition-all ${
                            authMethod === 'password'
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                              : 'border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500'
                          }`}
                        >
                          <Key className="w-5 h-5 mb-1 text-slate-700 dark:text-slate-300" />
                          <div className="font-medium text-sm text-slate-900 dark:text-slate-100">Password</div>
                        </button>
                        <button
                          type="button"
                          onClick={() => setAuthMethod('key')}
                          className={`p-3 border-2 rounded-lg text-left transition-all ${
                            authMethod === 'key'
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                              : 'border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500'
                          }`}
                        >
                          <Key className="w-5 h-5 mb-1 text-slate-700 dark:text-slate-300" />
                          <div className="font-medium text-sm text-slate-900 dark:text-slate-100">SSH Key</div>
                        </button>
                      </div>
                    </div>
                  )}

                  {(osType === 'windows' || authMethod === 'password') && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Password *
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full px-3 py-2 pr-10 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  )}

                  {osType === 'linux' && authMethod === 'key' && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                        <span>SSH Private Key *</span>
                        <button
                          type="button"
                          onClick={() => setShowSshKey(!showSshKey)}
                          className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 flex items-center"
                        >
                          {showSshKey ? (
                            <>
                              <EyeOff className="w-3 h-3 mr-1" />
                              Hide
                            </>
                          ) : (
                            <>
                              <Eye className="w-3 h-3 mr-1" />
                              Show
                            </>
                          )}
                        </button>
                      </label>
                      <textarea
                        required
                        value={sshKey}
                        onChange={(e) => setSshKey(e.target.value)}
                        className={`w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 ${!showSshKey ? 'blur-sm' : ''}`}
                        rows={6}
                        placeholder="-----BEGIN RSA PRIVATE KEY-----&#10;...&#10;-----END RSA PRIVATE KEY-----"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Port (Optional)
                    </label>
                    <input
                      type="number"
                      value={port}
                      onChange={(e) => setPort(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                      placeholder={osType === 'windows' ? '5986' : '22'}
                    />
                  </div>

                  {osType === 'linux' && (
                    <>
                      <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                        <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-3">Privilege Escalation (Optional)</h4>
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                              Become Method
                            </label>
                            <select
                              value={becomeMethod}
                              onChange={(e) => setBecomeMethod(e.target.value)}
                              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                            >
                              <option value="">None</option>
                              <option value="sudo">sudo</option>
                              <option value="su">su</option>
                              <option value="doas">doas</option>
                            </select>
                          </div>
                          {becomeMethod && (
                            <>
                              <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                  Become User
                                </label>
                                <input
                                  type="text"
                                  value={becomeUser}
                                  onChange={(e) => setBecomeUser(e.target.value)}
                                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                                  placeholder="root"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                  Become Password
                                </label>
                                <div className="relative">
                                  <input
                                    type={showBecomePassword ? "text" : "password"}
                                    value={becomePassword}
                                    onChange={(e) => setBecomePassword(e.target.value)}
                                    className="w-full px-3 py-2 pr-10 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setShowBecomePassword(!showBecomePassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                                  >
                                    {showBecomePassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                  </button>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between p-6 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
          <button
            type="button"
            onClick={() => setStep(Math.max(1, step - 1))}
            disabled={step === 1}
            className="inline-flex items-center px-4 py-2 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Previous
          </button>
          <div className="flex items-center space-x-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`w-2 h-2 rounded-full ${
                  s === step ? 'bg-blue-600' : s < step ? 'bg-blue-300 dark:bg-blue-400' : 'bg-slate-300 dark:bg-slate-600'
                }`}
              />
            ))}
          </div>
          {step < 3 ? (
            <button
              type="button"
              onClick={() => setStep(step + 1)}
              disabled={!canProceed()}
              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md transition-all"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinish}
              disabled={!canProceed() || saving}
              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md transition-all"
            >
              {saving ? 'Creating...' : 'Create Inventory'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
