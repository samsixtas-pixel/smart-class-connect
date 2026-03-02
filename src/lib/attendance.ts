export interface AttendanceSession {
  id: string;
  teacherId: string;
  code: string;
  expiresAt: number; // timestamp
  createdAt: number;
}

export interface AttendanceRecord {
  id: string;
  sessionId: string;
  studentId: string;
  studentName: string;
  signedAt: number;
}

function getSessions(): AttendanceSession[] {
  return JSON.parse(localStorage.getItem('attendance_sessions') || '[]');
}

function saveSessions(sessions: AttendanceSession[]) {
  localStorage.setItem('attendance_sessions', JSON.stringify(sessions));
}

function getRecords(): AttendanceRecord[] {
  return JSON.parse(localStorage.getItem('attendance_records') || '[]');
}

function saveRecords(records: AttendanceRecord[]) {
  localStorage.setItem('attendance_records', JSON.stringify(records));
}

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function createSession(teacherId: string): AttendanceSession {
  const sessions = getSessions();
  const session: AttendanceSession = {
    id: crypto.randomUUID(),
    teacherId,
    code: generateCode(),
    expiresAt: Date.now() + 10 * 60 * 1000,
    createdAt: Date.now(),
  };
  sessions.push(session);
  saveSessions(sessions);
  return session;
}

export function getActiveSession(teacherId: string): AttendanceSession | null {
  const sessions = getSessions();
  return sessions.find(s => s.teacherId === teacherId && s.expiresAt > Date.now()) || null;
}

export function signAttendance(
  code: string, studentId: string, studentName: string
): { success: boolean; message: string } {
  const sessions = getSessions();
  const session = sessions.find(s => s.code === code && s.expiresAt > Date.now());

  if (!session) return { success: false, message: 'Invalid or expired attendance code.' };

  const records = getRecords();
  if (records.find(r => r.sessionId === session.id && r.studentId === studentId)) {
    return { success: false, message: 'You have already signed attendance for this session.' };
  }

  records.push({
    id: crypto.randomUUID(),
    sessionId: session.id,
    studentId,
    studentName,
    signedAt: Date.now(),
  });
  saveRecords(records);
  return { success: true, message: 'Attendance signed successfully!' };
}

export function getSessionRecords(sessionId: string): AttendanceRecord[] {
  return getRecords().filter(r => r.sessionId === sessionId);
}

export function exportCSV(session: AttendanceSession, records: AttendanceRecord[]): string {
  const header = 'Student Name,Signed At\n';
  const rows = records.map(r =>
    `${r.studentName},${new Date(r.signedAt).toLocaleString()}`
  ).join('\n');
  return header + rows;
}
