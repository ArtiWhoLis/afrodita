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

    function showRequests() {
        let requests = JSON.parse(localStorage.getItem('requests') || '[]');
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
            tbody.innerHTML = requests.map((r, i) =>
                `<tr><td>${r.name}</td><td>${r.phone}</td><td>${r.service}</td><td>${r.date}</td><td>${r.time}</td><td>${r.comment ? r.comment : ''}</td><td><button class="btn-cancel" data-index="${i}">Отменить</button></td></tr>`
            ).join('');
        }
        // Кнопки отмены
        document.querySelectorAll('.btn-cancel').forEach(btn => {
            btn.addEventListener('click', function() {
                const idx = this.getAttribute('data-index');
                let requests = JSON.parse(localStorage.getItem('requests') || '[]');
                requests.splice(idx, 1);
                localStorage.setItem('requests', JSON.stringify(requests));
                showRequests();
            });
        });
    }

    if (filterDate) filterDate.addEventListener('input', showRequests);
    if (filterService) filterService.addEventListener('input', showRequests);
    if (filterSearch) filterSearch.addEventListener('input', showRequests);
    if (clearBtn) clearBtn.addEventListener('click', function() {
        if (confirm('Удалить все заявки?')) {
            localStorage.removeItem('requests');
            showRequests();
        }
    });

    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const password = document.getElementById('admin-password').value;
            if (password === '123') {
                loginDiv.style.display = 'none';
                adminRequests.style.display = 'block';
                showRequests();
            } else {
                loginError.textContent = 'Неверный пароль!';
            }
        });
    } else {
        // Если формы нет, сразу показываем заявки (например, если убрали защиту)
        adminRequests.style.display = 'block';
        showRequests();
    }
}); 