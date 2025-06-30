document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('login-form');
    const message = document.getElementById('login-message');
    const phoneInput = document.getElementById('phone');
    const tabUser = document.getElementById('tab-user');
    const tabAdmin = document.getElementById('tab-admin');
    let isAdmin = false;

    function setTab(admin) {
        isAdmin = admin;
        if (admin) {
            tabAdmin.classList.add('active');
            tabUser.classList.remove('active');
            phoneInput.removeAttribute('pattern');
            phoneInput.setAttribute('placeholder', 'Логин администратора');
            phoneInput.value = '';
        } else {
            tabUser.classList.add('active');
            tabAdmin.classList.remove('active');
            phoneInput.setAttribute('pattern', '\+7 \([0-9]{3}\) [0-9]{3}-[0-9]{2}-[0-9]{2}');
            phoneInput.setAttribute('placeholder', '+7 (XXX) XXX-XX-XX');
            phoneInput.value = '';
        }
    }
    if (tabUser && tabAdmin) {
        tabUser.addEventListener('click', function() { setTab(false); });
        tabAdmin.addEventListener('click', function() { setTab(true); });
    }
    setTab(false); // По умолчанию пользователь

    if (form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            message.textContent = '';
            const phone = form.phone.value.trim();
            const password = form.password.value;
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