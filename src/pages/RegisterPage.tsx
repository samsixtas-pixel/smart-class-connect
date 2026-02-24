import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { register } from '@/lib/auth';
import { ThemeToggle } from '@/components/ThemeToggle';
import { StatusAnimation } from '@/components/StatusAnimation';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GraduationCap, ArrowLeft, UserPlus } from 'lucide-react';

const RegisterPage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'student' as 'student' | 'teacher' });
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
      setStatus({ type: 'error', message: 'All fields are required.' });
      return;
    }
    if (form.password.length < 6) {
      setStatus({ type: 'error', message: 'Password must be at least 6 characters.' });
      return;
    }
    setLoading(true);
    try {
      await register(form.name.trim(), form.email.trim().toLowerCase(), form.password, form.role);
      setStatus({ type: 'success', message: 'Registration successful! Redirecting...' });
      setTimeout(() => navigate('/login'), 1500);
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
            <h1 className="text-2xl font-bold">Create Account</h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input placeholder="John Doe" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="glass" maxLength={100} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" placeholder="john@school.edu" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="glass" maxLength={255} />
            </div>
            <div className="space-y-2">
              <Label>Password</Label>
              <Input type="password" placeholder="••••••••" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="glass" maxLength={128} />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <div className="grid grid-cols-2 gap-3">
                {(['student', 'teacher'] as const).map(role => (
                  <motion.button
                    key={role}
                    type="button"
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setForm({ ...form, role })}
                    className={`rounded-xl border-2 px-4 py-3 text-sm font-semibold capitalize transition-all ${
                      form.role === role
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-card/50 text-muted-foreground hover:border-primary/30'
                    }`}
                  >
                    {role}
                  </motion.button>
                ))}
              </div>
            </div>

            <StatusAnimation type={status.type} message={status.message} />

            {loading ? (
              <LoadingSpinner />
            ) : (
              <Button type="submit" className="gradient-bg w-full border-0 text-white font-semibold h-12 text-base">
                <UserPlus className="mr-2 h-5 w-5" /> Register
              </Button>
            )}
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-primary hover:underline">Sign in</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default RegisterPage;
