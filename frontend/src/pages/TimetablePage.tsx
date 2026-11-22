import { useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { Plus, Pencil, Trash2, CalendarDays } from 'lucide-react';

const days = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const emptyForm = { day: 'Monday', startTime: '09:00', endTime: '10:00', subject: '', course: '', teacher: '', department: '', semester: 1, section: 'A', room: '', type: 'Lecture' };

const TimetablePage = () => {
  const { user } = useAuth();
  const canManage = user?.role === 'admin';
  const [items, setItems] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDept, setFilterDept] = useState('');
  const [filterSem, setFilterSem] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (filterDept) params.department = filterDept;
      if (filterSem) params.semester = filterSem;
      const reqs: any[] = [api.get('/timetables', { params }), api.get('/departments'), api.get('/courses')];
      if (canManage) reqs.push(api.get('/teachers'));
      const res = await Promise.all(reqs);
      setItems(res[0].data || []); setDepartments(res[1].data || []); setCourses(res[2].data || []);
      if (canManage) setTeachers(res[3].data || []);
    } catch (e: any) { toast.error(e?.response?.data?.message || 'Failed to load timetable'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [filterDept, filterSem, user]);

  const filteredCourses = useMemo(() => courses.filter((c) => !form.department || c.department?._id === form.department || c.department === form.department), [courses, form.department]);

  const openAdd = () => { setEditing(null); setForm({ ...emptyForm }); setModalOpen(true); };
  const openEdit = (t: any) => { setEditing(t); setForm({ day: t.day, startTime: t.startTime, endTime: t.endTime, subject: t.subject||'', course: t.course?._id||t.course||'', teacher: t.teacher?._id||t.teacher||'', department: t.department?._id||t.department||'', semester: t.semester||1, section: t.section||'A', room: t.room||'', type: t.type||'Lecture' }); setModalOpen(true); };

  const save = async () => {
    if (!form.subject) { toast.error('Subject is required'); return; }
    try { setSaving(true); const payload = { ...form }; if (!payload.course) delete payload.course; if (!payload.teacher) delete payload.teacher; if (!payload.department) delete payload.department;
      if (editing) { await api.put(`/timetables/${editing._id}`, payload); toast.success('Timetable updated'); }
      else { await api.post('/timetables', payload); toast.success('Timetable entry created'); }
      setModalOpen(false); load();
    } catch (e: any) { toast.error(e?.response?.data?.message || 'Failed to save timetable'); } finally { setSaving(false); }
  };
  const remove = async (id: string) => { try { await api.delete(`/timetables/${id}`); toast.success('Entry deleted'); setConfirmId(null); load(); } catch (e: any) { toast.error(e?.response?.data?.message || 'Delete failed'); } };

  const byDay = useMemo(() => {
    const map: Record<string, any[]> = {}; days.forEach(d => map[d] = []);
    items.forEach(i => { if (map[i.day]) map[i.day].push(i); });
    days.forEach(d => map[d].sort((a,b) => (a.startTime||'').localeCompare(b.startTime||'')));
    return map;
  }, [items]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div><h1 className="text-2xl font-display font-bold text-slate-900 dark:text-white">Timetable</h1><p className="text-slate-500 text-sm">Weekly schedule and class planning</p></div>
        {canManage && <button className="btn-primary" onClick={openAdd}><Plus size={16} /> Add Schedule</button>}
      </div>

      <div className="card p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <select className="input" value={filterDept} onChange={(e)=>setFilterDept(e.target.value)}><option value="">All Departments</option>{departments.map(d=> <option key={d._id} value={d._id}>{d.name}</option>)}</select>
        <input className="input" placeholder="Semester (e.g. 3)" value={filterSem} onChange={(e)=>setFilterSem(e.target.value)} />
        <div className="flex items-center text-sm text-slate-500"><CalendarDays size={16} className="mr-2" /> {items.length} scheduled entries</div>
      </div>

      {loading ? <div className="card p-6 text-slate-500">Loading timetable...</div> : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {days.map(day => (
            <div key={day} className="card overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 font-semibold flex items-center justify-between">
                <span>{day}</span><span className="badge bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">{byDay[day].length}</span>
              </div>
              <div className="p-3 space-y-2 min-h-[120px]">
                {byDay[day].length === 0 && <p className="text-sm text-slate-400">No classes scheduled.</p>}
                {byDay[day].map(entry => (
                  <div key={entry._id} className="rounded-xl border border-slate-200 dark:border-slate-700 p-3 bg-slate-50/60 dark:bg-slate-800/40">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-medium text-slate-900 dark:text-white text-sm">{entry.subject}</div>
                        <div className="text-xs text-slate-500">{entry.startTime} - {entry.endTime} · {entry.room || 'No room'}</div>
                        <div className="text-xs text-slate-500 mt-1">{entry.course?.name || ''} {entry.teacher?.fullName ? `· ${entry.teacher.fullName}` : ''}</div>
                        <div className="flex gap-1 mt-2"><span className="badge bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">{entry.type || 'Lecture'}</span>{entry.section && <span className="badge bg-slate-100 text-slate-600">Sec {entry.section}</span>}</div>
                      </div>
                      {canManage && <div className="flex flex-col gap-1">
                        <button className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-primary" onClick={() => openEdit(entry)}><Pencil size={14} /></button>
                        <button className="p-1.5 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-danger" onClick={() => setConfirmId(entry._id)}><Trash2 size={14} /></button>
                      </div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Schedule' : 'Add Schedule'} size="lg"
        footer={<><button className="btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button><button className="btn-primary" onClick={save} disabled={saving}>{saving?'Saving...':'Save'}</button></>}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div><label className="label">Day</label><select className="input" value={form.day} onChange={(e)=>setForm({...form,day:e.target.value})}>{days.map(d=> <option key={d}>{d}</option>)}</select></div>
          <div><label className="label">Type</label><select className="input" value={form.type} onChange={(e)=>setForm({...form,type:e.target.value})}>{['Lecture','Lab','Tutorial','Seminar'].map(t=> <option key={t}>{t}</option>)}</select></div>
          <div><label className="label">Start Time</label><input className="input" type="time" value={form.startTime} onChange={(e)=>setForm({...form,startTime:e.target.value})} /></div>
          <div><label className="label">End Time</label><input className="input" type="time" value={form.endTime} onChange={(e)=>setForm({...form,endTime:e.target.value})} /></div>
          <div className="sm:col-span-2"><label className="label">Subject *</label><input className="input" value={form.subject} onChange={(e)=>setForm({...form,subject:e.target.value})} /></div>
          <div><label className="label">Department</label><select className="input" value={form.department} onChange={(e)=>setForm({...form,department:e.target.value,course:''})}><option value="">Select</option>{departments.map(d=> <option key={d._id} value={d._id}>{d.name}</option>)}</select></div>
          <div><label className="label">Course</label><select className="input" value={form.course} onChange={(e)=>setForm({...form,course:e.target.value})}><option value="">Select</option>{filteredCourses.map(c=> <option key={c._id} value={c._id}>{c.name}</option>)}</select></div>
          <div><label className="label">Teacher</label><select className="input" value={form.teacher} onChange={(e)=>setForm({...form,teacher:e.target.value})}><option value="">Select</option>{teachers.map(t=> <option key={t._id} value={t._id}>{t.fullName}</option>)}</select></div>
          <div><label className="label">Semester</label><input className="input" type="number" min={1} value={form.semester} onChange={(e)=>setForm({...form,semester:Number(e.target.value)})} /></div>
          <div><label className="label">Section</label><input className="input" value={form.section} onChange={(e)=>setForm({...form,section:e.target.value})} /></div>
          <div><label className="label">Room</label><input className="input" value={form.room} onChange={(e)=>setForm({...form,room:e.target.value})} /></div>
        </div>
      </Modal>

      <ConfirmDialog open={!!confirmId} title="Delete schedule" message="Delete this timetable entry?" confirmText="Delete" onCancel={()=>setConfirmId(null)} onConfirm={() => confirmId && remove(confirmId)} />
    </div>
  );
};

export default TimetablePage;
