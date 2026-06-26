import { NavLink, useNavigate, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ListTodo, 
  FileCheck2, 
  BrainCircuit, 
  Siren, 
  CalendarDays, 
  LineChart, 
  Settings,
  Bell,
  Sun,
  Moon,
  ChevronDown,
  ShieldCheck,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { useState, useEffect } from 'react';
import GuardianAssistant from './GuardianAssistant';

export default function Layout({ children }) {
  const [user, setUser] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    const fetchUser = () => {
      const userData = localStorage.getItem('user');
      if (userData) {
        setUser(JSON.parse(userData));
      }
    };
    fetchUser();

    const fetchTasksForNotifications = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;
      try {
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/tasks`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const tasks = await res.json();
          const notifs = [];
          const now = new Date();
          
          tasks.forEach(t => {
            if (t.status === 'completed') return;
            
            // Check deadlines within 24 hours
            const deadline = new Date(t.deadline);
            const timeDiff = deadline.getTime() - now.getTime();
            const hoursLeft = timeDiff / (1000 * 60 * 60);
            
            if (hoursLeft > 0 && hoursLeft <= 24) {
              notifs.push({
                id: `dl-${t._id}`,
                title: 'Deadline Approaching',
                desc: `"${t.title}" is due in ${Math.floor(hoursLeft)} hours!`,
                color: 'text-orange-500',
                bgColor: 'bg-orange-500/10',
                icon: <Clock size={16} className="text-orange-500" />,
                time: 'Soon'
              });
            }
            
            // Check high risk
            if (t.riskScore >= 80) {
              notifs.push({
                id: `risk-${t._id}`,
                title: 'High Risk Detected',
                desc: `"${t.title}" has a risk score of ${t.riskScore}%.`,
                color: 'text-red-500',
                bgColor: 'bg-red-500/10',
                icon: <AlertTriangle size={16} className="text-red-500" />,
                time: 'New'
              });
            }
          });
          
          setNotifications(notifs);
          if (notifs.length > 0) setHasUnreadNotifications(true);
        }
      } catch (err) {
        console.error("Failed to fetch tasks for notifications", err);
      }
    };

    fetchTasksForNotifications();
    window.addEventListener('userUpdated', fetchUser);
    return () => window.removeEventListener('userUpdated', fetchUser);
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={20} /> },
    { name: 'My Tasks', path: '/dashboard?tab=tasks', icon: <ListTodo size={20} /> },
    { name: 'Proofs', path: '/dashboard?tab=proofs', icon: <FileCheck2 size={20} /> },
    { name: 'AI Analysis', path: '/dashboard?tab=analysis', icon: <BrainCircuit size={20} /> },
    { name: 'Rescue Mode', path: '/rescue', icon: <Siren size={20} /> },
    { name: 'Calendar', path: '/dashboard?tab=calendar', icon: <CalendarDays size={20} /> },
    { name: 'Insights', path: '/dashboard?tab=insights', icon: <LineChart size={20} /> },
    { name: 'Settings', path: '/dashboard?tab=settings', icon: <Settings size={20} /> },
  ];

  const hour = new Date().getHours();
  let greeting = "Good evening";
  if (hour < 12) greeting = "Good morning";
  else if (hour < 18) greeting = "Good afternoon";

  return (
    <div className="flex h-screen bg-bg text-text overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-surface border-r border-border flex flex-col justify-between hidden md:flex shrink-0">
        <div>
          <Link to="/dashboard" className="p-6 flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer">
            <div className="bg-primary/10 text-primary p-2 rounded-xl">
              <ShieldCheck size={28} className="text-primary" />
            </div>
            <span className="text-xl font-extrabold tracking-tight">Deadline<br/><span className="text-primary">Guardian AI</span></span>
          </Link>

          <nav className="px-4 py-2 flex flex-col gap-1">
            {navItems.map((item) => {
              const currentUrl = location.pathname + location.search;
              const isItemActive = currentUrl === item.path || (item.path === '/dashboard' && currentUrl === '/dashboard');
              
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                    isItemActive
                      ? 'bg-primary text-white shadow-md shadow-primary/20' 
                      : 'text-text-muted hover:bg-bg hover:text-text'
                  }`}
                >
                  {item.icon}
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="p-4">


          <div className="relative">
            <div onClick={() => setShowProfileMenu(!showProfileMenu)} className="flex items-center gap-3 px-2 py-2 hover:bg-bg rounded-xl cursor-pointer transition-colors border border-transparent hover:border-border">
              {user?.picture ? (
                <img src={user.picture} alt="Profile" className="w-10 h-10 rounded-full border border-border" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                  {user?.name?.[0] || 'U'}
                </div>
              )}
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-bold truncate">{user?.name || 'User'}</p>
                <p className="text-xs text-text-muted truncate">{user?.email || 'user@example.com'}</p>
              </div>
              <ChevronDown size={16} className={`text-text-muted transition-transform ${showProfileMenu ? 'rotate-180' : ''}`} />
            </div>

            {/* Profile Dropdown */}
            {showProfileMenu && (
              <div className="absolute bottom-full left-0 w-full mb-2 bg-surface border border-border rounded-xl shadow-lg overflow-hidden animate-slide-up z-50">
                <button onClick={handleLogout} className="w-full text-left px-4 py-3 text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">Log out</button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-bg">
        {/* Topbar */}
        <header className="h-20 flex items-center justify-between px-8 shrink-0">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              {greeting}, <span className="text-primary">{user?.name?.split(' ')[0] || 'Aditya'}</span>! <span className="text-2xl animate-wave origin-bottom-right">👋</span>
            </h1>
            <p className="text-text-muted text-sm mt-1">Let's stay on top of your goals today.</p>
          </div>
          
          <div className="flex items-center gap-4">
            
            {/* Gamification Stats */}
            {user && (
              <div className="flex items-center gap-4 bg-surface border border-border px-4 py-2 rounded-2xl shadow-sm mr-2 hidden md:flex transition-all hover:shadow-md cursor-default">
                <div className="flex flex-col items-end">
                  <span className="text-xs font-bold text-text-muted uppercase tracking-wider">Level {user.level || 1}</span>
                  <span className="text-sm font-extrabold text-primary">{user.xp || 0} XP</span>
                </div>
                <div className="w-24 h-2 bg-bg rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-primary to-primary-focus transition-all duration-1000 ease-out" 
                    style={{ width: `${((user.xp || 0) % 100)}%` }}
                  ></div>
                </div>
                {user.currentStreak > 0 && (
                  <div className="flex items-center gap-1 text-orange-500 ml-2 border-l border-border pl-4" title={`${user.currentStreak} task streak!`}>
                    <span className="text-lg animate-pulse">🔥</span>
                    <span className="font-extrabold">{user.currentStreak}</span>
                  </div>
                )}
              </div>
            )}

            <div className="bg-surface border border-border rounded-full flex items-center p-1 shadow-sm cursor-pointer" onClick={() => setIsDarkMode(!isDarkMode)}>
              <button className={`p-2 rounded-full transition-all ${!isDarkMode ? 'bg-primary shadow-md text-white' : 'text-text-muted hover:bg-bg/50'}`}>
                <Sun size={18} />
              </button>
              <button className={`p-2 rounded-full transition-all ${isDarkMode ? 'bg-primary shadow-md text-white' : 'text-text-muted hover:bg-bg/50'}`}>
                <Moon size={18} />
              </button>
            </div>
            
            <div className="relative">
              <button 
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  if (!showNotifications) setHasUnreadNotifications(false);
                }} 
                className="relative p-2.5 bg-surface border border-border rounded-full text-text-muted hover:text-text transition-colors shadow-sm"
              >
                <Bell size={20} />
                {hasUnreadNotifications && <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>}
              </button>
              
              {/* Notifications Dropdown */}
              {showNotifications && (
                <div className="absolute top-full right-0 mt-2 w-96 bg-surface border border-border rounded-2xl shadow-xl overflow-hidden animate-slide-up z-50">
                  <div className="p-4 border-b border-border flex justify-between items-center bg-bg/50">
                    <h3 className="font-extrabold text-lg flex items-center gap-2">
                      Notifications 
                      {notifications.length > 0 && <span className="bg-primary text-white text-[10px] px-2 py-0.5 rounded-full">{notifications.length}</span>}
                    </h3>
                    <button onClick={() => {setShowNotifications(false); setHasUnreadNotifications(false);}} className="text-xs font-bold text-primary hover:text-primary-focus transition-colors">Mark all read</button>
                  </div>
                  <div className="divide-y divide-border max-h-[400px] overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center flex flex-col items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                          <Bell size={24} className="text-primary/50" />
                        </div>
                        <p className="text-text font-bold">You're all caught up!</p>
                        <p className="text-text-muted text-sm mt-1">No new notifications.</p>
                      </div>
                    ) : (
                      notifications.map(n => (
                        <div key={n.id} className="p-4 hover:bg-bg/80 transition-all cursor-pointer flex gap-4 border-l-4 border-transparent hover:border-primary group">
                          <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${n.bgColor}`}>
                            {n.icon}
                          </div>
                          <div className="flex-1">
                            <p className={`text-sm font-extrabold ${n.color}`}>{n.title}</p>
                            <p className="text-sm text-text-muted mt-1 leading-snug">{n.desc}</p>
                            <p className="text-[10px] text-text-muted font-bold mt-2 uppercase tracking-wider">{n.time}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-auto p-8 pb-32">
          {children}
        </div>
      </main>
      
      {user && <GuardianAssistant />}
    </div>
  );
}
