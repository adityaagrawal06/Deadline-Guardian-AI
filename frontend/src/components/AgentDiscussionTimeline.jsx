import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function AgentDiscussionTimeline({ taskId, task, onAnalysisComplete }) {
  const [logs, setLogs] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState(null);
  const [showAnalysis, setShowAnalysis] = useState(false);

  useEffect(() => {
    fetchLogs();
  }, [taskId]);

  useEffect(() => {
    let interval;
    if (loading) {
      interval = setInterval(() => {
        setLoadingStep(prev => Math.min(prev + 1, 3));
      }, 1000);
    } else {
      setLoadingStep(0);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const fetchLogs = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/agents/logs/${taskId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        
        setLogs(data);
      }
    } catch (error) {
      console.error("Failed to fetch agent logs", error);
    }
  };

  const runAnalysis = async (refresh = false, replan = false) => {
    setLoading(true);
    setError(null);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/agents/analyze`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ taskId, refresh, replan })
      });
      if (res.ok) {
        const data = await res.json();
        setLogs(data.log);
        if (onAnalysisComplete) onAnalysisComplete();
      } else {
        const errData = await res.json();
        setError(errData.error || errData.message || "Analysis failed due to high demand. Please try again.");
      }
    } catch (error) {
      console.error("Failed to run analysis", error);
      setError("Network error occurred.");
    } finally {
      setLoading(false);
    }
  };

  if (!showAnalysis) {
    return (
      <div className="mt-4 border-t border-border pt-4">
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md border border-red-300 text-sm">
            <strong>Error:</strong> {error}
          </div>
        )}
        <button 
          onClick={() => {
            setShowAnalysis(true);
            if (!logs && !loading) {
              runAnalysis(false);
            }
          }}
          className="rounded-xl bg-primary px-4 py-3 text-white font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/30 w-full flex items-center justify-center gap-2"
        >
          {logs ? "👀 View AI Analysis" : "✨ Analyze with Multi-Agent System"}
        </button>
      </div>
    );
  }

  if (!logs && !loading) {
    return (
      <div className="mt-4 border-t border-border pt-4">
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md border border-red-300 text-sm">
            <strong>Error:</strong> {error}
          </div>
        )}
        <button 
          onClick={() => runAnalysis(false)}
          className="rounded-xl bg-primary px-4 py-3 text-white font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/30 w-full flex items-center justify-center gap-2"
        >
          ✨ Analyze with Multi-Agent System
        </button>
      </div>
    );
  }

  if (loading) {
    const loadingMessages = [
      { agent: "Planner Agent", msg: "Creating execution strategy..." },
      { agent: "Realist Agent", msg: "Reviewing assumptions..." },
      { agent: "Risk Agent", msg: "Calculating deadline risk..." },
      { agent: "Coordinator Agent", msg: "Generating final action plan..." }
    ];
    return (
      <div className="mt-4 p-8 rounded-xl bg-surface border border-border flex flex-col items-center justify-center py-12 shadow-inner transition-all overflow-hidden">
        {loadingMessages.map((item, step) => (
          <div key={item.agent} className={`flex flex-col items-center transition-all duration-700 ease-out ${loadingStep >= step ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8 hidden'}`}>
            <div className={`px-6 py-3 rounded-xl font-bold flex flex-col items-center min-w-[250px] text-center ${loadingStep === step ? 'bg-primary text-white shadow-[0_0_20px_rgba(var(--primary),0.3)] scale-105' : 'bg-bg text-text border border-border opacity-70'}`}>
              <span className="text-sm uppercase tracking-widest opacity-80 mb-1">{item.agent}</span>
              <span className={`text-xs ${loadingStep === step ? 'animate-pulse' : 'text-text-muted'}`}>{loadingStep === step ? item.msg : 'Complete'}</span>
            </div>
            {step < 3 && loadingStep >= step + 1 && (
              <div className="text-border text-2xl my-3 animate-fade-in">↓</div>
            )}
          </div>
        ))}
      </div>
    );
  }

  const getAgentColor = (agent) => {
    switch(agent) {
      case 'Planner': return 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800';
      case 'Realist': return 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800';
      case 'Risk': return 'bg-red-100 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800';
      case 'Coordinator': return 'bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800';
      default: return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getAgentIcon = (agent) => {
    switch(agent) {
      case 'Planner': return '🟦';
      case 'Realist': return '🟨';
      case 'Risk': return '🟥';
      case 'Coordinator': return '🟩';
      default: return '⬜';
    }
  };

  const renderAgentMessage = (entry) => {
    try {
      if (typeof entry.message === 'string' && !entry.message.startsWith('{') && !entry.message.startsWith('[')) {
        return <p className="text-sm whitespace-pre-wrap leading-relaxed">{entry.message}</p>;
      }

      const data = JSON.parse(entry.message);

      if (entry.agent === 'Planner') {
        return (
          <div className="space-y-4">
            <p className="italic text-sm opacity-80 border-l-2 border-blue-400 pl-2">"Execution strategy formulated. Breaking down workload."</p>
            
            <div className="bg-bg/50 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
              <span className="text-[10px] uppercase font-bold tracking-wider text-blue-600 dark:text-blue-400 block mb-2">✓ Today's Tasks</span>
              <ul className="space-y-1.5">
                {(data.subtasks || []).slice(0, 3).map((task, i) => (
                  <li key={i} className="text-sm flex items-start gap-2">
                    <span className="text-blue-500 mt-0.5">•</span>
                    <span className="leading-tight">{task}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-bg/50 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
                <span className="text-[10px] uppercase font-bold tracking-wider text-blue-600 dark:text-blue-400 block mb-1">Timeline</span>
                <span className="text-xs font-medium line-clamp-2" title={data.timeline}>{data.timeline || 'Start immediately'}</span>
              </div>
            </div>

            {data.recommendations && data.recommendations.length > 0 && (
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-text-muted block mb-1">Recommendations</span>
                <ul className="text-xs space-y-1 pl-4 list-disc opacity-80">
                  {data.recommendations.map((rec, i) => <li key={i}>{rec}</li>)}
                </ul>
              </div>
            )}
          </div>
        );
      }

      if (entry.agent === 'Realist') {
        return (
          <div className="space-y-4">
            <p className="italic text-sm opacity-80 border-l-2 border-amber-400 pl-2">"Reviewing assumptions. Found potential timeline constraints."</p>
            
            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3 border border-amber-200 dark:border-amber-800">
              <span className="text-[10px] uppercase font-bold tracking-wider text-amber-700 dark:text-amber-400 block mb-2">⚠ Bottlenecks & Risks</span>
              <ul className="space-y-2">
                {(data.bottlenecks || []).slice(0, 3).map((b, i) => (
                  <li key={i} className="text-sm flex items-start gap-2 text-amber-800 dark:text-amber-200">
                    <span className="shrink-0 mt-0.5">⚠️</span>
                    <span className="leading-tight">{b}</span>
                  </li>
                ))}
              </ul>
            </div>

            {data.adjustments && data.adjustments.length > 0 && (
              <div className="bg-bg/50 rounded-lg p-3 border border-amber-200 dark:border-amber-800">
                <span className="text-[10px] uppercase font-bold tracking-wider text-amber-600 dark:text-amber-400 block mb-2">Suggested Adjustments</span>
                <ul className="text-xs space-y-1.5 list-disc pl-4">
                  {data.adjustments.map((a, i) => <li key={i}>{a}</li>)}
                </ul>
              </div>
            )}
          </div>
        );
      }

      if (entry.agent === 'Risk') {
        return (
          <div className="space-y-4">
            <p className="italic text-sm opacity-80 border-l-2 border-red-400 pl-2">"Calculated deadline risk. Assessing failure probabilities."</p>
            
            <div className="flex gap-3">
              <div className="flex-1 bg-bg/50 rounded-lg p-3 border border-red-200 dark:border-red-800 flex flex-col items-center justify-center">
                <span className="text-[10px] uppercase font-bold tracking-wider text-red-600 dark:text-red-400 block mb-1 text-center">Risk Score</span>
                <div className="relative w-16 h-16 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <path className="text-bg stroke-current" strokeWidth="3" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    <path className="text-red-500 stroke-current" strokeWidth="3" strokeDasharray={`${data.riskScore}, 100`} fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  </svg>
                  <span className="absolute text-lg font-bold">{data.riskScore}</span>
                </div>
              </div>
              
              <div className="flex-1 bg-bg/50 rounded-lg p-3 border border-red-200 dark:border-red-800 flex flex-col items-center justify-center text-center">
                <span className="text-[10px] uppercase font-bold tracking-wider text-red-600 dark:text-red-400 block mb-1">Prob. of Missing</span>
                <span className="text-3xl font-bold">{data.probabilityOfFailure}%</span>
              </div>
            </div>

            <div className="space-y-2">
              {data.keyRisks && data.keyRisks.length > 0 && (
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-text-muted block mb-1">Main Risks</span>
                  <ul className="text-xs list-disc pl-4 opacity-80 space-y-1">
                    {data.keyRisks.map((r, i) => <li key={i}>{r}</li>)}
                  </ul>
                </div>
              )}
              {data.mitigation && data.mitigation.length > 0 && (
                <div className="pt-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-red-500 block mb-1">Risk Reduction Opportunities</span>
                  <ul className="text-xs list-disc pl-4 font-medium space-y-1">
                    {data.mitigation.map((m, i) => <li key={i}>{m}</li>)}
                  </ul>
                </div>
              )}
            </div>
          </div>
        );
      }

      if (entry.agent === 'Coordinator') {
        const schedule = Array.isArray(data) ? data : (data.schedule || []);
        const keyAdvice = data.keyAdvice;
        
        const now = new Date();
        now.setHours(0,0,0,0);
        const d = new Date(task?.deadline || new Date());
        d.setHours(0,0,0,0);
        const daysUntilDeadline = Math.round((d - now) / (1000 * 60 * 60 * 24));

        return (
          <div className="space-y-4">
            <p className="italic text-sm opacity-80 border-l-2 border-green-400 pl-2">"Synthesizing analysis. Generating finalized execution plan."</p>
            
            <div className={`grid grid-cols-1 ${daysUntilDeadline > 0 ? 'md:grid-cols-2' : ''} gap-3`}>
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 border border-green-200 dark:border-green-800">
                <span className="text-[10px] uppercase font-bold tracking-wider text-green-700 dark:text-green-400 block mb-2">
                  {daysUntilDeadline < 0 ? "Overdue Action Plan" : daysUntilDeadline === 0 ? "Today's Urgent Plan" : "Today's Plan"}
                </span>
                <p className="text-xs font-medium mb-1">{schedule[0] || "Start immediately and outline the core requirements."}</p>
                {daysUntilDeadline === 0 && schedule[1] && (
                  <p className="text-xs font-medium mt-2 pt-2 border-t border-green-200 dark:border-green-800/50">{schedule[1]}</p>
                )}
              </div>
              
              {daysUntilDeadline > 0 && (
                <div className="bg-bg/50 rounded-lg p-3 border border-green-200 dark:border-green-800">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-green-700 dark:text-green-400 block mb-2">Tomorrow's Plan</span>
                  <p className="text-xs font-medium text-text-muted">{schedule[1] || "Continue drafting and preliminary implementation."}</p>
                </div>
              )}
            </div>

            <div className="bg-surface rounded-lg p-3 border border-border flex justify-between items-center">
                <span className="text-[10px] uppercase font-bold tracking-wider text-text-muted">Expected Completion</span>
                <span className="font-bold text-sm text-primary">In {schedule.length} phases</span>
            </div>

            {keyAdvice && keyAdvice.length > 0 && (
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-text-muted block mb-2">Final Advice</span>
                <ul className="space-y-2">
                  {keyAdvice.map((a, i) => (
                    <li key={i} className="text-sm bg-black/5 dark:bg-white/5 p-2 rounded-md border-l-2 border-primary leading-tight">{a}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );
      }

    } catch (e) {
      return <p className="text-sm whitespace-pre-wrap leading-relaxed">{entry.message}</p>;
    }
  };

  return (
    <div className="mt-4 border-t border-border pt-4">
      <div className="flex justify-between items-center mb-4 gap-2 flex-wrap">
        <h3 className="font-bold text-lg text-left m-0">Agent Discussion Timeline</h3>
        <div className="flex gap-2">
          {task?.subTasks?.length > 0 && (
            <button 
              onClick={() => runAnalysis(true, true)}
              disabled={loading}
              className="text-xs font-bold text-white bg-amber-600 border border-amber-700 px-3 py-1 rounded-md hover:bg-amber-500 disabled:opacity-50 animate-pulse shadow-lg shadow-amber-600/20"
            >
              {loading ? 'Replanning...' : '🚨 I fell behind - Replan!'}
            </button>
          )}
          <button 
            onClick={() => runAnalysis(true, false)}
            disabled={loading}
            className="text-xs font-bold text-text-muted bg-surface border border-border px-3 py-1 rounded-md hover:bg-bg disabled:opacity-50"
          >
            {loading ? 'Refreshing...' : '↻ Refresh Analysis'}
          </button>
        </div>
      </div>
      
      {logs.summary && (() => {
        // Fallbacks for empty values
        const prob = logs.summary.estimatedCompletionProbability || 90;
        const start = logs.summary.recommendedStartTime || 'Today';
        const urgency = logs.summary.deadlineUrgency || 'Medium';
        
        // Impact Analysis Calculations - Using the true task object as the single source of truth
        const currentRisk = task?.riskScore || logs.summary.riskScore || 20;
        const predictedRisk = Math.max(5, Math.floor(currentRisk * 0.45)); // Predict a 55% reduction
        const riskReduction = Math.abs(currentRisk - predictedRisk);

        return (
          <div className="mb-8 flex flex-col gap-4">
            {/* Executive Summary Card */}
            <div className="rounded-xl border border-border bg-code-bg p-6 text-left shadow-md relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-primary"></div>
              
              <div className="flex justify-between items-start mb-6 border-b border-border pb-4">
                <div>
                  <h4 className="font-bold uppercase text-[10px] tracking-widest text-text-muted mb-1">AI Executive Summary</h4>
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-bold m-0">Assessment Complete</h2>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider ${logs.summary.riskSeverity === 'High' ? 'bg-red-100 text-red-700 border border-red-200' : logs.summary.riskSeverity === 'Medium' ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-green-100 text-green-700 border border-green-200'}`}>
                      {logs.summary.riskSeverity === 'High' ? '🔴 Critical Risk' : logs.summary.riskSeverity === 'Medium' ? '🟡 At Risk' : '🟢 On Track'}
                    </span>
                  </div>
                </div>
                {logs.summary.riskScore >= 60 && (
                  <button 
                    onClick={() => window.location.href = '/rescue'}
                    className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-2 px-4 rounded-md shadow-lg animate-pulse transition-transform hover:scale-105"
                  >
                    🚨 Generate Rescue Plan
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
                <div className="bg-bg/50 p-3 rounded-lg border border-border">
                  <span className="text-text-muted text-[10px] uppercase font-bold tracking-wider block mb-1">Completion Prob</span>
                  <span className="font-bold text-2xl">{prob}%</span>
                </div>
                <div className="bg-bg/50 p-3 rounded-lg border border-border">
                  <span className="text-text-muted text-[10px] uppercase font-bold tracking-wider block mb-1">Deadline Urgency</span>
                  <span className={`font-bold text-lg leading-loose ${urgency === 'High' ? 'text-red-500' : urgency === 'Medium' ? 'text-amber-500' : 'text-green-500'}`}>{urgency}</span>
                </div>
                <div className="bg-bg/50 p-3 rounded-lg border border-border">
                  <span className="text-text-muted text-[10px] uppercase font-bold tracking-wider block mb-1">AI Confidence</span>
                  <span className="font-bold text-lg leading-loose text-primary">96%</span>
                </div>
                <div className="bg-bg/50 p-3 rounded-lg border border-border">
                  <span className="text-text-muted text-[10px] uppercase font-bold tracking-wider block mb-1">Expected Completion</span>
                  <span className="font-bold text-lg leading-loose">
                    {(() => {
                      const now = new Date();
                      now.setHours(0,0,0,0);
                      const d = new Date(task?.deadline || new Date());
                      d.setHours(0,0,0,0);
                      const diff = Math.round((d - now) / (1000 * 60 * 60 * 24));
                      if (diff < 0) return 'Overdue';
                      if (diff === 0) return 'Today';
                      if (diff === 1) return 'Tomorrow';
                      return `In ${diff} Days`;
                    })()}
                  </span>
                </div>
              </div>

              <div className="bg-primary/5 dark:bg-primary/10 p-4 rounded-xl border border-primary/20">
                <span className="text-primary text-[10px] uppercase font-bold tracking-wider block mb-2">Most Critical Action</span>
                <span className="font-bold text-base leading-relaxed block">
                  {logs.summary.finalRecommendation}
                </span>
              </div>
            </div>

            {/* Plan Impact Analysis Card */}
            <div className="rounded-xl border border-border bg-surface p-5 text-left shadow-[var(--shadow)]">
              <h4 className="font-bold uppercase text-xs tracking-wider text-text-muted mb-4">Plan Impact Analysis</h4>
              
              <div className="flex items-center justify-between px-4">
                <div className="text-center">
                  <span className="block text-sm text-text-muted mb-1">Current Risk</span>
                  <span className={`text-2xl font-bold ${currentRisk >= 71 ? 'text-red-500' : currentRisk >= 31 ? 'text-amber-500' : 'text-green-500'}`}>{currentRisk}%</span>
                </div>
                
                <div className="flex-1 flex items-center justify-center px-4">
                  <div className="h-0.5 w-full bg-border relative">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-surface px-2 text-text-muted text-xs font-bold uppercase tracking-wider">
                      Applying Plan
                    </div>
                  </div>
                  <span className="text-2xl ml-2">→</span>
                </div>

                <div className="text-center">
                  <span className="block text-sm text-text-muted mb-1">Predicted Risk</span>
                  <span className="text-2xl font-bold text-green-500">{predictedRisk}%</span>
                </div>
                
                <div className="ml-8 pl-8 border-l border-border text-center">
                  <span className="block text-sm text-text-muted mb-1">Risk Reduction</span>
                  <span className="text-3xl font-bold text-purple-500">-{riskReduction}%</span>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
        {logs.timeline?.map((entry, idx) => (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.2, duration: 0.4 }}
            key={idx} 
            className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active"
          >
            <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-bg bg-surface shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 text-xl">
              {getAgentIcon(entry.agent)}
            </div>
            <div className={`w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border shadow-[var(--shadow)] text-left ${getAgentColor(entry.agent)}`}>
              <div className="flex items-center justify-between mb-2 pb-2 border-b border-black/10 dark:border-white/10">
                <h4 className="font-bold capitalize">{entry.agent} Agent</h4>
                <span className="text-xs font-bold px-2 py-1 bg-black/5 dark:bg-white/10 rounded uppercase tracking-wider">{entry.stepType || entry.type}</span>
              </div>
              {renderAgentMessage(entry)}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
