import { CheckCircle, XCircle, AlertCircle, MinusCircle, Clock } from 'lucide-react';

interface AnsibleTask {
  name: string;
  status: 'ok' | 'changed' | 'failed' | 'skipped' | 'unreachable' | 'running';
  host?: string;
  details?: string;
  stdout?: string;
  stderr?: string;
  msg?: string | string[];
  results?: any[];
  result?: any;
}

interface AnsiblePlay {
  name: string;
  tasks: AnsibleTask[];
}

interface AnsibleRecap {
  [host: string]: {
    ok: number;
    changed: number;
    unreachable: number;
    failed: number;
    skipped: number;
    rescued: number;
    ignored: number;
  };
}

interface ParsedAnsibleOutput {
  plays: AnsiblePlay[];
  recap?: AnsibleRecap;
}

function formatResultValue(value: any, depth: number = 0): JSX.Element {
  if (value === null || value === undefined) {
    return <span className="text-slate-400 dark:text-slate-500 italic">null</span>;
  }

  if (typeof value === 'boolean') {
    return <span className="text-blue-600 dark:text-blue-400 font-semibold">{value.toString()}</span>;
  }

  if (typeof value === 'number') {
    return <span className="text-green-600 dark:text-green-400 font-semibold">{value}</span>;
  }

  if (typeof value === 'string') {
    if (value.length > 150) {
      return (
        <div className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap font-mono text-xs bg-slate-50 dark:bg-slate-950/50 p-2 rounded mt-1">
          {value}
        </div>
      );
    }
    return <span className="text-slate-700 dark:text-slate-300">{value}</span>;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return <span className="text-slate-500 dark:text-slate-400 italic">empty array</span>;
    }

    return (
      <div className="space-y-3 mt-2">
        {value.map((item, index) => (
          <div key={index} className="border-l-2 border-blue-300 dark:border-blue-700 pl-3 py-1">
            <div className="text-xs font-bold text-blue-700 dark:text-blue-400 mb-1.5">
              Item {index + 1}
            </div>
            <div>{formatResultValue(item, depth + 1)}</div>
          </div>
        ))}
      </div>
    );
  }

  if (typeof value === 'object') {
    const keys = Object.keys(value);
    if (keys.length === 0) {
      return <span className="text-slate-500 dark:text-slate-400 italic">empty object</span>;
    }

    return (
      <div className="space-y-2.5 mt-2">
        {keys.map((key) => (
          <div key={key} className="flex flex-col sm:grid sm:grid-cols-[minmax(140px,auto)_1fr] sm:gap-4">
            <div className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide py-0.5">
              {key}:
            </div>
            <div className="min-w-0 py-0.5">
              {formatResultValue(value[key], depth + 1)}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return <span className="text-slate-600 dark:text-slate-400">{String(value)}</span>;
}

function parseJsonOutput(jsonData: any): ParsedAnsibleOutput {
  const plays: AnsiblePlay[] = [];
  const recap: AnsibleRecap = {};

  if (jsonData.plays && Array.isArray(jsonData.plays)) {
    for (const jsonPlay of jsonData.plays) {
      const play: AnsiblePlay = {
        name: jsonPlay.play?.name || 'Unknown Play',
        tasks: []
      };

      if (jsonPlay.tasks && Array.isArray(jsonPlay.tasks)) {
        for (const jsonTask of jsonPlay.tasks) {
          if (jsonTask.task?.name) {
            const hosts = jsonTask.hosts || {};

            for (const [hostname, hostResult] of Object.entries<any>(hosts)) {
              const task: AnsibleTask = {
                name: jsonTask.task.name,
                status: hostResult.failed ? 'failed' :
                       hostResult.changed ? 'changed' :
                       hostResult.unreachable ? 'unreachable' :
                       hostResult.skipped ? 'skipped' : 'ok',
                host: hostname
              };

              if (hostResult.stdout) task.stdout = hostResult.stdout;
              if (hostResult.stderr) task.stderr = hostResult.stderr;
              if (hostResult.msg) task.msg = hostResult.msg;
              if (hostResult.results) task.results = hostResult.results;

              play.tasks.push(task);
            }
          }
        }
      }

      plays.push(play);
    }
  }

  if (jsonData.stats) {
    for (const [hostname, stats] of Object.entries<any>(jsonData.stats)) {
      recap[hostname] = {
        ok: stats.ok || 0,
        changed: stats.changed || 0,
        unreachable: stats.unreachable || 0,
        failed: stats.failures || 0,
        skipped: stats.skipped || 0,
        rescued: stats.rescued || 0,
        ignored: stats.ignored || 0
      };
    }
  }

  return {
    plays,
    recap: Object.keys(recap).length > 0 ? recap : undefined
  };
}

export function parseAnsibleOutput(output: string): ParsedAnsibleOutput {
  try {
    const jsonMatch = output.match(/\{[\s\S]*"plays"[\s\S]*\}/);
    if (jsonMatch) {
      const jsonData = JSON.parse(jsonMatch[0]);
      return parseJsonOutput(jsonData);
    }
  } catch (e) {
    // Not JSON, continue with line-by-line parsing
  }
  const lines = output.split('\n');
  const plays: AnsiblePlay[] = [];
  let currentPlay: AnsiblePlay | null = null;
  let currentTask: AnsibleTask | null = null;
  let inRecap = false;
  const recap: AnsibleRecap = {};
  let collectingOutput = false;
  let outputBuffer: string[] = [];
  let outputType: 'stdout' | 'stderr' | 'msg' | null = null;

  const finishOutputCollection = () => {
    if (collectingOutput && currentTask && outputType && outputBuffer.length > 0) {
      const content = outputBuffer.join('\n').trim();
      if (content) {
        currentTask[outputType] = content;
      }
    }
    collectingOutput = false;
    outputBuffer = [];
    outputType = null;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();

    if (trimmedLine.startsWith('PLAY [')) {
      finishOutputCollection();
      const playName = trimmedLine.match(/PLAY \[(.*?)\]/)?.[1] || 'Unknown Play';
      currentPlay = { name: playName, tasks: [] };
      plays.push(currentPlay);
      currentTask = null;
    } else if (trimmedLine.startsWith('TASK [')) {
      finishOutputCollection();
      const taskName = trimmedLine.match(/TASK \[(.*?)\]/)?.[1] || 'Unknown Task';
      currentTask = { name: taskName, status: 'running' };
      if (currentPlay) {
        currentPlay.tasks.push(currentTask);
      }
    } else if (trimmedLine.startsWith('ok:') || trimmedLine.startsWith('changed:') ||
               trimmedLine.startsWith('failed:') || trimmedLine.startsWith('fatal:') ||
               trimmedLine.startsWith('skipping:')) {
      finishOutputCollection();

      let status: AnsibleTask['status'] = 'ok';
      let host: string | undefined;

      if (trimmedLine.startsWith('ok:')) {
        status = 'ok';
        host = trimmedLine.match(/ok: \[(.*?)\]/)?.[1];
      } else if (trimmedLine.startsWith('changed:')) {
        status = 'changed';
        host = trimmedLine.match(/changed: \[(.*?)\]/)?.[1];
      } else if (trimmedLine.startsWith('failed:')) {
        status = 'failed';
        host = trimmedLine.match(/failed: \[(.*?)\]/)?.[1];
      } else if (trimmedLine.startsWith('fatal:')) {
        status = 'failed';
        host = trimmedLine.match(/fatal: \[(.*?)\]/)?.[1];
      } else if (trimmedLine.startsWith('skipping:')) {
        status = 'skipped';
        host = trimmedLine.match(/skipping: \[(.*?)\]/)?.[1];
      }

      if (currentTask) {
        currentTask.status = status;
        currentTask.host = host;
      }

      // Check for JSON in the current line or following lines (multi-line JSON)
      const jsonStartIdx = trimmedLine.indexOf('{');
      if (jsonStartIdx !== -1) {
        try {
          // Try single-line JSON first
          const jsonStr = trimmedLine.substring(jsonStartIdx);
          let braceCount = 0;
          let jsonEndIdx = -1;

          for (let j = 0; j < jsonStr.length; j++) {
            if (jsonStr[j] === '{') braceCount++;
            if (jsonStr[j] === '}') braceCount--;
            if (braceCount === 0) {
              jsonEndIdx = j;
              break;
            }
          }

          if (jsonEndIdx !== -1) {
            // Single-line JSON found
            const jsonContent = JSON.parse(jsonStr.substring(0, jsonEndIdx + 1));
            if (currentTask) {
              currentTask.result = jsonContent;
              if (jsonContent.stdout) currentTask.stdout = jsonContent.stdout;
              if (jsonContent.stderr) currentTask.stderr = jsonContent.stderr;
              if (jsonContent.msg) currentTask.msg = jsonContent.msg;
              if (jsonContent.results) currentTask.results = jsonContent.results;
            }
          } else {
            // Multi-line JSON - collect following lines
            let jsonLines = [jsonStr];
            let foundEnd = false;

            for (let j = i + 1; j < lines.length && !foundEnd; j++) {
              const nextLine = lines[j];
              jsonLines.push(nextLine);

              // Check if we've closed all braces
              let fullJson = jsonLines.join('\n');
              let braceCount = 0;
              for (let k = 0; k < fullJson.length; k++) {
                if (fullJson[k] === '{') braceCount++;
                if (fullJson[k] === '}') braceCount--;
                if (braceCount === 0 && fullJson[k] === '}') {
                  foundEnd = true;
                  i = j; // Skip these lines in main loop
                  break;
                }
              }
            }

            if (foundEnd) {
              const fullJson = jsonLines.join('\n');
              try {
                const jsonContent = JSON.parse(fullJson);
                if (currentTask) {
                  currentTask.result = jsonContent;
                  if (jsonContent.stdout) currentTask.stdout = jsonContent.stdout;
                  if (jsonContent.stderr) currentTask.stderr = jsonContent.stderr;
                  if (jsonContent.msg) currentTask.msg = jsonContent.msg;
                  if (jsonContent.results) currentTask.results = jsonContent.results;
                }
              } catch (e) {
                // Failed to parse multi-line JSON
              }
            }
          }
        } catch (e) {
          // Failed to parse JSON
        }
      }
    } else if (trimmedLine.match(/^"?stdout"?\s*:/)) {
      finishOutputCollection();
      collectingOutput = true;
      outputType = 'stdout';
      const match = trimmedLine.match(/^"?stdout"?\s*:\s*"?(.*)$/);
      if (match && match[1] && !match[1].startsWith('"')) {
        outputBuffer.push(match[1].replace(/",?\s*$/, ''));
      }
    } else if (trimmedLine.match(/^"?stderr"?\s*:/)) {
      finishOutputCollection();
      collectingOutput = true;
      outputType = 'stderr';
      const match = trimmedLine.match(/^"?stderr"?\s*:\s*"?(.*)$/);
      if (match && match[1] && !match[1].startsWith('"')) {
        outputBuffer.push(match[1].replace(/",?\s*$/, ''));
      }
    } else if (trimmedLine.match(/^"?msg"?\s*:/)) {
      finishOutputCollection();
      collectingOutput = true;
      outputType = 'msg';
      const match = trimmedLine.match(/^"?msg"?\s*:\s*"?(.*)$/);
      if (match && match[1]) {
        const content = match[1].replace(/^"/, '').replace(/",?\s*$/, '');
        if (content && currentTask) {
          currentTask.msg = content;
        }
      }
      collectingOutput = false;
    } else if (collectingOutput && !trimmedLine.startsWith('}') && !trimmedLine.startsWith('"')) {
      const cleaned = trimmedLine.replace(/^"/, '').replace(/",?\s*$/, '').replace(/\\n/g, '\n');
      if (cleaned && cleaned !== ',') {
        outputBuffer.push(cleaned);
      }
    } else if (trimmedLine === '}' || trimmedLine === '},') {
      finishOutputCollection();
    } else if (trimmedLine.includes('PLAY RECAP')) {
      finishOutputCollection();
      inRecap = true;
      currentTask = null;
    } else if (inRecap && trimmedLine.includes(':')) {
      const recapMatch = trimmedLine.match(/^(\S+)\s*:\s+ok=(\d+)\s+changed=(\d+)\s+unreachable=(\d+)\s+failed=(\d+)\s+skipped=(\d+)\s+rescued=(\d+)\s+ignored=(\d+)/);
      if (recapMatch) {
        const [, host, ok, changed, unreachable, failed, skipped, rescued, ignored] = recapMatch;
        recap[host] = {
          ok: parseInt(ok),
          changed: parseInt(changed),
          unreachable: parseInt(unreachable),
          failed: parseInt(failed),
          skipped: parseInt(skipped),
          rescued: parseInt(rescued),
          ignored: parseInt(ignored),
        };
      }
    }
  }

  finishOutputCollection();

  return {
    plays,
    recap: Object.keys(recap).length > 0 ? recap : undefined,
  };
}

function TaskStatusIcon({ status }: { status: AnsibleTask['status'] }) {
  switch (status) {
    case 'ok':
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    case 'changed':
      return <CheckCircle className="w-4 h-4 text-blue-500" />;
    case 'failed':
      return <XCircle className="w-4 h-4 text-red-500" />;
    case 'skipped':
      return <MinusCircle className="w-4 h-4 text-slate-400" />;
    case 'unreachable':
      return <AlertCircle className="w-4 h-4 text-orange-500" />;
    case 'running':
      return <Clock className="w-4 h-4 text-blue-400 animate-pulse" />;
  }
}

function getTaskStatusColor(status: AnsibleTask['status']): string {
  switch (status) {
    case 'ok':
      return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
    case 'changed':
      return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
    case 'failed':
      return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
    case 'skipped':
      return 'bg-slate-50 dark:bg-slate-800/20 border-slate-200 dark:border-slate-700';
    case 'unreachable':
      return 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800';
    case 'running':
      return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
  }
}

export default function AnsibleOutputParser({ output }: { output: string }) {
  const parsed = parseAnsibleOutput(output);

  if (parsed.plays.length === 0 && !parsed.recap) {
    return null;
  }

  return (
    <div className="mt-6 space-y-6">
      <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wide mb-4">
          Structured Output
        </h3>

        <div className="space-y-4">
          {parsed.plays.map((play, playIndex) => (
            <div key={playIndex} className="bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="bg-slate-100 dark:bg-slate-800 px-4 py-3 border-b border-slate-200 dark:border-slate-700">
                <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  PLAY [{play.name}]
                </h4>
              </div>
              <div className="p-4">
                <div className="space-y-2">
                  {play.tasks.length === 0 ? (
                    <p className="text-sm text-slate-500 dark:text-slate-400 italic">No tasks yet</p>
                  ) : (
                    play.tasks.map((task, taskIndex) => (
                      <div
                        key={taskIndex}
                        className={`p-3 rounded-lg border ${getTaskStatusColor(task.status)}`}
                      >
                        <div className="flex items-start space-x-3">
                          <TaskStatusIcon status={task.status} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="font-medium text-sm text-slate-900 dark:text-slate-100">
                                {task.name}
                              </p>
                              <span className="text-xs font-medium text-slate-600 dark:text-slate-400 ml-2">
                                {task.status.toUpperCase()}
                              </span>
                            </div>
                            {task.host && (
                              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                                Host: {task.host}
                              </p>
                            )}
                            {task.details && (
                              <p className="text-xs text-red-600 dark:text-red-400 mt-1 font-mono">
                                {task.details}
                              </p>
                            )}

                            {task.msg && (
                              <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-950/30 rounded border border-blue-200 dark:border-blue-800">
                                <div className="text-xs font-semibold text-blue-900 dark:text-blue-300 mb-1">Message:</div>
                                {Array.isArray(task.msg) ? (
                                  <div className="space-y-1">
                                    {task.msg.map((line, idx) => (
                                      <div key={idx} className="text-xs text-blue-800 dark:text-blue-200 font-mono">
                                        {line}
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <pre className="text-xs text-blue-800 dark:text-blue-200 whitespace-pre-wrap font-mono">
                                    {task.msg}
                                  </pre>
                                )}
                              </div>
                            )}

                            {task.stdout && (
                              <div className="mt-2 p-2 bg-slate-50 dark:bg-slate-950/50 rounded border border-slate-300 dark:border-slate-700">
                                <div className="text-xs font-semibold text-slate-900 dark:text-slate-300 mb-1">Output (stdout):</div>
                                <pre className="text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap font-mono overflow-x-auto">
                                  {task.stdout}
                                </pre>
                              </div>
                            )}

                            {task.stderr && (
                              <div className="mt-2 p-2 bg-red-50 dark:bg-red-950/30 rounded border border-red-200 dark:border-red-800">
                                <div className="text-xs font-semibold text-red-900 dark:text-red-300 mb-1">Error Output (stderr):</div>
                                <pre className="text-xs text-red-800 dark:text-red-200 whitespace-pre-wrap font-mono overflow-x-auto">
                                  {task.stderr}
                                </pre>
                              </div>
                            )}

                            {task.results && task.results.length > 0 && (
                              <div className="mt-2 space-y-2">
                                {task.results.map((result: any, idx: number) => (
                                  <div key={idx} className="p-2 bg-slate-50 dark:bg-slate-950/50 rounded border border-slate-300 dark:border-slate-700">
                                    <div className="text-xs font-semibold text-slate-900 dark:text-slate-300 mb-1">
                                      Result {idx + 1}:
                                    </div>
                                    {result.stdout && (
                                      <pre className="text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap font-mono overflow-x-auto">
                                        {result.stdout}
                                      </pre>
                                    )}
                                    {result.msg && (
                                      Array.isArray(result.msg) ? (
                                        <div className="space-y-1">
                                          {result.msg.map((line: string, idx: number) => (
                                            <div key={idx} className="text-xs text-slate-800 dark:text-slate-200 font-mono">
                                              {line}
                                            </div>
                                          ))}
                                        </div>
                                      ) : (
                                        <pre className="text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap font-mono">
                                          {result.msg}
                                        </pre>
                                      )
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}

                            {task.result && !task.stdout && !task.stderr && !task.msg && !task.results && (
                              <div className="mt-3 p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-300 dark:border-slate-700 shadow-sm">
                                <div className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-3 pb-2 border-b border-slate-200 dark:border-slate-700">
                                  Task Result Details
                                </div>
                                <div className="text-xs">
                                  {formatResultValue(task.result)}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {parsed.recap && (
          <div className="mt-6 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="bg-slate-100 dark:bg-slate-800 px-4 py-3 border-b border-slate-200 dark:border-slate-700">
              <h4 className="font-medium text-slate-900 dark:text-slate-100">Play Recap</h4>
            </div>
            <div className="p-4">
              <div className="space-y-3">
                {Object.entries(parsed.recap).map(([host, stats]) => (
                  <div
                    key={host}
                    className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4"
                  >
                    <div className="font-medium text-slate-900 dark:text-slate-100 mb-3">
                      {host}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-sm text-slate-600 dark:text-slate-400">
                          OK: <span className="font-medium text-green-600 dark:text-green-500">{stats.ok}</span>
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-blue-500" />
                        <span className="text-sm text-slate-600 dark:text-slate-400">
                          Changed: <span className="font-medium text-blue-600 dark:text-blue-500">{stats.changed}</span>
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <XCircle className="w-4 h-4 text-red-500" />
                        <span className="text-sm text-slate-600 dark:text-slate-400">
                          Failed: <span className="font-medium text-red-600 dark:text-red-500">{stats.failed}</span>
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <MinusCircle className="w-4 h-4 text-slate-400" />
                        <span className="text-sm text-slate-600 dark:text-slate-400">
                          Skipped: <span className="font-medium">{stats.skipped}</span>
                        </span>
                      </div>
                      {stats.unreachable > 0 && (
                        <div className="flex items-center space-x-2">
                          <AlertCircle className="w-4 h-4 text-orange-500" />
                          <span className="text-sm text-slate-600 dark:text-slate-400">
                            Unreachable: <span className="font-medium text-orange-600 dark:text-orange-500">{stats.unreachable}</span>
                          </span>
                        </div>
                      )}
                      {stats.rescued > 0 && (
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="w-4 h-4 text-yellow-500" />
                          <span className="text-sm text-slate-600 dark:text-slate-400">
                            Rescued: <span className="font-medium text-yellow-600 dark:text-yellow-500">{stats.rescued}</span>
                          </span>
                        </div>
                      )}
                      {stats.ignored > 0 && (
                        <div className="flex items-center space-x-2">
                          <AlertCircle className="w-4 h-4 text-slate-400" />
                          <span className="text-sm text-slate-600 dark:text-slate-400">
                            Ignored: <span className="font-medium">{stats.ignored}</span>
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
