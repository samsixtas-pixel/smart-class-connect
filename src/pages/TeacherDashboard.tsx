import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getCurrentUser, logout, User } from '@/lib/auth';
import { createSession, getActiveSession, getSessionRecords, exportCSV, AttendanceSession, AttendanceRecord } from '@/lib/attendance';
import { ThemeToggle } from '@/components/ThemeToggle';
import { StatusAnimation } from '@/components/StatusAnimation';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { GraduationCap, LogOut, Zap, Download, Users, Clock, Copy, Check } from 'lucide-react';

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<AttendanceSession | null>(null);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const u = getCurrentUser();
    if (!u || u.role !== 'teacher') { navigate('/login'); return; }
    setUser(u);
    const existing = getActiveSession(u.id);
    if (existing) setSession(existing);
  }, [navigate]);

  // Countdown timer
  useEffect(() => {
    if (!session) return;
    const interval = setInterval(() => {
      const remaining = session.expiresAt - Date.now();
      if (remaining <= 0) {
        setTimeLeft('Expired');
        setSession(null);
        clearInterval(interval);
        return;
      }
      const m = Math.floor(remaining / 60000);
      const s = Math.floor((remaining % 60000) / 1000);
      setTimeLeft(`${m}:${s.toString().padStart(2, '0')}`);
    }, 1000);
    return () => clearInterval(interval);
  }, [session]);

  // Poll for attendance records every 5s
  const fetchRecords = useCallback(() => {
    if (!session) return;
    setRecords(getSessionRecords(session.id));
  }, [session]);

  useEffect(() => {
    fetchRecords();
    const interval = setInterval(fetchRecords, 5000);
    return () => clearInterval(interval);
  }, [fetchRecords]);

  const handleGenerate = () => {
    setLoading(true);
    try {
      const newSession = createSession(user!.id);
      setSession(newSession);
      setStatus({ type: 'success', message: 'Session created! Share the code with your students.' });
    } catch {
      setStatus({ type: 'error', message: 'Could not create session. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = () => {
    if (session) {
      navigator.clipboard.writeText(session.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (!session) return;
    const csv = exportCSV(session, records);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_${session.code}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
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

        <main className="container mx-auto max-w-2xl px-4 py-8 space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="mb-2 text-2xl font-bold">Teacher Dashboard 🎓</h1>
            <p className="mb-6 text-muted-foreground">Welcome, {user.name}</p>
          </motion.div>

          {/* Session Card */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="glass-strong rounded-3xl p-8"
          >
            {session ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold">Active Session</h2>
                  <div className="flex items-center gap-2 rounded-full bg-success/10 px-4 py-1.5 text-success text-sm font-semibold">
                    <Clock className="h-4 w-4" /> {timeLeft}
                  </div>
                </div>

                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-2">Attendance Code</p>
                  <div className="flex items-center justify-center gap-3">
                    <span className="text-5xl font-extrabold tracking-[0.3em] gradient-text">{session.code}</span>
                    <Button variant="ghost" size="icon" onClick={handleCopyCode}>
                      {copied ? <Check className="h-5 w-5 text-success" /> : <Copy className="h-5 w-5" />}
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4 text-center">
                <Zap className="mx-auto h-12 w-12 text-primary opacity-50" />
                <p className="text-muted-foreground">No active session. Generate one to start taking attendance.</p>
                <StatusAnimation type={status.type} message={status.message} />
                {loading ? <LoadingSpinner /> : (
                  <Button onClick={handleGenerate} className="gradient-bg border-0 text-white font-semibold h-12 px-8 text-base">
                    <Zap className="mr-2 h-5 w-5" /> Generate Code
                  </Button>
                )}
              </div>
            )}
          </motion.div>

          {/* Students List */}
          {session && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="glass-strong rounded-3xl p-8"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-bold">Signed Students ({records.length})</h2>
                </div>
                {records.length > 0 && (
                  <Button variant="outline" size="sm" onClick={handleDownload} className="glass">
                    <Download className="mr-1 h-4 w-4" /> CSV
                  </Button>
                )}
              </div>

              {records.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No students have signed yet. Waiting...</p>
              ) : (
                <div className="space-y-3">
                  {records.map((r, i) => (
                    <motion.div
                      key={r.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-center justify-between rounded-xl border border-border/50 bg-card/50 p-4"
                    >
                      <div>
                        <p className="font-semibold">{r.studentName}</p>
                        <p className="text-xs text-muted-foreground">{new Date(r.signedAt).toLocaleTimeString()}</p>
                      </div>
                      <span className="rounded-full bg-success/10 px-3 py-1 text-xs font-medium text-success">
                        Signed ✓
                      </span>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          <StatusAnimation type={status.type} message={status.message} />
        </main>
      </div>
    </div>
  );
};

export default TeacherDashboard;
