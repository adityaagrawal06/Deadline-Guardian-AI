import { CalendarDays, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { useState } from 'react';

export default function CalendarTab({ tasks }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  
  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  // Generate calendar grid
  const days = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(<div key={`empty-${i}`} className="h-32 bg-transparent"></div>);
  }
  
  for (let i = 1; i <= daysInMonth; i++) {
    const dateStr = new Date(currentDate.getFullYear(), currentDate.getMonth(), i).toDateString();
    
    // Find tasks due on this day
    const dayTasks = tasks.filter(t => {
      if (!t.deadline) return false;
      const tDate = new Date(t.deadline);
      return !isNaN(tDate.getTime()) && tDate.toDateString() === dateStr;
    });

    const isToday = dateStr === new Date().toDateString();

    days.push(
      <div key={`day-${i}`} className={`h-32 border border-border p-2 overflow-hidden hover:bg-bg/50 transition-colors ${isToday ? 'bg-primary/5 border-primary/30' : 'bg-surface'}`}>
        <p className={`font-bold mb-1 ${isToday ? 'text-primary' : 'text-text-muted'}`}>{i}</p>
        <div className="space-y-1">
          {dayTasks.map(t => (
            <div 
              key={t._id} 
              className={`text-[10px] px-2 py-1 rounded truncate font-bold ${
                t.status === 'completed' ? 'bg-green-100 text-green-700' :
                t.riskScore > 70 ? 'bg-red-100 text-red-700' :
                t.riskScore > 30 ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
              }`}
              title={t.title}
            >
              {t.title}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto animate-fade-in p-2 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="bg-purple-100 dark:bg-purple-900/30 text-purple-600 p-3 rounded-2xl">
              <CalendarDays size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-text">Deadline Calendar</h1>
              <p className="text-text-muted">Visualizing your upcoming high-risk items.</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => {
                const token = localStorage.getItem('token');
                window.open(`${import.meta.env.VITE_API_BASE_URL}/api/tasks/calendar?token=${token}`, '_blank');
              }}
              className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl font-bold hover:bg-primary-focus transition-colors shadow-sm"
            >
              <Download size={18} />
              Export .ics
            </button>
            <div className="flex items-center gap-4 bg-surface p-2 rounded-xl border border-border shadow-sm">
              <button onClick={prevMonth} className="p-2 hover:bg-bg rounded-lg"><ChevronLeft size={20} /></button>
              <span className="font-bold w-32 text-center">{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</span>
              <button onClick={nextMonth} className="p-2 hover:bg-bg rounded-lg"><ChevronRight size={20} /></button>
            </div>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-sm">
          <div className="grid grid-cols-7 bg-bg border-b border-border">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} className="p-3 text-center text-xs font-bold text-text-muted">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {days}
          </div>
        </div>
      </div>
    </div>
  );
}
