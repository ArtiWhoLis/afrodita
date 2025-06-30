document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('login-form');
    const message = document.getElementById('login-message');
    if (form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            message.textContent = '';
            const phone = form.phone.value.trim();
            const password = form.password.value;
            try {
                const res = await fetch('/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ phone, password })
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Ошибка входа');
                localStorage.setItem('token', data.token);
                window.location.href = 'profile.html';
            } catch (err) {
                message.textContent = err.message;
                message.style.color = 'red';
            }
        });
    }
}); 