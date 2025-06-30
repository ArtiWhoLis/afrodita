// master.js — панель мастера

document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }
    const masterInfo = document.getElementById('master-info');
    const tbody = document.getElementById('requests-body');
    // Получить профиль мастера
    fetch('/api/profile', { headers: { 'Authorization': 'Bearer ' + token } })
        .then(res => res.ok ? res.json() : null)
        .then(user => {
            if (!user) {
                localStorage.removeItem('token');
                window.location.href = 'login.html';
                return;
            }
            // Получить должность мастера
            fetch('/api/masters', { headers: { 'Authorization': 'Bearer ' + token } })
                .then(res => res.json())
                .then(masters => {
                    const m = (masters || []).find(m => m.user_id === user.id);
                    masterInfo.innerHTML = `<b>${user.fio}</b> <span style='color:#888;'>(${m ? m.position : 'Мастер'})</span>`;
                });
        });
    // Загрузить заявки мастера
    async function loadRequests() {
        tbody.innerHTML = '<tr><td colspan="6">Загрузка...</td></tr>';
        const res = await fetch('/api/my-requests', { headers: { 'Authorization': 'Bearer ' + token } });
        const data = await res.json();
        window._allRequests = data;
        renderRequests(data);
    }
    function renderRequests(requests) {
        if (!requests.length) {
            tbody.innerHTML = '<tr><td colspan="6">Нет записей</td></tr>';
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
            `;
            tbody.appendChild(tr);
        });
    }
    // --- Фильтрация ---
    function filterRequests() {
        let reqs = window._allRequests || [];
        const date = document.getElementById('filter-date').value;
        const search = document.getElementById('filter-search').value.trim().toLowerCase();
        if (date) reqs = reqs.filter(r => r.date === date);
        if (search) reqs = reqs.filter(r => (r.name + r.phone).toLowerCase().includes(search));
        renderRequests(reqs);
    }
    ['filter-date','filter-search'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.oninput = filterRequests;
    });
    loadRequests();
}); 