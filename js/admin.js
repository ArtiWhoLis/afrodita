document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('login-form');
    const adminRequests = document.getElementById('admin-requests');
    const loginDiv = document.getElementById('admin-login');
    const loginError = document.getElementById('login-error');
    const tbody = document.getElementById('requests-body');
    const filterDate = document.getElementById('filter-date');
    const filterService = document.getElementById('filter-service');
    const filterSearch = document.getElementById('filter-search');
    const clearBtn = document.getElementById('clear-requests');

    let allRequests = [];

    async function fetchRequests() {
        const res = await fetch('https://afrodita.onrender.com/api/requests');
        allRequests = await res.json();
        showRequests();
    }

    function showRequests() {
        let requests = [...allRequests];
        // Фильтрация
        const dateVal = filterDate ? filterDate.value : '';
        const serviceVal = filterService ? filterService.value : '';
        const searchVal = filterSearch ? filterSearch.value.trim().toLowerCase() : '';
        if (dateVal) requests = requests.filter(r => r.date === dateVal);
        if (serviceVal) requests = requests.filter(r => r.service === serviceVal);
        if (searchVal) requests = requests.filter(r => (r.name && r.name.toLowerCase().includes(searchVal)) || (r.phone && r.phone.includes(searchVal)));
        if (requests.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">Заявок пока нет</td></tr>';
        } else {
            tbody.innerHTML = requests.map((r) =>
                `<tr><td>${r.name}</td><td>${r.phone}</td><td>${r.service}</td><td>${r.date}</td><td>${r.time}</td><td>${r.comment ? r.comment : ''}</td><td><button class="btn-cancel" data-id="${r.id}">Отменить</button></td></tr>`
            ).join('');
        }
        // Кнопки отмены
        document.querySelectorAll('.btn-cancel').forEach(btn => {
            btn.addEventListener('click', async function() {
                const id = this.getAttribute('data-id');
                await fetch(`https://afrodita.onrender.com/api/requests/${id}`, { method: 'DELETE' });
                await fetchRequests();
            });
        });
        renderCalendar(requests);
    }

    if (filterDate) filterDate.addEventListener('input', showRequests);
    if (filterService) filterService.addEventListener('input', showRequests);
    if (filterSearch) filterSearch.addEventListener('input', showRequests);
    if (clearBtn) clearBtn.addEventListener('click', async function() {
        if (confirm('Удалить все заявки?')) {
            await fetch('https://afrodita.onrender.com/api/requests', { method: 'DELETE' });
            await fetchRequests();
        }
    });

    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const password = document.getElementById('admin-password').value;
            if (password === '123') {
                loginDiv.style.display = 'none';
                adminRequests.style.display = 'block';
                await fetchRequests();
            } else {
                loginError.textContent = 'Неверный пароль!';
            }
        });
    } else {
        adminRequests.style.display = 'block';
        fetchRequests();
    }
});

// === КАЛЕНДАРЬ ДЛЯ АДМИНА ===
function renderCalendar(requests) {
    const calendarContainerId = 'admin-calendar';
    let calendarContainer = document.getElementById(calendarContainerId);
    if (!calendarContainer) {
        calendarContainer = document.createElement('div');
        calendarContainer.id = calendarContainerId;
        calendarContainer.style.marginTop = '40px';
        calendarContainer.style.overflowX = 'auto';
        adminRequests.appendChild(calendarContainer);
    }
    // Дни недели (7 дней от сегодня)
    const days = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() + i);
        days.push(d.toISOString().slice(0, 10));
    }
    // Временные слоты (как в форме)
    const times = [
        '10:00','10:30','11:00','11:30','12:00','12:30','13:00','13:30','14:00','14:30',
        '15:00','15:30','16:00','16:30','17:00','17:30','18:00','18:30','19:00','19:30','20:00'
    ];
    // Строим таблицу
    let html = '<table class="admin-table" style="min-width:900px"><thead><tr><th>Время</th>';
    for (const day of days) {
        html += `<th>${day}</th>`;
    }
    html += '</tr></thead><tbody>';
    for (const time of times) {
        html += `<tr><td>${time}</td>`;
        for (const day of days) {
            const found = requests.find(r => r.date === day && r.time === time);
            if (found) {
                html += `<td style="background:#fbe9f2;color:#b96580;font-weight:bold;">${found.name}<br>${found.phone}<br>${found.service}</td>`;
            } else {
                html += '<td style="background:#f9f9f9;"></td>';
            }
        }
        html += '</tr>';
    }
    html += '</tbody></table>';
    calendarContainer.innerHTML = '<h3 style="margin-bottom:10px;">Расписание на 7 дней</h3>' + html;
} 