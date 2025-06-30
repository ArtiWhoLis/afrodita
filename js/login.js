document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('login-form');
    const message = document.getElementById('login-message');
    const adminMode = document.getElementById('admin-mode');
    if (form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            message.textContent = '';
            const phone = form.phone.value.trim();
            const password = form.password.value;
            const isAdmin = adminMode && adminMode.checked;
            try {
                let res, data;
                if (isAdmin) {
                    // Вход как админ
                    res = await fetch('/api/admin/login', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ login: phone, password })
                    });
                    data = await res.json();
                    if (!res.ok) throw new Error(data.error || 'Ошибка входа администратора');
                    localStorage.setItem('adminToken', data.token);
                    window.location.href = 'admin-panel.html';
                } else {
                    // Обычный пользователь
                    res = await fetch('/api/login', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ phone, password })
                    });
                    data = await res.json();
                    if (!res.ok) throw new Error(data.error || 'Ошибка входа');
                    localStorage.setItem('token', data.token);
                    window.location.href = 'profile.html';
                }
            } catch (err) {
                message.textContent = err.message;
                message.style.color = 'red';
            }
        });
    }
}); 