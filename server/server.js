const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const path = require('path');
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

app.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT}`);
}); 