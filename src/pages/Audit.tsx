import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import Layout from '../components/Layout';
import { Shield, User, Clock, Filter, ChevronLeft, ChevronRight } from 'lucide-react';

interface AuditLog {
  id: string;
  actor_id: string;
  actor_email: string;
  actor_name: string;
  action: string;
  target_type: string;
  target_id: string;
  before: any;
  after: any;
  details: string;
  status: string;
  ip_address: string;
  user_agent: string;
  timestamp: string;
}

export default function Audit() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(25);
  const [filters, setFilters] = useState({
    action: '',
    target_type: '',
  });

  useEffect(() => {
    loadLogs();
  }, [page, filters]);

  async function loadLogs() {
    try {
      setLoading(true);
      const data = await api.audit.list({
        page,
        limit,
        action: filters.action || undefined,
        target_type: filters.target_type || undefined,
      });
      setLogs(data.logs);
      setTotal(data.total);
    } catch (error) {
      console.error('Failed to load audit logs:', error);
    } finally {
      setLoading(false);
    }
  }

  function getActionColor(action: string) {
    if (action.includes('create')) return 'bg-green-100 text-green-800';
    if (action.includes('update')) return 'bg-blue-100 text-blue-800';
    if (action.includes('delete')) return 'bg-red-100 text-red-800';
    if (action.includes('login')) return 'bg-purple-100 text-purple-800';
    if (action.includes('launch')) return 'bg-orange-100 text-orange-800';
    return 'bg-gray-100 text-gray-800';
  }

  function getStatusColor(status: string) {
    return status === 'success' ? 'text-green-600' : 'text-red-600';
  }

  function formatAction(action: string) {
    return action
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Shield className="w-8 h-8 text-gray-700" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Audit Log</h1>
              <p className="text-gray-600 mt-1">Track all system activities and changes</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center space-x-4">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={filters.action}
                onChange={(e) => setFilters({ ...filters, action: e.target.value })}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Actions</option>
                <option value="create_template">Create Template</option>
                <option value="update_template">Update Template</option>
                <option value="delete_template">Delete Template</option>
                <option value="launch_job">Launch Job</option>
                <option value="create_credential">Create Credential</option>
                <option value="update_credential">Update Credential</option>
                <option value="delete_credential">Delete Credential</option>
                <option value="create_inventory">Create Inventory</option>
                <option value="update_inventory">Update Inventory</option>
                <option value="delete_inventory">Delete Inventory</option>
                <option value="login">Login</option>
                <option value="logout">Logout</option>
                <option value="update_setting">Update Setting</option>
              </select>
              <select
                value={filters.target_type}
                onChange={(e) => setFilters({ ...filters, target_type: e.target.value })}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Types</option>
                <option value="template">Template</option>
                <option value="job">Job</option>
                <option value="credential">Credential</option>
                <option value="inventory">Inventory</option>
                <option value="playbook">Playbook</option>
                <option value="setting">Setting</option>
                <option value="user">User</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-gray-500">Loading...</div>
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64">
              <Shield className="w-16 h-16 text-gray-300 mb-4" />
              <p className="text-gray-500">No audit logs found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Timestamp
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Target
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      IP Address
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm">
                          <Clock className="w-4 h-4 text-gray-400 mr-2" />
                          <span className="text-gray-900">
                            {new Date(log.timestamp).toLocaleString()}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <User className="w-4 h-4 text-gray-400 mr-2" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {log.actor_name || log.actor_email}
                            </div>
                            {log.actor_name && (
                              <div className="text-xs text-gray-500">{log.actor_email}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getActionColor(log.action)}`}>
                          {formatAction(log.action)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{log.target_type}</div>
                        {log.details && (
                          <div className="text-xs text-gray-500">{log.details}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-medium ${getStatusColor(log.status)}`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {log.ip_address || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!loading && logs.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} results
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-600" />
                </button>
                <span className="text-sm text-gray-600">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
