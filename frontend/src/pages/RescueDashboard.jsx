import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Circle, AlertOctagon, Clock, ShieldAlert } from 'lucide-react';

export default function RescueDashboard() {
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchRescuePlan();
  }, []);

  const fetchRescuePlan = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/rescue/plan`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setPlan(await res.json());
      } else if (res.status === 404) {
        // Not activated yet, show activation screen
        setPlan({ notActive: true });
      }
    } catch (error) {
      console.error("Failed to fetch rescue plan", error);
    } finally {
      setLoading(false);
    }
  };

  const handleReturn = () => navigate('/dashboard');

  const handleRegenerate = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    try {
      await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/rescue/deactivate`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      navigate('/dashboard');
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  const handleManualStart = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    try {
      await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/rescue/activate`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ manualTriggerReason: "User explicitly requested manual rescue." })
      });
      await fetchRescuePlan();
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  const toggleTriageStep = async (stepId) => {
    // Optimistic update
    setPlan(prev => {
      const newPlan = { ...prev };
      const step = newPlan.immediateTriageSteps.find(s => s._id === stepId);
      if (step) step.completed = !step.completed;
      return newPlan;
    });

    const token = localStorage.getItem('token');
    try {
      await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/rescue/triage/${stepId}/toggle`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (error) {
      console.error("Failed to toggle step", error);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-zinc-950 p-8 flex flex-col items-center justify-center gap-6 animate-pulse-fast">
        <div className="w-16 h-16 rounded-full border-4 border-red-500 border-t-transparent animate-spin"></div>
        <p className="text-red-500 font-bold tracking-widest uppercase">Initializing Emergency Systems...</p>
      </div>
    );
  }
  
  if (!plan) return <div className="fixed inset-0 z-50 bg-zinc-950 p-8 flex items-center justify-center"><p className="text-xl text-zinc-400 font-bold">No active rescue plan found.</p></div>;

  if (plan.notActive) {
    return (
      <div className="min-h-screen p-8 mx-auto flex items-center justify-center">
        <div className="bg-surface border border-border p-12 rounded-3xl text-center shadow-2xl animate-slide-up">
          <div className="text-8xl mb-6">🛡️</div>
          <h1 className="text-4xl font-extrabold mb-4 text-text">You're Safe for Now!</h1>
          <p className="text-lg text-text-muted mb-8 max-w-md mx-auto">Rescue Mode is currently inactive because your schedule is healthy. However, you can manually trigger it if you feel overwhelmed.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={handleReturn} className="px-8 py-4 bg-surface text-text border border-border rounded-xl font-bold hover:bg-bg transition-transform hover:scale-105 shadow-sm">
              Return to Dashboard
            </button>
            <button onClick={handleManualStart} className="px-8 py-4 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-transform hover:scale-105 shadow-sm flex items-center justify-center gap-2">
              <ShieldAlert size={20} /> Force Start Rescue Mode
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (plan && plan.completed) {
    return (
      <div className="fixed inset-0 z-50 bg-zinc-950 p-8 flex items-center justify-center">
        <div className="bg-zinc-900 border border-zinc-800 p-12 rounded-3xl text-center shadow-2xl animate-slide-up max-w-lg">
          <div className="text-8xl mb-6 animate-bounce">🎉</div>
          <h1 className="text-4xl font-extrabold mb-4 text-green-500">Rescue Mission Completed!</h1>
          <p className="text-lg text-zinc-400 mb-8 max-w-md mx-auto">You have successfully reduced your risks and conquered your deadlines. The AI is proud of you!</p>
          <button onClick={handleRegenerate} className="px-8 py-4 bg-green-600 text-white rounded-xl font-bold hover:bg-green-500 transition-transform hover:scale-105 shadow-[0_0_20px_rgba(22,163,74,0.4)]">
            Archive Mission & Return
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950 text-zinc-100 font-sans overflow-y-auto">
      <div className="max-w-5xl mx-auto p-4 md:p-8 pb-20">
        
        {/* HEADER */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b border-red-900/30 pb-6 mt-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-red-600/20 border-2 border-red-500 flex items-center justify-center shadow-[0_0_15px_rgba(239,68,68,0.5)]">
              <ShieldAlert className="text-red-500" size={28} />
            </div>
            <div>
              <h1 className="m-0 text-3xl md:text-4xl font-black text-white tracking-tight uppercase">Emergency Command Center</h1>
              <p className="text-red-500 font-bold text-sm tracking-widest uppercase mt-1">System Override: Active</p>
            </div>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <button onClick={handleRegenerate} className="flex-1 md:flex-none px-5 py-3 bg-red-600 rounded-lg font-bold text-white hover:bg-red-500 shadow-[0_0_15px_rgba(220,38,38,0.4)] transition-colors">Abort & Regenerate</button>
            <button onClick={handleReturn} className="flex-1 md:flex-none px-5 py-3 bg-zinc-800 rounded-lg font-bold text-zinc-300 hover:bg-zinc-700 border border-zinc-700 transition-colors">Exit Console</button>
          </div>
        </header>

        {/* DO THIS NOW WIDGET */}
        <div className="bg-red-950/40 border-2 border-red-600/50 p-6 md:p-12 rounded-3xl mb-10 relative overflow-hidden shadow-[0_0_40px_rgba(220,38,38,0.15)] text-center">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-red-700 via-orange-500 to-red-700"></div>
          <div className="absolute inset-0 bg-red-500/5 animate-pulse"></div>
          <AlertOctagon className="text-red-500 mx-auto mb-4 relative z-10" size={56} />
          <h2 className="text-red-500 font-black tracking-[0.2em] uppercase text-sm mb-4 relative z-10">Immediate Directive</h2>
          <h3 className="text-xl md:text-2xl lg:text-3xl font-bold text-white leading-relaxed relative z-10 drop-shadow-md max-w-4xl mx-auto">{plan.whatToDoRightNow || "STOP EVERYTHING. FOCUS ON YOUR NEAREST DEADLINE."}</h3>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          
          {/* LEFT COLUMN: TRIAGE CHECKLIST & CRITICAL TASKS */}
          <div className="space-y-8">
            
            <section className="bg-zinc-900/60 border border-zinc-800/80 p-6 md:p-8 rounded-2xl shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/10 rounded-bl-[100px] pointer-events-none"></div>
              <h2 className="text-2xl font-black text-white mb-2 uppercase tracking-wide">Triage Checklist</h2>
              <p className="text-sm text-zinc-400 mb-6 font-medium">Complete these actions immediately to stabilize the situation.</p>
              <div className="space-y-3">
                {plan.immediateTriageSteps && plan.immediateTriageSteps.length > 0 ? (
                  plan.immediateTriageSteps.map((step, idx) => (
                    <button 
                      key={step._id || idx} 
                      onClick={() => toggleTriageStep(step._id)}
                      className={`w-full text-left flex items-start gap-4 p-4 rounded-xl border-2 transition-all duration-300 ${step.completed ? 'bg-green-900/10 border-green-900/30 opacity-50 scale-[0.98]' : 'bg-zinc-950 border-zinc-800 hover:border-zinc-600 shadow-md hover:shadow-xl hover:-translate-y-0.5'}`}
                    >
                      <div className="mt-0.5 shrink-0">
                        {step.completed ? <CheckCircle2 className="text-green-500" size={24} /> : <Circle className="text-zinc-600" size={24} />}
                      </div>
                      <span className={`text-base md:text-lg font-bold leading-snug ${step.completed ? 'line-through text-zinc-500' : 'text-zinc-200'}`}>
                        {step.action}
                      </span>
                    </button>
                  ))
                ) : (
                  <p className="text-zinc-500 italic p-4 bg-zinc-950 rounded-xl border border-zinc-800">No triage steps required. Proceed to schedule.</p>
                )}
              </div>
            </section>

            <section className="bg-zinc-900/60 border border-zinc-800/80 p-6 md:p-8 rounded-2xl shadow-xl">
              <h2 className="text-2xl font-black text-white mb-6 uppercase tracking-wide">Affected Targets</h2>
              <ul className="space-y-3">
                {plan.tasksInvolved?.map(t => (
                  <li key={t._id} className="flex justify-between items-center bg-zinc-950 p-4 rounded-xl border border-zinc-800">
                    <div className="truncate pr-4">
                      <span className={`font-bold text-lg block truncate ${t.status === 'completed' ? 'text-zinc-600 line-through' : 'text-zinc-200'}`}>{t.title}</span>
                      <span className="text-xs text-zinc-500 uppercase tracking-widest font-bold mt-1 block">Due: {new Date(t.deadline).toLocaleDateString('en-GB')}</span>
                    </div>
                    {t.status === 'completed' ? (
                      <span className="text-xs bg-green-900/30 text-green-400 border border-green-800/50 px-3 py-1.5 rounded-md uppercase tracking-wider font-bold">Rescued</span>
                    ) : (
                      <span className="text-xs bg-red-900/30 text-red-400 border border-red-800/50 px-3 py-1.5 rounded-md uppercase tracking-wider font-bold shrink-0">Risk: {t.riskScore}%</span>
                    )}
                  </li>
                ))}
              </ul>
            </section>

          </div>

          {/* RIGHT COLUMN: STRICT SCHEDULE */}
          <div className="space-y-8">
            
            <section className="bg-zinc-900/60 border border-zinc-800/80 p-6 md:p-8 rounded-2xl shadow-xl h-full relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-bl-[150px] pointer-events-none"></div>
              
              <div className="flex items-center gap-3 mb-8 border-b border-zinc-800/80 pb-4">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Clock className="text-blue-400" size={28} />
                </div>
                <h2 className="text-2xl font-black text-white uppercase tracking-wide">Strict Action Timeline</h2>
              </div>
              
              <div className="relative pl-8 border-l-2 border-zinc-800 space-y-10 py-2">
                {plan.strictSchedule && plan.strictSchedule.length > 0 ? (
                  plan.strictSchedule.map((item, idx) => (
                    <div key={idx} className="relative group">
                      <div className="absolute -left-[41px] top-1 w-4 h-4 bg-blue-500 rounded-full ring-4 ring-zinc-900 shadow-[0_0_10px_rgba(59,130,246,0.5)] group-hover:scale-125 transition-transform"></div>
                      <h4 className="text-blue-400 font-black uppercase tracking-widest text-sm mb-2">{item.time}</h4>
                      <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-xl group-hover:border-blue-900/50 transition-colors">
                        <p className="text-zinc-300 text-base md:text-lg leading-relaxed font-medium">{item.action}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-zinc-500 italic p-4 bg-zinc-950 rounded-xl border border-zinc-800">No schedule generated. Focus purely on triage steps.</p>
                )}
              </div>
            </section>

          </div>
        </div>
      </div>
    </div>
  );
}
