const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET || 'afrodita_secret';
const app = express();
const PORT = process.env.PORT || 3001;

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

// Админ-логин (жёстко заданные логин и пароль)
const ADMIN_LOGIN = 'anton';
const ADMIN_PASSWORD = '123456';

app.post('/api/admin/login', (req, res) => {
  const { login, password } = req.body;
  if (login === ADMIN_LOGIN && password === ADMIN_PASSWORD) {
    const token = jwt.sign({ admin: true }, SECRET, { expiresIn: '7d' });
    return res.json({ token });
  }
  res.status(401).json({ error: 'Неверный логин или пароль администратора' });
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

app.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT}`);
}); 