import { useState, useEffect } from 'react';
import { LineChart, TrendingUp, AlertTriangle, Sparkles, BrainCircuit } from 'lucide-react';

export default function InsightsTab({ tasks, summary }) {
  const [aiInsight, setAiInsight] = useState('');
  const [loadingInsight, setLoadingInsight] = useState(true);

  useEffect(() => {
    const fetchInsight = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/tasks/insight`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (res.ok) {
          const data = await res.json();
          setAiInsight(data.insight);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingInsight(false);
      }
    };
    if (tasks.length > 0) fetchInsight();
    else setLoadingInsight(false);
  }, [tasks.length]); // trigger when tasks length changes

  const completed = tasks.filter(t => t.status === 'completed').length;
  const total = tasks.length;
  const progressPct = total === 0 ? 0 : Math.round((completed / total) * 100);

  const now = new Date();
  const validActiveTasks = tasks.filter(t => t.status === 'pending' && new Date(t.deadline) > now);

  // Risk Distribution
  const highRisk = validActiveTasks.filter(t => t.riskScore >= 80).length;
  const mediumRisk = validActiveTasks.filter(t => t.riskScore >= 30 && t.riskScore < 80).length;
  const lowRisk = validActiveTasks.filter(t => t.riskScore < 30).length;
  const realActiveTotal = highRisk + mediumRisk + lowRisk;
  const activeTotal = realActiveTotal || 1; // avoid div by 0

  const highPct = Math.round((highRisk / activeTotal) * 100);
  const medPct = Math.round((mediumRisk / activeTotal) * 100);
  const lowPct = Math.round((lowRisk / activeTotal) * 100);
  
  const conicGradient = `conic-gradient(#ef4444 0% ${highPct}%, #f97316 ${highPct}% ${highPct + medPct}%, #3b82f6 ${highPct + medPct}% 100%)`;

  // Category Distribution
  const categories = {};
  tasks.forEach(t => {
    categories[t.category] = (categories[t.category] || 0) + 1;
  });
  const maxCategory = Math.max(...Object.values(categories), 1);

  return (
    <div className="flex-1 overflow-auto animate-fade-in p-2 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <div className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 p-3 rounded-2xl">
            <LineChart size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-text">Analytics & Insights</h1>
            <p className="text-text-muted">Track your productivity and risk factors over time.</p>
          </div>
        </div>

        {/* AI Insight Card */}
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-2xl p-6 mb-8 relative overflow-hidden">
           <BrainCircuit className="absolute -right-4 -top-4 text-primary/10" size={120} />
           <div className="relative z-10">
             <div className="flex items-center gap-2 mb-3 text-primary font-extrabold tracking-wider text-sm uppercase">
               <Sparkles size={16} /> Guardian AI Analysis
             </div>
             {loadingInsight ? (
               <div className="flex flex-col gap-2 animate-pulse-fast">
                 <div className="h-4 bg-primary/20 rounded-full w-3/4"></div>
                 <div className="h-4 bg-primary/20 rounded-full w-1/2"></div>
               </div>
             ) : (
               <p className="text-text text-lg font-medium leading-relaxed max-w-4xl">
                 {aiInsight || "Add more tasks to generate deep AI productivity insights."}
               </p>
             )}
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-2 text-text-muted font-bold text-sm uppercase tracking-wider">
              <TrendingUp size={16} className="text-green-500" /> Overall Progress
            </div>
            <div className="text-4xl font-extrabold mb-4">{progressPct}%</div>
            <div className="w-full h-2 bg-border rounded-full overflow-hidden">
              <div className="h-full bg-green-500 rounded-full" style={{ width: `${progressPct}%` }}></div>
            </div>
            <p className="text-xs text-text-muted mt-2">{completed} of {total} tasks completed</p>
          </div>

          <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-2 text-text-muted font-bold text-sm uppercase tracking-wider">
              <AlertTriangle size={16} className="text-red-500" /> High Risk Tasks
            </div>
            <div className="text-4xl font-extrabold text-red-500 mb-2">{highRisk}</div>
            <p className="text-xs text-text-muted">Active tasks with risk score &gt;= 80%.</p>
          </div>

          <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-2 text-text-muted font-bold text-sm uppercase tracking-wider">
              <LineChart size={16} className="text-primary" /> Average Risk
            </div>
            <div className="text-4xl font-extrabold text-primary mb-2">{summary ? Math.round(summary.averageRisk) : 0}%</div>
            <p className="text-xs text-text-muted">Across all active pending tasks.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Risk Distribution Chart */}
          <div className="bg-surface border border-border rounded-2xl p-8 shadow-sm flex flex-col items-center">
            <h2 className="text-xl font-bold mb-8 w-full text-left">Active Risk Distribution</h2>
            {realActiveTotal > 0 ? (
              <div className="relative w-48 h-48 rounded-full border-4 border-surface shadow-inner mb-8" style={{ background: conicGradient }}>
                <div className="absolute inset-0 m-auto w-32 h-32 bg-surface rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-2xl font-bold">{highRisk + mediumRisk + lowRisk}</span>
                </div>
              </div>
            ) : (
              <div className="w-48 h-48 rounded-full border-4 border-border border-dashed flex items-center justify-center mb-8">
                <span className="text-text-muted font-bold text-sm text-center">No active<br/>tasks</span>
              </div>
            )}
            <div className="w-full flex justify-between gap-4">
              <div className="text-center"><div className="w-3 h-3 bg-red-500 rounded-full mx-auto mb-1"></div><p className="text-xs font-bold text-text-muted">High ({highPct}%)</p></div>
              <div className="text-center"><div className="w-3 h-3 bg-orange-500 rounded-full mx-auto mb-1"></div><p className="text-xs font-bold text-text-muted">Medium ({medPct}%)</p></div>
              <div className="text-center"><div className="w-3 h-3 bg-blue-500 rounded-full mx-auto mb-1"></div><p className="text-xs font-bold text-text-muted">Low ({lowPct}%)</p></div>
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="bg-surface border border-border rounded-2xl p-8 shadow-sm">
            <h2 className="text-xl font-bold mb-8">Category Breakdown</h2>
            <div className="space-y-6">
              {Object.keys(categories).length > 0 ? Object.entries(categories).map(([cat, count]) => (
                <div key={cat}>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-bold capitalize">{cat}</span>
                    <span className="text-sm font-bold text-text-muted">{count}</span>
                  </div>
                  <div className="w-full h-3 bg-bg rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${(count / maxCategory) * 100}%` }}></div>
                  </div>
                </div>
              )) : (
                <p className="text-text-muted text-center py-8">No tasks categorized yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
