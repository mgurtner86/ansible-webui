import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import Layout from '../components/Layout';
import AnsibleOutputParser from '../components/AnsibleOutputParser';
import { Play, CheckCircle, XCircle, Clock, ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react';

export default function JobExecution() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [job, setJob] = useState<any>(null);
  const [output, setOutput] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [isLiveOutputExpanded, setIsLiveOutputExpanded] = useState(true);
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
    if (outputRef.current && isLiveOutputExpanded) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output, isLiveOutputExpanded]);

  useEffect(() => {
    if (job && (job.status === 'completed' || job.status === 'failed' || job.status === 'canceled')) {
      setIsLiveOutputExpanded(false);
    }
  }, [job?.status]);

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
    }, 500);
  }

  function getStatusIcon() {
    switch (job?.status) {
      case 'completed':
        return <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-500" />;
      case 'failed':
        return <XCircle className="w-6 h-6 text-red-600 dark:text-red-500" />;
      case 'running':
        return <Play className="w-6 h-6 text-blue-600 dark:text-blue-500 animate-pulse" />;
      case 'pending':
        return <Clock className="w-6 h-6 text-slate-400 dark:text-slate-500" />;
      default:
        return <Clock className="w-6 h-6 text-slate-400 dark:text-slate-500" />;
    }
  }

  function getStatusColor() {
    switch (job?.status) {
      case 'completed':
        return 'bg-gradient-to-r from-green-500 to-green-600 text-white';
      case 'failed':
        return 'bg-gradient-to-r from-red-500 to-red-600 text-white';
      case 'running':
        return 'bg-gradient-to-r from-blue-500 to-blue-600 text-white';
      case 'pending':
        return 'bg-gradient-to-r from-slate-400 to-slate-500 text-white';
      case 'canceled':
        return 'bg-gradient-to-r from-orange-500 to-orange-600 text-white';
      default:
        return 'bg-gradient-to-r from-slate-400 to-slate-500 text-white';
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
    return 'text-slate-300 dark:text-slate-400';
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
          <div className="text-slate-500 dark:text-slate-400">Loading...</div>
        </div>
      </Layout>
    );
  }

  if (!job) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-slate-500 dark:text-slate-400">Job not found</div>
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
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-xl transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            </button>
            <div>
              <h1 className="text-4xl font-light text-slate-900 dark:text-slate-100">Job Execution</h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">Job #{job.id.slice(0, 8)}</p>
            </div>
          </div>
          {job.status === 'running' && (
            <button
              onClick={handleCancel}
              className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 shadow-md transition-all duration-200"
            >
              Cancel Job
            </button>
          )}
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200/60 dark:border-slate-700/60 p-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-start space-x-4">
              {getStatusIcon()}
              <div>
                <h2 className="text-2xl font-light text-slate-900 dark:text-slate-100">{job.template_name}</h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  Template: {job.template_name} • Inventory: {job.inventory_name}
                </p>
                <div className="flex items-center space-x-3 mt-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium shadow-md ${getStatusColor()}`}>
                    {job.status}
                  </span>
                  <span className="text-sm text-slate-500 dark:text-slate-400">
                    Started: {new Date(job.started_at).toLocaleString()}
                  </span>
                  {job.finished_at && (
                    <span className="text-sm text-slate-500 dark:text-slate-400">
                      Finished: {new Date(job.finished_at).toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
            <div className="flex items-center justify-between mb-3">
              <button
                onClick={() => setIsLiveOutputExpanded(!isLiveOutputExpanded)}
                className="flex items-center space-x-2 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-lg px-3 py-2 transition-colors"
              >
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wide">
                  Live Output
                </h3>
                {isLiveOutputExpanded ? (
                  <ChevronUp className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                )}
              </button>
              {job.status === 'running' && (
                <div className="flex items-center space-x-2 text-sm text-blue-600 dark:text-blue-400">
                  <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full animate-pulse"></div>
                  <span>Streaming...</span>
                </div>
              )}
            </div>
            {isLiveOutputExpanded && (
              <div
                ref={outputRef}
                className="bg-slate-900 dark:bg-slate-950 font-mono text-sm p-4 rounded-xl h-[500px] overflow-y-auto border border-slate-700 dark:border-slate-800"
                style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}
              >
                {renderColoredOutput()}
              </div>
            )}
          </div>

          <AnsibleOutputParser output={output} />

          {job.status === 'completed' && (
            <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700/50 rounded-xl">
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-500 mr-2" />
                <span className="text-green-800 dark:text-green-300 font-medium">Job completed successfully</span>
              </div>
            </div>
          )}

          {job.status === 'failed' && (
            <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700/50 rounded-xl">
              <div className="flex items-center">
                <XCircle className="w-5 h-5 text-red-600 dark:text-red-500 mr-2" />
                <span className="text-red-800 dark:text-red-300 font-medium">Job failed</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
