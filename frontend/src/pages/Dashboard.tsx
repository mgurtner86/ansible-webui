import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import Layout from '../components/Layout';
import {
  FolderGit2,
  Server,
  FileCode,
  PlayCircle,
  CheckCircle,
  XCircle,
  Clock,
  Activity,
} from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {
      const data = await api.stats();
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
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

  const statCards = [
    { name: 'Projects', value: stats?.totals.projects || 0, icon: FolderGit2, link: '/projects', color: 'bg-blue-500' },
    { name: 'Inventories', value: stats?.totals.inventories || 0, icon: Server, link: '/inventories', color: 'bg-green-500' },
    { name: 'Templates', value: stats?.totals.templates || 0, icon: FileCode, link: '/templates', color: 'bg-purple-500' },
    { name: 'Jobs', value: stats?.totals.jobs || 0, icon: PlayCircle, link: '/jobs', color: 'bg-orange-500' },
  ];

  const jobStatusCards = [
    { name: 'Success', value: stats?.jobsByStatus.success || 0, icon: CheckCircle, color: 'text-green-600 bg-green-50' },
    { name: 'Failed', value: stats?.jobsByStatus.failed || 0, icon: XCircle, color: 'text-red-600 bg-red-50' },
    { name: 'Running', value: stats?.jobsByStatus.running || 0, icon: Activity, color: 'text-blue-600 bg-blue-50' },
    { name: 'Queued', value: stats?.jobsByStatus.queued || 0, icon: Clock, color: 'text-yellow-600 bg-yellow-50' },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Overview of your Ansible Tower instance</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.name}
                to={card.link}
                className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{card.name}</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{card.value}</p>
                  </div>
                  <div className={`${card.color} p-3 rounded-lg`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Job Status (Last 24h)</h2>
            <div className="space-y-4">
              {jobStatusCards.map((card) => {
                const Icon = card.icon;
                return (
                  <div key={card.name} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${card.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-gray-700 font-medium">{card.name}</span>
                    </div>
                    <span className="text-2xl font-bold text-gray-900">{card.value}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Jobs</h2>
            <div className="space-y-3">
              {stats?.recentJobs.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No recent jobs</p>
              ) : (
                stats?.recentJobs.map((job: any) => (
                  <Link
                    key={job.id}
                    to={`/jobs/${job.id}`}
                    className="block p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{job.template_name}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(job.created_at).toLocaleString()}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded ${
                          job.status === 'success'
                            ? 'bg-green-100 text-green-800'
                            : job.status === 'failed'
                            ? 'bg-red-100 text-red-800'
                            : job.status === 'running'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {job.status}
                      </span>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
