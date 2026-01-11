import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import Layout from '../components/Layout';
import { Settings as SettingsIcon, Save, Lock, Mail, Shield, Plus, Edit2, Trash2, Check, X } from 'lucide-react';

interface Setting {
  id: string;
  key: string;
  value: any;
  category: string;
  description: string;
  is_encrypted: boolean;
  updated_at: string;
}

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  variables: string[];
  description: string;
  is_active: boolean;
}

export default function Settings() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('authentication');
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [showTemplateModal, setShowTemplateModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [settingsData, templatesData] = await Promise.all([
        api.settings.list(),
        api.emailTemplates.list(),
      ]);
      setSettings(settingsData);
      setTemplates(templatesData);

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

  async function handleDeleteTemplate(id: string) {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      await api.emailTemplates.delete(id);
      await loadData();
    } catch (error) {
      console.error('Failed to delete template:', error);
      alert('Failed to delete template');
    }
  }

  async function handleToggleTemplate(template: EmailTemplate) {
    try {
      await api.emailTemplates.update(template.id, {
        is_active: !template.is_active,
      });
      await loadData();
    } catch (error) {
      console.error('Failed to toggle template:', error);
      alert('Failed to toggle template');
    }
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

            <div className="p-6">
              {activeTab === 'authentication' && (
                <div className="space-y-8">
                  <div>
                    <div className="flex items-center space-x-2 mb-4">
                      <Lock className="w-5 h-5 text-gray-700" />
                      <h2 className="text-lg font-semibold text-gray-900">Local Authentication</h2>
                    </div>
                    <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
                      {getSettingsByKeys([
                        'auth.local.enabled',
                        'auth.local.require_strong_password',
                        'auth.local.session_timeout',
                        'auth.local.max_login_attempts',
                      ]).map((setting) => (
                        <div key={setting.key}>
                          {renderInput(setting)}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border-t pt-6">
                    <div className="flex items-center space-x-2 mb-4">
                      <Shield className="w-5 h-5 text-blue-600" />
                      <h2 className="text-lg font-semibold text-gray-900">Microsoft 365 OAuth</h2>
                    </div>
                    <div className="space-y-4">
                      {getSettingsByKeys([
                        'auth.microsoft365.enabled',
                        'auth.microsoft365.client_id',
                        'auth.microsoft365.tenant_id',
                        'auth.microsoft365.client_secret',
                      ]).map((setting) => (
                        <div key={setting.key} className="p-4 border border-gray-200 rounded-lg">
                          {renderInput(setting)}
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start">
                        <Lock className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                        <div>
                          <h3 className="text-sm font-semibold text-blue-900">Setup Instructions</h3>
                          <ol className="mt-2 text-sm text-blue-800 space-y-1 list-decimal list-inside">
                            <li>Register an application in Azure AD</li>
                            <li>Set redirect URI to: http://localhost:3001/api/auth/microsoft/callback</li>
                            <li>Grant API permissions: User.Read, Mail.Send, openid, profile, email</li>
                            <li>Copy Client ID and Tenant ID to the fields above</li>
                            <li>Create a client secret in Azure AD and copy the value</li>
                            <li>Enable Microsoft 365 OAuth authentication</li>
                          </ol>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'email' && (
                <div className="space-y-8">
                  <div>
                    <div className="flex items-center space-x-2 mb-4">
                      <Mail className="w-5 h-5 text-gray-700" />
                      <h2 className="text-lg font-semibold text-gray-900">Email Configuration</h2>
                    </div>
                    <div className="space-y-4">
                      {getSettingsByKeys([
                        'email.smtp.host',
                        'email.smtp.port',
                        'email.smtp.user',
                        'email.smtp.password',
                        'email.from',
                        'email.use_oauth',
                      ]).map((setting) => (
                        <div key={setting.key} className="p-4 border border-gray-200 rounded-lg">
                          {renderInput(setting)}
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start">
                        <Mail className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
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

                  <div className="border-t pt-6">
                    <div className="flex items-center space-x-2 mb-4">
                      <Mail className="w-5 h-5 text-gray-700" />
                      <h2 className="text-lg font-semibold text-gray-900">Email Notifications</h2>
                    </div>
                    <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
                      {getSettingsByKeys([
                        'notifications.job_success.enabled',
                        'notifications.job_failed.enabled',
                        'notifications.schedule_upcoming.enabled',
                        'notifications.inventory_sync.enabled',
                        'notifications.system_alerts.enabled',
                      ]).map((setting) => (
                        <div key={setting.key}>
                          {renderInput(setting)}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border-t pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <Mail className="w-5 h-5 text-gray-700" />
                        <h2 className="text-lg font-semibold text-gray-900">Email Templates</h2>
                      </div>
                      <button
                        onClick={() => {
                          setEditingTemplate(null);
                          setShowTemplateModal(true);
                        }}
                        className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add Template</span>
                      </button>
                    </div>
                    <div className="space-y-3">
                      {templates.map((template) => (
                        <div key={template.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3">
                                <h3 className="font-medium text-gray-900">{template.name}</h3>
                                <button
                                  onClick={() => handleToggleTemplate(template)}
                                  className={`px-2 py-1 rounded text-xs font-medium ${
                                    template.is_active
                                      ? 'bg-green-100 text-green-800'
                                      : 'bg-gray-100 text-gray-800'
                                  }`}
                                >
                                  {template.is_active ? 'Active' : 'Inactive'}
                                </button>
                              </div>
                              <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                              <p className="text-sm text-gray-500 mt-2">
                                <strong>Subject:</strong> {template.subject}
                              </p>
                              {template.variables.length > 0 && (
                                <p className="text-sm text-gray-500 mt-1">
                                  <strong>Variables:</strong> {template.variables.join(', ')}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center space-x-2 ml-4">
                              <button
                                onClick={() => {
                                  setEditingTemplate(template);
                                  setShowTemplateModal(true);
                                }}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteTemplate(template.id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'system' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">System Settings</h2>
                    <div className="space-y-4">
                      {getSettingsByKeys([
                        'system.ansible_path',
                        'system.default_forks',
                        'system.default_timeout',
                      ]).map((setting) => (
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

      {showTemplateModal && (
        <TemplateModal
          template={editingTemplate}
          onClose={() => {
            setShowTemplateModal(false);
            setEditingTemplate(null);
          }}
          onSave={async (data) => {
            try {
              if (editingTemplate) {
                await api.emailTemplates.update(editingTemplate.id, data);
              } else {
                await api.emailTemplates.create(data);
              }
              await loadData();
              setShowTemplateModal(false);
              setEditingTemplate(null);
            } catch (error) {
              console.error('Failed to save template:', error);
              alert('Failed to save template');
            }
          }}
        />
      )}
    </Layout>
  );
}

function TemplateModal({
  template,
  onClose,
  onSave,
}: {
  template: EmailTemplate | null;
  onClose: () => void;
  onSave: (data: any) => void;
}) {
  const [name, setName] = useState(template?.name || '');
  const [subject, setSubject] = useState(template?.subject || '');
  const [body, setBody] = useState(template?.body || '');
  const [description, setDescription] = useState(template?.description || '');
  const [variables, setVariables] = useState(template?.variables.join(', ') || '');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            {template ? 'Edit Email Template' : 'New Email Template'}
          </h2>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Template Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2"
              placeholder="e.g., job_success"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2"
              placeholder="Brief description of this template"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2"
              placeholder="Email subject (use {{variable}} for placeholders)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Body (HTML)</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={10}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 font-mono text-sm"
              placeholder="Email body in HTML format (use {{variable}} for placeholders)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Variables (comma-separated)
            </label>
            <input
              type="text"
              value={variables}
              onChange={(e) => setVariables(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2"
              placeholder="e.g., job_name, template_name, completed_at"
            />
            <p className="text-xs text-gray-500 mt-1">
              List all variables used in the subject and body
            </p>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onSave({
                name,
                subject,
                body,
                description,
                variables: variables.split(',').map(v => v.trim()).filter(Boolean),
                is_active: true,
              });
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Save Template
          </button>
        </div>
      </div>
    </div>
  );
}
