import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

type FormData = z.infer<typeof schema>;

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    try {
      await login(data.email, data.password);
      toast.success('Logged in successfully');
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-violet-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md card p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-lg">E</div>
          <div>
            <h1 className="text-xl font-display font-bold text-slate-900 dark:text-white">EduPulse SMS</h1>
            <p className="text-sm text-slate-500">Sign in to your account</p>
          </div>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" placeholder="you@edupulse.edu" {...register('email')} />
            {errors.email && <p className="text-xs text-danger mt-1">{errors.email.message}</p>}
          </div>
          <div>
            <label className="label">Password</label>
            <div className="relative">
              <input className="input pr-10" type={showPassword ? 'text' : 'password'} placeholder="Enter your password" {...register('password')} />
              <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-slate-700" onClick={() => setShowPassword((s) => !s)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-danger mt-1">{errors.password.message}</p>}
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">Forgot your password?</span>
            <Link to="/forgot-password" className="text-primary hover:underline font-medium">Reset here</Link>
          </div>
          <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
            <LogIn size={16} /> {isSubmitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <p className="text-sm text-slate-500 mt-5 text-center">
          Don't have an account? <Link to="/register" className="text-primary font-medium hover:underline">Create account</Link>
        </p>
        <div className="mt-5 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-600 dark:text-slate-300 space-y-1">
          <div className="font-semibold text-slate-700 dark:text-slate-200">Demo credentials (after seeding)</div>
          <div>Admin: admin@edupulse.edu / Admin@123</div>
          <div>Teacher: teacher@edupulse.edu / Teacher@123</div>
          <div>Student: student@edupulse.edu / Student@123</div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
