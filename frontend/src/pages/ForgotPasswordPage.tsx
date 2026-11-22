import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';
import { Mail } from 'lucide-react';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { toast.error('Please enter your email'); return; }
    try {
      setLoading(true);
      const res = await api.post('/auth/forgot-password', { email });
      setSent(true);
      toast.success(res.data?.message || 'If the account exists, reset instructions were sent.');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-violet-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md card p-6 sm:p-8">
        <h1 className="text-xl font-display font-bold text-slate-900 dark:text-white mb-1">Forgot password</h1>
        <p className="text-sm text-slate-500 mb-6">Enter your email and we'll send reset instructions if an account exists.</p>
        {sent ? (
          <div className="rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 p-4 text-sm text-emerald-700 dark:text-emerald-300 mb-4">
            If an account exists for <strong>{email}</strong>, password reset instructions have been sent.
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="label">Email address</label>
              <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@edupulse.edu" />
            </div>
            <button type="submit" className="btn-primary w-full" disabled={loading}>
              <Mail size={16} /> {loading ? 'Submitting...' : 'Send reset instructions'}
            </button>
          </form>
        )}
        <div className="mt-5 text-center">
          <Link to="/login" className="text-primary hover:underline text-sm font-medium">Back to login</Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
