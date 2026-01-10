import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import Layout from '../components/Layout';
import { Play, CheckCircle, XCircle, Clock, ArrowLeft } from 'lucide-react';

export default function JobExecution() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [job, setJob] = useState<any>(null);
  const [output, setOutput] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const outputRef = useRef<HTMLDivElement>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!id) return;

    loadJob();
    startPolling();

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [id]);

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output]);

  async function loadJob() {
    try {
      const data = await api.jobs.get(id!);
      setJob(data);
      setOutput(data.output || 'Waiting for job to start...\n');
    } catch (error) {
      console.error('Failed to load job:', error);
    } finally {
      setLoading(false);
    }
  }

  function startPolling() {
    pollIntervalRef.current = setInterval(async () => {
      try {
        const data = await api.jobs.get(id!);
        setJob(data);
        setOutput(data.output || 'Waiting for job to start...\n');

        if (data.status === 'completed' || data.status === 'failed' || data.status === 'canceled') {
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
          }
        }
      } catch (error) {
        console.error('Failed to poll job:', error);
      }
    }, 2000);
  }

  function getStatusIcon() {
    switch (job?.status) {
      case 'completed':
        return <CheckCircle className="w-6 h-6 text-green-600" />;
      case 'failed':
        return <XCircle className="w-6 h-6 text-red-600" />;
      case 'running':
        return <Play className="w-6 h-6 text-blue-600 animate-pulse" />;
      case 'pending':
        return <Clock className="w-6 h-6 text-gray-400" />;
      default:
        return <Clock className="w-6 h-6 text-gray-400" />;
    }
  }

  function getStatusColor() {
    switch (job?.status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'running':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-gray-100 text-gray-600';
      case 'canceled':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  }

  function getLineColor(line: string): string {
    const lowerLine = line.toLowerCase();

    // Fehler (Rot)
    if (
      lowerLine.includes('fatal') ||
      lowerLine.includes('failed') ||
      lowerLine.includes('error') ||
      lowerLine.includes('unreachable') ||
      lowerLine.match(/\bfailed:\s*\d+/) ||
      lowerLine.includes('fatal:')
    ) {
      return 'text-red-400';
    }

    // Warnungen (Orange)
    if (
      lowerLine.includes('warn') ||
      lowerLine.includes('skipping') ||
      lowerLine.includes('skipped') ||
      lowerLine.includes('deprecated') ||
      lowerLine.includes('retry') ||
      lowerLine.includes('ignored')
    ) {
      return 'text-orange-400';
    }

    // Verbose/Debug (Blau)
    if (
      lowerLine.includes('loading') ||
      lowerLine.includes('declined parsing') ||
      lowerLine.includes('parsed') ||
      lowerLine.includes('callback plugin') ||
      lowerLine.includes('verify_file') ||
      lowerLine.includes('collection') ||
      lowerLine.match(/^\s*(meta|using|reading)/)
    ) {
      return 'text-blue-400';
    }

    // Erfolg (Grün)
    if (
      lowerLine.includes('ok:') ||
      lowerLine.includes('changed:') ||
      lowerLine.match(/ok=\d+/) ||
      lowerLine.match(/changed=\d+/) ||
      lowerLine.includes('play recap') ||
      lowerLine.includes('playbook run') ||
      lowerLine.includes('task [')
    ) {
      return 'text-green-400';
    }

    // Standard (Grau/Weiß)
    return 'text-gray-300';
  }

  function renderColoredOutput() {
    return output.split('\n').map((line, index) => (
      <div key={index} className={getLineColor(line)}>
        {line || '\u00A0'}
      </div>
    ));
  }

  async function handleCancel() {
    if (!confirm('Are you sure you want to cancel this job?')) return;
    try {
      await api.jobs.cancel(id!);
      await loadJob();
    } catch (error) {
      console.error('Failed to cancel job:', error);
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

  if (!job) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Job not found</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/jobs')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Job Execution</h1>
              <p className="text-gray-600 mt-1">Job #{job.id.slice(0, 8)}</p>
            </div>
          </div>
          {job.status === 'running' && (
            <button
              onClick={handleCancel}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Cancel Job
            </button>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-start space-x-4">
              {getStatusIcon()}
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{job.template_name}</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Template: {job.template_name} • Inventory: {job.inventory_name}
                </p>
                <div className="flex items-center space-x-3 mt-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor()}`}>
                    {job.status}
                  </span>
                  <span className="text-sm text-gray-500">
                    Started: {new Date(job.started_at).toLocaleString()}
                  </span>
                  {job.finished_at && (
                    <span className="text-sm text-gray-500">
                      Finished: {new Date(job.finished_at).toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="border-t pt-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                Live Output
              </h3>
              {job.status === 'running' && (
                <div className="flex items-center space-x-2 text-sm text-blue-600">
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                  <span>Streaming...</span>
                </div>
              )}
            </div>
            <div
              ref={outputRef}
              className="bg-gray-900 font-mono text-sm p-4 rounded-lg h-[500px] overflow-y-auto"
              style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}
            >
              {renderColoredOutput()}
            </div>
          </div>

          {job.status === 'completed' && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                <span className="text-green-800 font-medium">Job completed successfully</span>
              </div>
            </div>
          )}

          {job.status === 'failed' && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <XCircle className="w-5 h-5 text-red-600 mr-2" />
                <span className="text-red-800 font-medium">Job failed</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
