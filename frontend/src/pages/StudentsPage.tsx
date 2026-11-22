import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Plus, Search, Pencil, Trash2, Eye } from 'lucide-react';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import EmptyState from '../components/EmptyState';
import { useAuth } from '../context/AuthContext';

const emptyForm = {
  studentId: '', fullName: '', email: '', password: 'Student@123', dateOfBirth: '', gender: 'Male',
  bloodGroup: '', mobile: '', address: '', department: '', course: '', semester: 1, batch: '',
  admissionYear: new Date().getFullYear(), academicStatus: 'Active', guardianName: '', guardianContact: '', guardianRelation: '',
  createUserAccount: true
};

const StudentsPage = () => {
  const { user } = useAuth();
  const canManage = user?.role === 'admin';
  const [students, setStudents] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [semester, setSemester] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ page: 1, pages: 1, total: 0, limit: 10 });
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      const params: any = { page, limit: 10 };
      if (search) params.search = search;
      if (department) params.department = department;
      if (semester) params.semester = semester;
      if (status) params.status = status;
      const res = await api.get('/students', { params });
      setStudents(res.data.students || []);
      setMeta({ page: res.data.page, pages: res.data.pages, total: res.data.total, limit: res.data.limit });
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const loadRefs = async () => {
    try {
      const [d, c] = await Promise.all([api.get('/departments'), api.get('/courses')]);
      setDepartments(d.data || []);
      setCourses(c.data || []);
    } catch {}
  };

  useEffect(() => { loadRefs(); }, []);
  useEffect(() => { load(); }, [page, department, semester, status]);
  useEffect(() => { const t = setTimeout(() => { setPage(1); load(); }, 350); return () => clearTimeout(t); }, [search]);

  const filteredCourses = useMemo(() => courses.filter((c) => !form.department || c.department?._id === form.department || c.department === form.department), [courses, form.department]);

  const openAdd = () => { setEditing(null); setForm({ ...emptyForm }); setModalOpen(true); };
  const openEdit = (s: any) => {
    setEditing(s);
    setForm({
      studentId: s.studentId || '', fullName: s.fullName || '', email: s.email || '', password: '', dateOfBirth: s.dateOfBirth ? String(s.dateOfBirth).slice(0, 10) : '',
      gender: s.gender || 'Male', bloodGroup: s.bloodGroup || '', mobile: s.mobile || '', address: s.address || '',
      department: s.department?._id || s.department || '', course: s.course?._id || s.course || '', semester: s.semester || 1,
      batch: s.batch || '', admissionYear: s.admissionYear || new Date().getFullYear(), academicStatus: s.academicStatus || 'Active',
      guardianName: s.guardianName || '', guardianContact: s.guardianContact || '', guardianRelation: s.guardianRelation || '', createUserAccount: false
    });
    setModalOpen(true);
  };

  const save = async () => {
    if (!form.studentId || !form.fullName || !form.email) { toast.error('Student ID, name and email are required'); return; }
    try {
      setSaving(true);
      const payload: any = { ...form };
      if (payload.department === '') delete payload.department;
      if (payload.course === '') delete payload.course;
      if (editing) {
        if (!payload.password) delete payload.password;
        await api.put(`/students/${editing._id}`, payload);
        toast.success('Student updated');
      } else {
        await api.post('/students', payload);
        toast.success('Student added');
      }
      setModalOpen(false);
      load();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to save student');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    try {
      await api.delete(`/students/${id}`);
      toast.success('Student deleted');
      setConfirmId(null);
      load();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to delete student');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-white">Student Management</h1>
          <p className="text-slate-500 text-sm">Directory, enrollment and profiles</p>
        </div>
        {canManage && <button className="btn-primary" onClick={openAdd}><Plus size={16} /> Add Student</button>}
      </div>

      <div className="card p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input className="input pl-9" placeholder="Search name, ID, email..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select className="input" value={department} onChange={(e) => { setDepartment(e.target.value); setPage(1); }}>
            <option value="">All Departments</option>
            {departments.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
          </select>
          <input className="input" placeholder="Semester" value={semester} onChange={(e) => { setSemester(e.target.value); setPage(1); }} />
          <select className="input" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
            <option value="">All Status</option>
            {['Active','Inactive','Graduated','On Leave'].map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300">
              <tr>
                <th className="text-left px-4 py-3 font-semibold">Student</th>
                <th className="text-left px-4 py-3 font-semibold">Department</th>
                <th className="text-left px-4 py-3 font-semibold">Course</th>
                <th className="text-left px-4 py-3 font-semibold">Semester</th>
                <th className="text-left px-4 py-3 font-semibold">Status</th>
                <th className="text-right px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading && <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500">Loading students...</td></tr>}
              {!loading && students.length === 0 && <tr><td colSpan={6} className="px-4 py-6"><EmptyState title="No students found" description="Try adjusting filters or add a new student." /></td></tr>}
              {students.map((s) => (
                <tr key={s._id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30">
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900 dark:text-white">{s.fullName}</div>
                    <div className="text-xs text-slate-500">{s.studentId} · {s.email}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{s.department?.name || '—'}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{s.course?.name || '—'}</td>
                  <td className="px-4 py-3">{s.semester}</td>
                  <td className="px-4 py-3"><span className={`badge ${s.academicStatus === 'Active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'}`}>{s.academicStatus}</span></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Link to={`/students/${s._id}`} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300" title="View"><Eye size={16} /></Link>
                      {canManage && <button className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-primary" onClick={() => openEdit(s)} title="Edit"><Pencil size={16} /></button>}
                      {canManage && <button className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-danger" onClick={() => setConfirmId(s._id)} title="Delete"><Trash2 size={16} /></button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 dark:border-slate-800 text-sm">
          <span className="text-slate-500">Showing page {meta.page} of {meta.pages} ({meta.total} total)</span>
          <div className="flex gap-2">
            <button className="btn-ghost" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</button>
            <button className="btn-ghost" disabled={page >= meta.pages} onClick={() => setPage((p) => p + 1)}>Next</button>
          </div>
        </div>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Student' : 'Add Student'} size="xl"
        footer={<><button className="btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button><button className="btn-primary" onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Save Student'}</button></>}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div><label className="label">Student ID *</label><input className="input" value={form.studentId} onChange={(e) => setForm({ ...form, studentId: e.target.value })} /></div>
          <div><label className="label">Full Name *</label><input className="input" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} /></div>
          <div><label className="label">Email *</label><input className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          <div><label className="label">Password {editing ? '(leave blank to keep)' : '*'}</label><input className="input" type="text" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
          <div><label className="label">Date of Birth</label><input className="input" type="date" value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} /></div>
          <div><label className="label">Gender</label><select className="input" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}><option>Male</option><option>Female</option><option>Other</option></select></div>
          <div><label className="label">Mobile</label><input className="input" value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} /></div>
          <div><label className="label">Blood Group</label><input className="input" value={form.bloodGroup} onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })} /></div>
          <div><label className="label">Department</label><select className="input" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value, course: '' })}><option value="">Select</option>{departments.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}</select></div>
          <div><label className="label">Course</label><select className="input" value={form.course} onChange={(e) => setForm({ ...form, course: e.target.value })}><option value="">Select</option>{filteredCourses.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}</select></div>
          <div><label className="label">Semester</label><input className="input" type="number" min={1} value={form.semester} onChange={(e) => setForm({ ...form, semester: Number(e.target.value) })} /></div>
          <div><label className="label">Batch</label><input className="input" value={form.batch} onChange={(e) => setForm({ ...form, batch: e.target.value })} /></div>
          <div><label className="label">Admission Year</label><input className="input" type="number" value={form.admissionYear} onChange={(e) => setForm({ ...form, admissionYear: Number(e.target.value) })} /></div>
          <div><label className="label">Status</label><select className="input" value={form.academicStatus} onChange={(e) => setForm({ ...form, academicStatus: e.target.value })}>{['Active','Inactive','Graduated','On Leave'].map(s => <option key={s}>{s}</option>)}</select></div>
          <div className="sm:col-span-2"><label className="label">Address</label><input className="input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
          <div><label className="label">Guardian Name</label><input className="input" value={form.guardianName} onChange={(e) => setForm({ ...form, guardianName: e.target.value })} /></div>
          <div><label className="label">Guardian Contact</label><input className="input" value={form.guardianContact} onChange={(e) => setForm({ ...form, guardianContact: e.target.value })} /></div>
          <div><label className="label">Guardian Relation</label><input className="input" value={form.guardianRelation} onChange={(e) => setForm({ ...form, guardianRelation: e.target.value })} /></div>
          {!editing && (
            <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 sm:col-span-2 mt-2">
              <input type="checkbox" checked={!!form.createUserAccount} onChange={(e) => setForm({ ...form, createUserAccount: e.target.checked })} /> Create login account for this student
            </label>
          )}
        </div>
      </Modal>

      <ConfirmDialog open={!!confirmId} title="Delete student" message="This will permanently delete the student record. Continue?" confirmText="Delete" onCancel={() => setConfirmId(null)} onConfirm={() => confirmId && remove(confirmId)} />
    </div>
  );
};

export default StudentsPage;
