import { useState, useEffect } from 'react';
import { Play, StopCircle, Clock, CheckCircle, XCircle, Loader } from 'lucide-react';
import { api } from '../lib/api';

const statusIcons: Record<string, any> = {
  pending: Clock,
  running: Loader,
  successful: CheckCircle,
  failed: XCircle,
  canceled: StopCircle,
};

const statusColors: Record<string, string> = {
  pending: 'text-gray-500',
  running: 'text-blue-500 animate-spin',
  successful: 'text-green-500',
  failed: 'text-red-500',
  canceled: 'text-gray-500',
};

export function Jobs() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadJobs();
    const interval = setInterval(loadJobs, 3000);
    return () => clearInterval(interval);
  }, []);

  const loadJobs = async () => {
    try {
      const data = await api.getJobs();
      setJobs(data);
    } catch (error) {
      console.error('Failed to load jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this job?')) return;
    try {
      await api.cancelJob(id);
      loadJobs();
    } catch (error) {
      console.error('Failed to cancel job:', error);
      alert('Failed to cancel job');
    }
  };

  const formatDuration = (started: string, finished: string | null) => {
    if (!started) return '-';
    const start = new Date(started).getTime();
    const end = finished ? new Date(finished).getTime() : Date.now();
    const duration = Math.floor((end - start) / 1000);
    if (duration < 60) return `${duration}s`;
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    return `${minutes}m ${seconds}s`;
  };

  if (loading) return <div className="text-center py-8">Loading...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Jobs</h1>
        <p className="text-gray-600 mt-1">Monitor and manage Ansible job executions</p>
      </div>

      <div className="grid gap-4">
        {jobs.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <Play className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">No jobs yet. Launch a template to create one.</p>
          </div>
        ) : (
          jobs.map((job) => {
            const StatusIcon = statusIcons[job.status] || Clock;
            return (
              <div key={job.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <StatusIcon className={`w-5 h-5 ${statusColors[job.status]}`} />
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Job #{job.id} {job.template_name && `- ${job.template_name}`}
                      </h3>
                      <div className="flex gap-4 mt-2 text-sm text-gray-500">
                        <span>Status: <span className="font-medium">{job.status}</span></span>
                        <span>Inventory: {job.inventory_name}</span>
                        <span>Duration: {formatDuration(job.started_at, job.finished_at)}</span>
                        <span>Launched by: {job.launched_by_name}</span>
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        Started: {new Date(job.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {(job.status === 'pending' || job.status === 'running') && (
                      <button onClick={() => handleCancel(job.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                        <StopCircle className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
