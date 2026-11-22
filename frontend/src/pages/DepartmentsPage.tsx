import { useEffect, useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, Users } from 'lucide-react';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import EmptyState from '../components/EmptyState';

const emptyForm = { name: '', code: '', description: '', headOfDepartment: '' };

const DepartmentsPage = () => {
  const [departments, setDepartments] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [studentsByDept, setStudentsByDept] = useState<Record<string, any[]>>({});
  const [viewingDept, setViewingDept] = useState<any>(null);

  const load = async () => {
    try {
      setLoading(true);
      const [d, t] = await Promise.all([api.get('/departments'), api.get('/teachers')]);
      setDepartments(d.data || []);
      setTeachers(t.data || []);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to load departments');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const openAdd = () => { setEditing(null); setForm({ ...emptyForm }); setModalOpen(true); };
  const openEdit = (d: any) => { setEditing(d); setForm({ name: d.name || '', code: d.code || '', description: d.description || '', headOfDepartment: d.headOfDepartment?._id || d.headOfDepartment || '' }); setModalOpen(true); };

  const save = async () => {
    if (!form.name || !form.code) { toast.error('Name and code are required'); return; }
    try {
      setSaving(true);
      const payload = { ...form };
      if (!payload.headOfDepartment) delete payload.headOfDepartment;
      if (editing) { await api.put(`/departments/${editing._id}`, payload); toast.success('Department updated'); }
      else { await api.post('/departments', payload); toast.success('Department added'); }
      setModalOpen(false); load();
    } catch (e: any) { toast.error(e?.response?.data?.message || 'Failed to save department'); }
    finally { setSaving(false); }
  };

  const remove = async (id: string) => {
    try { await api.delete(`/departments/${id}`); toast.success('Department deleted'); setConfirmId(null); load(); }
    catch (e: any) { toast.error(e?.response?.data?.message || 'Failed to delete department'); }
  };

  const viewStudents = async (dept: any) => {
    setViewingDept(dept);
    try {
      if (!studentsByDept[dept._id]) {
        const res = await api.get('/students', { params: { department: dept._id, limit: 100 } });
        setStudentsByDept((p) => ({ ...p, [dept._id]: res.data.students || [] }));
      }
    } catch { toast.error('Failed to load department students'); }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div><h1 className="text-2xl font-display font-bold text-slate-900 dark:text-white">Departments</h1><p className="text-slate-500 text-sm">Manage departments and view department-wise students</p></div>
        <button className="btn-primary" onClick={openAdd}><Plus size={16} /> Add Department</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {loading && <div className="card p-6 text-slate-500">Loading departments...</div>}
        {!loading && departments.length === 0 && <div className="md:col-span-2 xl:col-span-3"><EmptyState title="No departments" description="Create a department to organize courses and students." /></div>}
        {departments.map((d) => (
          <div key={d._id} className="card p-5 flex flex-col gap-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-slate-900 dark:text-white">{d.name}</h3>
                  <span className="badge bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">{d.code}</span>
                </div>
                <p className="text-sm text-slate-500 mt-1 line-clamp-2">{d.description || 'No description'}</p>
              </div>
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-300"><span className="font-medium">HOD:</span> {d.headOfDepartment?.fullName || '—'}</div>
            <div className="flex items-center gap-2 mt-auto pt-2">
              <button className="btn-ghost text-sm" onClick={() => viewStudents(d)}><Users size={14} /> Students</button>
              <button className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-primary ml-auto" onClick={() => openEdit(d)}><Pencil size={16} /></button>
              <button className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-danger" onClick={() => setConfirmId(d._id)}><Trash2 size={16} /></button>
            </div>
          </div>
        ))}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Department' : 'Add Department'}
        footer={<><button className="btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button><button className="btn-primary" onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button></>}>
        <div className="space-y-3">
          <div><label className="label">Name *</label><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><label className="label">Code *</label><input className="input" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} /></div>
          <div><label className="label">Head of Department</label><select className="input" value={form.headOfDepartment} onChange={(e) => setForm({ ...form, headOfDepartment: e.target.value })}><option value="">Select teacher</option>{teachers.map((t) => <option key={t._id} value={t._id}>{t.fullName}</option>)}</select></div>
          <div><label className="label">Description</label><textarea className="input min-h-[90px]" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
        </div>
      </Modal>

      <Modal open={!!viewingDept} onClose={() => setViewingDept(null)} title={viewingDept ? `${viewingDept.name} — Students` : 'Department Students'} size="lg">
        <div className="space-y-2">
          {!(studentsByDept[viewingDept?._id] || []).length && <p className="text-sm text-slate-500">No students found in this department.</p>}
          {(studentsByDept[viewingDept?._id] || []).map((s) => (
            <div key={s._id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
              <div><div className="font-medium text-slate-900 dark:text-white text-sm">{s.fullName}</div><div className="text-xs text-slate-500">{s.studentId} · Sem {s.semester} · {s.course?.name || 'No course'}</div></div>
              <span className={`badge ${s.academicStatus === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{s.academicStatus}</span>
            </div>
          ))}
        </div>
      </Modal>

      <ConfirmDialog open={!!confirmId} title="Delete department" message="This will permanently delete the department. Continue?" confirmText="Delete" onCancel={() => setConfirmId(null)} onConfirm={() => confirmId && remove(confirmId)} />
    </div>
  );
};

export default DepartmentsPage;
