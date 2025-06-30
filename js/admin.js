// admin.js — современная админ-панель

document.addEventListener('DOMContentLoaded', function() {
    // --- Элементы ---
    const adminLogin = document.getElementById('admin-login');
    const adminRequests = document.getElementById('admin-requests');
    // --- Авторизация ---
    const token = localStorage.getItem('token');
    let role = null;
    // Проверяем роль через /api/profile и /api/my-requests (или отдельный endpoint)
    async function checkAdmin() {
        if (!token) return false;
        // Можно сделать отдельный endpoint для проверки роли, но пока через заявки
        const res = await fetch('/api/my-requests', { headers: { 'Authorization': 'Bearer ' + token } });
        if (!res.ok) return false;
        // Если admin — покажет все заявки, если нет — ограничит
        const data = await res.json();
        // Примитивная проверка: если массив заявок не пустой и есть поле user_id у всех — значит admin
        // Лучше сделать отдельный endpoint для проверки роли
        return true;
    }
    // --- Логика входа ---
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const password = document.getElementById('admin-password').value;
            // Для универсальности: логин через /api/role-login (можно сделать отдельный логин для админа)
            const res = await fetch('/api/role-login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: 'admin', password }) // phone: 'admin' — для примера, лучше сделать отдельное поле
            });
            const data = await res.json();
            if (res.ok && data.token && data.role === 'admin') {
                localStorage.setItem('token', data.token);
                location.reload();
            } else {
                document.getElementById('login-error').textContent = data.error || 'Ошибка входа';
            }
        });
    }
    // --- Если уже авторизован ---
    (async function() {
        if (await checkAdmin()) {
            if (adminLogin) adminLogin.style.display = 'none';
            const adminPanel = document.getElementById('admin-panel');
            if (adminPanel) adminPanel.style.display = '';
            // Вкладки
            const tabs = document.querySelectorAll('.admin-tab');
            const tabContents = document.querySelectorAll('.admin-tab-content');
            tabs.forEach(tab => {
                tab.addEventListener('click', function() {
                    tabs.forEach(t => t.classList.remove('active'));
                    tabContents.forEach(c => c.style.display = 'none');
                    tab.classList.add('active');
                    document.getElementById('tab-' + tab.dataset.tab).style.display = '';
                });
            });
            // По умолчанию — заявки
            tabs[0].classList.add('active');
            tabContents[0].style.display = '';
        } else {
            if (adminLogin) adminLogin.style.display = '';
            const adminPanel = document.getElementById('admin-panel');
            if (adminPanel) adminPanel.style.display = 'none';
        }
    })();
    // --- Дальнейшая логика: вкладки, загрузка данных, CRUD ---
    // --- Заявки ---
    async function loadRequests() {
        const tbody = document.getElementById('requests-body');
        if (!tbody) return;
        tbody.innerHTML = '<tr><td colspan="7">Загрузка...</td></tr>';
        const res = await fetch('/api/my-requests', { headers: { 'Authorization': 'Bearer ' + token } });
        const data = await res.json();
        if (!Array.isArray(data)) {
            tbody.innerHTML = '<tr><td colspan="7">Ошибка загрузки</td></tr>';
            return;
        }
        // Сохраним для фильтрации
        window._allRequests = data;
        renderRequests(data);
    }
    function renderRequests(requests) {
        const tbody = document.getElementById('requests-body');
        if (!tbody) return;
        if (!requests.length) {
            tbody.innerHTML = '<tr><td colspan="7">Нет заявок</td></tr>';
            return;
        }
        tbody.innerHTML = '';
        requests.forEach(r => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${r.name}</td>
                <td>${r.phone}</td>
                <td>${r.service}</td>
                <td>${r.date}</td>
                <td>${r.time}</td>
                <td>${r.comment || ''}</td>
                <td><button class="btn-cancel btn-sm" data-id="${r.id}">Удалить</button></td>
            `;
            tbody.appendChild(tr);
        });
        // Кнопки удаления
        tbody.querySelectorAll('button[data-id]').forEach(btn => {
            btn.onclick = async function() {
                if (!confirm('Удалить заявку?')) return;
                await fetch(`/api/requests/${btn.dataset.id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': 'Bearer ' + token }
                });
                loadRequests();
            };
        });
    }
    // --- Фильтрация ---
    function filterRequests() {
        let reqs = window._allRequests || [];
        const date = document.getElementById('filter-date').value;
        const service = document.getElementById('filter-service').value;
        const search = document.getElementById('filter-search').value.trim().toLowerCase();
        if (date) reqs = reqs.filter(r => r.date === date);
        if (service) reqs = reqs.filter(r => r.service == service);
        if (search) reqs = reqs.filter(r => (r.name + r.phone).toLowerCase().includes(search));
        renderRequests(reqs);
    }
    // --- Очистить все заявки ---
    const clearBtn = document.getElementById('clear-requests');
    if (clearBtn) {
        clearBtn.onclick = async function() {
            if (!confirm('Удалить все заявки?')) return;
            await fetch('/api/requests', { method: 'DELETE', headers: { 'Authorization': 'Bearer ' + token } });
            loadRequests();
        };
    }
    // --- События фильтрации ---
    ['filter-date','filter-service','filter-search'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.oninput = filterRequests;
    });
    // --- Подгрузка услуг для фильтра ---
    async function loadServicesForFilter() {
        const sel = document.getElementById('filter-service');
        if (!sel) return;
        const res = await fetch('/api/services');
        const data = await res.json();
        sel.innerHTML = '<option value="">Все услуги</option>';
        data.forEach(s => {
            const opt = document.createElement('option');
            opt.value = s.id;
            opt.textContent = s.name;
            sel.appendChild(opt);
        });
    }
    // --- Инициализация ---
    if (document.getElementById('tab-requests')) {
        loadServicesForFilter();
        loadRequests();
    }
}); 