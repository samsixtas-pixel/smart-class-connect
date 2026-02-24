# XAMPP Setup Instructions & Reference Files

## Smart School Attendance — XAMPP Backend Reference

This React frontend currently uses **localStorage** for demo purposes. To connect it to a real **XAMPP (Apache + MySQL + PHP)** backend, follow the instructions below.

---

## 1. Find Your Local IP

Open Command Prompt and run:
```
ipconfig
```
Look for **IPv4 Address** under your WiFi adapter (e.g., `192.168.1.100`).

## 2. Allow Apache Through Firewall

- Open **Windows Defender Firewall** → **Allow an app through firewall**
- Click **Allow another app** → Browse to `C:\xampp\apache\bin\httpd.exe`
- Check both **Private** and **Public** network boxes

## 3. Import SQL Database

1. Start **Apache** and **MySQL** in XAMPP Control Panel
2. Open **phpMyAdmin**: `http://localhost/phpmyadmin`
3. Create a new database: `attendance_db`
4. Click **Import** tab → Choose the SQL file below → Click **Go**

## 4. SQL Schema

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
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (teacher_id) REFERENCES users(id)
);

CREATE TABLE attendance_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id INT NOT NULL,
    student_id INT NOT NULL,
    signed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    student_lat DECIMAL(10, 8),
    student_lng DECIMAL(11, 8),
    FOREIGN KEY (session_id) REFERENCES attendance_sessions(id),
    FOREIGN KEY (student_id) REFERENCES users(id),
    UNIQUE KEY unique_attendance (session_id, student_id)
);
```

## 5. PHP API Examples

Place these in `C:\xampp\htdocs\attendance_app\api\`

### `config.php`
```php
<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

$host = 'localhost';
$db = 'attendance_db';
$user = 'root';
$pass = '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$db;charset=utf8mb4", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    echo json_encode(['error' => 'Database connection failed']);
    exit;
}
?>
```

### `register.php`
```php
<?php
require_once 'config.php';
$data = json_decode(file_get_contents('php://input'), true);

$name = htmlspecialchars(trim($data['name'] ?? ''));
$email = filter_var(trim($data['email'] ?? ''), FILTER_VALIDATE_EMAIL);
$password = $data['password'] ?? '';
$role = in_array($data['role'] ?? '', ['student', 'teacher']) ? $data['role'] : null;

if (!$name || !$email || !$password || !$role) {
    echo json_encode(['error' => 'Invalid input']);
    exit;
}

$stmt = $pdo->prepare('SELECT id FROM users WHERE email = ?');
$stmt->execute([$email]);
if ($stmt->fetch()) {
    echo json_encode(['error' => 'Email already registered']);
    exit;
}

$hashed = password_hash($password, PASSWORD_DEFAULT);
$stmt = $pdo->prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)');
$stmt->execute([$name, $email, $hashed, $role]);

echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
?>
```

### `login.php`
```php
<?php
require_once 'config.php';
$data = json_decode(file_get_contents('php://input'), true);

$email = filter_var(trim($data['email'] ?? ''), FILTER_VALIDATE_EMAIL);
$password = $data['password'] ?? '';

if (!$email || !$password) {
    echo json_encode(['error' => 'Invalid input']);
    exit;
}

$stmt = $pdo->prepare('SELECT * FROM users WHERE email = ?');
$stmt->execute([$email]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$user || !password_verify($password, $user['password'])) {
    echo json_encode(['error' => 'Invalid email or password']);
    exit;
}

unset($user['password']);
echo json_encode(['success' => true, 'user' => $user]);
?>
```

## 6. Testing From Phones

1. Connect all devices to the **same WiFi** network
2. Access the app from phone browsers at: `http://YOUR_LOCAL_IP/attendance_app`
3. Teacher generates code on one device, students enter code on their phones

## 7. Connecting React to PHP Backend

Replace the localStorage calls in `src/lib/auth.ts` and `src/lib/attendance.ts` with `fetch()` calls to your PHP API:

```typescript
// Example: Replace login() in auth.ts
export async function login(email: string, password: string): Promise<User> {
  const res = await fetch('http://YOUR_LOCAL_IP/attendance_app/api/login.php', {
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
