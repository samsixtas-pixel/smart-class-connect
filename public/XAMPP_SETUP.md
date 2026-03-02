# Smart School Attendance — Backend Setup Guide

This guide provides **complete PHP backend files** that can be hosted on **any web server** (shared hosting, VPS, cloud, or local XAMPP) and communicate with the React frontend from anywhere.

---

## 1. Database Setup (MySQL)

Create a database called `attendance_db` and run this SQL:

```sql
CREATE DATABASE IF NOT EXISTS attendance_db;
USE attendance_db;

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('student', 'teacher') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE attendance_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    teacher_id INT NOT NULL,
    code VARCHAR(6) NOT NULL UNIQUE,
    expires_at DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (teacher_id) REFERENCES users(id)
);

CREATE TABLE attendance_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id INT NOT NULL,
    student_id INT NOT NULL,
    student_name VARCHAR(100) NOT NULL,
    signed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES attendance_sessions(id),
    FOREIGN KEY (student_id) REFERENCES users(id),
    UNIQUE KEY unique_attendance (session_id, student_id)
);
```

---

## 2. PHP Backend Files

Place all files in your web server's public directory, e.g.:
- **XAMPP**: `C:\xampp\htdocs\attendance_api\`
- **Shared Hosting**: `public_html/attendance_api/`
- **VPS/Cloud**: `/var/www/html/attendance_api/`

### File Structure

```
attendance_api/
├── config.php
├── register.php
├── login.php
├── create_session.php
├── sign_attendance.php
├── get_session.php
├── get_records.php
└── .htaccess
```

---

### `config.php`

```php
<?php
// CORS — Allow requests from any origin (update for production)
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// ====== DATABASE CONFIG ======
// Update these for your hosting environment
$host = 'localhost';
$db   = 'attendance_db';
$user = 'root';       // Change for production
$pass = '';            // Change for production

try {
    $pdo = new PDO(
        "mysql:host=$host;dbname=$db;charset=utf8mb4",
        $user,
        $pass,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]
    );
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed']);
    exit;
}
?>
```

---

### `register.php`

```php
<?php
require_once 'config.php';
$data = json_decode(file_get_contents('php://input'), true);

$name     = htmlspecialchars(trim($data['name'] ?? ''));
$email    = filter_var(trim($data['email'] ?? ''), FILTER_VALIDATE_EMAIL);
$password = $data['password'] ?? '';
$role     = in_array($data['role'] ?? '', ['student', 'teacher']) ? $data['role'] : null;

if (!$name || !$email || !$password || !$role) {
    http_response_code(400);
    echo json_encode(['error' => 'All fields are required and must be valid.']);
    exit;
}

if (strlen($password) < 6) {
    http_response_code(400);
    echo json_encode(['error' => 'Password must be at least 6 characters.']);
    exit;
}

// Check if email exists
$stmt = $pdo->prepare('SELECT id FROM users WHERE email = ?');
$stmt->execute([$email]);
if ($stmt->fetch()) {
    http_response_code(409);
    echo json_encode(['error' => 'Email already registered']);
    exit;
}

$hashed = password_hash($password, PASSWORD_DEFAULT);
$stmt = $pdo->prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)');
$stmt->execute([$name, $email, $hashed, $role]);

$userId = $pdo->lastInsertId();

echo json_encode([
    'success' => true,
    'user' => [
        'id' => $userId,
        'name' => $name,
        'email' => $email,
        'role' => $role,
    ]
]);
?>
```

---

### `login.php`

```php
<?php
require_once 'config.php';
$data = json_decode(file_get_contents('php://input'), true);

$email    = filter_var(trim($data['email'] ?? ''), FILTER_VALIDATE_EMAIL);
$password = $data['password'] ?? '';

if (!$email || !$password) {
    http_response_code(400);
    echo json_encode(['error' => 'Email and password are required.']);
    exit;
}

$stmt = $pdo->prepare('SELECT * FROM users WHERE email = ?');
$stmt->execute([$email]);
$user = $stmt->fetch();

