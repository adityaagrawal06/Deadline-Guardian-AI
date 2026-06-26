import { BrainCircuit, Info, ChevronRight, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import AgentDiscussionTimeline from '../AgentDiscussionTimeline';

export default function AnalysisTab({ tasks }) {
  const [expandedTaskId, setExpandedTaskId] = useState(null);
  const activeTasks = tasks.filter(t => {
    if (t.status !== 'pending') return false;
    const deadline = new Date(t.deadline);
    const now = new Date();
    return deadline > now; // Compare exact time
  });

  return (
    <div className="flex-1 overflow-auto animate-fade-in p-2 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <div className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 p-3 rounded-2xl">
            <BrainCircuit size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-text">AI Strategy Overview</h1>
            <p className="text-text-muted">Master view of all AI-generated execution plans.</p>
          </div>
        </div>

        <div className="space-y-8">
          {activeTasks.length > 0 ? (
            activeTasks.map(task => (
              <div key={task._id} className="bg-surface border border-border rounded-3xl shadow-sm relative overflow-hidden transition-all duration-300">
                <div className="absolute top-0 left-0 w-2 h-full bg-indigo-500"></div>
                
                {/* Clickable Header */}
                <div 
                  className="p-6 cursor-pointer hover:bg-bg/50 transition-colors flex justify-between items-center group"
                  onClick={() => setExpandedTaskId(expandedTaskId === task._id ? null : task._id)}
                >
                  <div className="flex-1 ml-2">
                    <h2 className="text-xl font-bold group-hover:text-primary transition-colors">{task.title}</h2>
                    <p className="text-xs text-text-muted mt-1 capitalize">{task.category}</p>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className={`px-3 py-1.5 rounded-xl font-bold text-xs ${task.riskScore > 70 ? 'bg-red-100 text-red-700' : task.riskScore > 30 ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                      Risk: {task.riskScore}%
                    </div>
                    <div className="text-text-muted group-hover:text-primary transition-colors">
                      {expandedTaskId === task._id ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                    </div>
                  </div>
                </div>
                
                {/* Expanded Content */}
                {expandedTaskId === task._id && (
                  <div className="p-6 border-t border-border animate-slide-up bg-bg/20">
                    <AgentDiscussionTimeline taskId={task._id} task={task} />
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center p-12 bg-surface border border-border rounded-3xl">
              <Info className="mx-auto text-text-muted mb-4" size={48} />
              <h2 className="text-xl font-bold mb-2">No Active Strategies</h2>
              <p className="text-text-muted max-w-md mx-auto">Create a new task to see our Dual-Agent AI system generate a comprehensive execution plan.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
