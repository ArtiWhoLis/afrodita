document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('login-form');
    const message = document.getElementById('login-message');
    const phoneInput = document.getElementById('phone');
    const tabUser = document.getElementById('tab-user');
    const tabMaster = document.getElementById('tab-master');
    const tabAdmin = document.getElementById('tab-admin');
    const phoneLabel = document.querySelector('label[for="phone"]');
    const loginIcon = document.getElementById('login-icon');
    let isAdmin = false;
    let isMaster = false;

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
    function setTab(admin, master) {
        isAdmin = admin;
        isMaster = master;
        if (admin) {
            tabAdmin.classList.add('active');
            tabUser.classList.remove('active');
            tabMaster.classList.remove('active');
            phoneInput.removeAttribute('pattern');
            phoneInput.setAttribute('placeholder', 'Логин администратора');
            if (phoneLabel) phoneLabel.textContent = 'Логин';
            disablePhoneMask();
            // Анимация
            tabAdmin.style.transition = 'background 0.2s, border-bottom 0.2s';
            tabUser.style.transition = 'background 0.2s, border-bottom 0.2s';
            tabMaster.style.transition = 'background 0.2s, border-bottom 0.2s';
            if (loginIcon) {
                loginIcon.src = 'https://cdn-icons-png.flaticon.com/512/2202/2202112.png';
                loginIcon.style.transform = 'scale(1.08) rotate(-6deg)';
                setTimeout(()=>loginIcon.style.transform='', 200);
            }
        } else if (master) {
            tabMaster.classList.add('active');
            tabUser.classList.remove('active');
            tabAdmin.classList.remove('active');
            phoneInput.removeAttribute('pattern');
            phoneInput.setAttribute('placeholder', 'Телефон мастера');
            if (phoneLabel) phoneLabel.textContent = 'Телефон';
            enablePhoneMask();
            // Анимация
            tabUser.style.transition = 'background 0.2s, border-bottom 0.2s';
            tabMaster.style.transition = 'background 0.2s, border-bottom 0.2s';
            tabAdmin.style.transition = 'background 0.2s, border-bottom 0.2s';
            if (loginIcon) {
                loginIcon.src = 'https://cdn-icons-png.flaticon.com/512/2922/2922510.png';
                loginIcon.style.transform = 'scale(1.08) rotate(6deg)';
                setTimeout(()=>loginIcon.style.transform='', 200);
            }
        } else {
            tabUser.classList.add('active');
            tabMaster.classList.remove('active');
            tabAdmin.classList.remove('active');
            phoneInput.setAttribute('pattern', '\+7 \([0-9]{3}\) [0-9]{3}-[0-9]{2}-[0-9]{2}');
            phoneInput.setAttribute('placeholder', '+7 (XXX) XXX-XX-XX');
            if (phoneLabel) phoneLabel.textContent = 'Телефон';
            enablePhoneMask();
            // Анимация
            tabUser.style.transition = 'background 0.2s, border-bottom 0.2s';
            tabMaster.style.transition = 'background 0.2s, border-bottom 0.2s';
            tabAdmin.style.transition = 'background 0.2s, border-bottom 0.2s';
            if (loginIcon) {
                loginIcon.src = 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png';
                loginIcon.style.transform = 'scale(1.08) rotate(6deg)';
                setTimeout(()=>loginIcon.style.transform='', 200);
            }
        }
    }
    if (tabUser && tabAdmin && tabMaster) {
        tabUser.addEventListener('click', function() { setTab(false, false); });
        tabMaster.addEventListener('click', function() { setTab(false, true); });
        tabAdmin.addEventListener('click', function() { setTab(true, false); });
    }
    setTab(false, false); // По умолчанию пользователь

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
                    window.location.replace('admin.html');
                } else if (isMaster) {
                    // Вход как мастер
                    res = await fetch('/api/role-login', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ phone, password })
                    });
                    data = await res.json();
                    if (!res.ok) throw new Error(data.error || 'Ошибка входа мастера');
                    localStorage.setItem('token', data.token);
                    window.location.replace('master.html');
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

    // Фокус-эффекты для полей
    document.querySelectorAll('#login-form input').forEach(inp => {
        inp.addEventListener('focus', function() {
            this.style.boxShadow = '0 0 0 2px #f7b0c3';
        });
        inp.addEventListener('blur', function() {
            this.style.boxShadow = '';
        });
    });
}); 