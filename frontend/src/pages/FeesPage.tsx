import { useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { Plus, CreditCard, Printer, Pencil, Trash2 } from 'lucide-react';

const emptyFee = { student: '', semester: 1, academicYear: '2024-2025', totalFees: 0, paidAmount: 0, dueDate: '', paymentStatus: 'Unpaid', notes: '' };

const FeesPage = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [fees, setFees] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterUnpaid, setFilterUnpaid] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>(emptyFee);
  const [payModal, setPayModal] = useState<any>(null);
  const [payForm, setPayForm] = useState({ amount: 0, method: 'Cash', reference: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<any>(null);

  const load = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (isAdmin && filterUnpaid) params.status = 'Unpaid';
      if (!isAdmin) {
        const studentId = (user as any)?.student?._id || (user as any)?.student;
        if (studentId) params.studentId = studentId;
      }
      const [f, s] = await Promise.all([api.get('/fees', { params }), isAdmin ? api.get('/students', { params: { limit: 200 } }) : Promise.resolve({ data: { students: [] } })]);
      setFees(f.data || []);
      if (isAdmin) setStudents(s.data.students || []);
    } catch (e: any) { toast.error(e?.response?.data?.message || 'Failed to load fees'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [user, filterUnpaid]);

  const openAdd = () => { setEditing(null); setForm({ ...emptyFee }); setModalOpen(true); };
  const openEdit = (f: any) => { setEditing(f); setForm({ student: f.student?._id||f.student, semester: f.semester||1, academicYear: f.academicYear||'2024-2025', totalFees: f.totalFees||0, paidAmount: f.paidAmount||0, dueDate: f.dueDate?String(f.dueDate).slice(0,10):'', paymentStatus: f.paymentStatus||'Unpaid', notes: f.notes||'' }); setModalOpen(true); };
  const save = async () => {
    if (!form.student) { toast.error('Student is required'); return; }
    try { setSaving(true);
      if (editing) { await api.put(`/fees/${editing._id}`, form); toast.success('Fee record updated'); }
      else { await api.post('/fees', form); toast.success('Fee record created'); }
      setModalOpen(false); load();
    } catch (e: any) { toast.error(e?.response?.data?.message || 'Failed to save fee record'); } finally { setSaving(false); }
  };
  const remove = async (id: string) => { try { await api.delete(`/fees/${id}`); toast.success('Fee record deleted'); setConfirmId(null); load(); } catch (e: any) { toast.error(e?.response?.data?.message || 'Delete failed'); } };

  const submitPayment = async () => {
    if (!payModal || payForm.amount <= 0) { toast.error('Enter a valid amount'); return; }
    try { setSaving(true); await api.post(`/fees/${payModal._id}/payments`, payForm); toast.success('Payment recorded'); setPayModal(null); setPayForm({ amount: 0, method: 'Cash', reference: '', notes: '' }); load(); }
    catch (e: any) { toast.error(e?.response?.data?.message || 'Payment failed'); } finally { setSaving(false); }
  };

  const viewReceipt = async (fee: any, receiptId?: string) => {
    try {
      const rid = receiptId || fee.paymentHistory?.[fee.paymentHistory.length - 1]?.receiptNumber;
      if (!rid) { toast.error('No receipt available yet'); return; }
      const res = await api.get(`/fees/${fee._id}/receipts/${rid}`);
      setReceipt(res.data);
    } catch (e: any) { toast.error(e?.response?.data?.message || 'Failed to load receipt'); }
  };

  const printReceipt = () => {
    if (!receipt) return;
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`<html><head><title>Fee Receipt ${receipt.receipt?.receiptNumber || ''}</title><style>body{font-family:Arial,sans-serif;padding:24px;color:#111}h1{margin:0 0 4px}table{width:100%;border-collapse:collapse;margin-top:16px}td,th{border:1px solid #ddd;padding:8px;text-align:left}.muted{color:#666;font-size:12px}</style></head><body>
      <h1>EduPulse University SMS</h1><div class="muted">Fee Payment Receipt</div><hr/>
      <p><strong>Receipt No:</strong> ${receipt.receipt?.receiptNumber || ''}<br/>
      <strong>Date:</strong> ${receipt.receipt?.paidAt ? new Date(receipt.receipt.paidAt).toLocaleString() : ''}<br/>
      <strong>Student:</strong> ${receipt.student?.fullName || ''} (${receipt.student?.studentId || ''})<br/>
      <strong>Department:</strong> ${receipt.student?.department?.name || ''}</p>
      <table><tr><th>Semester</th><th>Academic Year</th><th>Total</th><th>Paid</th><th>Pending</th><th>Status</th></tr>
      <tr><td>${receipt.fee?.semester || ''}</td><td>${receipt.fee?.academicYear || ''}</td><td>₹${receipt.fee?.totalFees}</td><td>₹${receipt.fee?.paidAmount}</td><td>₹${receipt.fee?.pendingFees}</td><td>${receipt.fee?.paymentStatus || ''}</td></tr></table>
      <table><tr><th>Amount</th><th>Method</th><th>Reference</th><th>Notes</th></tr>
      <tr><td>₹${receipt.receipt?.amount}</td><td>${receipt.receipt?.method || ''}</td><td>${receipt.receipt?.reference || '-'}</td><td>${receipt.receipt?.notes || '-'}</td></tr></table>
      <p class="muted" style="margin-top:24px">This is a system-generated receipt.</p>
      <script>window.print()</script></body></html>`);
    w.document.close();
  };

  const totals = useMemo(() => ({
    total: fees.reduce((s, f) => s + (f.totalFees || 0), 0),
    paid: fees.reduce((s, f) => s + (f.paidAmount || 0), 0),
    pending: fees.reduce((s, f) => s + (f.pendingFees || 0), 0),
  }), [fees]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div><h1 className="text-2xl font-display font-bold text-slate-900 dark:text-white">Fees & Payments</h1><p className="text-slate-500 text-sm">Manage fee records, payments and receipts</p></div>
        {isAdmin && <button className="btn-primary" onClick={openAdd}><Plus size={16} /> Add Fee Record</button>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-4"><div className="text-xs text-slate-500">Total Fees</div><div className="text-2xl font-bold">₹{totals.total}</div></div>
        <div className="card p-4"><div className="text-xs text-slate-500">Collected</div><div className="text-2xl font-bold text-emerald-600">₹{totals.paid}</div></div>
        <div className="card p-4"><div className="text-xs text-slate-500">Pending</div><div className="text-2xl font-bold text-amber-600">₹{totals.pending}</div></div>
      </div>

      {isAdmin && <div className="card p-4 flex items-center gap-3"><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={filterUnpaid} onChange={(e)=>setFilterUnpaid(e.target.checked)} /> Show only unpaid/partial records</label></div>}

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/60"><tr><th className="text-left px-4 py-3">Student</th><th className="text-left px-4 py-3">Semester</th><th className="text-left px-4 py-3">Total</th><th className="text-left px-4 py-3">Paid</th><th className="text-left px-4 py-3">Pending</th><th className="text-left px-4 py-3">Status</th><th className="text-right px-4 py-3">Actions</th></tr></thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading && <tr><td colSpan={7} className="px-4 py-6 text-center text-slate-500">Loading...</td></tr>}
              {!loading && fees.length === 0 && <tr><td colSpan={7} className="px-4 py-6 text-center text-slate-500">No fee records found.</td></tr>}
              {fees.map((f) => (
                <tr key={f._id}>
                  <td className="px-4 py-3 font-medium">{f.student?.fullName || '—'}<div className="text-xs text-slate-500">{f.student?.studentId || ''}</div></td>
                  <td className="px-4 py-3">Sem {f.semester} · {f.academicYear}</td>
                  <td className="px-4 py-3">₹{f.totalFees}</td>
                  <td className="px-4 py-3 text-emerald-600">₹{f.paidAmount}</td>
                  <td className="px-4 py-3 text-amber-600">₹{f.pendingFees}</td>
                  <td className="px-4 py-3"><span className={`badge ${f.paymentStatus==='Paid'?'bg-emerald-100 text-emerald-700':f.paymentStatus==='Partial'?'bg-amber-100 text-amber-700':'bg-red-100 text-red-700'}`}>{f.paymentStatus}</span></td>
                  <td className="px-4 py-3"><div className="flex justify-end gap-1 flex-wrap">
                    {isAdmin && f.paymentStatus !== 'Paid' && <button className="btn-ghost text-xs" onClick={() => { setPayModal(f); setPayForm({ amount: f.pendingFees || 0, method: 'Cash', reference: '', notes: '' }); }}><CreditCard size={14} /> Pay</button>}
                    {(f.paymentHistory||[]).length > 0 && <button className="btn-ghost text-xs" onClick={() => viewReceipt(f)}><Printer size={14} /> Receipt</button>}
                    {isAdmin && <button className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-primary" onClick={() => openEdit(f)}><Pencil size={16} /></button>}
                    {isAdmin && <button className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-danger" onClick={() => setConfirmId(f._id)}><Trash2 size={16} /></button>}
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Fee Record' : 'Add Fee Record'}
        footer={<><button className="btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button><button className="btn-primary" onClick={save} disabled={saving}>{saving?'Saving...':'Save'}</button></>}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2"><label className="label">Student *</label><select className="input" value={form.student} onChange={(e)=>setForm({...form,student:e.target.value})}><option value="">Select student</option>{students.map(s=> <option key={s._id} value={s._id}>{s.fullName} ({s.studentId})</option>)}</select></div>
          <div><label className="label">Semester</label><input className="input" type="number" min={1} value={form.semester} onChange={(e)=>setForm({...form,semester:Number(e.target.value)})} /></div>
          <div><label className="label">Academic Year</label><input className="input" value={form.academicYear} onChange={(e)=>setForm({...form,academicYear:e.target.value})} /></div>
          <div><label className="label">Total Fees (₹)</label><input className="input" type="number" min={0} value={form.totalFees} onChange={(e)=>setForm({...form,totalFees:Number(e.target.value)})} /></div>
          <div><label className="label">Paid Amount (₹)</label><input className="input" type="number" min={0} value={form.paidAmount} onChange={(e)=>setForm({...form,paidAmount:Number(e.target.value)})} /></div>
          <div><label className="label">Due Date</label><input className="input" type="date" value={form.dueDate} onChange={(e)=>setForm({...form,dueDate:e.target.value})} /></div>
          <div><label className="label">Status</label><select className="input" value={form.paymentStatus} onChange={(e)=>setForm({...form,paymentStatus:e.target.value})}>{['Unpaid','Partial','Paid'].map(s=><option key={s}>{s}</option>)}</select></div>
          <div className="sm:col-span-2"><label className="label">Notes</label><input className="input" value={form.notes} onChange={(e)=>setForm({...form,notes:e.target.value})} /></div>
        </div>
      </Modal>

      <Modal open={!!payModal} onClose={() => setPayModal(null)} title="Record Payment"
        footer={<><button className="btn-ghost" onClick={() => setPayModal(null)}>Cancel</button><button className="btn-primary" onClick={submitPayment} disabled={saving}>{saving?'Processing...':'Record Payment'}</button></>}>
        <div className="space-y-3">
          <p className="text-sm text-slate-600 dark:text-slate-300">Student: <strong>{payModal?.student?.fullName}</strong> · Pending: <strong>₹{payModal?.pendingFees}</strong></p>
          <div><label className="label">Amount (₹)</label><input className="input" type="number" min={1} value={payForm.amount} onChange={(e)=>setPayForm({...payForm,amount:Number(e.target.value)})} /></div>
          <div><label className="label">Method</label><select className="input" value={payForm.method} onChange={(e)=>setPayForm({...payForm,method:e.target.value})}>{['Cash','Card','UPI','Bank Transfer','Online'].map(m=><option key={m}>{m}</option>)}</select></div>
          <div><label className="label">Reference</label><input className="input" value={payForm.reference} onChange={(e)=>setPayForm({...payForm,reference:e.target.value})} /></div>
          <div><label className="label">Notes</label><input className="input" value={payForm.notes} onChange={(e)=>setPayForm({...payForm,notes:e.target.value})} /></div>
        </div>
      </Modal>

      <Modal open={!!receipt} onClose={() => setReceipt(null)} title="Fee Receipt" size="lg"
        footer={<><button className="btn-ghost" onClick={() => setReceipt(null)}>Close</button><button className="btn-primary" onClick={printReceipt}><Printer size={16} /> Print / Download</button></>}>
        {receipt && (
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-slate-500">Receipt No</span><span className="font-semibold">{receipt.receipt?.receiptNumber}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Date</span><span>{receipt.receipt?.paidAt ? new Date(receipt.receipt.paidAt).toLocaleString() : ''}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Student</span><span>{receipt.student?.fullName} ({receipt.student?.studentId})</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Amount</span><span className="font-semibold text-emerald-600">₹{receipt.receipt?.amount}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Method</span><span>{receipt.receipt?.method}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Fee Status</span><span>{receipt.fee?.paymentStatus} (Pending ₹{receipt.fee?.pendingFees})</span></div>
          </div>
        )}
      </Modal>

      <ConfirmDialog open={!!confirmId} title="Delete fee record" message="Delete this fee record?" confirmText="Delete" onCancel={()=>setConfirmId(null)} onConfirm={() => confirmId && remove(confirmId)} />
    </div>
  );
};

export default FeesPage;
