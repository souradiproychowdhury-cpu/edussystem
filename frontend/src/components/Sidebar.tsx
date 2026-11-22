import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Users, GraduationCap, Building2, BookOpen, CalendarCheck,
  ClipboardList, BadgeDollarSign, CalendarDays, Bell, X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import type { Role } from '../types';

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  roles: Role[];
}

const navItems: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'teacher', 'student'] },
  { to: '/students', label: 'Students', icon: Users, roles: ['admin', 'teacher'] },
  { to: '/teachers', label: 'Teachers', icon: GraduationCap, roles: ['admin'] },
  { to: '/departments', label: 'Departments', icon: Building2, roles: ['admin'] },
  { to: '/courses', label: 'Courses', icon: BookOpen, roles: ['admin', 'teacher'] },
  { to: '/attendance', label: 'Attendance', icon: CalendarCheck, roles: ['admin', 'teacher', 'student'] },
  { to: '/examinations', label: 'Exams & Results', icon: ClipboardList, roles: ['admin', 'teacher', 'student'] },
  { to: '/fees', label: 'Fees', icon: BadgeDollarSign, roles: ['admin', 'student'] },
  { to: '/timetable', label: 'Timetable', icon: CalendarDays, roles: ['admin', 'teacher', 'student'] },
  { to: '/notifications', label: 'Notifications', icon: Bell, roles: ['admin', 'teacher', 'student'] },
];

const Sidebar = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const { user } = useAuth();
  const role = user?.role as Role | undefined;
  const items = navItems.filter((i) => role && i.roles.includes(role));

  return (
    <>
      <div className={`fixed inset-0 bg-slate-900/40 z-40 lg:hidden transition-opacity ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={onClose} />
      <aside className={`fixed left-0 top-0 h-full w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-50 flex flex-col transform transition-transform lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-16 px-5 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold">E</div>
            <div>
              <div className="font-display font-bold text-slate-900 dark:text-white leading-none">EduPulse</div>
              <div className="text-[10px] uppercase tracking-wider text-slate-500 mt-0.5">University SMS</div>
            </div>
          </div>
          <button className="lg:hidden p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800" onClick={onClose} type="button" aria-label="Close menu">
            <X size={18} />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Operations</div>
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                  }`
                }
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
        <div className="p-4 border-t border-slate-200 dark:border-slate-800">
          <div className="rounded-xl bg-slate-50 dark:bg-slate-800 p-3 flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-500">Academic Term</div>
              <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">AY 2024-2025</div>
            </div>
            <span className="badge bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">Active</span>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
