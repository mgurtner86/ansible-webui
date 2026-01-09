import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import Layout from '../components/Layout';
import { Plus, Key } from 'lucide-react';

export default function Credentials() {
  const [credentials, setCredentials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCredentials();
  }, []);

  async function loadCredentials() {
    try {
      const data = await api.credentials.list();
      setCredentials(data);
    } catch (error) {
      console.error('Failed to load credentials:', error);
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
            <h1 className="text-2xl font-bold text-gray-900">Credentials</h1>
            <p className="text-gray-600 mt-1">Secure credential storage for SSH, API keys, and more</p>
          </div>
          <button className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            New Credential
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {credentials.map((credential) => (
            <div key={credential.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <Key className="w-5 h-5 text-gray-400 mt-1" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{credential.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{credential.description}</p>
                    <div className="flex items-center space-x-3 mt-2 text-sm text-gray-500">
                      <span className="px-2 py-1 bg-gray-100 rounded">{credential.type}</span>
                      <span>•</span>
                      <span>{credential.scope}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {credentials.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No credentials yet. Create one to get started.
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
