[![Перейти к репозиторию на GitHub](https://img.shields.io/badge/GitHub-afrodita-blue?logo=github)](https://github.com/ArtiWhoLis/afrodita)

# Салон красоты "Афродита"

Веб-приложение для онлайн-записи клиентов в салон красоты и администрирования заявок.

## Функционал
- Просмотр информации о салоне, услугах и контактах
- Онлайн-запись на услуги (выбор услуги, даты, времени, ввод контактов)
- Админ-панель для просмотра, фильтрации и удаления заявок
- Адаптивный дизайн для мобильных устройств

## Структура проекта
```
├── admin.html         # Страница админ-панели
├── booking.html       # Страница онлайн-записи
├── contacts.html      # Контакты салона
├── css/
│   └── style.css      # Стилизация сайта
├── index.html         # Главная страница
├── js/
│   ├── admin.js       # Логика админ-панели
│   ├── enhance.js     # Анимации, маска телефона, FAQ
│   └── script.js      # Логика формы записи
├── package.json       # Зависимости и скрипты запуска
├── package-lock.json  # Лок-файл npm
├── server/
│   └── server.js      # Серверная часть (Express + PostgreSQL)
├── services.html      # Описание услуг
```

## Установка и запуск
1. Клонируйте репозиторий:
   ```bash
   git clone https://github.com/ArtiWhoLis/afrodita.git
   cd afrodita
   ```
2. Установите зависимости:
   ```bash
   npm install
   ```
3. Запустите сервер:
   ```bash
   npm start
   ```
   Сервер будет доступен на http://localhost:3001

## Описание API
Серверная часть реализована на Express и работает с PostgreSQL.

- `GET /api/requests` — получить все заявки
- `POST /api/requests` — добавить заявку (требуются поля: name, phone, service, date, time, comment)
- `DELETE /api/requests/:id` — удалить заявку по id
- `DELETE /api/requests` — удалить все заявки

## Переменные окружения
Для подключения к своей базе PostgreSQL измените параметры в `server/server.js`:
```js
const pool = new Pool({
  user: '...',
  host: '...',
  database: '...',
  password: '...',
  port: 5432,
  ssl: { rejectUnauthorized: false }
});
```

---
© 2025 Салон красоты "Афродита". Все права защищены. 