const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET || 'afrodita_secret';
const app = express();
const PORT = process.env.PORT || 3001;
const { Parser } = require('json2csv');

// Настройте параметры подключения к вашей базе PostgreSQL
const pool = new Pool({
  user: 'clinic_db_zx6v_user',
  host: 'dpg-d1cqdl6r433s738624pg-a',
  database: 'clinic_db_zx6v',
  password: 'UQuFXD53wmKossKZrM4DgnHESoMnwkM9',
  port: 5432,
  ssl: { rejectUnauthorized: false }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../'))); // для отдачи статики

// Middleware для отключения кэширования API
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    res.set('Cache-Control', 'no-store');
  }
  next();
});

// Получить все заявки
app.get('/api/requests', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM requests ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Добавить заявку
app.post('/api/requests', async (req, res) => {
  const { name, phone, service, date, time, comment } = req.body;
  if (!name || !phone || !service || !date || !time) {
    return res.status(400).json({ error: 'Заполните все обязательные поля' });
  }
  try {
    // Проверка занятости времени
    const exists = await pool.query(
      'SELECT id FROM requests WHERE date = $1 AND time = $2',
      [date, time]
    );
    if (exists.rows.length > 0) {
      return res.status(409).json({ error: 'Это время уже занято. Пожалуйста, выберите другое.' });
    }
    const result = await pool.query(
      'INSERT INTO requests (name, phone, service, date, time, comment) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
      [name, phone, service, date, time, comment]
    );
    res.json({ id: result.rows[0].id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Удалить заявку по id
app.delete('/api/requests/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM requests WHERE id = $1', [req.params.id]);
    res.json({ deleted: result.rowCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Очистить все заявки
app.delete('/api/requests', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM requests');
    res.json({ deleted: result.rowCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Регистрация пользователя
app.post('/api/register', async (req, res) => {
  const { fio, phone, password } = req.body;
  if (!fio || !phone || !password) {
    return res.status(400).json({ error: 'Заполните все поля' });
  }
  try {
    const exists = await pool.query('SELECT id FROM users WHERE phone = $1', [phone]);
    if (exists.rows.length > 0) {
      return res.status(409).json({ error: 'Пользователь с таким номером уже зарегистрирован' });
    }
    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query('INSERT INTO users (fio, phone, password) VALUES ($1, $2, $3) RETURNING id, fio, phone', [fio, phone, hash]);
    const user = result.rows[0];
    const token = jwt.sign({ id: user.id }, SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, fio: user.fio, phone: user.phone } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Вход пользователя
app.post('/api/login', async (req, res) => {
  const { phone, password } = req.body;
  if (!phone || !password) {
    return res.status(400).json({ error: 'Заполните все поля' });
  }
  try {
    const result = await pool.query('SELECT * FROM users WHERE phone = $1', [phone]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Пользователь не найден' });
    }
    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ error: 'Неверный пароль' });
    }
    const token = jwt.sign({ id: user.id }, SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, fio: user.fio, phone: user.phone } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Админ-логин (по таблице users и admins)
app.post('/api/admin/login', async (req, res) => {
  const { login, password } = req.body;
  if (!login || !password) {
    return res.status(400).json({ error: 'Заполните все поля' });
  }
  try {
    // Найти пользователя с таким логином (phone) и ролью admin
    const userRes = await pool.query(
      `SELECT u.*, a.role FROM users u
       JOIN admins a ON a.user_id = u.id
       WHERE u.phone = $1 AND a.role = 'admin'`, [login]
    );
    if (userRes.rows.length === 0) {
      return res.status(401).json({ error: 'Пользователь не найден' });
    }
    const user = userRes.rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ error: 'Неверный пароль' });
    }
    const token = jwt.sign({ id: user.id, role: 'admin' }, SECRET, { expiresIn: '7d' });
    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Middleware для проверки токена
function auth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Нет авторизации' });
  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, SECRET);
    req.userId = payload.id;
    next();
  } catch {
    res.status(401).json({ error: 'Неверный токен' });
  }
}

// Middleware для проверки админ-токена
function adminAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Нет авторизации' });
  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, SECRET);
    if (!payload.admin) throw new Error();
    next();
  } catch {
    res.status(401).json({ error: 'Нет доступа (требуется админ)' });
  }
}

// Профиль пользователя
app.get('/api/profile', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, fio, phone FROM users WHERE id = $1', [req.userId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Пользователь не найден' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Роли и авторизация ---
function getRole(req) {
  // userId всегда есть, если auth прошёл
  return req.role || 'user';
}

function roleAuth(role) {
  return (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Нет авторизации' });
    const token = authHeader.split(' ')[1];
    try {
      const payload = jwt.verify(token, SECRET);
      req.userId = payload.id;
      req.role = payload.role || 'user';
      if (role === 'admin' && req.role !== 'admin') throw new Error();
      if (role === 'master' && req.role !== 'master' && req.role !== 'admin') throw new Error();
      next();
    } catch {
      res.status(401).json({ error: 'Нет доступа (роль: ' + role + ')'});
    }
  };
}

// --- CRUD для услуг (services) ---
app.get('/api/services', async (req, res) => {
  const result = await pool.query('SELECT * FROM services ORDER BY id');
  res.json(result.rows);
});
app.post('/api/services', roleAuth('admin'), async (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ error: 'Название обязательно' });
  const result = await pool.query('INSERT INTO services (name, description) VALUES ($1, $2) RETURNING *', [name, description]);
  res.json(result.rows[0]);
});
app.put('/api/services/:id', roleAuth('admin'), async (req, res) => {
  const { name, description } = req.body;
  const result = await pool.query('UPDATE services SET name=$1, description=$2 WHERE id=$3 RETURNING *', [name, description, req.params.id]);
  res.json(result.rows[0]);
});
app.delete('/api/services/:id', roleAuth('admin'), async (req, res) => {
  await pool.query('DELETE FROM services WHERE id=$1', [req.params.id]);
  res.json({ deleted: true });
});

// --- CRUD для мастеров (masters) ---
app.get('/api/masters', roleAuth('admin'), async (req, res) => {
  const result = await pool.query('SELECT * FROM masters ORDER BY id');
  res.json(result.rows);
});
app.post('/api/masters', roleAuth('admin'), async (req, res) => {
  const { fio, position, user_id } = req.body;
  if (!fio || !position || !user_id) return res.status(400).json({ error: 'Все поля обязательны' });
  const result = await pool.query('INSERT INTO masters (fio, position, user_id) VALUES ($1, $2, $3) RETURNING *', [fio, position, user_id]);
  res.json(result.rows[0]);
});
app.put('/api/masters/:id', roleAuth('admin'), async (req, res) => {
  const { fio, position } = req.body;
  const result = await pool.query('UPDATE masters SET fio=$1, position=$2 WHERE id=$3 RETURNING *', [fio, position, req.params.id]);
  res.json(result.rows[0]);
});
app.delete('/api/masters/:id', roleAuth('admin'), async (req, res) => {
  await pool.query('DELETE FROM masters WHERE id=$1', [req.params.id]);
  res.json({ deleted: true });
});

// --- Назначение мастера на услугу ---
app.post('/api/master-services', roleAuth('admin'), async (req, res) => {
  const { master_id, service_id } = req.body;
  if (!master_id || !service_id) return res.status(400).json({ error: 'master_id и service_id обязательны' });
  const result = await pool.query('INSERT INTO master_services (master_id, service_id) VALUES ($1, $2) RETURNING *', [master_id, service_id]);
  res.json(result.rows[0]);
});
app.delete('/api/master-services/:id', roleAuth('admin'), async (req, res) => {
  await pool.query('DELETE FROM master_services WHERE id=$1', [req.params.id]);
  res.json({ deleted: true });
});

// --- Добавление админа ---
app.post('/api/admins', roleAuth('admin'), async (req, res) => {
  const { user_id, role } = req.body;
  if (!user_id || !role) return res.status(400).json({ error: 'user_id и role обязательны' });
  const result = await pool.query('INSERT INTO admins (user_id, role) VALUES ($1, $2) RETURNING *', [user_id, role]);
  res.json(result.rows[0]);
});

// --- Вход для мастера и админа ---
app.post('/api/role-login', async (req, res) => {
  const { phone, password } = req.body;
  if (!phone || !password) return res.status(400).json({ error: 'Заполните все поля' });
  // Проверяем пользователя
  const userRes = await pool.query('SELECT * FROM users WHERE phone = $1', [phone]);
  if (userRes.rows.length === 0) return res.status(401).json({ error: 'Пользователь не найден' });
  const user = userRes.rows[0];
  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(401).json({ error: 'Неверный пароль' });
  // Проверяем роль
  const adminRes = await pool.query('SELECT * FROM admins WHERE user_id = $1', [user.id]);
  let role = 'user';
  if (adminRes.rows.length > 0) role = adminRes.rows[0].role;
  const token = jwt.sign({ id: user.id, role }, SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, fio: user.fio, phone: user.phone }, role });
});

// --- Получение заявок по ролям ---
app.get('/api/my-requests', roleAuth('user'), async (req, res) => {
  const role = req.role;
  if (role === 'admin') {
    // Все заявки
    const result = await pool.query('SELECT * FROM requests ORDER BY id DESC');
    return res.json(result.rows);
  } else if (role === 'master') {
    // Заявки только по мастеру (по user_id мастера)
    const masterRes = await pool.query('SELECT id FROM masters WHERE user_id = $1', [req.userId]);
    if (masterRes.rows.length === 0) return res.json([]);
    const masterId = masterRes.rows[0].id;
    // Получаем услуги мастера
    const servRes = await pool.query('SELECT service_id FROM master_services WHERE master_id = $1', [masterId]);
    const serviceIds = servRes.rows.map(r => r.service_id);
    if (serviceIds.length === 0) return res.json([]);
    // Заявки на эти услуги
    const result = await pool.query('SELECT * FROM requests WHERE service = ANY($1::int[]) ORDER BY id DESC', [serviceIds]);
    return res.json(result.rows);
  } else {
    // Только свои заявки
    const result = await pool.query('SELECT * FROM requests WHERE user_id = $1 ORDER BY id DESC', [req.userId]);
    return res.json(result.rows);
  }
});

// --- Изменение создания заявки: только для авторизованных, user_id ---
app.post('/api/requests', roleAuth('user'), async (req, res) => {
  const { service, date, time, comment } = req.body;
  // Получаем профиль пользователя
  const userRes = await pool.query('SELECT fio, phone FROM users WHERE id = $1', [req.userId]);
  if (userRes.rows.length === 0) return res.status(400).json({ error: 'Пользователь не найден' });
  const { fio, phone } = userRes.rows[0];
  if (!service || !date || !time) {
    return res.status(400).json({ error: 'Заполните все обязательные поля' });
  }
  // Проверка занятости времени
  const exists = await pool.query(
    'SELECT id FROM requests WHERE date = $1 AND time = $2',
    [date, time]
  );
  if (exists.rows.length > 0) {
    return res.status(409).json({ error: 'Это время уже занято. Пожалуйста, выберите другое.' });
  }
  const result = await pool.query(
    'INSERT INTO requests (name, phone, service, date, time, comment, user_id) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
    [fio, phone, service, date, time, comment, req.userId]
  );
  res.json({ id: result.rows[0].id });
});

// Получить всех админов (и мастеров)
app.get('/api/admins', roleAuth('admin'), async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM admins ORDER BY id');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Получить пользователя по id
app.get('/api/users/:id', roleAuth('admin'), async (req, res) => {
  try {
    const result = await pool.query('SELECT id, fio, phone FROM users WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Пользователь не найден' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Получить всех пользователей (id, fio, phone)
app.get('/api/users', roleAuth('admin'), async (req, res) => {
  try {
    const result = await pool.query('SELECT id, fio, phone FROM users ORDER BY fio');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Экспорт заявок в CSV
app.get('/api/export/requests', roleAuth('admin'), async (req, res) => {
  const result = await pool.query('SELECT * FROM requests ORDER BY id DESC');
  const parser = new Parser();
  const csv = parser.parse(result.rows);
  res.header('Content-Type', 'text/csv');
  res.attachment('requests.csv');
  res.send(csv);
});

// Экспорт пользователей в CSV
app.get('/api/export/users', roleAuth('admin'), async (req, res) => {
  const result = await pool.query('SELECT * FROM users ORDER BY id');
  const parser = new Parser();
  const csv = parser.parse(result.rows);
  res.header('Content-Type', 'text/csv');
  res.attachment('users.csv');
  res.send(csv);
});

// Экспорт услуг в CSV
app.get('/api/export/services', roleAuth('admin'), async (req, res) => {
  const result = await pool.query('SELECT * FROM services ORDER BY id');
  const parser = new Parser();
  const csv = parser.parse(result.rows);
  res.header('Content-Type', 'text/csv');
  res.attachment('services.csv');
  res.send(csv);
});

// Audit log: запись действий админов
async function logAdminAction(adminId, action, entity, entityId, details) {
  await pool.query('INSERT INTO audit_log (admin_id, action, entity, entity_id, details, ts) VALUES ($1, $2, $3, $4, $5, NOW())', [adminId, action, entity, entityId, details]);
}

// Сброс пароля пользователя через админку
app.post('/api/users/:id/reset-password', roleAuth('admin'), async (req, res) => {
  const { newPassword } = req.body;
  if (!newPassword || newPassword.length < 6) return res.status(400).json({ error: 'Пароль слишком короткий' });
  const hash = await bcrypt.hash(newPassword, 10);
  await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hash, req.params.id]);
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT}`);
}); 