import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getCurrentUser, logout, User } from '@/lib/auth';
import { signAttendance } from '@/lib/attendance';
import { ThemeToggle } from '@/components/ThemeToggle';
import { StatusAnimation } from '@/components/StatusAnimation';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GraduationCap, LogOut, Send } from 'lucide-react';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [code, setCode] = useState('');
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const u = getCurrentUser();
    if (!u || u.role !== 'student') { navigate('/login'); return; }
    setUser(u);
  }, [navigate]);

  const handleSign = () => {
    if (code.length !== 6) {
      setStatus({ type: 'error', message: 'Please enter a valid 6-digit code.' });
      return;
    }
    setLoading(true);
    try {
      const result = signAttendance(code, user!.id, user!.name);
      setStatus({ type: result.success ? 'success' : 'error', message: result.message });
      if (result.success) setCode('');
    } catch {
      setStatus({ type: 'error', message: 'Something went wrong. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => { logout(); navigate('/'); };

  if (!user) return null;

  return (
    <div className="relative min-h-screen">
      <div className="animated-gradient-bg fixed inset-0 opacity-10" />
      <div className="fixed inset-0 bg-background/70 backdrop-blur-sm" />

      <div className="relative z-10">
        <nav className="flex items-center justify-between p-4 md:p-6">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-7 w-7 text-primary" />
            <span className="font-bold text-lg">SmartAttend</span>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button variant="ghost" size="sm" onClick={handleLogout}><LogOut className="mr-1 h-4 w-4" />Logout</Button>
          </div>
        </nav>

        <main className="container mx-auto max-w-lg px-4 py-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="mb-2 text-2xl font-bold">Hello, {user.name} 👋</h1>
            <p className="mb-8 text-muted-foreground">Enter the attendance code from your teacher.</p>

            <div className="glass-strong rounded-3xl p-8 space-y-6">
              <div className="space-y-2">
                <Label className="text-base">Attendance Code</Label>
                <Input
                  value={code}
                  onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  className="glass text-center text-3xl font-bold tracking-[0.5em] h-16"
                  maxLength={6}
                  inputMode="numeric"
                />
              </div>


              <StatusAnimation type={status.type} message={status.message} />

              {loading ? (
                <LoadingSpinner />
              ) : (
                <Button onClick={handleSign} className="gradient-bg w-full border-0 text-white font-semibold h-14 text-base" disabled={code.length !== 6}>
                  <Send className="mr-2 h-5 w-5" /> Sign Attendance
                </Button>
              )}
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default StudentDashboard;
