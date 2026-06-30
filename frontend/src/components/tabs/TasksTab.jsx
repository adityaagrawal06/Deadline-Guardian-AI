import { useState, useEffect } from 'react';
import { ClipboardList, CheckCircle2, Plus, Trash2 } from 'lucide-react';
import AgentDiscussionTimeline from '../AgentDiscussionTimeline';
import ProofUpload from '../ProofUpload';
import TaskForm from '../TaskForm';

export default function TasksTab({ tasks, fetchDashboardData }) {
  const [nowDate, setNowDate] = useState(new Date());
  const [filters, setFilters] = useState({ status: 'active', risk: 'all', timeframe: 'all', category: 'all', searchQuery: '' });
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [expandedTaskId, setExpandedTaskId] = useState(null);

  useEffect(() => {
    const timer = setInterval(() => setNowDate(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const onTaskAdded = async (newTask) => {
    setShowTaskForm(false);
    if (fetchDashboardData) {
      await fetchDashboardData(localStorage.getItem('token'));
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!confirm('Are you sure you want to delete this task? This cannot be undone.')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/tasks/${taskId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setExpandedTaskId(null);
        if (fetchDashboardData) {
          await fetchDashboardData(token);
        }
      } else {
        alert('Failed to delete task');
      }
    } catch (error) {
      console.error("Failed to delete task", error);
    }
  };

  const handleToggleSubTask = async (taskId, subTaskId) => {
    // Optimistic UI update: Find the checkbox and manually toggle it in the DOM 
    // or we can just rely on the user seeing the fetch happen if we added a loading state. 
    // Wait, TasksTab receives `tasks` as a prop, so we can't easily modify the state directly here without a setter.
    // Let's just do a quick DOM manipulation for the optimistic update, or just use a local state wrapper.
    
    // Instead, I'll temporarily disable the checkbox visually while it loads, but we don't have event access.
    // The safest approach is just to let the network request finish. 
    // I will add a console.log and keep the current logic, since it's most robust.
    const token = localStorage.getItem('token');
    try {
      await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/tasks/${taskId}/subtasks/${subTaskId}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (fetchDashboardData) {
        await fetchDashboardData(token);
      }
    } catch (error) {
      console.error("Failed to toggle subtask", error);
    }
  };

  const getFilteredTasks = () => {
    return tasks.filter(t => {
      const deadline = new Date(t.deadline);
      deadline.setHours(0,0,0,0);
      
      const today = new Date(nowDate);
      today.setHours(0,0,0,0);
      
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);

      const isCompleted = t.status === 'completed';
      const isOverdue = !isCompleted && new Date(t.deadline) <= nowDate;
      
      // Status Filter
      if (filters.status === 'active' && (isCompleted || isOverdue)) return false;
      if (filters.status === 'completed' && !isCompleted) return false;
      if (filters.status === 'overdue' && !isOverdue) return false;

      // Risk Filter
      if (filters.risk === 'high' && (t.riskScore < 70 || isCompleted)) return false;
      if (filters.risk === 'medium' && (t.riskScore < 30 || t.riskScore >= 70 || isCompleted)) return false;
      if (filters.risk === 'low' && (t.riskScore >= 30 || isCompleted)) return false;

      // Timeframe Filter
      if (filters.timeframe === 'today' && deadline.getTime() !== today.getTime()) return false;
      if (filters.timeframe === 'tomorrow' && deadline.getTime() !== tomorrow.getTime()) return false;
      if (filters.timeframe === 'week' && (deadline < today || deadline > nextWeek)) return false;

      // Category Filter
      if (filters.category !== 'all' && (t.category || 'Work').toLowerCase() !== filters.category.toLowerCase()) return false;

      // Search Filter
      if (filters.searchQuery && !t.title.toLowerCase().includes(filters.searchQuery.toLowerCase())) return false;

      return true;
    });
  };

  const filteredTasks = getFilteredTasks();

  return (
    <div className="max-w-6xl mx-auto w-full animate-fade-in">
      <div className="flex justify-between items-end mb-8 border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-text">My Tasks</h1>
          <p className="text-text-muted mt-2">Manage your academic workload with AI-powered risk assessment.</p>
        </div>
      </div>

      {showTaskForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-border">
              <h2 className="font-bold text-xl">Create New Task</h2>
              <button onClick={() => setShowTaskForm(false)} className="text-text-muted hover:text-text font-bold text-2xl">&times;</button>
            </div>
            <div className="p-6">
              <TaskForm onTaskAdded={onTaskAdded} />
            </div>
          </div>
        </div>
      )}

      <div className="bg-surface rounded-2xl shadow-sm border border-border overflow-hidden">
        <div className="p-6 border-b border-border flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <h2 className="text-lg font-bold shrink-0 hidden lg:block">Filters</h2>
          
          <div className="w-full lg:w-64 shrink-0">
            <input 
              type="text" 
              placeholder="Search tasks..." 
              value={filters.searchQuery}
              onChange={(e) => setFilters({...filters, searchQuery: e.target.value})}
              className="w-full bg-bg border border-border text-sm rounded-lg px-4 py-2 text-text focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full lg:w-auto justify-between lg:justify-end">
            <div className="flex flex-wrap items-center gap-2">
              <select 
                value={filters.category} 
                onChange={(e) => setFilters({...filters, category: e.target.value})}
                className="bg-bg border border-border text-xs font-bold rounded-lg px-3 py-2 text-text-muted hover:text-text focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all cursor-pointer"
              >
                <option value="all">All Categories</option>
                <option value="work">Work</option>
                <option value="personal">Personal</option>
                <option value="groceries">Groceries</option>
                <option value="academic">Academic</option>
                <option value="other">Other</option>
              </select>
              <select 
                value={filters.status} 
                onChange={(e) => setFilters({...filters, status: e.target.value})}
                className="bg-bg border border-border text-xs font-bold rounded-lg px-3 py-2 text-text-muted hover:text-text focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="overdue">Overdue</option>
                <option value="completed">Completed</option>
              </select>

              <select 
                value={filters.risk} 
                onChange={(e) => setFilters({...filters, risk: e.target.value})}
                className="bg-bg border border-border text-xs font-bold rounded-lg px-3 py-2 text-text-muted hover:text-text focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all cursor-pointer"
              >
                <option value="all">All Risks</option>
                <option value="high">High Risk (&gt;70%)</option>
                <option value="medium">Medium Risk</option>
                <option value="low">Low Risk</option>
              </select>

              <select 
                value={filters.timeframe} 
                onChange={(e) => setFilters({...filters, timeframe: e.target.value})}
                className="bg-bg border border-border text-xs font-bold rounded-lg px-3 py-2 text-text-muted hover:text-text focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all cursor-pointer"
              >
                <option value="all">All Time</option>
                <option value="today">Due Today</option>
                <option value="tomorrow">Due Tomorrow</option>
                <option value="week">Due This Week</option>
              </select>
            </div>
            <button onClick={() => setShowTaskForm(true)} className="bg-primary text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 text-xs hover:bg-primary/90 transition-colors shadow-sm shadow-primary/20 shrink-0">
              <Plus size={16} /> New Task
            </button>
          </div>
        </div>

        <div className="flex flex-col divide-y divide-border">
          {tasks.length === 0 ? (
            <div className="p-16 text-center flex flex-col items-center">
              <div className="bg-primary/10 p-6 rounded-full text-primary mb-6"><ClipboardList size={64} /></div>
              <h3 className="text-xl font-bold mb-2">No tasks yet</h3>
              <p className="text-text-muted max-w-sm mb-6">Create your first task to get an AI-generated execution strategy and risk assessment.</p>
              <button onClick={() => setShowTaskForm(true)} className="bg-bg border border-border hover:bg-border px-6 py-3 rounded-xl font-bold transition-colors text-text shadow-sm hover:shadow">Get Started</button>
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="p-16 text-center">
              <p className="text-text-muted font-bold text-lg mb-4">No tasks match your filters.</p>
              <button onClick={() => setFilters({ status: 'active', risk: 'all', timeframe: 'all', category: 'all', searchQuery: '' })} className="text-sm font-bold text-primary hover:text-primary/80 transition-colors">Clear all filters</button>
            </div>
          ) : (
            filteredTasks.map(task => {
              const isCompleted = task.status === 'completed';
              const progressPercentage = isCompleted ? 100 : task.status === 'in_progress' ? 50 : 0;
              const diff = new Date(task.deadline) - nowDate;
              
              let timeLabel = "Deadline passed";
              if (diff > 0 && !isCompleted) {
                const d = Math.floor(diff / (1000 * 60 * 60 * 24));
                timeLabel = d > 0 ? `Due in ${d} days` : 'Due Today';
              } else if (isCompleted) {
                timeLabel = "Completed";
              }

              return (
                <div key={task._id} className="flex flex-col group transition-colors hover:bg-bg/50">
                  <div 
                    onClick={() => setExpandedTaskId(expandedTaskId === task._id ? null : task._id)}
                    className="p-5 flex flex-col lg:flex-row items-center justify-between gap-6 cursor-pointer"
                  >
                    <div className="flex items-center gap-5 w-full lg:w-[40%]">
                      <div className={`p-3 rounded-xl shrink-0 transition-colors ${isCompleted ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                        {isCompleted ? <CheckCircle2 size={24} /> : <ClipboardList size={24} />}
                      </div>
                      <div className="truncate">
                        <h4 className={`font-bold text-base truncate ${isCompleted ? 'line-through text-text-muted' : 'text-text'}`}>{task.title}</h4>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <p className="text-xs font-bold text-text-muted uppercase tracking-wider">{task.category}</p>
                          {task.estimatedHours && (
                            <>
                              <span className="w-1 h-1 rounded-full bg-text-muted/30"></span>
                              <p className="text-xs font-bold text-text-muted uppercase tracking-wider">{task.estimatedHours}h Est.</p>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between w-full lg:w-[30%]">
                      <div className="text-left">
                        <p className="text-sm font-bold">{timeLabel}</p>
                        <p className="text-xs text-text-muted mt-0.5">{task.deadline ? (isNaN(new Date(task.deadline).getTime()) ? 'Invalid Date' : new Date(task.deadline).toLocaleDateString('en-GB')) : 'No Date'}</p>
                      </div>
                      {!isCompleted ? (
                        <div className="text-center">
                          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${task.riskScore > 70 ? 'bg-red-100 text-red-700' : task.riskScore > 30 ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                            {task.riskScore > 70 ? 'High Risk' : task.riskScore > 30 ? 'Med Risk' : 'Low Risk'}
                          </span>
                          <p className="text-xs font-bold mt-1.5 text-text-muted">{task.riskScore}% Score</p>
                        </div>
                      ) : (
                        <div className="text-center">
                          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-green-100 text-green-700 uppercase tracking-wider">Done</span>
                          <p className="text-xs font-bold mt-1.5 text-text-muted">0% Score</p>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-end gap-6 w-full lg:w-[30%]">
                      <div className="flex items-center gap-4 w-full">
                        <div className="w-full h-2 bg-border rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all ${isCompleted ? 'bg-green-500' : 'bg-primary'}`} style={{width: `${progressPercentage}%`}}></div>
                        </div>
                        <span className="text-xs font-bold w-10 text-right">{progressPercentage}%</span>
                      </div>
                      <button className={`text-text-muted hover:text-primary transition-all p-2 ${expandedTaskId === task._id ? 'rotate-90 text-primary' : 'opacity-0 group-hover:opacity-100'}`}>
                        &gt;
                      </button>
                    </div>
                  </div>
                  
                  {expandedTaskId === task._id && (
                    <div className="p-8 bg-surface/50 border-t border-border animate-slide-up relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-1 h-full bg-primary"></div>
                      {!isCompleted && (
                        <div className="mb-8">
                          <AgentDiscussionTimeline taskId={task._id} task={task} onAnalysisComplete={() => { if(fetchDashboardData) fetchDashboardData(localStorage.getItem('token')); }} />
                        </div>
                      )}
                      
                      {/* SUBTASKS UI */}
                      {!isCompleted && task.subTasks && task.subTasks.length > 0 && (
                        <div className="mb-8 bg-surface border border-border p-6 rounded-2xl shadow-sm">
                          <h4 className="font-extrabold text-lg mb-4 text-primary flex items-center gap-2">
                            <CheckCircle2 size={20} /> AI Generated Sub-Tasks
                          </h4>
                          <div className="space-y-3">
                            {task.subTasks.map(sub => (
                              <label key={sub._id} className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${sub.completed ? 'bg-bg/50 border-transparent opacity-60' : 'bg-bg border-border hover:border-primary/50'}`}>
                                <input 
                                  type="checkbox" 
                                  checked={sub.completed}
                                  onChange={() => handleToggleSubTask(task._id, sub._id)}
                                  className="w-5 h-5 rounded border-border text-primary focus:ring-primary/20 cursor-pointer"
                                />
                                <span className={`font-medium ${sub.completed ? 'line-through text-text-muted' : 'text-text'}`}>
                                  {sub.title}
                                </span>
                              </label>
                            ))}
                          </div>
                          <p className="text-xs text-text-muted mt-4 font-bold flex items-center gap-1">
                            <span className="text-orange-500">⚡</span> Checking off sub-tasks dynamically reduces your overall risk score!
                          </p>
                        </div>
                      )}

                      {!isCompleted && (
                        <ProofUpload taskId={task._id} onUploadSuccess={() => fetchDashboardData(localStorage.getItem('token'))} />
                      )}
                      {isCompleted && (
                        <div className="text-center p-8 bg-green-50 rounded-2xl border border-green-200">
                          <h4 className="font-bold text-green-800 text-xl mb-2">Task Completed! 🎉</h4>
                          <p className="text-green-700">You've successfully uploaded proof and verified this task. Great job!</p>
                        </div>
                      )}
                      <div className="mt-6 flex justify-end">
                        <button onClick={() => handleDeleteTask(task._id)} className="text-red-500 hover:text-red-700 font-bold text-sm flex items-center gap-2 transition-colors px-4 py-2 rounded-lg hover:bg-red-50">
                           <Trash2 size={16} /> Delete Task
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  );
}
