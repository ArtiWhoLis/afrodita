// Новый master.js — панель мастера (2024)

document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }
    const masterInfo = document.getElementById('master-info');
    const tbody = document.getElementById('requests-body');
    let allRequests = [];
    let servicesMap = {};
    let hasServices = true; // Новый флаг

    // Получить профиль мастера и его услуги
    async function loadMasterInfo() {
        // Профиль
        const profileRes = await fetch('/api/profile', { headers: { 'Authorization': 'Bearer ' + token } });
        const user = await profileRes.json();
        let position = 'Мастер';
        let masterId = null;
        let serviceIds = [];
        // Получить master_id
        const masterRes = await fetch('/api/my-master', { headers: { 'Authorization': 'Bearer ' + token } });
        if (masterRes.ok) {
            const m = await masterRes.json();
            if (m && m.position) position = m.position;
            if (m && m.id) masterId = m.id;
        }
        // Получить услуги мастера
        if (masterId) {
            const msRes = await fetch('/api/my-services', { headers: { 'Authorization': 'Bearer ' + token } });
            if (msRes.ok) {
                const ms = await msRes.json();
                serviceIds = ms.map(x => String(x));
                hasServices = serviceIds.length > 0;
            }
        }
        // Получить все услуги (для отображения названия)
        const servRes = await fetch('/api/services');
        if (servRes.ok) {
            const servs = await servRes.json();
            servicesMap = {};
            servs.forEach(s => servicesMap[s.id] = s.name);
        }
        masterInfo.innerHTML = `<b>${user.fio}</b> <span style='color:#888;'>(${position})</span><br><span style='color:#aaa;font-size:0.95em;'>Услуги: ${serviceIds.map(id => `<span class='service-badge'>${servicesMap[id]||id}</span>`).join(' ')}</span>`;
    }

    // Загрузить заявки мастера
    async function loadRequests() {
        tbody.innerHTML = '<tr><td colspan="6">Загрузка...</td></tr>';
        try {
            const res = await fetch('/api/my-requests', { headers: { 'Authorization': 'Bearer ' + token } });
            if (!res.ok) throw new Error('Ошибка загрузки заявок');
            const data = await res.json();
            allRequests = Array.isArray(data) ? data : [];
            window._allRequests = allRequests;
            renderRequests(allRequests);
        } catch (e) {
            tbody.innerHTML = '<tr><td colspan="6">Ошибка загрузки</td></tr>';
        }
    }

    function renderRequests(requests) {
        if (!requests.length) {
            if (!hasServices) {
                tbody.innerHTML = '<tr><td colspan="6" style="color:#d17a97;font-weight:bold;">Вам не назначены услуги. Обратитесь к администратору.</td></tr>';
            } else {
                tbody.innerHTML = '<tr><td colspan="6">Нет записей</td></tr>';
            }
            return;
        }
        tbody.innerHTML = '';
        requests.forEach(r => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${r.name}</td>
                <td>${r.phone}</td>
                <td>${servicesMap[r.service] || r.service}</td>
                <td>${r.date}</td>
                <td>${r.time}</td>
                <td>${r.comment || ''}</td>
            `;
            tbody.appendChild(tr);
        });
    }

    // --- Фильтрация ---
    function filterRequests() {
        let reqs = allRequests || [];
        const date = document.getElementById('filter-date').value;
        const search = document.getElementById('filter-search').value.trim().toLowerCase();
        if (date) reqs = reqs.filter(r => r.date === date);
        if (search) reqs = reqs.filter(r =>
            (r.name + r.phone + (servicesMap[r.service]||'')).toLowerCase().includes(search)
        );
        renderRequests(reqs);
    }
    ['filter-date','filter-search'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.oninput = filterRequests;
    });

    loadMasterInfo();
    loadRequests();
});

// Новый эндпоинт /api/my-master должен возвращать { position } для текущего мастера (или пусто) 