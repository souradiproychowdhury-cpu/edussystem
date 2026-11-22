import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Users, GraduationCap, BookOpen, Building2, CalendarCheck, BadgeDollarSign, Bell, CalendarDays, ClipboardList, TrendingUp } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import LoadingSkeleton from '../components/LoadingSkeleton';

const COLORS = ['#6366F1', '#22C55E', '#F59E0B', '#06B6D4', '#8B5CF6', '#EF4444'];

const StatCard = ({ title, value, icon: Icon, color, to }: any) => (
  <Link to={to} className="card p-4 sm:p-5 hover:shadow-hover transition-shadow block">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold">{title}</p>
        <p className="text-2xl sm:text-3xl font-display font-bold text-slate-900 dark:text-white mt-2">{value ?? 0}</p>
      </div>
      <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${color}`}>
        <Icon size={20} className="text-white" />
      </div>
    </div>
  </Link>
);

const DashboardPage = () => {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await api.get('/dashboard');
        setData(res.data);
      } catch (e: any) {
        setError(e?.response?.data?.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const stats = data?.stats || {};
  const charts = data?.charts || {};
  const recent = data?.recent || {};
  const personal = data?.personal || {};

  const quickActions = useMemo(() => {
    if (user?.role === 'admin') return [
      { label: 'Add Student', to: '/students', icon: Users },
      { label: 'Add Teacher', to: '/teachers', icon: GraduationCap },
      { label: 'Manage Courses', to: '/courses', icon: BookOpen },
      { label: 'View Fees', to: '/fees', icon: BadgeDollarSign },
      { label: 'Timetable', to: '/timetable', icon: CalendarDays },
      { label: 'Notifications', to: '/notifications', icon: Bell },
    ];
    if (user?.role === 'teacher') return [
      { label: 'Mark Attendance', to: '/attendance', icon: CalendarCheck },
      { label: 'Students', to: '/students', icon: Users },
      { label: 'Exams & Results', to: '/examinations', icon: ClipboardList },
      { label: 'Timetable', to: '/timetable', icon: CalendarDays },
      { label: 'Notifications', to: '/notifications', icon: Bell },
    ];
    return [
      { label: 'My Attendance', to: '/attendance', icon: CalendarCheck },
      { label: 'My Results', to: '/examinations', icon: ClipboardList },
      { label: 'My Fees', to: '/fees', icon: BadgeDollarSign },
      { label: 'Timetable', to: '/timetable', icon: CalendarDays },
      { label: 'Notifications', to: '/notifications', icon: Bell },
    ];
  }, [user?.role]);

  if (loading) return <div className="card p-6"><LoadingSkeleton lines={8} /></div>;
  if (error) return <div className="card p-6 text-danger">{error}</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-slate-900 dark:text-white">Dashboard</h1>
          <p className="text-slate-500 mt-1">Overview for {user?.role} portal</p>
        </div>
        <div className="text-sm text-slate-500">Data sourced from live database records</div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {user?.role === 'admin' && <>
          <StatCard title="Total Students" value={stats.totalStudents} icon={Users} color="bg-primary" to="/students" />
          <StatCard title="Total Teachers" value={stats.totalTeachers} icon={GraduationCap} color="bg-secondary" to="/teachers" />
          <StatCard title="Total Courses" value={stats.totalCourses} icon={BookOpen} color="bg-accent" to="/courses" />
          <StatCard title="Total Departments" value={stats.totalDepartments} icon={Building2} color="bg-indigo-500" to="/departments" />
          <StatCard title="Total Attendance" value={stats.totalAttendance} icon={CalendarCheck} color="bg-emerald-500" to="/attendance" />
          <StatCard title="Pending Fees" value={stats.pendingFees} icon={BadgeDollarSign} color="bg-amber-500" to="/fees" />
        </>}
        {user?.role === 'teacher' && <>
          <StatCard title="Total Students" value={stats.totalStudents} icon={Users} color="bg-primary" to="/students" />
          <StatCard title="My Timetable Slots" value={personal.timetableSlots || 0} icon={CalendarDays} color="bg-accent" to="/timetable" />
          <StatCard title="Unread Notifications" value={personal.unreadNotifications || 0} icon={Bell} color="bg-secondary" to="/notifications" />
          <StatCard title="Total Courses" value={stats.totalCourses} icon={BookOpen} color="bg-indigo-500" to="/courses" />
          <StatCard title="Total Attendance Records" value={stats.totalAttendance} icon={CalendarCheck} color="bg-emerald-500" to="/attendance" />
          <StatCard title="Departments" value={stats.totalDepartments} icon={Building2} color="bg-amber-500" to="/departments" />
        </>}
        {user?.role === 'student' && <>
          <StatCard title="Attendance %" value={`${personal.attendancePercentage ?? 0}%`} icon={CalendarCheck} color="bg-emerald-500" to="/attendance" />
          <StatCard title="Attendance Records" value={personal.attendanceRecords || 0} icon={CalendarDays} color="bg-primary" to="/attendance" />
          <StatCard title="Fee Status" value={personal.fee?.paymentStatus || 'N/A'} icon={BadgeDollarSign} color="bg-amber-500" to="/fees" />
          <StatCard title="Pending Amount" value={personal.fee ? `₹${personal.fee.pendingFees}` : '₹0'} icon={TrendingUp} color="bg-danger" to="/fees" />
          <StatCard title="Recent Results" value={(personal.recentResults || []).length} icon={ClipboardList} color="bg-secondary" to="/examinations" />
          <StatCard title="Unread Notifications" value={personal.unreadNotifications || 0} icon={Bell} color="bg-accent" to="/notifications" />
        </>}
      </div>

      {/* Charts - admin/teacher mainly */}
      {(user?.role === 'admin' || user?.role === 'teacher') && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <div className="card p-4 sm:p-5">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Student Enrollment by Department</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.enrollmentByDepartment || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} interval={0} angle={-10} textAnchor="end" height={50} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#6366F1" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="card p-4 sm:p-5">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Attendance Overview</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={charts.attendanceOverview || []} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                    {(charts.attendanceOverview || []).map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="card p-4 sm:p-5 xl:col-span-2">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Monthly Student Registration</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={charts.monthlyRegistrations || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="#8B5CF6" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div className="card p-4 sm:p-5">
        <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {quickActions.map((a) => {
            const Icon = a.icon;
            return (
              <Link key={a.label} to={a.to} className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-center">
                <Icon size={20} className="text-primary" />
                <span className="text-xs font-medium text-slate-700 dark:text-slate-200">{a.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="card p-4 sm:p-5 xl:col-span-1">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-slate-900 dark:text-white">Recent Registrations</h3>
            <Link to="/students" className="text-sm text-primary hover:underline">View</Link>
          </div>
          <div className="space-y-3">
            {(recent.students || []).length === 0 && <p className="text-sm text-slate-500">No recent students.</p>}
            {(recent.students || []).map((s: any) => (
              <div key={s._id} className="flex items-center justify-between gap-3 py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">{s.fullName}</p>
                  <p className="text-xs text-slate-500 truncate">{s.studentId} · {s.department?.name || '—'}</p>
                </div>
                <span className={`badge ${s.academicStatus === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{s.academicStatus || 'Active'}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="card p-4 sm:p-5 xl:col-span-1">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-slate-900 dark:text-white">Upcoming Examinations</h3>
            <Link to="/examinations" className="text-sm text-primary hover:underline">View</Link>
          </div>
          <div className="space-y-3">
            {(recent.examinations || []).length === 0 && <p className="text-sm text-slate-500">No upcoming examinations.</p>}
            {(recent.examinations || []).map((e: any) => (
              <div key={e._id} className="py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
                <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{e.name}</p>
                <p className="text-xs text-slate-500">{e.subject} · {e.department?.name || '—'} · {new Date(e.date).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="card p-4 sm:p-5 xl:col-span-1">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-slate-900 dark:text-white">Recent Notifications</h3>
            <Link to="/notifications" className="text-sm text-primary hover:underline">View</Link>
          </div>
          <div className="space-y-3">
            {(recent.notifications || []).length === 0 && <p className="text-sm text-slate-500">No notifications.</p>}
            {(recent.notifications || []).map((n: any) => (
              <div key={n._id} className="py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
                <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{n.title}</p>
                <p className="text-xs text-slate-500 line-clamp-2">{n.message}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
