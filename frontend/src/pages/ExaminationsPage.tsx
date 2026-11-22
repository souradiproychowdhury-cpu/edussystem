import { useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { Plus, Pencil, Trash2, ClipboardList } from 'lucide-react';

const emptyExam = { name: '', type: 'Internal', subject: '', department: '', course: '', semester: 1, date: '', startTime: '', endTime: '', totalMarks: 100, passingMarks: 40, room: '', status: 'Scheduled' };
const emptyResult = { student: '', examination: '', subject: '', marksObtained: 0, totalMarks: 100, semester: 1, remarks: '' };

const ExaminationsPage = () => {
  const { user } = useAuth();
  const canManage = user?.role === 'admin' || user?.role === 'teacher';
  const [tab, setTab] = useState<'exams' | 'results'>(canManage ? 'exams' : 'results');
  const [exams, setExams] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [examModal, setExamModal] = useState(false);
  const [examEditing, setExamEditing] = useState<any>(null);
  const [examForm, setExamForm] = useState<any>(emptyExam);
  const [resultModal, setResultModal] = useState(false);
  const [resultEditing, setResultEditing] = useState<any>(null);
  const [resultForm, setResultForm] = useState<any>(emptyResult);
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState<{ type: 'exam' | 'result'; id: string } | null>(null);

  const loadRefs = async () => {
    try {
      const [d, c] = await Promise.all([api.get('/departments'), api.get('/courses')]);
      setDepartments(d.data || []);
      setCourses(c.data || []);
    } catch {}
  };
  const loadStudents = async (dept?: string, semester?: number) => {
    if (!canManage) return;
    try {
      const params: any = { limit: 200 };
      if (dept) params.department = dept;
      if (semester) params.semester = semester;
      const res = await api.get('/students', { params });
      setStudents(res.data.students || []);
    } catch {}
  };
  const loadData = async () => {
    try {
      setLoading(true);
      if (canManage) {
        const [e, r] = await Promise.all([api.get('/examinations'), api.get('/results')]);
        setExams(e.data || []); setResults(r.data || []);
      } else {
        const studentId = (user as any)?.student?._id || (user as any)?.student;
        const r = await api.get('/results', { params: studentId ? { studentId } : {} });
        setResults(r.data || []);
        const e = await api.get('/examinations');
        setExams(e.data || []);
      }
    } catch (e: any) { toast.error(e?.response?.data?.message || 'Failed to load exam data'); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadRefs(); }, []);
  useEffect(() => { loadData(); }, [user]);
  useEffect(() => { if (canManage) loadStudents(resultForm.departmentRef, resultForm.semester); }, [canManage]);

  const filteredCourses = useMemo(() => courses.filter((c) => !examForm.department || c.department?._id === examForm.department || c.department === examForm.department), [courses, examForm.department]);

  const openAddExam = () => { setExamEditing(null); setExamForm({ ...emptyExam }); setExamModal(true); };
  const openEditExam = (e: any) => { setExamEditing(e); setExamForm({ name: e.name||'', type: e.type||'Internal', subject: e.subject||'', department: e.department?._id||e.department||'', course: e.course?._id||e.course||'', semester: e.semester||1, date: e.date?String(e.date).slice(0,10):'', startTime: e.startTime||'', endTime: e.endTime||'', totalMarks: e.totalMarks||100, passingMarks: e.passingMarks||40, room: e.room||'', status: e.status||'Scheduled' }); setExamModal(true); };
  const saveExam = async () => {
    if (!examForm.name || !examForm.subject || !examForm.date) { toast.error('Name, subject and date are required'); return; }
    try { setSaving(true); const payload = { ...examForm }; if (!payload.department) delete payload.department; if (!payload.course) delete payload.course;
      if (examEditing) { await api.put(`/examinations/${examEditing._id}`, payload); toast.success('Exam updated'); }
      else { await api.post('/examinations', payload); toast.success('Exam created'); }
      setExamModal(false); loadData();
    } catch (e: any) { toast.error(e?.response?.data?.message || 'Failed to save exam'); } finally { setSaving(false); }
  };

  const openAddResult = async (exam?: any) => {
    setResultEditing(null);
    const init: any = { ...emptyResult, examination: exam?._id || '', subject: exam?.subject || '', totalMarks: exam?.totalMarks || 100, semester: exam?.semester || 1, departmentRef: exam?.department?._id || exam?.department || '' };
    setResultForm(init);
    if (canManage) await loadStudents(init.departmentRef, init.semester);
    setResultModal(true);
  };
  const openEditResult = (r: any) => { setResultEditing(r); setResultForm({ student: r.student?._id||r.student, examination: r.examination?._id||r.examination, subject: r.subject||'', marksObtained: r.marksObtained??0, totalMarks: r.totalMarks||100, semester: r.semester||1, remarks: r.remarks||'' }); setResultModal(true); };
  const saveResult = async () => {
    if (!resultForm.student || !resultForm.examination || !resultForm.subject) { toast.error('Student, examination and subject are required'); return; }
    try { setSaving(true);
      const payload: any = { ...resultForm }; delete payload.departmentRef;
      if (resultEditing) { await api.put(`/results/${resultEditing._id}`, payload); toast.success('Result updated'); }
      else { await api.post('/results', payload); toast.success('Result saved'); }
      setResultModal(false); loadData();
    } catch (e: any) { toast.error(e?.response?.data?.message || 'Failed to save result'); } finally { setSaving(false); }
  };

  const doDelete = async () => {
    if (!confirm) return;
    try {
      if (confirm.type === 'exam') await api.delete(`/examinations/${confirm.id}`); else await api.delete(`/results/${confirm.id}`);
      toast.success('Deleted successfully'); setConfirm(null); loadData();
    } catch (e: any) { toast.error(e?.response?.data?.message || 'Delete failed'); }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div><h1 className="text-2xl font-display font-bold text-slate-900 dark:text-white">Examinations & Results</h1><p className="text-slate-500 text-sm">Manage exams and student performance</p></div>
        {canManage && <div className="flex gap-2"><button className="btn-secondary" onClick={() => openAddResult()}><ClipboardList size={16} /> Add Result</button><button className="btn-primary" onClick={openAddExam}><Plus size={16} /> Create Exam</button></div>}
      </div>

      <div className="flex gap-2">
        {canManage && <button className={`px-4 py-2 rounded-lg text-sm font-medium ${tab==='exams'?'bg-primary text-white':'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700'}`} onClick={() => setTab('exams')}>Examinations</button>}
        <button className={`px-4 py-2 rounded-lg text-sm font-medium ${tab==='results'?'bg-primary text-white':'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700'}`} onClick={() => setTab('results')}>Results</button>
      </div>

      {tab === 'exams' && canManage && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/60"><tr><th className="text-left px-4 py-3">Exam</th><th className="text-left px-4 py-3">Subject</th><th className="text-left px-4 py-3">Department</th><th className="text-left px-4 py-3">Date</th><th className="text-left px-4 py-3">Status</th><th className="text-right px-4 py-3">Actions</th></tr></thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loading && <tr><td colSpan={6} className="px-4 py-6 text-center text-slate-500">Loading...</td></tr>}
                {!loading && exams.length === 0 && <tr><td colSpan={6} className="px-4 py-6 text-center text-slate-500">No examinations created.</td></tr>}
                {exams.map((e) => (
                  <tr key={e._id}><td className="px-4 py-3 font-medium">{e.name}<div className="text-xs text-slate-500">{e.type} · Sem {e.semester}</div></td><td className="px-4 py-3">{e.subject}</td><td className="px-4 py-3">{e.department?.name || '—'}</td><td className="px-4 py-3">{new Date(e.date).toLocaleDateString()}</td><td className="px-4 py-3"><span className={`badge ${e.status==='Completed'?'bg-emerald-100 text-emerald-700':e.status==='Ongoing'?'bg-amber-100 text-amber-700':'bg-indigo-100 text-indigo-700'}`}>{e.status}</span></td>
                  <td className="px-4 py-3"><div className="flex justify-end gap-1"><button className="btn-ghost text-xs" onClick={() => openAddResult(e)}>Enter Marks</button><button className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-primary" onClick={() => openEditExam(e)}><Pencil size={16} /></button><button className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-danger" onClick={() => setConfirm({ type: 'exam', id: e._id })}><Trash2 size={16} /></button></div></td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'results' && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/60"><tr><th className="text-left px-4 py-3">Student</th><th className="text-left px-4 py-3">Exam</th><th className="text-left px-4 py-3">Subject</th><th className="text-left px-4 py-3">Marks</th><th className="text-left px-4 py-3">Grade</th><th className="text-left px-4 py-3">Result</th>{canManage && <th className="text-right px-4 py-3">Actions</th>}</tr></thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loading && <tr><td colSpan={canManage?7:6} className="px-4 py-6 text-center text-slate-500">Loading...</td></tr>}
                {!loading && results.length === 0 && <tr><td colSpan={canManage?7:6} className="px-4 py-6 text-center text-slate-500">No results available.</td></tr>}
                {results.map((r) => (
                  <tr key={r._id}><td className="px-4 py-3">{r.student?.fullName || '—'}<div className="text-xs text-slate-500">{r.student?.studentId || ''}</div></td><td className="px-4 py-3">{r.examination?.name || '—'}</td><td className="px-4 py-3">{r.subject}</td><td className="px-4 py-3">{r.marksObtained}/{r.totalMarks} ({r.percentage}%)</td><td className="px-4 py-3 font-semibold">{r.grade}</td><td className="px-4 py-3"><span className={`badge ${r.passFail==='Pass'?'bg-emerald-100 text-emerald-700':'bg-red-100 text-red-700'}`}>{r.passFail}</span></td>
                  {canManage && <td className="px-4 py-3"><div className="flex justify-end gap-1"><button className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-primary" onClick={() => openEditResult(r)}><Pencil size={16} /></button><button className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-danger" onClick={() => setConfirm({ type: 'result', id: r._id })}><Trash2 size={16} /></button></div></td>}</tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal open={examModal} onClose={() => setExamModal(false)} title={examEditing ? 'Edit Exam' : 'Create Exam'} size="lg"
        footer={<><button className="btn-ghost" onClick={() => setExamModal(false)}>Cancel</button><button className="btn-primary" onClick={saveExam} disabled={saving}>{saving?'Saving...':'Save Exam'}</button></>}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2"><label className="label">Exam Name *</label><input className="input" value={examForm.name} onChange={(e)=>setExamForm({...examForm,name:e.target.value})} /></div>
          <div><label className="label">Type</label><select className="input" value={examForm.type} onChange={(e)=>setExamForm({...examForm,type:e.target.value})}>{['Internal','Midterm','Final','Quiz','Practical'].map(t=><option key={t}>{t}</option>)}</select></div>
          <div><label className="label">Subject *</label><input className="input" value={examForm.subject} onChange={(e)=>setExamForm({...examForm,subject:e.target.value})} /></div>
          <div><label className="label">Department</label><select className="input" value={examForm.department} onChange={(e)=>setExamForm({...examForm,department:e.target.value,course:''})}><option value="">Select</option>{departments.map(d=><option key={d._id} value={d._id}>{d.name}</option>)}</select></div>
          <div><label className="label">Course</label><select className="input" value={examForm.course} onChange={(e)=>setExamForm({...examForm,course:e.target.value})}><option value="">Select</option>{filteredCourses.map(c=><option key={c._id} value={c._id}>{c.name}</option>)}</select></div>
          <div><label className="label">Semester</label><input className="input" type="number" min={1} value={examForm.semester} onChange={(e)=>setExamForm({...examForm,semester:Number(e.target.value)})} /></div>
          <div><label className="label">Date *</label><input className="input" type="date" value={examForm.date} onChange={(e)=>setExamForm({...examForm,date:e.target.value})} /></div>
          <div><label className="label">Start Time</label><input className="input" type="time" value={examForm.startTime} onChange={(e)=>setExamForm({...examForm,startTime:e.target.value})} /></div>
          <div><label className="label">End Time</label><input className="input" type="time" value={examForm.endTime} onChange={(e)=>setExamForm({...examForm,endTime:e.target.value})} /></div>
          <div><label className="label">Total Marks</label><input className="input" type="number" value={examForm.totalMarks} onChange={(e)=>setExamForm({...examForm,totalMarks:Number(e.target.value)})} /></div>
          <div><label className="label">Passing Marks</label><input className="input" type="number" value={examForm.passingMarks} onChange={(e)=>setExamForm({...examForm,passingMarks:Number(e.target.value)})} /></div>
          <div><label className="label">Room</label><input className="input" value={examForm.room} onChange={(e)=>setExamForm({...examForm,room:e.target.value})} /></div>
          <div><label className="label">Status</label><select className="input" value={examForm.status} onChange={(e)=>setExamForm({...examForm,status:e.target.value})}>{['Scheduled','Ongoing','Completed','Cancelled'].map(s=><option key={s}>{s}</option>)}</select></div>
        </div>
      </Modal>

      <Modal open={resultModal} onClose={() => setResultModal(false)} title={resultEditing ? 'Edit Result' : 'Enter Result'} size="lg"
        footer={<><button className="btn-ghost" onClick={() => setResultModal(false)}>Cancel</button><button className="btn-primary" onClick={saveResult} disabled={saving}>{saving?'Saving...':'Save Result'}</button></>}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2"><label className="label">Examination *</label><select className="input" value={resultForm.examination} onChange={(e)=>{ const ex = exams.find(x=>x._id===e.target.value); setResultForm({...resultForm, examination:e.target.value, subject: ex?.subject||resultForm.subject, totalMarks: ex?.totalMarks||resultForm.totalMarks, semester: ex?.semester||resultForm.semester}); }}><option value="">Select exam</option>{exams.map(ex=> <option key={ex._id} value={ex._id}>{ex.name} ({ex.subject})</option>)}</select></div>
          <div className="sm:col-span-2"><label className="label">Student *</label><select className="input" value={resultForm.student} onChange={(e)=>setResultForm({...resultForm,student:e.target.value})}><option value="">Select student</option>{students.map(s=> <option key={s._id} value={s._id}>{s.fullName} ({s.studentId})</option>)}</select></div>
          <div><label className="label">Subject *</label><input className="input" value={resultForm.subject} onChange={(e)=>setResultForm({...resultForm,subject:e.target.value})} /></div>
          <div><label className="label">Semester</label><input className="input" type="number" min={1} value={resultForm.semester} onChange={(e)=>setResultForm({...resultForm,semester:Number(e.target.value)})} /></div>
          <div><label className="label">Marks Obtained *</label><input className="input" type="number" min={0} value={resultForm.marksObtained} onChange={(e)=>setResultForm({...resultForm,marksObtained:Number(e.target.value)})} /></div>
          <div><label className="label">Total Marks *</label><input className="input" type="number" min={1} value={resultForm.totalMarks} onChange={(e)=>setResultForm({...resultForm,totalMarks:Number(e.target.value)})} /></div>
          <div className="sm:col-span-2"><label className="label">Remarks</label><input className="input" value={resultForm.remarks} onChange={(e)=>setResultForm({...resultForm,remarks:e.target.value})} /></div>
          <p className="text-xs text-slate-500 sm:col-span-2">Percentage, grade and pass/fail are calculated automatically by the server.</p>
        </div>
      </Modal>

      <ConfirmDialog open={!!confirm} title="Delete" message="Are you sure you want to delete this item?" confirmText="Delete" onCancel={()=>setConfirm(null)} onConfirm={doDelete} />
    </div>
  );
};

export default ExaminationsPage;
