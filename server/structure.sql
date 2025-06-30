-- Таблица услуг
CREATE TABLE IF NOT EXISTS services (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT
);

-- Таблица админов
CREATE TABLE IF NOT EXISTS admins (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL DEFAULT 'admin' -- admin/master
);

-- Таблица мастеров
CREATE TABLE IF NOT EXISTS masters (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    fio VARCHAR(100) NOT NULL,
    position VARCHAR(100) NOT NULL -- Должность/услуга
);

-- Связь мастер-услуга (если мастер может выполнять несколько услуг)
CREATE TABLE IF NOT EXISTS master_services (
    id SERIAL PRIMARY KEY,
    master_id INTEGER REFERENCES masters(id) ON DELETE CASCADE,
    service_id INTEGER REFERENCES services(id) ON DELETE CASCADE
);

-- Добавить user_id в requests (если ещё нет)
ALTER TABLE requests ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE SET NULL; 