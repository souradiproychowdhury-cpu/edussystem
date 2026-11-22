import { useEffect, useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import EmptyState from '../components/EmptyState';

const emptyForm = { name: '', code: '', department: '', semester: 1, credits: 3, type: 'Core', description: '', teacher: '', isActive: true };

const CoursesPage = () => {
  const [courses, setCourses] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [filterDept, setFilterDept] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (filterDept) params.department = filterDept;
      const [c, d, t] = await Promise.all([api.get('/courses', { params }), api.get('/departments'), api.get('/teachers')]);
      setCourses(c.data || []);
      setDepartments(d.data || []);
      setTeachers(t.data || []);
    } catch (e: any) { toast.error(e?.response?.data?.message || 'Failed to load courses'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [filterDept]);

  const openAdd = () => { setEditing(null); setForm({ ...emptyForm }); setModalOpen(true); };
  const openEdit = (c: any) => { setEditing(c); setForm({ name: c.name || '', code: c.code || '', department: c.department?._id || c.department || '', semester: c.semester || 1, credits: c.credits || 3, type: c.type || 'Core', description: c.description || '', teacher: c.teacher?._id || c.teacher || '', isActive: c.isActive ?? true }); setModalOpen(true); };

  const save = async () => {
    if (!form.name || !form.code) { toast.error('Name and code are required'); return; }
    try {
      setSaving(true);
      const payload = { ...form };
      if (!payload.department) delete payload.department;
      if (!payload.teacher) delete payload.teacher;
      if (editing) { await api.put(`/courses/${editing._id}`, payload); toast.success('Course updated'); }
      else { await api.post('/courses', payload); toast.success('Course added'); }
      setModalOpen(false); load();
    } catch (e: any) { toast.error(e?.response?.data?.message || 'Failed to save course'); }
    finally { setSaving(false); }
  };

  const remove = async (id: string) => {
    try { await api.delete(`/courses/${id}`); toast.success('Course deleted'); setConfirmId(null); load(); }
    catch (e: any) { toast.error(e?.response?.data?.message || 'Failed to delete course'); }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div><h1 className="text-2xl font-display font-bold text-slate-900 dark:text-white">Courses</h1><p className="text-slate-500 text-sm">Manage courses, assignments and curriculum</p></div>
        <button className="btn-primary" onClick={openAdd}><Plus size={16} /> Add Course</button>
      </div>
      <div className="card p-4">
        <select className="input max-w-sm" value={filterDept} onChange={(e) => setFilterDept(e.target.value)}><option value="">All Departments</option>{departments.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}</select>
      </div>
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300"><tr>
              <th className="text-left px-4 py-3 font-semibold">Course</th>
              <th className="text-left px-4 py-3 font-semibold">Department</th>
              <th className="text-left px-4 py-3 font-semibold">Semester</th>
              <th className="text-left px-4 py-3 font-semibold">Credits</th>
              <th className="text-left px-4 py-3 font-semibold">Teacher</th>
              <th className="text-right px-4 py-3 font-semibold">Actions</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading && <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500">Loading courses...</td></tr>}
              {!loading && courses.length === 0 && <tr><td colSpan={6} className="px-4 py-6"><EmptyState title="No courses found" description="Create courses and assign them to departments." /></td></tr>}
              {courses.map((c) => (
                <tr key={c._id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30">
                  <td className="px-4 py-3"><div className="font-medium text-slate-900 dark:text-white">{c.name}</div><div className="text-xs text-slate-500">{c.code} · {c.type}</div></td>
                  <td className="px-4 py-3">{c.department?.name || '—'}</td>
                  <td className="px-4 py-3">{c.semester}</td>
                  <td className="px-4 py-3">{c.credits}</td>
                  <td className="px-4 py-3">{c.teacher?.fullName || '—'}</td>
                  <td className="px-4 py-3"><div className="flex justify-end gap-1">
                    <button className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-primary" onClick={() => openEdit(c)}><Pencil size={16} /></button>
                    <button className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-danger" onClick={() => setConfirmId(c._id)}><Trash2 size={16} /></button>
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Course' : 'Add Course'} size="lg"
        footer={<><button className="btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button><button className="btn-primary" onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Save Course'}</button></>}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2"><label className="label">Course Name *</label><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><label className="label">Course Code *</label><input className="input" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} /></div>
          <div><label className="label">Department</label><select className="input" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}><option value="">Select</option>{departments.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}</select></div>
          <div><label className="label">Semester</label><input className="input" type="number" min={1} value={form.semester} onChange={(e) => setForm({ ...form, semester: Number(e.target.value) })} /></div>
          <div><label className="label">Credits</label><input className="input" type="number" min={0} value={form.credits} onChange={(e) => setForm({ ...form, credits: Number(e.target.value) })} /></div>
          <div><label className="label">Type</label><select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>{['Core','Elective','Lab','Seminar'].map(t => <option key={t}>{t}</option>)}</select></div>
          <div><label className="label">Assigned Teacher</label><select className="input" value={form.teacher} onChange={(e) => setForm({ ...form, teacher: e.target.value })}><option value="">None</option>{teachers.map((t) => <option key={t._id} value={t._id}>{t.fullName}</option>)}</select></div>
          <div className="sm:col-span-2"><label className="label">Description</label><textarea className="input min-h-[80px]" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <label className="flex items-center gap-2 text-sm sm:col-span-2"><input type="checkbox" checked={!!form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} /> Active course</label>
        </div>
      </Modal>
      <ConfirmDialog open={!!confirmId} title="Delete course" message="This will permanently delete the course. Continue?" confirmText="Delete" onCancel={() => setConfirmId(null)} onConfirm={() => confirmId && remove(confirmId)} />
    </div>
  );
};

export default CoursesPage;
