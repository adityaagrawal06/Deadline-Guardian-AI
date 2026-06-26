import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import TaskForm from '../components/TaskForm';
import AgentDiscussionTimeline from '../components/AgentDiscussionTimeline';
import ProofUpload from '../components/ProofUpload';
import { ClipboardList, Sparkles, Target, CheckCircle2, ArrowUpRight, ArrowDownRight, Plus, CloudUpload, ShieldAlert, Activity, BrainCircuit, FileCheck2, CalendarDays, Settings } from 'lucide-react';

// Tab Components
import CalendarTab from '../components/tabs/CalendarTab';
import InsightsTab from '../components/tabs/InsightsTab';
import ProofsTab from '../components/tabs/ProofsTab';
import AnalysisTab from '../components/tabs/AnalysisTab';
import SettingsTab from '../components/tabs/SettingsTab';
import TasksTab from '../components/tabs/TasksTab';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [summary, setSummary] = useState(null);
  const [rescueStatus, setRescueStatus] = useState(null);
  const [nowDate, setNowDate] = useState(new Date());
  const [filters, setFilters] = useState({ status: 'active', risk: 'all', timeframe: 'all' });
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [expandedTaskId, setExpandedTaskId] = useState(null);
  const [hasShownHighRiskAlert, setHasShownHighRiskAlert] = useState(false);
  const [criticalTask, setCriticalTask] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const activeTab = searchParams.get('tab');

  useEffect(() => {
    const timer = setInterval(() => setNowDate(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    
    const fetchUser = () => {
      const userData = localStorage.getItem('user');
      if (!token || !userData) {
        navigate('/');
        return;
      }
      setUser(JSON.parse(userData));
    };

    fetchUser();
    fetchDashboardData(token);

    window.addEventListener('userUpdated', fetchUser);
    return () => window.removeEventListener('userUpdated', fetchUser);
  }, [navigate]);

  const fetchDashboardData = async (token) => {
    try {
      const [tasksRes, summaryRes, rescueRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_BASE_URL}/api/tasks`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${import.meta.env.VITE_API_BASE_URL}/api/tasks/dashboard`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${import.meta.env.VITE_API_BASE_URL}/api/rescue/status`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      
      if (tasksRes.ok) setTasks(await tasksRes.json());
      if (summaryRes.ok) {
        const sumData = await summaryRes.json();
        setSummary(sumData);
        if (sumData.user) {
          const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
          const updatedUser = { ...storedUser, ...sumData.user };
          localStorage.setItem('user', JSON.stringify(updatedUser));
          window.dispatchEvent(new Event('userUpdated'));
        }
      }
      if (rescueRes.ok) setRescueStatus(await rescueRes.json());
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
  };

  const [criticalTaskTimeRemaining, setCriticalTaskTimeRemaining] = useState('');

  useEffect(() => {
    if (tasks.length > 0 && !hasShownHighRiskAlert) {
      const now = new Date();
      const highRiskTask = tasks.find(t => {
        if (t.status !== 'pending' || !(t.riskScore >= 80)) return false;
        const deadline = new Date(t.deadline);
        return deadline > now; // Exclude past deadlines
      });

      if (highRiskTask) {
        const deadline = new Date(highRiskTask.deadline);
        const hoursRemaining = ((deadline - now) / (1000 * 60 * 60));
        let timeText = '';
        if (hoursRemaining < 1) {
          timeText = `only ${Math.round(hoursRemaining * 60)} minutes remaining`;
        } else if (hoursRemaining < 24) {
          const hrs = Math.floor(hoursRemaining);
          const mins = Math.round((hoursRemaining % 1) * 60);
          timeText = `only ${hrs} hr${hrs > 1 ? 's' : ''} ${mins} min remaining`;
        } else {
          timeText = `only ${Math.round(hoursRemaining / 24)} days remaining`;
        }
        
        setCriticalTaskTimeRemaining(timeText);
        setCriticalTask(highRiskTask);
        setHasShownHighRiskAlert(true);
      }
    }
  }, [tasks, hasShownHighRiskAlert]);

  const [isRescuing, setIsRescuing] = useState(false);

  const handleRescueAction = async () => {
    if (rescueStatus?.isRescueModeActive) {
      navigate('/rescue');
    } else {
      setIsRescuing(true);
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/rescue/activate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ manualTriggerReason: "User manually clicked Rescue Me" })
        });
        if (res.ok) {
          navigate('/rescue');
        } else {
          console.error("Failed to activate rescue mode");
          alert("Failed to activate rescue mode. Please try again.");
        }
      } catch (error) {
        console.error("Rescue error", error);
        alert("Network error. Please try again.");
      } finally {
        setIsRescuing(false);
      }
    }
  };

  const handleSeedDemoData = async () => {
    const token = localStorage.getItem('token');
    const now = new Date();
    
    const demoTasks = [
      { title: "High Risk Assignment", category: "assignment", estimatedHours: 10, priority: "high", deadline: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString() },
      { title: "Medium Risk Coding Interview Prep", category: "exam", estimatedHours: 20, priority: "medium", deadline: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString() },
      { title: "Low Risk Project Documentation", category: "assignment", estimatedHours: 5, priority: "low", deadline: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString() }
    ];

    try {
      for (const t of demoTasks) {
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/tasks`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify(t)
        });
        if (res.ok) {
          const task = await res.json();
          // Instantly trigger analysis to generate perfect dynamic fallback data
          await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/agents/analyze`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ taskId: task._id, refresh: false })
          });
        }
      }
      fetchDashboardData(token);
    } catch (error) {
      console.error("Failed to seed demo data", error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const onTaskAdded = (newTask) => {
    setTasks([...tasks, newTask].sort((a, b) => new Date(a.deadline) - new Date(b.deadline)));
    fetchDashboardData(localStorage.getItem('token'));
  };

  if (!user) {
    return (
      <div className="min-h-screen p-8 max-w-6xl mx-auto flex flex-col gap-8 animate-pulse-fast">
        <div className="h-24 bg-surface rounded-xl"></div>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4"><div className="h-24 bg-surface rounded-xl"></div><div className="h-24 bg-surface rounded-xl"></div><div className="h-24 bg-surface rounded-xl"></div><div className="h-24 bg-surface rounded-xl"></div><div className="h-24 bg-surface rounded-xl"></div><div className="h-24 bg-surface rounded-xl"></div></div>
        <div className="h-48 bg-surface rounded-xl"></div>
        <div className="h-12 w-48 bg-surface rounded-lg"></div>
        <div className="h-32 bg-surface rounded-xl"></div>
      </div>
    );
  }

  // 1. Strict Rescue Logic
  const now = new Date();
  const shouldShowRescueBanner = rescueStatus?.isRescueModeActive || tasks.some(t => 
    t.riskScore >= 80 && t.status === 'pending' && new Date(t.deadline).getTime() > now.getTime()
  );

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'tasks': return <TasksTab tasks={tasks} fetchDashboardData={() => fetchDashboardData(localStorage.getItem('token'))} />;
      case 'calendar': return <CalendarTab tasks={tasks} />;
      case 'insights': return <InsightsTab tasks={tasks} summary={summary} />;
      case 'proofs': return <ProofsTab tasks={tasks} onUploadSuccess={() => fetchDashboardData(localStorage.getItem('token'))} />;
      case 'analysis': return <AnalysisTab tasks={tasks} />;
      case 'settings': return <SettingsTab user={user} />;
      case 'dashboard': 
      case null:
      case '':
        return null; // Will render default dashboard below
      default:
        return (
          <div className="flex-1 h-[70vh] flex flex-col items-center justify-center p-12 text-center">
            <div className="bg-surface border border-border p-12 rounded-3xl shadow-lg max-w-lg w-full relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 text-primary/10">
                <Settings size={120} />
              </div>
              <div className="relative z-10">
                <h1 className="text-3xl font-extrabold mb-4 text-text capitalize">{activeTab}</h1>
                <p className="text-text-muted mb-8 text-lg leading-relaxed">This premium module is actively being developed by our AI team and will be released in the next major update.</p>
                <button onClick={() => navigate('/dashboard')} className="px-8 py-3 bg-bg border border-border hover:bg-border transition-all rounded-xl font-bold text-sm shadow-sm hover:shadow text-text">
                  &larr; Back to Dashboard
                </button>
              </div>
            </div>
          </div>
        );
    }
  };

  if (activeTab && activeTab !== 'dashboard') {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="h-full"
        >
          {renderActiveTab()}
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-8 pb-12 animate-fade-in">
      {/* High Risk Alert Modal */}
      {criticalTask && (
        <div className="fixed inset-0 bg-red-950/80 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-fade-in">
          <div className="bg-surface rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-red-500/30">
            <div className="bg-red-500/10 p-6 flex flex-col items-center text-center">
              <div className="bg-red-500 text-white p-4 rounded-full mb-4 animate-pulse">
                <ShieldAlert size={40} />
              </div>
              <h2 className="font-extrabold text-2xl text-red-500 mb-2">CRITICAL RISK ALERT</h2>
              <p className="text-text-muted font-bold">Immediate Action Required</p>
            </div>
            <div className="p-6 text-center">
              <p className="text-lg mb-4">
                Your task <strong>"{criticalTask.title}"</strong> has reached a catastrophic risk level of <span className="text-red-500 font-extrabold">{criticalTask.riskScore}%</span>.
              </p>
              <p className="text-sm text-text-muted mb-6">
                You have <span className="font-bold text-red-500">{criticalTaskTimeRemaining}</span>. We strongly recommend activating Rescue Mode immediately to salvage the situation.
              </p>
              <div className="flex gap-4">
                <button 
                  onClick={() => setCriticalTask(null)} 
                  className="flex-1 bg-bg border border-border text-text py-3 rounded-xl font-bold hover:bg-surface transition-colors"
                >
                  Dismiss
                </button>
                <button 
                  onClick={() => {
                    setCriticalTask(null);
                    handleRescueAction();
                  }} 
                  className="flex-1 bg-red-600 text-white py-3 rounded-xl font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-600/30"
                >
                  Activate Rescue
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Strict Rescue Mode Banner */}
      {shouldShowRescueBanner && (
        <div className="rounded-2xl bg-red-50 border border-red-200 p-6 shadow-sm dark:bg-red-900/10 dark:border-red-900/30 text-left flex justify-between items-center transition-all">
          <div className="flex items-center gap-4">
            <div className="bg-red-100 p-3 rounded-full dark:bg-red-900/50 text-red-600"><ShieldAlert size={28} /></div>
            <div>
              <h2 className="text-xl font-bold text-red-700 dark:text-red-400 mb-1">Academic Rescue Mode {rescueStatus?.isRescueModeActive ? 'Active' : 'Recommended'}</h2>
              <p className="text-red-600 dark:text-red-300">You have a high probability of missing upcoming deadlines. Immediate intervention required.</p>
            </div>
          </div>
          <button 
            onClick={handleRescueAction}
            disabled={isRescuing}
            className="rounded-xl bg-red-600 px-6 py-3 font-bold text-white hover:bg-red-700 shadow-md shadow-red-600/20 transition-transform hover:scale-105 disabled:opacity-50"
          >
            {isRescuing ? 'Activating...' : rescueStatus?.isRescueModeActive ? 'View Rescue Plan' : 'Rescue Me!'}
          </button>
        </div>
      )}

      {/* 4 Premium Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Tasks Pending */}
        <div className="bg-surface p-6 rounded-2xl shadow-sm border border-border flex flex-col justify-between hover:shadow-md transition-shadow h-32">
          <div className="flex justify-between items-start">
            <div className="bg-primary/10 p-2.5 rounded-xl text-primary"><ClipboardList size={24} /></div>
            <div className="text-right">
              <p className="text-3xl font-extrabold text-text">{summary?.activeCount || 0}</p>
              <p className="text-text-muted text-sm font-medium">Tasks Pending</p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs font-bold text-green-500 mt-2">
            <ArrowUpRight size={14} /> <span>12% this week</span>
          </div>
        </div>

        {/* AI Analyses */}
        <div className="bg-surface p-6 rounded-2xl shadow-sm border border-border flex flex-col justify-between hover:shadow-md transition-shadow h-32">
          <div className="flex justify-between items-start">
            <div className="bg-indigo-500/10 p-2.5 rounded-xl text-indigo-500"><Sparkles size={24} /></div>
            <div className="text-right">
              <p className="text-3xl font-extrabold text-text">{summary?.total || 0}</p>
              <p className="text-text-muted text-sm font-medium">AI Analyses</p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs font-bold text-green-500 mt-2">
            <ArrowUpRight size={14} /> <span>33% this week</span>
          </div>
        </div>

        {/* Avg Risk Score */}
        <div className="bg-surface p-6 rounded-2xl shadow-sm border border-border flex flex-col justify-between hover:shadow-md transition-shadow h-32">
          <div className="flex justify-between items-start">
            <div className="bg-red-500/10 p-2.5 rounded-xl text-red-500"><Target size={24} /></div>
            <div className="text-right">
              <p className="text-3xl font-extrabold text-text">{summary?.averageRisk ? Math.floor(summary.averageRisk) : 0}%</p>
              <p className="text-text-muted text-sm font-medium">Avg. Risk Score</p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs font-bold text-green-500 mt-2">
            <ArrowDownRight size={14} /> <span>12% this week</span>
          </div>
        </div>

        {/* Tasks Completed */}
        <div className="bg-surface p-6 rounded-2xl shadow-sm border border-border flex flex-col justify-between hover:shadow-md transition-shadow h-32">
          <div className="flex justify-between items-start">
            <div className="bg-blue-500/10 p-2.5 rounded-xl text-blue-500"><CheckCircle2 size={24} /></div>
            <div className="text-right">
              <p className="text-3xl font-extrabold text-text">{summary?.completed || 0}</p>
              <p className="text-text-muted text-sm font-medium">Tasks Completed</p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs font-bold text-green-500 mt-2">
            <ArrowUpRight size={14} /> <span>100% this week</span>
          </div>
        </div>
      </div>

      {/* Add Task Modal overlay */}
      {showTaskForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-border">
              <h2 className="font-bold text-xl">Create New Task</h2>
              <button onClick={() => setShowTaskForm(false)} className="text-text-muted hover:text-text font-bold text-2xl">&times;</button>
            </div>
            <div className="p-6">
              <TaskForm onTaskAdded={(t) => { onTaskAdded(t); setShowTaskForm(false); }} />
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: 2/3 Left, 1/3 Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: Tasks & Workflow */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          
          {/* Top 3 Most Urgent Tasks Widget */}
          <div className="bg-surface rounded-2xl shadow-sm border border-border overflow-hidden">
            <div className="p-6 border-b border-border flex justify-between items-center">
              <h2 className="text-lg font-bold">Top 3 Most Urgent Tasks</h2>
              <button onClick={() => navigate('/dashboard?tab=tasks')} className="text-xs font-bold text-primary hover:text-primary/80 transition-colors">
                View All Tasks &rarr;
              </button>
            </div>
            
            <div className="flex flex-col divide-y divide-border">
              {(() => {
                const urgentTasks = tasks
                  .filter(t => {
                    if (t.status === 'completed') return false;
                    return new Date(t.deadline).getTime() > nowDate.getTime();
                  })
                  .sort((a, b) => b.riskScore - a.riskScore)
                  .slice(0, 3);
                
                if (urgentTasks.length === 0) {
                   return <div className="p-8 text-center text-text-muted text-sm font-medium">No highly urgent tasks at the moment!</div>;
                }

                return urgentTasks.map(task => {
                  const diff = new Date(task.deadline) - nowDate;
                  let timeLabel = "Deadline passed";
                  if (diff > 0) {
                    const d = Math.floor(diff / (1000 * 60 * 60 * 24));
                    timeLabel = d > 0 ? `Due in ${d} days` : 'Due Today';
                  }

                  return (
                    <div key={task._id} className="p-4 flex items-center justify-between hover:bg-bg/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={`p-2.5 rounded-xl ${task.riskScore > 70 ? 'bg-red-100 text-red-600' : task.riskScore > 30 ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'}`}>
                          {task.riskScore > 70 ? <ShieldAlert size={20} /> : <ClipboardList size={20} />}
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-text truncate max-w-[150px] sm:max-w-[200px]">{task.title}</h4>
                          <p className="text-xs text-text-muted">{timeLabel}</p>
                        </div>
                      </div>
                      <div className="text-center">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${task.riskScore > 70 ? 'bg-red-100 text-red-700' : task.riskScore > 30 ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                           {task.riskScore > 70 ? 'High Risk' : task.riskScore > 30 ? 'Med Risk' : 'Low Risk'}
                        </span>
                        <p className="text-xs font-bold mt-1 text-text-muted">{task.riskScore}%</p>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>

          {/* 7-Day Upcoming Deadlines Timeline */}
          <div className="bg-surface rounded-2xl shadow-sm border border-border p-6 overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-indigo-500 to-primary"></div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <CalendarDays size={16} className="text-primary" />
                Upcoming Deadlines (Next 7 Days)
              </h3>
            </div>

            <div className="flex justify-between items-stretch gap-2 pt-2 pb-4">
              {(() => {
                if (!tasks) return null;
                const days = [];
                const today = new Date(nowDate);
                today.setHours(0, 0, 0, 0);

                for (let i = 0; i < 7; i++) {
                  const targetDate = new Date(today);
                  targetDate.setDate(targetDate.getDate() + i);
                  
                  // Find tasks for this day
                  const dayTasks = tasks.filter(t => {
                    if (t.status === 'completed') return false;
                    const d = new Date(t.deadline);
                    return d.toLocaleDateString() === targetDate.toLocaleDateString();
                  });

                  // Format day label
                  const isToday = i === 0;
                  const isTomorrow = i === 1;
                  const dayName = isToday ? 'Today' : isTomorrow ? 'Tmrw' : targetDate.toLocaleDateString('en-US', { weekday: 'short' });
                  const dateNum = targetDate.getDate();

                  // Determine color based on highest risk
                  let dotColor = 'bg-border';
                  if (dayTasks.length > 0) {
                    const highestRisk = Math.max(...dayTasks.map(t => t.riskScore || 0));
                    dotColor = highestRisk > 70 ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]' : highestRisk > 30 ? 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]' : 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]';
                  }

                  days.push(
                    <div key={i} className="flex flex-col items-center flex-1 relative group cursor-pointer animate-fade-in" style={{animationDelay: `${i * 100}ms`}}>
                      {/* Line connector */}
                      {i < 6 && (
                        <div className="absolute top-[22px] left-1/2 w-full h-[2px] bg-border -z-10 mt-1"></div>
                      )}
                      
                      {/* Day Label */}
                      <span className={`text-[10px] font-bold mb-3 ${isToday ? 'text-primary' : 'text-text-muted'}`}>
                        {dayName}
                      </span>

                      {/* Timeline Dot */}
                      <div className={`w-3 h-3 rounded-full ${dotColor} relative z-10 transition-transform group-hover:scale-125`}>
                        {dayTasks.length > 0 && (
                           <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-white animate-ping opacity-75"></div>
                        )}
                      </div>
                      
                      {/* Date Number */}
                      <span className="text-[10px] text-text-muted mt-2">{dateNum}</span>
                      
                      {/* Tooltip for tasks */}
                      {dayTasks.length > 0 && (
                        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-48 bg-surface border border-border shadow-lg rounded-xl p-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 pointer-events-none">
                          <p className="text-[10px] font-bold text-text-muted mb-2 uppercase tracking-wider">{dayName}, {targetDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                          <div className="flex flex-col gap-2">
                            {dayTasks.map(t => (
                              <div key={t._id} className="flex items-center gap-2">
                                <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${t.riskScore > 70 ? 'bg-red-500' : t.riskScore > 30 ? 'bg-orange-500' : 'bg-green-500'}`}></div>
                                <span className="text-xs font-bold text-text truncate">{t.title}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                }
                return days;
              })()}
            </div>
          </div>

          {/* AI Agent Analysis Flow */}
          <div className="bg-surface rounded-2xl shadow-sm border border-border p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-sm">AI Agent Analysis Flow</h3>
              <button onClick={() => navigate('/dashboard?tab=analysis')} className="text-xs font-bold text-primary hover:text-primary/80 transition-colors">View Full Analysis &rarr;</button>
            </div>
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center relative gap-6 md:gap-0">
              <div className="hidden md:block absolute top-6 left-12 right-12 h-0.5 bg-border -z-10 border-t border-dashed border-border/80"></div>
              
              {/* Planner */}
              <div className="flex flex-col items-center bg-surface w-full md:w-32 z-10 text-center gap-2">
                <div className="bg-primary/10 text-primary p-3 rounded-2xl"><BrainCircuit size={24} /></div>
                <div>
                  <h4 className="text-[10px] font-bold text-primary">Planner Agent</h4>
                  <p className="text-[9px] text-text-muted">Strategy Created</p>
                </div>
                <div className="flex items-center gap-1 text-[9px] text-green-500 font-bold mt-1">
                  <CheckCircle2 size={12} /> Completed
                </div>
              </div>

              {/* Realist */}
              <div className="flex flex-col items-center bg-surface w-full md:w-32 z-10 text-center gap-2">
                <div className="bg-green-500/10 text-green-500 p-3 rounded-2xl"><Target size={24} /></div>
                <div>
                  <h4 className="text-[10px] font-bold text-green-600">Realist Agent</h4>
                  <p className="text-[9px] text-text-muted">Bottlenecks Found</p>
                </div>
                <div className="flex items-center gap-1 text-[9px] text-green-500 font-bold mt-1">
                  <CheckCircle2 size={12} /> Completed
                </div>
              </div>

              {/* Risk */}
              <div className="flex flex-col items-center bg-surface w-full md:w-32 z-10 text-center gap-2">
                <div className="bg-orange-500/10 text-orange-500 p-3 rounded-2xl"><ShieldAlert size={24} /></div>
                <div>
                  <h4 className="text-[10px] font-bold text-orange-600">Risk Agent</h4>
                  <p className="text-[9px] text-text-muted">Risk Score: {summary?.averageRisk ? Math.floor(summary.averageRisk) : 0}%</p>
                </div>
                <div className="flex items-center gap-1 text-[9px] text-green-500 font-bold mt-1">
                  <CheckCircle2 size={12} /> Completed
                </div>
              </div>

              {/* Coordinator */}
              <div className="flex flex-col items-center bg-surface w-full md:w-32 z-10 text-center gap-2">
                <div className="bg-indigo-500/10 text-indigo-500 p-3 rounded-2xl"><Activity size={24} /></div>
                <div>
                  <h4 className="text-[10px] font-bold text-indigo-600">Coordinator Agent</h4>
                  <p className="text-[9px] text-text-muted">Plan Generated</p>
                </div>
                <div className="flex items-center gap-1 text-[9px] text-green-500 font-bold mt-1">
                  <CheckCircle2 size={12} /> Completed
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Exec Summary, Risk, Quick Actions */}
        <div className="flex flex-col gap-8">
          
          {/* AI Executive Summary */}
          <div className="rounded-2xl shadow-md overflow-hidden border border-primary/20">
            <div className="bg-gradient-to-r from-primary to-indigo-500 p-4 flex justify-between items-center text-white">
              <h3 className="font-bold text-sm flex items-center gap-2"><Sparkles size={16} /> AI Executive Summary</h3>
              <span className="text-[9px] uppercase tracking-wider bg-black/20 px-2 py-0.5 rounded-full backdrop-blur-sm flex items-center gap-1">
                <Activity size={10} /> Updated just now
              </span>
            </div>
            <div className="bg-surface p-5 flex flex-col gap-4">
              <div className="flex items-center gap-3 border-b border-border pb-4">
                <span className="text-xs font-bold text-text-muted">Overall Status</span>
                <span className="text-xs font-bold bg-orange-100 text-orange-700 px-2.5 py-1 rounded-full">At Risk</span>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] text-text-muted mb-1">Completion Probability</p>
                  <p className="text-xl font-bold text-primary">62%</p>
                </div>
                <div>
                  <p className="text-[10px] text-text-muted mb-1">Deadline Urgency</p>
                  <p className="text-sm font-bold text-red-500 mt-1">High</p>
                </div>
                <div>
                  <p className="text-[10px] text-text-muted mb-1">Most Critical Action</p>
                  <p className="text-xs font-medium text-text mt-1 leading-tight">Start next assignment today</p>
                </div>
                <div>
                  <p className="text-[10px] text-text-muted mb-1">Recommended Start</p>
                  <p className="text-xs font-medium text-text mt-1">Today</p>
                </div>
                <div>
                  <p className="text-[10px] text-text-muted mb-1">Expected Completion</p>
                  <p className="text-xs font-medium text-text mt-1">Tomorrow</p>
                </div>
                <div>
                  <p className="text-[10px] text-text-muted mb-1">AI Confidence</p>
                  <p className="text-xl font-bold text-primary">92%</p>
                </div>
              </div>
            </div>
          </div>

          {/* Risk Overview */}
          <div className="bg-surface rounded-2xl shadow-sm border border-border p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-sm">Risk Overview</h3>
              <button className="text-xs font-bold text-primary hover:text-primary/80 transition-colors">View Details &rarr;</button>
            </div>
            
            <div className="flex items-center gap-6 mb-6">
              <div className="relative w-24 h-24 shrink-0 flex items-center justify-center rounded-full border-[12px] border-border border-l-red-500 border-t-orange-500 border-r-green-500">
                <div className="text-center">
                  <p className="text-xl font-extrabold leading-none">{summary?.averageRisk ? Math.floor(summary.averageRisk) : 0}%</p>
                  <p className="text-[8px] text-text-muted uppercase font-bold mt-1 tracking-wider">Avg Risk</p>
                </div>
              </div>
              <div className="flex-1 flex flex-col gap-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500"></span> High Risk</span>
                  <span className="font-bold">82%</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-orange-500"></span> Medium Risk</span>
                  <span className="font-bold">52%</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-500"></span> Low Risk</span>
                  <span className="font-bold">18%</span>
                </div>
              </div>
            </div>

            <div className="bg-primary/5 rounded-xl p-3 flex gap-3 items-start border border-primary/10">
              <div className="bg-white dark:bg-black/50 p-1.5 rounded-lg text-primary shadow-sm mt-0.5"><ArrowDownRight size={14} /></div>
              <div>
                <p className="text-xs font-bold text-primary">Reduce your risk by 23%</p>
                <p className="text-[10px] text-text-muted leading-tight mt-0.5">Upload proofs and follow AI recommendations</p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-surface rounded-2xl shadow-sm border border-border p-6">
            <h3 className="font-bold text-sm mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setShowTaskForm(true)} className="flex items-center gap-2 bg-bg border border-border hover:bg-border transition-colors p-2.5 rounded-xl text-xs font-bold text-text justify-center">
                <div className="bg-primary text-white p-1 rounded-md"><Plus size={12} /></div> New Task
              </button>
              <button onClick={() => navigate('/dashboard?tab=proofs')} className="flex items-center gap-2 bg-bg border border-border hover:bg-border transition-colors p-2.5 rounded-xl text-xs font-bold text-text justify-center">
                <div className="bg-blue-500 text-white p-1 rounded-md"><CloudUpload size={12} /></div> Upload Proof
              </button>
              <button onClick={handleRescueAction} disabled={isRescuing} className="flex items-center gap-2 bg-bg border border-border hover:bg-border transition-colors p-2.5 rounded-xl text-xs font-bold text-text justify-center">
                <div className="bg-red-500 text-white p-1 rounded-md"><ShieldAlert size={12} /></div> {isRescuing ? 'Activating...' : 'Rescue Me'}
              </button>
              <button onClick={() => navigate('/dashboard?tab=analysis')} className="flex items-center gap-2 bg-bg border border-border hover:bg-border transition-colors p-2.5 rounded-xl text-xs font-bold text-text justify-center">
                <div className="bg-indigo-500 text-white p-1 rounded-md"><Sparkles size={12} /></div> AI Analysis
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