if (!$user || !password_verify($password, $user['password'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Invalid email or password']);
    exit;
}

unset($user['password']);
echo json_encode(['success' => true, 'user' => $user]);
?>
```

---

### `create_session.php`

```php
<?php
require_once 'config.php';
$data = json_decode(file_get_contents('php://input'), true);

$teacherId = intval($data['teacherId'] ?? 0);

if (!$teacherId) {
    http_response_code(400);
    echo json_encode(['error' => 'Teacher ID is required.']);
    exit;
}

// Verify teacher exists and has correct role
$stmt = $pdo->prepare('SELECT id FROM users WHERE id = ? AND role = ?');
$stmt->execute([$teacherId, 'teacher']);
if (!$stmt->fetch()) {
    http_response_code(403);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

// Expire old sessions first
$pdo->exec("DELETE FROM attendance_sessions WHERE expires_at < NOW()");

// Check for existing active session
$stmt = $pdo->prepare('SELECT * FROM attendance_sessions WHERE teacher_id = ? AND expires_at > NOW()');
$stmt->execute([$teacherId]);
$existing = $stmt->fetch();

if ($existing) {
    echo json_encode(['success' => true, 'session' => $existing]);
    exit;
}

// Generate unique 6-digit code
do {
    $code = str_pad(random_int(100000, 999999), 6, '0', STR_PAD_LEFT);
    $stmt = $pdo->prepare('SELECT id FROM attendance_sessions WHERE code = ? AND expires_at > NOW()');
    $stmt->execute([$code]);
} while ($stmt->fetch());

$expiresAt = date('Y-m-d H:i:s', time() + 600); // 10 minutes

$stmt = $pdo->prepare('INSERT INTO attendance_sessions (teacher_id, code, expires_at) VALUES (?, ?, ?)');
$stmt->execute([$teacherId, $code, $expiresAt]);

$sessionId = $pdo->lastInsertId();

echo json_encode([
    'success' => true,
    'session' => [
        'id' => $sessionId,
        'teacher_id' => $teacherId,
        'code' => $code,
        'expires_at' => $expiresAt,
        'created_at' => date('Y-m-d H:i:s'),
    ]
]);
?>
```

---

### `sign_attendance.php`

```php
<?php
require_once 'config.php';
$data = json_decode(file_get_contents('php://input'), true);

$code        = trim($data['code'] ?? '');
$studentId   = intval($data['studentId'] ?? 0);
$studentName = htmlspecialchars(trim($data['studentName'] ?? ''));

if (!$code || !$studentId || !$studentName) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'All fields are required.']);
    exit;
}

// Find active session by code
$stmt = $pdo->prepare('SELECT * FROM attendance_sessions WHERE code = ? AND expires_at > NOW()');
$stmt->execute([$code]);
$session = $stmt->fetch();

if (!$session) {
    echo json_encode(['success' => false, 'message' => 'Invalid or expired attendance code.']);
    exit;
}

// Check for duplicate
$stmt = $pdo->prepare('SELECT id FROM attendance_records WHERE session_id = ? AND student_id = ?');
$stmt->execute([$session['id'], $studentId]);
if ($stmt->fetch()) {
    echo json_encode(['success' => false, 'message' => 'You have already signed attendance for this session.']);
    exit;
}

// Record attendance
$stmt = $pdo->prepare('INSERT INTO attendance_records (session_id, student_id, student_name) VALUES (?, ?, ?)');
$stmt->execute([$session['id'], $studentId, $studentName]);

echo json_encode(['success' => true, 'message' => 'Attendance signed successfully!']);
?>
```

---

### `get_session.php`

```php
<?php
require_once 'config.php';

$teacherId = intval($_GET['teacherId'] ?? 0);

if (!$teacherId) {
    http_response_code(400);
    echo json_encode(['error' => 'Teacher ID is required.']);
    exit;
}

$stmt = $pdo->prepare('SELECT * FROM attendance_sessions WHERE teacher_id = ? AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1');
$stmt->execute([$teacherId]);
$session = $stmt->fetch();

