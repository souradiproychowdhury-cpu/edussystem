import { useEffect, useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { Bell, Plus, CheckCheck, Trash2 } from 'lucide-react';

const emptyForm = { title: '', message: '', type: 'Info', audience: 'all', targetRole: '', isActive: true };

const NotificationsPage = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<any>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      const res = await api.get('/notifications');
      setItems(res.data || []);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!form.title || !form.message) { toast.error('Title and message are required'); return; }
    try {
      setSaving(true);
      const payload: any = { ...form, createdBy: user?._id };
      if (payload.audience !== 'role') delete payload.targetRole;
      await api.post('/notifications', payload);
      toast.success('Notification created');
      setModalOpen(false);
      setForm({ ...emptyForm });
      load();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to create notification');
    } finally {
      setSaving(false);
    }
  };

  const markRead = async (id: string) => {
    try { await api.put(`/notifications/${id}/read`); setItems((prev) => prev.map((n) => n._id === id ? { ...n, isRead: true } : n)); }
    catch { toast.error('Failed to mark as read'); }
  };
  const markAll = async () => {
    try { await api.put('/notifications/read-all'); setItems((prev) => prev.map((n) => ({ ...n, isRead: true }))); toast.success('All marked as read'); }
    catch { toast.error('Failed to mark all as read'); }
  };
  const remove = async (id: string) => {
    try { await api.delete(`/notifications/${id}`); toast.success('Notification deleted'); setConfirmId(null); setItems((prev) => prev.filter((n) => n._id !== id)); }
    catch (e: any) { toast.error(e?.response?.data?.message || 'Failed to delete notification'); }
  };

  const unread = items.filter((n) => !n.isRead).length;

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-white">Notifications</h1>
          <p className="text-slate-500 text-sm">Announcements and alerts {unread > 0 ? `· ${unread} unread` : ''}</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-ghost" onClick={markAll}><CheckCheck size={16} /> Mark all read</button>
          {isAdmin && <button className="btn-primary" onClick={() => setModalOpen(true)}><Plus size={16} /> New Notification</button>}
        </div>
      </div>

      <div className="space-y-3">
        {loading && <div className="card p-6 text-slate-500">Loading notifications...</div>}
        {!loading && items.length === 0 && <div className="card p-8 text-center text-slate-500"><Bell className="mx-auto mb-2 text-slate-400" /> No notifications yet.</div>}
        {items.map((n) => (
          <div key={n._id} className={`card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-start gap-3 ${!n.isRead ? 'ring-1 ring-primary/30' : ''}`}>
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 ${n.type === 'Alert' ? 'bg-red-100 text-red-600' : n.type === 'Announcement' ? 'bg-amber-100 text-amber-600' : n.type === 'Event' ? 'bg-violet-100 text-violet-600' : 'bg-indigo-100 text-indigo-600'}`}>
              <Bell size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-semibold text-slate-900 dark:text-white">{n.title}</h3>
                <span className="badge bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">{n.type || 'Info'}</span>
                {!n.isRead && <span className="badge bg-primary/10 text-primary">Unread</span>}
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">{n.message}</p>
              <p className="text-xs text-slate-400 mt-2">{n.createdAt ? new Date(n.createdAt).toLocaleString() : ''} {n.targetRole ? `· For ${n.targetRole}` : n.audience === 'all' ? '· For everyone' : ''}</p>
            </div>
            <div className="flex items-center gap-2 sm:flex-col sm:items-end">
              {!n.isRead && <button className="btn-ghost text-sm" onClick={() => markRead(n._id)}>Mark read</button>}
              {isAdmin && <button className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-danger" onClick={() => setConfirmId(n._id)} title="Delete"><Trash2 size={16} /></button>}
            </div>
          </div>
        ))}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Create Notification"
        footer={<><button className="btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button><button className="btn-primary" onClick={create} disabled={saving}>{saving ? 'Creating...' : 'Create'}</button></>}>
        <div className="space-y-3">
          <div><label className="label">Title *</label><input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
          <div><label className="label">Message *</label><textarea className="input min-h-[110px]" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} /></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div><label className="label">Type</label><select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>{['Info','Alert','Announcement','Event'].map(t => <option key={t}>{t}</option>)}</select></div>
            <div><label className="label">Audience</label><select className="input" value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value })}><option value="all">All users</option><option value="role">Specific role</option></select></div>
            {form.audience === 'role' && <div className="sm:col-span-2"><label className="label">Target Role</label><select className="input" value={form.targetRole} onChange={(e) => setForm({ ...form, targetRole: e.target.value })}><option value="">Select role</option><option value="admin">Admin</option><option value="teacher">Teacher</option><option value="student">Student</option></select></div>}
          </div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} /> Active notification</label>
        </div>
      </Modal>

      <ConfirmDialog open={!!confirmId} title="Delete notification" message="Delete this notification?" confirmText="Delete" onCancel={() => setConfirmId(null)} onConfirm={() => confirmId && remove(confirmId)} />
    </div>
  );
};

export default NotificationsPage;
