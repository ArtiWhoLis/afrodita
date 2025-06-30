document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }
    const bookingForm = document.getElementById('booking-form');
    const formMessage = document.getElementById('form-message');
    const profileFio = document.getElementById('profile-fio');
    const profilePhone = document.getElementById('profile-phone');
    const editProfileBtn = document.getElementById('edit-profile-btn');
    // Получаем профиль
    fetch('/api/profile', { headers: { 'Authorization': 'Bearer ' + token } })
        .then(res => res.ok ? res.json() : null)
        .then(user => {
            if (!user) {
                localStorage.removeItem('token');
                window.location.href = 'login.html';
                return;
            }
            profileFio.textContent = user.fio;
            profilePhone.textContent = user.phone;
        });
    if (editProfileBtn) {
        editProfileBtn.onclick = () => window.location.href = 'profile.html';
    }
    // Подгружаем услуги
    const serviceSelect = document.getElementById('service');
    fetch('/api/services')
        .then(res => res.json())
        .then(services => {
            serviceSelect.innerHTML = '<option value="">--Пожалуйста, выберите--</option>';
            services.forEach(s => {
                const opt = document.createElement('option');
                opt.value = s.id;
                opt.textContent = s.name;
                serviceSelect.appendChild(opt);
            });
        });
    if (bookingForm) {
        bookingForm.addEventListener('submit', function(e) {
            e.preventDefault();
            formMessage.textContent = '';
            const service = serviceSelect.value;
            const date = document.getElementById('date').value;
            const time = document.getElementById('time').value;
            const comment = document.getElementById('comment') ? document.getElementById('comment').value : '';
            if (!service || !date || !time) {
                formMessage.textContent = 'Пожалуйста, заполните все поля.';
                formMessage.style.color = 'red';
                return;
            }
            if (time < '10:00' || time > '20:00') {
                formMessage.textContent = 'Время записи возможно только с 10:00 до 20:00';
                formMessage.style.color = 'red';
                return;
            }
            fetch('/api/requests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
                body: JSON.stringify({ service, date, time, comment })
            })
            .then(res => res.json())
            .then(data => {
                if (data.error) {
                    formMessage.textContent = data.error;
                    formMessage.style.color = 'red';
                } else {
                    formMessage.textContent = 'Спасибо! Ваша заявка отправлена.';
                    formMessage.style.color = 'green';
                    bookingForm.reset();
                }
            })
            .catch(() => {
                formMessage.textContent = 'Ошибка отправки заявки!';
                formMessage.style.color = 'red';
            });
        });
    }
}); 