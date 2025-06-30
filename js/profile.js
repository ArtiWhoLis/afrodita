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
    // Валидация и автоформат номера
    form.phone.addEventListener('input', function(e) {
        let v = this.value.replace(/\D/g, '');
        if (v.length > 10) v = v.slice(0, 10);
        let formatted = '+7 (';
        if (v.length > 0) formatted += v.slice(0, 3);
        if (v.length >= 3) formatted += ') ' + v.slice(3, 6);
        if (v.length >= 6) formatted += '-' + v.slice(6, 8);
        if (v.length >= 8) formatted += '-' + v.slice(8, 10);
        this.value = formatted;
    });
    // Сохранить изменения
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        message.textContent = '';
        const fio = form.fio.value.trim();
        const phone = form.phone.value.trim();
        if (!fio || fio.length < 3) {
            message.textContent = 'Введите корректное ФИО (минимум 3 символа)';
            message.style.color = 'red';
            return;
        }
        if (!/^\+7 \([0-9]{3}\) [0-9]{3}-[0-9]{2}-[0-9]{2}$/.test(phone)) {
            message.textContent = 'Введите телефон в формате +7 (XXX) XXX-XX-XX';
            message.style.color = 'red';
            return;
        }
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