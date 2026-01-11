import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import Layout from '../components/Layout';
import { Settings as SettingsIcon, Save, Lock, Mail, Shield } from 'lucide-react';

interface Setting {
  id: string;
  key: string;
  value: any;
  category: string;
  description: string;
  is_encrypted: boolean;
  updated_at: string;
}

export default function Settings() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('authentication');
  const [formData, setFormData] = useState<Record<string, any>>({});

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      setLoading(true);
      const data = await api.settings.list();
      setSettings(data);

      const initialData: Record<string, any> = {};
      data.forEach((setting: Setting) => {
        initialData[setting.key] = setting.value;
      });
      setFormData(initialData);
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    try {
      setSaving(true);

      const promises = settings.map(setting => {
        if (formData[setting.key] !== setting.value) {
          return api.settings.update(setting.key, formData[setting.key]);
        }
        return Promise.resolve();
      });

      await Promise.all(promises);
      await loadSettings();
      alert('Settings saved successfully');
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  }

  function handleInputChange(key: string, value: any) {
    setFormData(prev => ({ ...prev, [key]: value }));
  }

  function getSettingsByCategory(category: string) {
    return settings.filter(s => s.category === category);
  }

  function renderInput(setting: Setting) {
    const value = formData[setting.key];

    if (typeof value === 'boolean') {
      return (
        <div className="flex items-center">
          <input
            type="checkbox"
            checked={value}
            onChange={(e) => handleInputChange(setting.key, e.target.checked)}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label className="ml-2 text-sm text-gray-700">{setting.description}</label>
        </div>
      );
    }

    if (setting.is_encrypted || setting.key.includes('password') || setting.key.includes('secret')) {
      return (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {setting.description}
          </label>
          <input
            type="password"
            value={value || ''}
            onChange={(e) => handleInputChange(setting.key, e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter value"
          />
        </div>
      );
    }

    if (typeof value === 'number') {
      return (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {setting.description}
          </label>
          <input
            type="number"
            value={value}
            onChange={(e) => handleInputChange(setting.key, parseInt(e.target.value))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      );
    }

    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {setting.description}
        </label>
        <input
          type="text"
          value={value || ''}
          onChange={(e) => handleInputChange(setting.key, e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter value"
        />
      </div>
    );
  }

  const tabs = [
    { id: 'authentication', name: 'Authentication', icon: Shield },
    { id: 'email', name: 'Email', icon: Mail },
    { id: 'system', name: 'System', icon: SettingsIcon },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <SettingsIcon className="w-8 h-8 text-gray-700" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
              <p className="text-gray-600 mt-1">Configure system settings and integrations</p>
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">Loading...</div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow">
            <div className="border-b border-gray-200">
              <nav className="flex -mb-px">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center space-x-2 px-6 py-4 border-b-2 font-medium text-sm ${
                        activeTab === tab.id
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{tab.name}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="p-6 space-y-6">
              {activeTab === 'authentication' && (
                <div className="space-y-6">
                  <div className="border-b pb-4">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Microsoft 365 OAuth</h2>
                    <div className="space-y-4">
                      {getSettingsByCategory('authentication').map((setting) => (
                        <div key={setting.key} className="p-4 border border-gray-200 rounded-lg">
                          {renderInput(setting)}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start">
                      <Lock className="w-5 h-5 text-blue-600 mr-3 mt-0.5" />
                      <div>
                        <h3 className="text-sm font-semibold text-blue-900">Setup Instructions</h3>
                        <ol className="mt-2 text-sm text-blue-800 space-y-1 list-decimal list-inside">
                          <li>Register an application in Azure AD</li>
                          <li>Set redirect URI to: https://your-domain.com/auth/callback</li>
                          <li>Grant API permissions: User.Read, Mail.Send</li>
                          <li>Copy Client ID and Tenant ID to the fields above</li>
                          <li>Create a client secret and store it securely</li>
                        </ol>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'email' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Email Configuration</h2>
                    <div className="space-y-4">
                      {getSettingsByCategory('email').map((setting) => (
                        <div key={setting.key} className="p-4 border border-gray-200 rounded-lg">
                          {renderInput(setting)}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start">
                      <Mail className="w-5 h-5 text-blue-600 mr-3 mt-0.5" />
                      <div>
                        <h3 className="text-sm font-semibold text-blue-900">OAuth Email Configuration</h3>
                        <p className="mt-1 text-sm text-blue-800">
                          Configure OAuth 2.0 for secure email sending via Microsoft 365.
                          Use the same Client ID and Tenant ID from the Authentication tab.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'system' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">System Settings</h2>
                    <div className="space-y-4">
                      {getSettingsByCategory('system').map((setting) => (
                        <div key={setting.key} className="p-4 border border-gray-200 rounded-lg">
                          {renderInput(setting)}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
