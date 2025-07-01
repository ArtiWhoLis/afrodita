document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('login-form');
    const message = document.getElementById('login-message');
    const phoneInput = document.getElementById('phone');
    const tabUser = document.getElementById('tab-user');
    const tabAdmin = document.getElementById('tab-admin');
    const phoneLabel = document.querySelector('label[for="phone"]');
    let isAdmin = false;

    // Маска телефона для пользователя
    function enablePhoneMask() {
        phoneInput.value = '+7 (';
        phoneInput.addEventListener('input', phoneMaskHandler);
        phoneInput.addEventListener('focus', phoneMaskFocus);
    }
    function disablePhoneMask() {
        phoneInput.removeEventListener('input', phoneMaskHandler);
        phoneInput.removeEventListener('focus', phoneMaskFocus);
        phoneInput.value = '';
    }
    function phoneMaskHandler(e) {
        let v = this.value.replace(/\D/g, '');
        if (v.startsWith('7')) v = v.slice(1);
        if (v.length > 10) v = v.slice(0, 10);
        let formatted = '+7 (';
        if (v.length > 0) formatted += v.slice(0, 3);
        if (v.length >= 3) formatted += ') ' + v.slice(3, 6);
        if (v.length >= 6) formatted += '-' + v.slice(6, 8);
        if (v.length >= 8) formatted += '-' + v.slice(8, 10);
        this.value = formatted;
    }
    function phoneMaskFocus() {
        if (!this.value.startsWith('+7')) this.value = '+7 (';
    }
    function setTab(admin) {
        isAdmin = admin;
        if (admin) {
            tabAdmin.classList.add('active');
            tabUser.classList.remove('active');
            phoneInput.removeAttribute('pattern');
            phoneInput.setAttribute('placeholder', 'Логин администратора');
            if (phoneLabel) phoneLabel.textContent = 'Логин';
            disablePhoneMask();
            // Анимация
            tabAdmin.style.transition = 'background 0.2s, border-bottom 0.2s';
            tabUser.style.transition = 'background 0.2s, border-bottom 0.2s';
        } else {
            tabUser.classList.add('active');
            tabAdmin.classList.remove('active');
            phoneInput.setAttribute('pattern', '\+7 \([0-9]{3}\) [0-9]{3}-[0-9]{2}-[0-9]{2}');
            phoneInput.setAttribute('placeholder', '+7 (XXX) XXX-XX-XX');
            if (phoneLabel) phoneLabel.textContent = 'Телефон';
            enablePhoneMask();
            // Анимация
            tabUser.style.transition = 'background 0.2s, border-bottom 0.2s';
            tabAdmin.style.transition = 'background 0.2s, border-bottom 0.2s';
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
                    window.location.href = 'admin.html';
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