echo json_encode(['session' => $session ?: null]);
?>
```

---

### `get_records.php`

```php
<?php
require_once 'config.php';

$sessionId = intval($_GET['sessionId'] ?? 0);

if (!$sessionId) {
    http_response_code(400);
    echo json_encode(['error' => 'Session ID is required.']);
    exit;
}

$stmt = $pdo->prepare('SELECT * FROM attendance_records WHERE session_id = ? ORDER BY signed_at ASC');
$stmt->execute([$sessionId]);
$records = $stmt->fetchAll();

echo json_encode(['records' => $records]);
?>
```

---

### `.htaccess` (Apache — enable CORS & clean URLs)

```apache
# Enable rewrite engine
RewriteEngine On

# Handle CORS preflight
RewriteCond %{REQUEST_METHOD} OPTIONS
RewriteRule ^(.*)$ $1 [R=200,L]

# PHP error handling
php_flag display_errors off
php_flag log_errors on
```

---

## 3. Connecting the React Frontend

Update `src/lib/auth.ts` and `src/lib/attendance.ts` to use your hosted API URL.

### Set your API base URL

Create a file `src/lib/api.ts`:

```typescript
// Change this to your hosted backend URL
export const API_BASE = 'https://your-domain.com/attendance_api';
// For local XAMPP: 'http://192.168.1.100/attendance_api'
```

### Replace auth.ts functions

```typescript
import { API_BASE } from './api';

export async function register(name, email, password, role) {
  const res = await fetch(`${API_BASE}/register.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password, role }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data.user;
}

export async function login(email, password) {
  const res = await fetch(`${API_BASE}/login.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  localStorage.setItem('attendance_current_user', JSON.stringify(data.user));
  return data.user;
}
```

### Replace attendance.ts functions

```typescript
import { API_BASE } from './api';

export async function createSession(teacherId) {
  const res = await fetch(`${API_BASE}/create_session.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ teacherId }),
  });
  return (await res.json()).session;
}

export async function signAttendance(code, studentId, studentName) {
  const res = await fetch(`${API_BASE}/sign_attendance.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, studentId, studentName }),
  });
  return await res.json();
}

export async function getSessionRecords(sessionId) {
  const res = await fetch(`${API_BASE}/get_records.php?sessionId=${sessionId}`);
  return (await res.json()).records;
}
```

---

## 4. Hosting Options

### Option A: Shared Hosting (Cheapest)
1. Buy hosting from Hostinger, Namecheap, Bluehost, etc.
2. Upload PHP files to `public_html/attendance_api/`
3. Create MySQL database via cPanel
4. Import the SQL schema
5. Update `config.php` with your database credentials
6. Point your domain to the hosting

### Option B: VPS (DigitalOcean, Linode, etc.)
1. Install Apache, PHP, MySQL
2. Deploy PHP files to `/var/www/html/attendance_api/`
3. Set up SSL with Let's Encrypt
4. Configure firewall

### Option C: Local XAMPP
1. Start Apache & MySQL in XAMPP
2. Place files in `C:\xampp\htdocs\attendance_api\`
3. Import SQL via phpMyAdmin
4. Access via `http://YOUR_LOCAL_IP/attendance_api`
5. Allow Apache through Windows Firewall

### Finding your local IP (for XAMPP)
```
ipconfig
```
Look for **IPv4 Address** under your WiFi adapter.

---

## 5. Security Checklist

- ✅ Prepared statements (PDO) — prevents SQL injection
- ✅ Password hashing with `password_hash()` / `password_verify()`
- ✅ Input sanitization with `htmlspecialchars()` and `filter_var()`
- ✅ Duplicate attendance prevention (UNIQUE constraint)
- ✅ Session expiration (10 minutes)
- ✅ Role verification for teacher actions
- ⚠️ For production: Add HTTPS, rate limiting, and CSRF tokens
- ⚠️ For production: Restrict CORS to your specific frontend domain
