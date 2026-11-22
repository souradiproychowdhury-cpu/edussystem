import { Menu, Bell, Moon, Sun, LogOut, UserCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useEffect, useState } from 'react';
import api from '../services/api';

const Topbar = ({ onMenu }: { onMenu: () => void }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const res = await api.get('/notifications');
        if (!mounted) return;
        const count = (res.data || []).filter((n: any) => !n.isRead).length;
        setUnread(count);
      } catch {
        // ignore
      }
    };
    load();
    const t = setInterval(load, 30000);
    return () => { mounted = false; clearInterval(t); };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="fixed top-0 left-0 lg:left-72 right-0 h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur border-b border-slate-200 dark:border-slate-800 z-30 px-4 sm:px-6 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 min-w-0">
        <button className="lg:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800" onClick={onMenu} type="button" aria-label="Open menu">
          <Menu size={20} />
        </button>
        <div className="hidden sm:block text-sm text-slate-500 truncate">
          Welcome back, <span className="font-semibold text-slate-800 dark:text-slate-100">{user?.name || 'User'}</span>
        </div>
      </div>
      <div className="flex items-center gap-1 sm:gap-2">
        <span className="hidden md:inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200 capitalize">
          <UserCircle size={14} className="text-primary" /> {user?.role}
        </span>
        <button className="relative p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => navigate('/notifications')} type="button" aria-label="Notifications">
          <Bell size={18} />
          {unread > 0 && <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-danger text-white text-[10px] font-bold flex items-center justify-center">{unread > 9 ? '9+' : unread}</span>}
        </button>
        <button className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800" onClick={toggleTheme} type="button" aria-label="Toggle theme">
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <button className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300" onClick={handleLogout} type="button" aria-label="Logout" title="Logout">
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
};

export default Topbar;
