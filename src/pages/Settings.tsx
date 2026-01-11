import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import Layout from '../components/Layout';
import { Settings as SettingsIcon, Save, Mail, Shield, Plus, Edit2, Trash2 } from 'lucide-react';

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

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-2">
                  <Mail className="w-6 h-6 text-gray-700" />
                  <h2 className="text-xl font-bold text-gray-900">Email Templates</h2>
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
