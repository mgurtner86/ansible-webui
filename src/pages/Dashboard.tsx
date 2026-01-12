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
    { name: 'Projects', value: stats?.totals.projects || 0, icon: FolderGit2, link: '/projects', color: 'from-blue-500 to-blue-600' },
    { name: 'Inventories', value: stats?.totals.inventories || 0, icon: Server, link: '/inventories', color: 'from-emerald-500 to-emerald-600' },
    { name: 'Templates', value: stats?.totals.templates || 0, icon: FileCode, link: '/templates', color: 'from-orange-500 to-orange-600' },
    { name: 'Jobs', value: stats?.totals.jobs || 0, icon: PlayCircle, link: '/jobs', color: 'from-pink-500 to-pink-600' },
  ];

  const jobStatusCards = [
    { name: 'Success', value: stats?.jobsByStatus.success || 0, icon: CheckCircle, color: 'from-emerald-500 to-emerald-600' },
    { name: 'Failed', value: stats?.jobsByStatus.failed || 0, icon: XCircle, color: 'from-red-500 to-red-600' },
    { name: 'Running', value: stats?.jobsByStatus.running || 0, icon: Activity, color: 'from-blue-500 to-blue-600' },
    { name: 'Queued', value: stats?.jobsByStatus.queued || 0, icon: Clock, color: 'from-amber-500 to-amber-600' },
  ];

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-light tracking-tight text-slate-800 dark:text-slate-100">
            Dashboard
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg">Overview of your Ansible Tower instance</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.name}
                to={card.link}
                className="group relative overflow-hidden bg-white dark:bg-slate-800 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 p-8 border border-slate-200/60 dark:border-slate-700/60"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${card.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>
                <div className="relative">
                  <div className={`inline-flex p-4 rounded-xl bg-gradient-to-br ${card.color} shadow-lg mb-4`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">{card.name}</p>
                  <p className="text-5xl font-light text-slate-900 dark:text-slate-100 mt-3">{card.value}</p>
                </div>
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-2 h-2 bg-slate-400 dark:bg-slate-500 rounded-full"></div>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-8 border border-slate-200/60 dark:border-slate-700/60">
            <h2 className="text-2xl font-light text-slate-800 dark:text-slate-100 mb-6 tracking-tight">Job Status</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Last 24 hours</p>
            <div className="grid grid-cols-2 gap-4">
              {jobStatusCards.map((card) => {
                const Icon = card.icon;
                return (
                  <div key={card.name} className="group relative overflow-hidden bg-gradient-to-br from-slate-50 to-white dark:from-slate-700 dark:to-slate-800 rounded-xl p-6 border border-slate-200/60 dark:border-slate-700/60 hover:shadow-md transition-all duration-300">
                    <div className={`absolute inset-0 bg-gradient-to-br ${card.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>
                    <div className="relative">
                      <div className={`inline-flex p-3 rounded-lg bg-gradient-to-br ${card.color} shadow-md mb-3`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">{card.name}</p>
                      <p className="text-3xl font-light text-slate-900 dark:text-slate-100 mt-2">{card.value}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-8 border border-slate-200/60 dark:border-slate-700/60">
            <h2 className="text-2xl font-light text-slate-800 dark:text-slate-100 mb-6 tracking-tight">Recent Jobs</h2>
            <div className="space-y-3">
              {stats?.recentJobs.length === 0 ? (
                <div className="text-center py-12">
                  <PlayCircle className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-500 dark:text-slate-400">No recent jobs</p>
                </div>
              ) : (
                stats?.recentJobs.map((job: any) => (
                  <Link
                    key={job.id}
                    to={`/jobs/${job.id}`}
                    className="group block p-4 border border-slate-200/60 dark:border-slate-700/60 rounded-xl hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600 transition-all duration-200 bg-gradient-to-r from-white to-slate-50 dark:from-slate-800 dark:to-slate-700"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{job.template_name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          {new Date(job.created_at).toLocaleString()}
                        </p>
                      </div>
                      <span
                        className={`ml-3 px-3 py-1.5 text-xs font-medium rounded-lg shadow-sm ${
                          job.status === 'success'
                            ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white'
                            : job.status === 'failed'
                            ? 'bg-gradient-to-r from-red-500 to-red-600 text-white'
                            : job.status === 'running'
                            ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
                            : 'bg-gradient-to-r from-amber-500 to-amber-600 text-white'
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
