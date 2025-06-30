document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('register-form');
    const message = document.getElementById('register-message');
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