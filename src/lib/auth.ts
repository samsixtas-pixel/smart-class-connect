export interface User {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'teacher';
}

interface StoredUser extends User {
  password: string;
}

function getUsers(): StoredUser[] {
  return JSON.parse(localStorage.getItem('attendance_users') || '[]');
}

function saveUsers(users: StoredUser[]) {
  localStorage.setItem('attendance_users', JSON.stringify(users));
}

// Simple hash for demo - in production use bcrypt via PHP backend
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function register(name: string, email: string, password: string, role: 'student' | 'teacher'): Promise<User> {
  const users = getUsers();
  if (users.find(u => u.email === email)) {
    throw new Error('Email already registered');
  }
  const hashed = await hashPassword(password);
  const user: StoredUser = { id: crypto.randomUUID(), name, email, password: hashed, role };
  users.push(user);
  saveUsers(users);
  const { password: _, ...safeUser } = user;
  return safeUser;
}

export async function login(email: string, password: string): Promise<User> {
  const users = getUsers();
  const hashed = await hashPassword(password);
  const user = users.find(u => u.email === email && u.password === hashed);
  if (!user) throw new Error('Invalid email or password');
  const { password: _, ...safeUser } = user;
  localStorage.setItem('attendance_current_user', JSON.stringify(safeUser));
  return safeUser;
}

export function logout() {
  localStorage.removeItem('attendance_current_user');
}

export function getCurrentUser(): User | null {
  const data = localStorage.getItem('attendance_current_user');
  return data ? JSON.parse(data) : null;
}
