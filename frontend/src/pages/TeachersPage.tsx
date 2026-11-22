import { useEffect, useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Plus, Search, Pencil, Trash2 } from 'lucide-react';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import EmptyState from '../components/EmptyState';
import { useAuth } from '../context/AuthContext';

const emptyForm = {
  teacherId: '', fullName: '', email: '', password: 'Teacher@123', mobile: '', department: '',
  designation: '', qualification: '', experienceYears: 0, specialization: '', subjects: '', joiningDate: '',
  salary: '', address: '', status: 'Active', createUserAccount: true
};

const TeachersPage = () => {
  const { user } = useAuth();
  const canManage = user?.role === 'admin';
  const [teachers, setTeachers] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (search) params.search = search;
      if (department) params.department = department;
      const [tRes, dRes] = await Promise.all([api.get('/teachers', { params }), api.get('/departments')]);
      setTeachers(tRes.data || []);
      setDepartments(dRes.data || []);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to load teachers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);
  useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t); }, [search, department]);

  const openAdd = () => { setEditing(null); setForm({ ...emptyForm }); setModalOpen(true); };
  const openEdit = (t: any) => {
    setEditing(t);
    setForm({
      teacherId: t.teacherId || '', fullName: t.fullName || '', email: t.email || '', password: '', mobile: t.mobile || '',
      department: t.department?._id || t.department || '', designation: t.designation || '', qualification: t.qualification || '',
      experienceYears: t.experienceYears || 0, specialization: t.specialization || '', subjects: (t.subjects || []).join(', '),
      joiningDate: t.joiningDate ? String(t.joiningDate).slice(0, 10) : '', salary: t.salary ?? '', address: t.address || '',
      status: t.status || 'Active', createUserAccount: false
    });
    setModalOpen(true);
  };

  const save = async () => {
    if (!form.teacherId || !form.fullName || !form.email) { toast.error('Teacher ID, name and email are required'); return; }
    try {
      setSaving(true);
      const payload: any = { ...form, subjects: typeof form.subjects === 'string' ? form.subjects.split(',').map((s: string) => s.trim()).filter(Boolean) : form.subjects };
      if (payload.department === '') delete payload.department;
      if (payload.salary === '') delete payload.salary;
      if (editing) {
        if (!payload.password) delete payload.password;
        await api.put(`/teachers/${editing._id}`, payload);
        toast.success('Teacher updated');
      } else {
        await api.post('/teachers', payload);
        toast.success('Teacher added');
      }
      setModalOpen(false);
      load();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to save teacher');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    try { await api.delete(`/teachers/${id}`); toast.success('Teacher deleted'); setConfirmId(null); load(); }
    catch (e: any) { toast.error(e?.response?.data?.message || 'Failed to delete teacher'); }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-white">Teachers & Faculty</h1>
          <p className="text-slate-500 text-sm">Manage faculty profiles and assignments</p>
        </div>
        {canManage && <button className="btn-primary" onClick={openAdd}><Plus size={16} /> Add Teacher</button>}
      </div>
      <div className="card p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="md:col-span-2 relative"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input className="input pl-9" placeholder="Search by name, ID, email, designation..." value={search} onChange={(e) => setSearch(e.target.value)} /></div>
        <select className="input" value={department} onChange={(e) => setDepartment(e.target.value)}><option value="">All Departments</option>{departments.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}</select>
      </div>
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300"><tr>
              <th className="text-left px-4 py-3 font-semibold">Teacher</th>
              <th className="text-left px-4 py-3 font-semibold">Department</th>
              <th className="text-left px-4 py-3 font-semibold">Designation</th>
              <th className="text-left px-4 py-3 font-semibold">Subjects</th>
              <th className="text-left px-4 py-3 font-semibold">Status</th>
              <th className="text-right px-4 py-3 font-semibold">Actions</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading && <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500">Loading teachers...</td></tr>}
              {!loading && teachers.length === 0 && <tr><td colSpan={6} className="px-4 py-6"><EmptyState title="No teachers found" description="Add faculty members to get started." /></td></tr>}
              {teachers.map((t) => (
                <tr key={t._id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30">
                  <td className="px-4 py-3"><div className="font-medium text-slate-900 dark:text-white">{t.fullName}</div><div className="text-xs text-slate-500">{t.teacherId} · {t.email}</div></td>
                  <td className="px-4 py-3">{t.department?.name || '—'}</td>
                  <td className="px-4 py-3">{t.designation || '—'}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{(t.subjects || []).slice(0,2).join(', ') || '—'}{(t.subjects||[]).length>2 ? '…':''}</td>
                  <td className="px-4 py-3"><span className={`badge ${t.status === 'Active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' : 'bg-slate-100 text-slate-600'}`}>{t.status}</span></td>
                  <td className="px-4 py-3"><div className="flex justify-end gap-1">
                    {canManage && <button className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-primary" onClick={() => openEdit(t)}><Pencil size={16} /></button>}
                    {canManage && <button className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-danger" onClick={() => setConfirmId(t._id)}><Trash2 size={16} /></button>}
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Teacher' : 'Add Teacher'} size="xl"
        footer={<><button className="btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button><button className="btn-primary" onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Save Teacher'}</button></>}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div><label className="label">Teacher ID *</label><input className="input" value={form.teacherId} onChange={(e) => setForm({ ...form, teacherId: e.target.value })} /></div>
          <div><label className="label">Full Name *</label><input className="input" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} /></div>
          <div><label className="label">Email *</label><input className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          <div><label className="label">Password {editing ? '(blank to keep)' : '*'}</label><input className="input" type="text" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
          <div><label className="label">Mobile</label><input className="input" value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} /></div>
          <div><label className="label">Department</label><select className="input" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}><option value="">Select</option>{departments.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}</select></div>
          <div><label className="label">Designation</label><input className="input" value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} /></div>
          <div><label className="label">Qualification</label><input className="input" value={form.qualification} onChange={(e) => setForm({ ...form, qualification: e.target.value })} /></div>
          <div><label className="label">Experience (years)</label><input className="input" type="number" min={0} value={form.experienceYears} onChange={(e) => setForm({ ...form, experienceYears: Number(e.target.value) })} /></div>
          <div><label className="label">Specialization</label><input className="input" value={form.specialization} onChange={(e) => setForm({ ...form, specialization: e.target.value })} /></div>
          <div className="sm:col-span-2"><label className="label">Subjects (comma separated)</label><input className="input" value={form.subjects} onChange={(e) => setForm({ ...form, subjects: e.target.value })} /></div>
          <div><label className="label">Joining Date</label><input className="input" type="date" value={form.joiningDate} onChange={(e) => setForm({ ...form, joiningDate: e.target.value })} /></div>
          <div><label className="label">Salary</label><input className="input" type="number" value={form.salary} onChange={(e) => setForm({ ...form, salary: e.target.value })} /></div>
          <div><label className="label">Status</label><select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}><option>Active</option><option>Inactive</option></select></div>
          <div className="sm:col-span-2"><label className="label">Address</label><input className="input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
          {!editing && <label className="flex items-center gap-2 text-sm sm:col-span-2"><input type="checkbox" checked={!!form.createUserAccount} onChange={(e) => setForm({ ...form, createUserAccount: e.target.checked })} /> Create login account for this teacher</label>}
        </div>
      </Modal>
      <ConfirmDialog open={!!confirmId} title="Delete teacher" message="This will permanently delete the teacher record. Continue?" confirmText="Delete" onCancel={() => setConfirmId(null)} onConfirm={() => confirmId && remove(confirmId)} />
    </div>
  );
};

export default TeachersPage;
