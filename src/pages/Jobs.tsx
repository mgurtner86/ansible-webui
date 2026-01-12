import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import Layout from '../components/Layout';
import { Play, CheckCircle, XCircle, Clock, Eye } from 'lucide-react';

export default function Jobs() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    loadJobs();
    const interval = setInterval(loadJobs, 5000);
    return () => clearInterval(interval);
  }, []);

  async function loadJobs() {
    try {
      const data = await api.jobs.list();
      setJobs(data);
    } catch (error) {
      console.error('Failed to load jobs:', error);
    } finally {
      setLoading(false);
    }
  }

  function getStatusIcon(status: string) {
    switch (status) {
      case 'completed':
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'running':
        return <Play className="w-5 h-5 text-blue-600 animate-pulse" />;
      case 'pending':
      case 'queued':
        return <Clock className="w-5 h-5 text-gray-400" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'completed':
      case 'success':
        return 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white';
      case 'failed':
        return 'bg-gradient-to-r from-red-500 to-red-600 text-white';
      case 'running':
        return 'bg-gradient-to-r from-blue-500 to-blue-600 text-white';
      case 'pending':
      case 'queued':
        return 'bg-gradient-to-r from-slate-400 to-slate-500 text-white';
      case 'canceled':
        return 'bg-gradient-to-r from-orange-500 to-orange-600 text-white';
      default:
        return 'bg-gradient-to-r from-slate-400 to-slate-500 text-white';
    }
  }

  const filteredJobs = jobs.filter(job => {
    if (filter === 'all') return true;
    if (filter === 'completed') return job.status === 'completed' || job.status === 'success';
    return job.status === filter;
  });

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
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-light tracking-tight text-slate-800">Jobs</h1>
            <p className="text-slate-500 mt-2 text-lg">Job execution history and live monitoring</p>
          </div>
        </div>

        <div className="flex items-center space-x-3 bg-white rounded-xl p-2 shadow-md border border-slate-200/60 w-fit">
          <button
            onClick={() => setFilter('all')}
            className={`px-6 py-2.5 rounded-lg font-medium transition-all duration-200 ${filter === 'all' ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md' : 'text-slate-700 hover:bg-slate-50'}`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('running')}
            className={`px-6 py-2.5 rounded-lg font-medium transition-all duration-200 ${filter === 'running' ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md' : 'text-slate-700 hover:bg-slate-50'}`}
          >
            Running
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-6 py-2.5 rounded-lg font-medium transition-all duration-200 ${filter === 'completed' ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md' : 'text-slate-700 hover:bg-slate-50'}`}
          >
            Completed
          </button>
          <button
            onClick={() => setFilter('failed')}
            className={`px-6 py-2.5 rounded-lg font-medium transition-all duration-200 ${filter === 'failed' ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md' : 'text-slate-700 hover:bg-slate-50'}`}
          >
            Failed
          </button>
        </div>

        <div className="space-y-4">
          {filteredJobs.map((job) => (
            <div
              key={job.id}
              className="group bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 p-6 cursor-pointer border border-slate-200/60"
              onClick={() => navigate(`/jobs/${job.id}`)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1">
                  <div className="mt-1">
                    {getStatusIcon(job.status)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <h3 className="text-xl font-medium text-slate-900 group-hover:text-blue-600 transition-colors">
                        {job.template_name}
                      </h3>
                      <span className={`px-3 py-1.5 rounded-lg text-xs font-medium shadow-sm ${getStatusColor(job.status)}`}>
                        {job.status}
                      </span>
                    </div>
                    <div className="space-y-2 text-sm text-slate-600">
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <span className="text-xs text-slate-500 uppercase tracking-wider">Job ID</span>
                          <p className="font-mono mt-1">{job.id.slice(0, 8)}</p>
                        </div>
                        <div>
                          <span className="text-xs text-slate-500 uppercase tracking-wider">Template</span>
                          <p className="font-medium mt-1">{job.template_name}</p>
                        </div>
                        <div>
                          <span className="text-xs text-slate-500 uppercase tracking-wider">Inventory</span>
                          <p className="font-medium mt-1">{job.inventory_name}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-6 pt-2 text-xs text-slate-500">
                        <span>Started: {new Date(job.started_at || job.created_at).toLocaleString()}</span>
                        {job.finished_at && (
                          <span>Finished: {new Date(job.finished_at).toLocaleString()}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/jobs/${job.id}`);
                  }}
                  className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-200 shadow-md"
                >
                  <Eye className="w-4 h-4" />
                  <span className="font-medium">View</span>
                </button>
              </div>
            </div>
          ))}
          {filteredJobs.length === 0 && (
            <div className="text-center py-16 bg-white rounded-xl shadow-md border border-slate-200/60">
              <Play className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 text-lg">No jobs found. Launch a template to start a job.</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
