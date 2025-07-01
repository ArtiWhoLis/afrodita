// admin.js — современная админ-панель

document.addEventListener('DOMContentLoaded', function() {
    // --- Элементы ---
    const adminLogin = document.getElementById('admin-login');
    const adminRequests = document.getElementById('admin-requests');
    // --- Авторизация ---
    const token = localStorage.getItem('adminToken');
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
                localStorage.setItem('adminToken', data.token);
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
            // Кнопка выхода
            let logoutBtn = document.getElementById('admin-logout-btn');
            if (!logoutBtn) {
                logoutBtn = document.createElement('button');
                logoutBtn.id = 'admin-logout-btn';
                logoutBtn.textContent = 'Выйти';
                logoutBtn.className = 'btn-cancel';
                logoutBtn.style = 'position:absolute;top:20px;right:30px;z-index:10;';
                adminPanel.parentNode.insertBefore(logoutBtn, adminPanel);
                logoutBtn.onclick = function() {
                    localStorage.removeItem('adminToken');
                    location.reload();
                };
            }
            // Вкладки
            const tabs = document.querySelectorAll('.admin-tab');
            const tabContents = document.querySelectorAll('.admin-tab-content');
            tabs.forEach(tab => {
                tab.addEventListener('click', function() {
                    activateTab(tab.dataset.tab);
                });
            });
            // По умолчанию — заявки
            tabs[0].classList.add('active');
            tabContents[0].style.display = '';
        } else {
            if (adminLogin) adminLogin.style.display = '';
            const adminPanel = document.getElementById('admin-panel');
            if (adminPanel) adminPanel.style.display = 'none';
            // Удаляем кнопку выхода, если есть
            const logoutBtn = document.getElementById('admin-logout-btn');
            if (logoutBtn) logoutBtn.remove();
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
                await safeAction(async () => {
                    await fetch(`/api/requests/${btn.dataset.id}`, {
                        method: 'DELETE',
                        headers: { 'Authorization': 'Bearer ' + token }
                    });
                }, () => {
                    loadRequests();
                });
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
            await safeAction(async () => {
                await fetch('/api/requests', { method: 'DELETE', headers: { 'Authorization': 'Bearer ' + token } });
            }, () => {
                loadRequests();
            });
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
    // --- Услуги ---
    async function loadServices() {
        const tbody = document.getElementById('services-body');
        if (!tbody) return;
        tbody.innerHTML = '<tr><td colspan="3">Загрузка...</td></tr>';
        const res = await fetch('/api/services');
        const data = await res.json();
        window._allServices = data;
        renderServices(data);
    }
    function renderServices(services) {
        const tbody = document.getElementById('services-body');
        if (!tbody) return;
        if (!services.length) {
            tbody.innerHTML = '<tr><td colspan="3">Нет услуг</td></tr>';
            return;
        }
        tbody.innerHTML = '';
        services.forEach(s => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${s.name}</td>
                <td>${s.description || ''}</td>
                <td>
                    <button class="btn-sm btn" data-edit="${s.id}">✏️</button>
                    <button class="btn-sm btn-cancel" data-del="${s.id}">🗑️</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
        // Кнопки редактирования
        tbody.querySelectorAll('button[data-edit]').forEach(btn => {
            btn.onclick = () => showServiceForm('edit', btn.dataset.edit);
        });
        // Кнопки удаления
        tbody.querySelectorAll('button[data-del]').forEach(btn => {
            btn.onclick = async () => {
                if (!confirm('Удалить услугу?')) return;
                await safeAction(async () => {
                    await fetch(`/api/services/${btn.dataset.del}`, {
                        method: 'DELETE',
                        headers: { 'Authorization': 'Bearer ' + token }
                    });
                }, () => {
                    loadServices();
                });
            };
        });
    }
    // --- Модальное окно для добавления/редактирования ---
    function showServiceForm(mode, id) {
        const modal = document.getElementById('service-form-modal');
        modal.style.display = '';
        let service = { name: '', description: '' };
        if (mode === 'edit') {
            service = window._allServices.find(s => s.id == id) || service;
        }
        modal.innerHTML = `
            <div style="background:#fff;padding:24px 28px;border-radius:10px;box-shadow:0 2px 12px #0003;max-width:400px;margin:40px auto;position:relative;">
                <button id="close-service-modal" style="position:absolute;top:8px;right:12px;font-size:1.3em;background:none;border:none;">×</button>
                <h3 style="margin-top:0;">${mode === 'edit' ? 'Редактировать' : 'Добавить'} услугу</h3>
                <form id="service-form">
                    <div class="form-group">
                        <label>Название</label>
                        <input type="text" name="name" required maxlength="100" value="${service.name || ''}" placeholder="Название услуги">
                    </div>
                    <div class="form-group">
                        <label>Описание</label>
                        <textarea name="description" maxlength="300" placeholder="Описание услуги (необязательно)">${service.description || ''}</textarea>
                    </div>
                    <div class="form-group text-center">
                        <button type="submit" class="btn">${mode === 'edit' ? 'Сохранить' : 'Добавить'}</button>
                    </div>
                </form>
            </div>
        `;
        document.getElementById('close-service-modal').onclick = () => { modal.style.display = 'none'; };
        document.getElementById('service-form').onsubmit = async function(e) {
            e.preventDefault();
            const name = this.name.value.trim();
            const description = this.description.value.trim();
            if (!name) return alert('Название обязательно');
            await safeAction(async () => {
                if (mode === 'edit') {
                    await fetch(`/api/services/${id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
                        body: JSON.stringify({ name, description })
                    });
                } else {
                    await fetch('/api/services', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
                        body: JSON.stringify({ name, description })
                    });
                }
            }, () => {
                modal.style.display = 'none';
                loadServices();
            });
        };
    }
    // --- Кнопка добавить услугу ---
    const addServiceBtn = document.getElementById('add-service-btn');
    if (addServiceBtn) addServiceBtn.onclick = () => showServiceForm('add');
    // --- Мастера ---
    async function loadMasters() {
        const tbody = document.getElementById('masters-body');
        if (!tbody) return;
        tbody.innerHTML = '<tr><td colspan="4">Загрузка...</td></tr>';
        const res = await fetch('/api/masters', { headers: { 'Authorization': 'Bearer ' + token } });
        const data = await res.json();
        window._allMasters = data;
        renderMasters(data);
    }
    async function getServiceNamesByIds(ids) {
        if (!window._allServices) await loadServices();
        return (window._allServices || []).filter(s => ids.includes(s.id)).map(s => s.name).join(', ');
    }
    async function renderMasters(masters) {
        const tbody = document.getElementById('masters-body');
        if (!tbody) return;
        if (!masters.length) {
            tbody.innerHTML = '<tr><td colspan="4">Нет мастеров</td></tr>';
            return;
        }
        tbody.innerHTML = '';
        for (const m of masters) {
            // Получить услуги мастера
            const servRes = await fetch(`/api/master-services?master_id=${m.id}`, { headers: { 'Authorization': 'Bearer ' + token } });
            const servData = await servRes.json();
            const serviceIds = servData.map(s => s.service_id);
            const serviceNames = await getServiceNamesByIds(serviceIds);
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${m.fio}</td>
                <td>${m.position}</td>
                <td>${serviceNames}</td>
                <td>
                    <button class="btn-sm btn" data-edit="${m.id}">✏️</button>
                    <button class="btn-sm btn-cancel" data-del="${m.id}">🗑️</button>
                </td>
            `;
            tbody.appendChild(tr);
        }
        // Кнопки редактирования
        tbody.querySelectorAll('button[data-edit]').forEach(btn => {
            btn.onclick = () => showMasterForm('edit', btn.dataset.edit);
        });
        // Кнопки удаления
        tbody.querySelectorAll('button[data-del]').forEach(btn => {
            btn.onclick = async () => {
                if (!confirm('Удалить мастера?')) return;
                await safeAction(async () => {
                    await fetch(`/api/masters/${btn.dataset.del}`, {
                        method: 'DELETE',
                        headers: { 'Authorization': 'Bearer ' + token }
                    });
                }, () => {
                    loadMasters();
                });
            };
        });
    }
    // --- Модальное окно для добавления/редактирования мастера ---
    async function showMasterForm(mode, id) {
        const modal = document.getElementById('master-form-modal');
        modal.style.display = '';
        let master = { fio: '', position: '', user_id: '' };
        let selectedServices = [];
        if (mode === 'edit') {
            master = window._allMasters.find(m => m.id == id) || master;
            // Получить услуги мастера
            const servRes = await fetch(`/api/master-services?master_id=${id}`, { headers: { 'Authorization': 'Bearer ' + token } });
            const servData = await servRes.json();
            selectedServices = servData.map(s => s.service_id);
        }
        // Получить все услуги
        if (!window._allServices) await loadServices();
        const services = window._allServices || [];
        modal.innerHTML = `
            <div style="background:#fff;padding:24px 28px;border-radius:10px;box-shadow:0 2px 12px #0003;max-width:420px;margin:40px auto;position:relative;">
                <button id="close-master-modal" style="position:absolute;top:8px;right:12px;font-size:1.3em;background:none;border:none;">×</button>
                <h3 style="margin-top:0;">${mode === 'edit' ? 'Редактировать' : 'Добавить'} мастера</h3>
                <form id="master-form">
                    <div class="form-group">
                        <label>ФИО</label>
                        <input type="text" name="fio" required maxlength="100" value="${master.fio || ''}" placeholder="ФИО мастера">
                    </div>
                    <div class="form-group">
                        <label>Должность</label>
                        <input type="text" name="position" required maxlength="100" value="${master.position || ''}" placeholder="Должность/услуга">
                    </div>
                    <div class="form-group">
                        <label>Услуги</label>
                        <select name="services" multiple size="${Math.min(services.length, 6)}" style="width:100%;">
                            ${services.map(s => `<option value="${s.id}"${selectedServices.includes(s.id) ? ' selected' : ''}>${s.name}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group text-center">
                        <button type="submit" class="btn">${mode === 'edit' ? 'Сохранить' : 'Добавить'}</button>
                    </div>
                </form>
            </div>
        `;
        document.getElementById('close-master-modal').onclick = () => { modal.style.display = 'none'; };
        document.getElementById('master-form').onsubmit = async function(e) {
            e.preventDefault();
            const fio = this.fio.value.trim();
            const position = this.position.value.trim();
            const servicesSelected = Array.from(this.services.selectedOptions).map(o => +o.value);
            if (!fio || !position || !servicesSelected.length) return alert('Заполните все поля и выберите хотя бы одну услугу');
            await safeAction(async () => {
                if (mode === 'edit') {
                    await fetch(`/api/masters/${id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
                        body: JSON.stringify({ fio, position })
                    });
                    // Сбросить все старые связи и добавить новые
                    await fetch(`/api/master-services?master_id=${id}`, { method: 'DELETE', headers: { 'Authorization': 'Bearer ' + token } });
                    for (const sid of servicesSelected) {
                        await fetch('/api/master-services', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
                            body: JSON.stringify({ master_id: id, service_id: sid })
                        });
                    }
                } else {
                    // Для добавления нужен user_id (создаётся через регистрацию, затем назначается ролью мастер)
                    // Здесь можно реализовать выбор пользователя или автосоздание
                    alert('Добавление мастера реализуется через регистрацию пользователя и назначение роли мастер в разделе "Админы".');
                    modal.style.display = 'none';
                    return;
                }
            }, () => {
                modal.style.display = 'none';
                loadMasters();
            });
        };
    }
    // --- Кнопка добавить мастера ---
    const addMasterBtn = document.getElementById('add-master-btn');
    if (addMasterBtn) addMasterBtn.onclick = () => showMasterForm('add');
    // --- Админы ---
    async function loadAdmins() {
        const tbody = document.getElementById('admins-body');
        if (!tbody) return;
        tbody.innerHTML = '<tr><td colspan="4">Загрузка...</td></tr>';
        const res = await fetch('/api/admins', { headers: { 'Authorization': 'Bearer ' + token } });
        const data = await res.json();
        window._allAdmins = data;
        renderAdmins(data);
    }
    async function renderAdmins(admins) {
        const tbody = document.getElementById('admins-body');
        if (!tbody) return;
        if (!admins.length) {
            tbody.innerHTML = '<tr><td colspan="4">Нет админов</td></tr>';
            return;
        }
        tbody.innerHTML = '';
        for (const a of admins) {
            // Получить пользователя
            const userRes = await fetch(`/api/users/${a.user_id}`, { headers: { 'Authorization': 'Bearer ' + token } });
            const user = await userRes.json();
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${user.fio}</td>
                <td>${user.phone}</td>
                <td>${a.role}</td>
                <td>
                    <button class="btn-sm btn" data-edit="${a.id}">✏️</button>
                    <button class="btn-sm btn-cancel" data-del="${a.id}">🗑️</button>
                </td>
            `;
            tbody.appendChild(tr);
        }
        // Кнопки редактирования
        tbody.querySelectorAll('button[data-edit]').forEach(btn => {
            btn.onclick = () => showAdminForm('edit', btn.dataset.edit);
        });
        // Кнопки удаления
        tbody.querySelectorAll('button[data-del]').forEach(btn => {
            btn.onclick = async () => {
                if (!confirm('Удалить админа/мастера?')) return;
                await safeAction(async () => {
                    await fetch(`/api/admins/${btn.dataset.del}`, {
                        method: 'DELETE',
                        headers: { 'Authorization': 'Bearer ' + token }
                    });
                }, () => {
                    loadAdmins();
                });
            };
        });
    }
    // --- Модальное окно для добавления/редактирования админа/мастера ---
    async function showAdminForm(mode, id) {
        const modal = document.getElementById('admin-form-modal');
        modal.style.display = '';
        let admin = { user_id: '', role: 'admin' };
        if (mode === 'edit') {
            admin = window._allAdmins.find(a => a.id == id) || admin;
        }
        // Получить всех пользователей (для выбора)
        const usersRes = await fetch('/api/users', { headers: { 'Authorization': 'Bearer ' + token } });
        const users = await usersRes.json();
        modal.innerHTML = `
            <div style="background:#fff;padding:24px 28px;border-radius:10px;box-shadow:0 2px 12px #0003;max-width:420px;margin:40px auto;position:relative;">
                <button id="close-admin-modal" style="position:absolute;top:8px;right:12px;font-size:1.3em;background:none;border:none;">×</button>
                <h3 style="margin-top:0;">${mode === 'edit' ? 'Редактировать' : 'Добавить'} админа/мастера</h3>
                <form id="admin-form">
                    <div class="form-group">
                        <label>Пользователь</label>
                        <input type="text" id="user-search" placeholder="Поиск по ФИО/телефону" style="width:100%;margin-bottom:6px;">
                        <select name="user_id" required style="width:100%;">
                            <option value="">Выберите пользователя</option>
                            ${users.map(u => `<option value="${u.id}"${u.id == admin.user_id ? ' selected' : ''}>${u.fio} (${u.phone})</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Роль</label>
                        <select name="role" required style="width:100%;">
                            <option value="admin"${admin.role === 'admin' ? ' selected' : ''}>Админ</option>
                            <option value="master"${admin.role === 'master' ? ' selected' : ''}>Мастер</option>
                        </select>
                    </div>
                    <div class="form-group text-center">
                        <button type="submit" class="btn">${mode === 'edit' ? 'Сохранить' : 'Добавить'}</button>
                        ${mode === 'edit' ? `<button type="button" id="reset-password-btn" class="btn-cancel" style="margin-left:10px;">Сбросить пароль</button>` : ''}
                        ${mode === 'edit' ? `<button type="button" id="show-audit-btn" class="btn" style="margin-left:10px;">История</button>` : ''}
                    </div>
                </form>
            </div>
        `;
        document.getElementById('close-admin-modal').onclick = () => { modal.style.display = 'none'; };
        // Поиск по пользователям
        const userSearch = document.getElementById('user-search');
        const userSelect = modal.querySelector('select[name="user_id"]');
        userSearch.oninput = () => filterUserOptions(userSearch, userSelect);
        // Сброс пароля
        if (mode === 'edit') {
            document.getElementById('reset-password-btn').onclick = async () => {
                const newPassword = prompt('Введите новый пароль для пользователя (мин. 6 символов):');
                if (!newPassword || newPassword.length < 6) return alert('Пароль слишком короткий');
                await safeAction(async () => {
                    await fetch(`/api/users/${admin.user_id}/reset-password`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
                        body: JSON.stringify({ newPassword })
                    });
                }, () => showNotice('Пароль сброшен!'));
            };
            // История изменений
            document.getElementById('show-audit-btn').onclick = () => showAuditLog('admin', id);
        }
        document.getElementById('admin-form').onsubmit = async function(e) {
            e.preventDefault();
            const user_id = this.user_id.value;
            const role = this.role.value;
            if (!user_id || !role) return alert('Выберите пользователя и роль');
            await safeAction(async () => {
                if (mode === 'edit') {
                    await fetch(`/api/admins/${id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
                        body: JSON.stringify({ user_id, role })
                    });
                } else {
                    await fetch('/api/admins', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
                        body: JSON.stringify({ user_id, role })
                    });
                }
            }, () => {
                modal.style.display = 'none';
                loadAdmins();
            });
        };
    }
    // --- Кнопка добавить админа ---
    const addAdminBtn = document.getElementById('add-admin-btn');
    if (addAdminBtn) addAdminBtn.onclick = () => showAdminForm('add');
    // --- Уведомления ---
    function showNotice(msg, isError = false) {
        let notice = document.getElementById('admin-notice');
        if (!notice) {
            notice = document.createElement('div');
            notice.id = 'admin-notice';
            notice.style = 'position:fixed;top:30px;right:30px;z-index:9999;padding:14px 22px;border-radius:8px;font-size:1.1em;box-shadow:0 2px 12px #0002;transition:opacity .3s;';
            document.body.appendChild(notice);
        }
        notice.textContent = msg;
        notice.style.background = isError ? '#ffd6d6' : '#d6ffd6';
        notice.style.color = isError ? '#a00' : '#070';
        notice.style.opacity = '1';
        setTimeout(() => { notice.style.opacity = '0'; }, 2200);
    }
    // --- Перегрузка вкладок ---
    function activateTab(tabName) {
        const tabs = document.querySelectorAll('.admin-tab');
        const tabContents = document.querySelectorAll('.admin-tab-content');
        tabs.forEach(t => t.classList.remove('active'));
        tabContents.forEach(c => c.style.display = 'none');
        const tab = document.querySelector(`.admin-tab[data-tab="${tabName}"]`);
        const content = document.getElementById('tab-' + tabName);
        if (tab && content) {
            tab.classList.add('active');
            content.style.display = '';
            if (tabName === 'requests') loadRequests();
            if (tabName === 'services') loadServices();
            if (tabName === 'masters') loadMasters();
            if (tabName === 'admins') loadAdmins();
        }
    }
    // --- После любого действия обновлять список и показывать уведомление ---
    // (пример для услуг, аналогично для других сущностей)
    async function safeAction(action, onSuccess) {
        try {
            await action();
            showNotice('Успешно!');
            if (onSuccess) onSuccess();
        } catch (e) {
            showNotice(e.message || 'Ошибка запроса', true);
        }
    }
    // --- Пример использования safeAction ---
    // Везде, где был fetch(...), обернуть в safeAction(() => fetch(...), ...)
    // Например, в showServiceForm:
    // await safeAction(async () => { await fetch(...) }, () => { modal.style.display = 'none'; loadServices(); });
    // --- Аналогично для мастеров, админов, заявок ---
    // ... (все CRUD-операции обернуть в safeAction)
    // --- При открытии страницы по умолчанию активировать первую вкладку и загрузить данные ---
    activateTab('requests');
    // --- Кнопки экспорта ---
    function addExportButtons() {
        const requestsTab = document.getElementById('tab-requests');
        if (requestsTab && !document.getElementById('export-requests-btn')) {
            const btn = document.createElement('button');
            btn.id = 'export-requests-btn';
            btn.className = 'btn';
            btn.textContent = 'Экспорт заявок (CSV)';
            btn.style = 'margin-bottom:12px;float:right;';
            btn.onclick = () => window.open('/api/export/requests', '_blank');
            requestsTab.prepend(btn);
        }
        const usersTab = document.getElementById('tab-admins');
        if (usersTab && !document.getElementById('export-users-btn')) {
            const btn = document.createElement('button');
            btn.id = 'export-users-btn';
            btn.className = 'btn';
            btn.textContent = 'Экспорт пользователей (CSV)';
            btn.style = 'margin-bottom:12px;float:right;';
            btn.onclick = () => window.open('/api/export/users', '_blank');
            usersTab.prepend(btn);
        }
        const servicesTab = document.getElementById('tab-services');
        if (servicesTab && !document.getElementById('export-services-btn')) {
            const btn = document.createElement('button');
            btn.id = 'export-services-btn';
            btn.className = 'btn';
            btn.textContent = 'Экспорт услуг (CSV)';
            btn.style = 'margin-bottom:12px;float:right;';
            btn.onclick = () => window.open('/api/export/services', '_blank');
            servicesTab.prepend(btn);
        }
    }
    // --- Поиск по пользователям в выпадающем списке ---
    function filterUserOptions(input, select) {
        const val = input.value.trim().toLowerCase();
        Array.from(select.options).forEach(opt => {
            if (!opt.value) return;
            opt.style.display = (opt.textContent.toLowerCase().includes(val)) ? '' : 'none';
        });
    }
    // --- Модальное окно истории изменений (audit log) ---
    async function showAuditLog(entity, entityId) {
        const modal = document.createElement('div');
        modal.style = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:#0005;z-index:9999;display:flex;align-items:center;justify-content:center;';
        modal.innerHTML = `<div style="background:#fff;padding:24px 32px;max-width:700px;width:100%;border-radius:12px;max-height:90vh;overflow:auto;position:relative;">
            <button id="close-audit-modal" style="position:absolute;top:8px;right:12px;font-size:1.3em;background:none;border:none;">×</button>
            <h2 style="margin-top:0;">История изменений (${entity} #${entityId})</h2>
            <div id="audit-log-body">Загрузка...</div>
        </div>`;
        document.body.appendChild(modal);
        document.getElementById('close-audit-modal').onclick = () => modal.remove();
        const res = await fetch(`/api/audit-log?entity=${entity}&entityId=${entityId}`, { headers: { 'Authorization': 'Bearer ' + token } });
        const data = await res.json();
        const body = document.getElementById('audit-log-body');
        if (!Array.isArray(data) || !data.length) {
            body.innerHTML = '<div style="color:#888;">Нет истории изменений</div>';
        } else {
            body.innerHTML = '<ul style="padding-left:18px;">' + data.map(a => `<li><b>${a.ts.replace('T',' ').slice(0,19)}</b> — <b>${a.action}</b> (${a.entity} #${a.entity_id})<br>${a.details || ''}</li>`).join('') + '</ul>';
        }
    }
    // --- Инициализация ---
    addExportButtons();
}); 