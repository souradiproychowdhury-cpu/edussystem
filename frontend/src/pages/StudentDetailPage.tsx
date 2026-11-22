import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import LoadingSkeleton from '../components/LoadingSkeleton';
import { ArrowLeft, Mail, Phone, GraduationCap, Calendar, IndianRupee, ClipboardList } from 'lucide-react';

const StudentDetailPage = () => {
  const { id } = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/students/${id}`);
        setData(res.data);
      } catch (e: any) {
        setError(e?.response?.data?.message || 'Failed to load student details');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) return <div className="card p-6"><LoadingSkeleton lines={10} /></div>;
  if (error || !data) return <div className="card p-6 text-danger">{error || 'Student not found'}</div>;

  const { student, attendance, examResults, fees } = data;
  const summary = attendance?.summary || { total: 0, present: 0, percentage: 0 };

  return (
    <div className="space-y-5">
      <Link to="/students" className="inline-flex items-center gap-2 text-sm text-primary hover:underline"><ArrowLeft size={16} /> Back to students</Link>
      <div className="card p-5 sm:p-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-secondary text-white flex items-center justify-center text-xl font-bold">
              {student.fullName?.charAt(0) || 'S'}
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-white">{student.fullName}</h1>
              <p className="text-slate-500">{student.studentId} · {student.department?.name || 'No department'} · Sem {student.semester}</p>
              <div className="flex flex-wrap gap-2 mt-2 text-sm text-slate-600 dark:text-slate-300">
                <span className="inline-flex items-center gap-1"><Mail size={14} /> {student.email}</span>
                {student.mobile && <span className="inline-flex items-center gap-1"><Phone size={14} /> {student.mobile}</span>}
              </div>
            </div>
          </div>
          <span className={`badge ${student.academicStatus === 'Active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' : 'bg-slate-100 text-slate-600'}`}>{student.academicStatus}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4"><div className="text-xs uppercase tracking-wider text-slate-500">Attendance</div><div className="text-2xl font-bold mt-1">{summary.percentage}%</div><div className="text-xs text-slate-500 mt-1">{summary.present}/{summary.total} present</div></div>
        <div className="card p-4"><div className="text-xs uppercase tracking-wider text-slate-500">Course</div><div className="text-lg font-semibold mt-1">{student.course?.name || '—'}</div><div className="text-xs text-slate-500 mt-1">Batch {student.batch || '—'}</div></div>
        <div className="card p-4"><div className="text-xs uppercase tracking-wider text-slate-500">Results</div><div className="text-2xl font-bold mt-1">{examResults?.length || 0}</div><div className="text-xs text-slate-500 mt-1">Exam records</div></div>
        <div className="card p-4"><div className="text-xs uppercase tracking-wider text-slate-500">Fee Status</div><div className="text-lg font-semibold mt-1">{fees?.paymentStatus || 'N/A'}</div><div className="text-xs text-slate-500 mt-1">Pending ₹{fees?.pendingFees ?? 0}</div></div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="card p-5">
          <h3 className="font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2"><GraduationCap size={18} className="text-primary" /> Personal & Academic</h3>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <div><dt className="text-slate-500">Gender</dt><dd className="font-medium">{student.gender || '—'}</dd></div>
            <div><dt className="text-slate-500">DOB</dt><dd className="font-medium">{student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString() : '—'}</dd></div>
            <div><dt className="text-slate-500">Blood Group</dt><dd className="font-medium">{student.bloodGroup || '—'}</dd></div>
            <div><dt className="text-slate-500">Admission Year</dt><dd className="font-medium">{student.admissionYear || '—'}</dd></div>
            <div className="sm:col-span-2"><dt className="text-slate-500">Address</dt><dd className="font-medium">{student.address || '—'}</dd></div>
            <div><dt className="text-slate-500">Guardian</dt><dd className="font-medium">{student.guardianName || '—'} {student.guardianRelation ? `(${student.guardianRelation})` : ''}</dd></div>
            <div><dt className="text-slate-500">Guardian Contact</dt><dd className="font-medium">{student.guardianContact || '—'}</dd></div>
          </dl>
        </div>

        <div className="card p-5">
          <h3 className="font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2"><IndianRupee size={18} className="text-amber-500" /> Fee Details</h3>
          {fees ? (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Total Fees</span><span className="font-medium">₹{fees.totalFees}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Paid</span><span className="font-medium text-emerald-600">₹{fees.paidAmount}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Pending</span><span className="font-medium text-amber-600">₹{fees.pendingFees}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Due Date</span><span className="font-medium">{fees.dueDate ? new Date(fees.dueDate).toLocaleDateString() : '—'}</span></div>
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800"><span className={`badge ${fees.paymentStatus === 'Paid' ? 'bg-emerald-100 text-emerald-700' : fees.paymentStatus === 'Partial' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>{fees.paymentStatus}</span></div>
            </div>
          ) : <p className="text-sm text-slate-500">No fee record found.</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="card p-5">
          <h3 className="font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2"><Calendar size={18} className="text-emerald-500" /> Recent Attendance</h3>
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {(attendance?.records || []).slice(0, 10).length === 0 && <p className="text-sm text-slate-500">No attendance records.</p>}
            {(attendance?.records || []).slice(0, 10).map((r: any) => (
              <div key={r._id} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-sm">
                <div><div className="font-medium">{new Date(r.date).toLocaleDateString()}</div><div className="text-xs text-slate-500">{r.course?.name || r.subject || '—'}</div></div>
                <span className={`badge ${r.status === 'Present' ? 'bg-emerald-100 text-emerald-700' : r.status === 'Late' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>{r.status}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="card p-5">
          <h3 className="font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2"><ClipboardList size={18} className="text-secondary" /> Exam Results</h3>
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {(examResults || []).length === 0 && <p className="text-sm text-slate-500">No exam results.</p>}
            {(examResults || []).slice(0, 10).map((r: any) => (
              <div key={r._id} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-sm">
                <div><div className="font-medium">{r.examination?.name || 'Exam'}</div><div className="text-xs text-slate-500">{r.subject} · {r.marksObtained}/{r.totalMarks}</div></div>
                <div className="text-right"><div className="font-semibold">{r.grade}</div><div className={`text-xs ${r.passFail === 'Pass' ? 'text-emerald-600' : 'text-red-600'}`}>{r.passFail}</div></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDetailPage;
