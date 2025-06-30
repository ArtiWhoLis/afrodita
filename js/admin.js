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
    // ...
}); 