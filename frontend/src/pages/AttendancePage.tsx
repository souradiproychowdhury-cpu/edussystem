import { useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { Save, Search } from 'lucide-react';

type Status = 'Present' | 'Absent' | 'Late';

const AttendancePage = () => {
  const { user } = useAuth();
  const canMark = user?.role === 'admin' || user?.role === 'teacher';

  const [departments, setDepartments] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [records, setRecords] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);

  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [department, setDepartment] = useState('');
  const [course, setCourse] = useState('');
  const [semester, setSemester] = useState('');
  const [subject, setSubject] = useState('');
  const [marks, setMarks] = useState<Record<string, { status: Status; remarks: string }>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const filteredCourses = useMemo(() => courses.filter((c) => !department || c.department?._id === department || c.department === department), [courses, department]);

  const loadRefs = async () => {
    try {
      const [d, c] = await Promise.all([api.get('/departments'), api.get('/courses')]);
      setDepartments(d.data || []);
      setCourses(c.data || []);
    } catch {}
  };

  const loadStudents = async () => {
    if (!canMark) return;
    try {
      setLoading(true);
      const params: any = { limit: 200 };
      if (department) params.department = department;
      if (semester) params.semester = semester;
      const res = await api.get('/students', { params });
      const list = res.data.students || [];
      setStudents(list);
      const init: any = {};
      list.forEach((s: any) => { init[s._id] = { status: 'Present', remarks: '' }; });
      setMarks(init);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const loadRecords = async () => {
    try {
      if (!canMark) {
        // student view - backend scopes to linked student for non-admin/teacher in list? actually listAttendance is open to all but doesn't auto-scope; better use summary endpoint for student
      }
      const params: any = {};
      if (date) params.date = date;
      if (department) params.department = department;
      if (course) params.course = course;
      const res = await api.get('/attendance', { params });
      setRecords(res.data || []);
    } catch {}
  };

  const loadSummaryAndAnalytics = async () => {
    try {
      if (canMark) {
        const a = await api.get('/attendance/analytics');
        setAnalytics(a.data);
      } else {
        // student: find own student id via linked user not directly exposed; load /students? no access. Use summary by calling students/me not available; instead fetch attendance list and also try summary via /attendance/summary? we need student id. Better: get profile from auth context has student link
        const studentId = (user as any)?.student?._id || (user as any)?.student;
        if (studentId) {
          const [s, r] = await Promise.all([
            api.get('/attendance/summary', { params: { studentId } }),
            api.get('/attendance', { params: { studentId } }),
          ]);
          setSummary(s.data);
          setRecords(r.data || []);
        } else {
          // fallback: no linked student - show empty
          setSummary({ summary: { total: 0, present: 0, absent: 0, late: 0, percentage: 0 }, monthly: [] });
          setRecords([]);
        }
      }
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => { loadRefs(); }, []);
  useEffect(() => { loadSummaryAndAnalytics(); }, [user]);
  useEffect(() => { if (canMark) loadRecords(); }, [date, department, course]);

  const submit = async () => {
    if (!students.length) { toast.error('Load students before marking attendance'); return; }
    try {
      setSaving(true);
      const payload = {
        date,
        subject: subject || (filteredCourses.find(c => c._id === course)?.name) || '',
        department: department || undefined,
        course: course || undefined,
        semester: semester ? Number(semester) : undefined,
        records: students.map((s) => ({ student: s._id, status: marks[s._id]?.status || 'Present', remarks: marks[s._id]?.remarks || '' })),
      };
      await api.post('/attendance', payload);
      toast.success('Attendance saved successfully');
      loadRecords();
      loadSummaryAndAnalytics();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  if (!canMark) {
    const s = summary?.summary || { total: 0, present: 0, absent: 0, late: 0, percentage: 0 };
    return (
      <div className="space-y-5">
        <div><h1 className="text-2xl font-display font-bold text-slate-900 dark:text-white">My Attendance</h1><p className="text-slate-500 text-sm">View your attendance history and percentage</p></div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="card p-4"><div className="text-xs text-slate-500">Total</div><div className="text-2xl font-bold">{s.total}</div></div>
          <div className="card p-4"><div className="text-xs text-slate-500">Present</div><div className="text-2xl font-bold text-emerald-600">{s.present}</div></div>
          <div className="card p-4"><div className="text-xs text-slate-500">Absent</div><div className="text-2xl font-bold text-red-600">{s.absent}</div></div>
          <div className="card p-4"><div className="text-xs text-slate-500">Late</div><div className="text-2xl font-bold text-amber-600">{s.late}</div></div>
          <div className="card p-4"><div className="text-xs text-slate-500">Percentage</div><div className="text-2xl font-bold text-primary">{s.percentage}%</div></div>
        </div>
        <div className="card overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 font-semibold">Attendance History</div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/60"><tr><th className="text-left px-4 py-3">Date</th><th className="text-left px-4 py-3">Subject/Course</th><th className="text-left px-4 py-3">Status</th><th className="text-left px-4 py-3">Remarks</th></tr></thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {records.length === 0 && <tr><td colSpan={4} className="px-4 py-6 text-center text-slate-500">No attendance records found.</td></tr>}
                {records.map((r: any) => (
                  <tr key={r._id}><td className="px-4 py-3">{new Date(r.date).toLocaleDateString()}</td><td className="px-4 py-3">{r.course?.name || r.subject || '—'}</td><td className="px-4 py-3"><span className={`badge ${r.status === 'Present' ? 'bg-emerald-100 text-emerald-700' : r.status === 'Late' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>{r.status}</span></td><td className="px-4 py-3 text-slate-500">{r.remarks || '—'}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  const overall = analytics || { total: 0, present: 0, absent: 0, late: 0, percentage: 0 };

  return (
    <div className="space-y-5">
      <div><h1 className="text-2xl font-display font-bold text-slate-900 dark:text-white">Attendance Management</h1><p className="text-slate-500 text-sm">Mark attendance, view history and reports</p></div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="card p-4"><div className="text-xs text-slate-500">Total Records</div><div className="text-2xl font-bold">{overall.total}</div></div>
        <div className="card p-4"><div className="text-xs text-slate-500">Present</div><div className="text-2xl font-bold text-emerald-600">{overall.present}</div></div>
        <div className="card p-4"><div className="text-xs text-slate-500">Absent</div><div className="text-2xl font-bold text-red-600">{overall.absent}</div></div>
        <div className="card p-4"><div className="text-xs text-slate-500">Late</div><div className="text-2xl font-bold text-amber-600">{overall.late}</div></div>
        <div className="card p-4"><div className="text-xs text-slate-500">Overall %</div><div className="text-2xl font-bold text-primary">{overall.percentage || 0}%</div></div>
      </div>

      <div className="card p-4 space-y-4">
        <h3 className="font-semibold text-slate-900 dark:text-white">Mark Attendance</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div><label className="label">Date</label><input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
          <div><label className="label">Department</label><select className="input" value={department} onChange={(e) => { setDepartment(e.target.value); setCourse(''); }}><option value="">Select</option>{departments.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}</select></div>
          <div><label className="label">Course</label><select className="input" value={course} onChange={(e) => setCourse(e.target.value)}><option value="">Select</option>{filteredCourses.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}</select></div>
          <div><label className="label">Semester</label><input className="input" type="number" min={1} value={semester} onChange={(e) => setSemester(e.target.value)} placeholder="e.g. 3" /></div>
          <div><label className="label">Subject/Lecture</label><input className="input" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Optional" /></div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="btn-secondary" onClick={loadStudents} disabled={loading}><Search size={16} /> {loading ? 'Loading...' : 'Load Students'}</button>
          {students.length > 0 && <button className="btn-primary" onClick={submit} disabled={saving}><Save size={16} /> {saving ? 'Saving...' : 'Save Attendance'}</button>}
          {students.length > 0 && <span className="text-sm text-slate-500 self-center">{students.length} students loaded</span>}
        </div>

        {students.length > 0 && (
          <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/60"><tr><th className="text-left px-4 py-3">Student</th><th className="text-left px-4 py-3">ID</th><th className="text-left px-4 py-3">Status</th><th className="text-left px-4 py-3">Remarks</th></tr></thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {students.map((s) => (
                  <tr key={s._id}>
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{s.fullName}</td>
                    <td className="px-4 py-3 text-slate-500">{s.studentId}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        {(['Present','Absent','Late'] as Status[]).map((st) => (
                          <button key={st} type="button" onClick={() => setMarks((m) => ({ ...m, [s._id]: { ...(m[s._id] || { remarks: '' }), status: st } }))}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${marks[s._id]?.status === st ? (st === 'Present' ? 'bg-emerald-600 text-white border-emerald-600' : st === 'Late' ? 'bg-amber-500 text-white border-amber-500' : 'bg-red-600 text-white border-red-600') : 'border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                            {st}
                          </button>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3"><input className="input" placeholder="Optional" value={marks[s._id]?.remarks || ''} onChange={(e) => setMarks((m) => ({ ...m, [s._id]: { ...(m[s._id] || { status: 'Present' }), remarks: e.target.value } }))} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 font-semibold">Attendance Records {date ? `(${new Date(date).toLocaleDateString()})` : ''}</div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/60"><tr><th className="text-left px-4 py-3">Date</th><th className="text-left px-4 py-3">Student</th><th className="text-left px-4 py-3">Course/Subject</th><th className="text-left px-4 py-3">Status</th></tr></thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {records.length === 0 && <tr><td colSpan={4} className="px-4 py-6 text-center text-slate-500">No records for selected filters.</td></tr>}
              {records.map((r: any) => (
                <tr key={r._id}><td className="px-4 py-3">{new Date(r.date).toLocaleDateString()}</td><td className="px-4 py-3">{r.student?.fullName || r.student?.studentId || '—'}</td><td className="px-4 py-3">{r.course?.name || r.subject || '—'}</td><td className="px-4 py-3"><span className={`badge ${r.status === 'Present' ? 'bg-emerald-100 text-emerald-700' : r.status === 'Late' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>{r.status}</span></td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AttendancePage;
