document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('register-form');
    const message = document.getElementById('register-message');
    const phoneInput = document.getElementById('phone');
    if (phoneInput) {
        phoneInput.value = '+7 (';
        phoneInput.addEventListener('input', function(e) {
            let v = this.value.replace(/\D/g, '');
            if (v.startsWith('7')) v = v.slice(1); // не дублируем +7
            if (v.length > 10) v = v.slice(0, 10);
            let formatted = '+7 (';
            if (v.length > 0) formatted += v.slice(0, 3);
            if (v.length >= 3) formatted += ') ' + v.slice(3, 6);
            if (v.length >= 6) formatted += '-' + v.slice(6, 8);
            if (v.length >= 8) formatted += '-' + v.slice(8, 10);
            this.value = formatted;
        });
        phoneInput.addEventListener('focus', function() {
            if (!this.value.startsWith('+7')) this.value = '+7 (';
        });
    }
    if (form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            message.textContent = '';
            const fio = form.fio.value.trim();
            const phone = form.phone.value.trim();
            const password = form.password.value;
            try {
                const res = await fetch('/api/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ fio, phone, password })
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Ошибка регистрации');
                localStorage.setItem('token', data.token);
                window.location.href = 'profile.html';
            } catch (err) {
                message.textContent = err.message;
                message.style.color = 'red';
            }
        });
    }
}); 