import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import Layout from '../components/Layout';
import { Settings as SettingsIcon, Save, Mail, Shield } from 'lucide-react';

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
  const [formData, setFormData] = useState<Record<string, any>>({});

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const settingsData = await api.settings.list();
      setSettings(settingsData);

      const initialData: Record<string, any> = {};
      settingsData.forEach((setting: Setting) => {
        initialData[setting.key] = setting.value;
      });
      setFormData(initialData);
    } catch (error) {
      console.error('Failed to load data:', error);
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
      await loadData();
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

  function getSettingsByKeys(keys: string[]) {
    return settings.filter(s => keys.includes(s.key));
  }

  function renderInput(setting: Setting) {
    const value = formData[setting.key];

    if (typeof value === 'boolean') {
      return (
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <label className="text-sm font-medium text-gray-700">{setting.description}</label>
          <input
            type="checkbox"
            checked={value}
            onChange={(e) => handleInputChange(setting.key, e.target.checked)}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
        </div>
      );
    }

    if (setting.is_encrypted || setting.key.includes('password') || setting.key.includes('secret')) {
      return (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            {setting.description}
          </label>
          <input
            type="password"
            value={value || ''}
            onChange={(e) => handleInputChange(setting.key, e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter value"
          />
        </div>
      );
    }

    if (typeof value === 'number') {
      return (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            {setting.description}
          </label>
          <input
            type="number"
            value={value}
            onChange={(e) => handleInputChange(setting.key, parseInt(e.target.value))}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      );
    }

    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          {setting.description}
        </label>
        <input
          type="text"
          value={value || ''}
          onChange={(e) => handleInputChange(setting.key, e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter value"
        />
      </div>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <SettingsIcon className="w-8 h-8 text-gray-700" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
              <p className="text-gray-600 mt-1">Configure authentication and email notifications</p>
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
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center space-x-2 mb-6">
                <Shield className="w-6 h-6 text-gray-700" />
                <h2 className="text-xl font-bold text-gray-900">Authentication Settings</h2>
              </div>

              <div className="space-y-6">
                {getSettingsByKeys(['auth.microsoft365.enabled']).map((setting) => (
                  <div key={setting.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <label className="text-sm font-medium text-gray-900">
                      Enable Microsoft Entra ID (Azure AD) Authentication
                    </label>
                    <input
                      type="checkbox"
                      checked={formData[setting.key] || false}
                      onChange={(e) => handleInputChange(setting.key, e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                  </div>
                ))}

                {getSettingsByKeys(['auth.microsoft365.client_id']).map((setting) => (
                  <div key={setting.key} className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Client ID (Application ID) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData[setting.key] || ''}
                      onChange={(e) => handleInputChange(setting.key, e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter Client ID"
                    />
                  </div>
                ))}

                {getSettingsByKeys(['auth.microsoft365.client_secret']).map((setting) => (
                  <div key={setting.key} className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Client Secret <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      value={formData[setting.key] || ''}
                      onChange={(e) => handleInputChange(setting.key, e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono tracking-wider"
                      placeholder="••••••••••••••••••••••••••••••••••••••••"
                    />
                  </div>
                ))}

                {getSettingsByKeys(['auth.microsoft365.tenant_id']).map((setting) => (
                  <div key={setting.key} className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Tenant ID (Directory ID) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData[setting.key] || ''}
                      onChange={(e) => handleInputChange(setting.key, e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter Tenant ID"
                    />
                  </div>
                ))}

                {getSettingsByKeys(['auth.microsoft365.required_group_id']).map((setting) => (
                  <div key={setting.key} className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Required Group ID (Object ID) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData[setting.key] || ''}
                      onChange={(e) => handleInputChange(setting.key, e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter Group Object ID"
                    />
                    <p className="text-sm text-gray-500">
                      Users must be members of this group to access the application
                    </p>
                  </div>
                ))}

                <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-blue-900 mb-2">Microsoft Entra ID Configuration</h3>
                  <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                    <li>Register an app in Azure Portal</li>
                    <li>Configure API permissions: User.Read, GroupMember.Read.All</li>
                    <li>Set redirect URI: http://localhost:3001/api/auth/microsoft/callback</li>
                    <li>Create a security group and add authorized users</li>
                    <li>Refer to AUTHENTICATION_SETUP.md for detailed instructions</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center space-x-2 mb-6">
                <Mail className="w-6 h-6 text-gray-700" />
                <h2 className="text-xl font-bold text-gray-900">Email Notifications</h2>
              </div>

              <div className="space-y-6">
                {getSettingsByKeys(['email.notifications.enabled']).map((setting) => (
                  <div key={setting.key}>
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <label className="text-sm font-medium text-gray-900">
                        Enable Email Notifications
                      </label>
                      <input
                        type="checkbox"
                        checked={formData[setting.key] || false}
                        onChange={(e) => handleInputChange(setting.key, e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                    </div>
                    <p className="text-sm text-gray-600 mt-2 ml-4">
                      Send email alerts via Microsoft Graph API (OAuth 2.0)
                    </p>
                  </div>
                ))}

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-blue-900 mb-2">Microsoft Graph Configuration</h3>
                  <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                    <li>Register an app in Azure Portal</li>
                    <li>API Permissions: Mail.Send (Application permission)</li>
                    <li>Grant admin consent for the permission</li>
                    <li>Create a client secret and note the value</li>
                    <li>The sender email must be a valid Microsoft 365 mailbox</li>
                  </ul>
                </div>

                {getSettingsByKeys(['email.graph.tenant_id']).map((setting) => (
                  <div key={setting.key} className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Microsoft Tenant ID <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData[setting.key] || ''}
                      onChange={(e) => handleInputChange(setting.key, e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter Tenant ID"
                    />
                  </div>
                ))}

                {getSettingsByKeys(['email.graph.client_id']).map((setting) => (
                  <div key={setting.key} className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Application (Client) ID <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData[setting.key] || ''}
                      onChange={(e) => handleInputChange(setting.key, e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter Application ID"
                    />
                  </div>
                ))}

                {getSettingsByKeys(['email.graph.client_secret']).map((setting) => (
                  <div key={setting.key} className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Client Secret <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      value={formData[setting.key] || ''}
                      onChange={(e) => handleInputChange(setting.key, e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono tracking-wider"
                      placeholder="••••••••••••••••••••••••••••••••••••••••"
                    />
                  </div>
                ))}

                {getSettingsByKeys(['email.from']).map((setting) => (
                  <div key={setting.key} className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      From Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={formData[setting.key] || ''}
                      onChange={(e) => handleInputChange(setting.key, e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="sender@example.com"
                    />
                    <p className="text-sm text-gray-500">
                      Must be a valid Microsoft 365 mailbox
                    </p>
                  </div>
                ))}

                {getSettingsByKeys(['email.recipients']).map((setting) => (
                  <div key={setting.key} className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Recipient Email Addresses <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData[setting.key] || ''}
                      onChange={(e) => handleInputChange(setting.key, e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="user1@example.com, user2@example.com"
                    />
                    <p className="text-sm text-gray-500">
                      Comma-separated list of email addresses
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
