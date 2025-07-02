document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }
    const tbody = document.getElementById('myreq-body');
    let allRequests = [];
    let servicesMap = {};

    // Получить все услуги (для отображения названия)
    async function loadServices() {
        const servRes = await fetch('/api/services');
        if (servRes.ok) {
            const servs = await servRes.json();
            servicesMap = {};
            servs.forEach(s => servicesMap[s.id] = s.name);
        }
    }

    // Загрузить заявки пользователя
    async function loadRequests() {
        tbody.innerHTML = '<tr><td colspan="4">Загрузка...</td></tr>';
        try {
            const res = await fetch('/api/my-requests', { headers: { 'Authorization': 'Bearer ' + token } });
            if (!res.ok) throw new Error('Ошибка загрузки заявок');
            const data = await res.json();
            allRequests = Array.isArray(data) ? data : [];
            renderRequests(allRequests);
        } catch (e) {
            tbody.innerHTML = '<tr><td colspan="4">Ошибка загрузки</td></tr>';
        }
    }

    function renderRequests(requests) {
        if (!requests.length) {
            tbody.innerHTML = '<tr><td colspan="4">Нет записей</td></tr>';
            return;
        }
        tbody.innerHTML = '';
        requests.forEach(r => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
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
            (servicesMap[r.service]||'').toLowerCase().includes(search) ||
            (r.date||'').includes(search) ||
            (r.comment||'').toLowerCase().includes(search)
        );
        renderRequests(reqs);
    }
    ['filter-date','filter-search'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.oninput = filterRequests;
    });

    (async function() {
        await loadServices();
        await loadRequests();
    })();
}); 