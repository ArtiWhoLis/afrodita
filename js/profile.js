document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('profile-form');
    const message = document.getElementById('profile-message');
    const logoutBtn = document.getElementById('logout-btn');
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }
    // Получить профиль
    fetch('/api/profile', {
        headers: { 'Authorization': 'Bearer ' + token }
    })
    .then(res => {
        if (!res.ok) throw new Error('Ошибка авторизации');
        return res.json();
    })
    .then(user => {
        form.fio.value = user.fio;
        form.phone.value = user.phone;
    })
    .catch(() => {
        localStorage.removeItem('token');
        window.location.href = 'login.html';
    });
    // Сохранить изменения
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        message.textContent = '';
        const fio = form.fio.value.trim();
        const phone = form.phone.value.trim();
        try {
            const res = await fetch('/api/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                },
                body: JSON.stringify({ fio, phone })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Ошибка сохранения');
            message.textContent = 'Профиль обновлён!';
            message.style.color = 'green';
        } catch (err) {
            message.textContent = err.message;
            message.style.color = 'red';
        }
    });
    // Выход
    logoutBtn.addEventListener('click', function() {
        localStorage.removeItem('token');
        window.location.href = 'login.html';
    });
}); 