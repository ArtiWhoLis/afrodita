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