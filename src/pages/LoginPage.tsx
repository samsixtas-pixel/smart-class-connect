import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { login } from '@/lib/auth';
import { ThemeToggle } from '@/components/ThemeToggle';
import { StatusAnimation } from '@/components/StatusAnimation';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GraduationCap, ArrowLeft, LogIn } from 'lucide-react';

const LoginPage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email.trim() || !form.password.trim()) {
      setStatus({ type: 'error', message: 'All fields are required.' });
      return;
    }
    setLoading(true);
    try {
      const user = await login(form.email.trim().toLowerCase(), form.password);
      setStatus({ type: 'success', message: 'Login successful!' });
      setTimeout(() => navigate(user.role === 'teacher' ? '/teacher' : '/student'), 1000);
    } catch (err: any) {
      setStatus({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen">
      <div className="animated-gradient-bg fixed inset-0 opacity-20" />
      <div className="fixed inset-0 bg-background/60 backdrop-blur-sm" />

      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center p-4">
        <div className="absolute right-4 top-4"><ThemeToggle /></div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-strong w-full max-w-md rounded-3xl p-8"
        >
          <Link to="/" className="mb-6 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>

          <div className="mb-8 flex items-center gap-3">
            <GraduationCap className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">Welcome Back</h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" placeholder="john@school.edu" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="glass" maxLength={255} />
            </div>
            <div className="space-y-2">
              <Label>Password</Label>
              <Input type="password" placeholder="••••••••" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="glass" maxLength={128} />
            </div>

            <StatusAnimation type={status.type} message={status.message} />

            {loading ? (
              <LoadingSpinner />
            ) : (
              <Button type="submit" className="gradient-bg w-full border-0 text-white font-semibold h-12 text-base">
                <LogIn className="mr-2 h-5 w-5" /> Sign In
              </Button>
            )}
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-primary hover:underline">Register</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage;
