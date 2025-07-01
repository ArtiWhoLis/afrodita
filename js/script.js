document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('token');
    // if (!token) {
    //     window.location.href = 'login.html';
    //     return;
    // }
    const bookingForm = document.getElementById('booking-form');
    const formMessage = document.getElementById('form-message');
    const profileFio = document.getElementById('profile-fio');
    const profilePhone = document.getElementById('profile-phone');
    const editProfileBtn = document.getElementById('edit-profile-btn');
    // Получаем профиль
    if (profileFio && profilePhone) {
        fetch('/api/profile', { headers: { 'Authorization': 'Bearer ' + token } })
            .then(res => res.ok ? res.json() : null)
            .then(user => {
                if (!user) {
                    localStorage.removeItem('token');
                    // window.location.href = 'login.html';
                    return;
                }
                profileFio.textContent = user.fio;
                profilePhone.textContent = user.phone;
            });
    }
    if (editProfileBtn) {
        editProfileBtn.onclick = () => window.location.href = 'profile.html';
    }
    // Подгружаем услуги
    const serviceSelect = document.getElementById('service');
    const dateInput = document.getElementById('date');
    const timeInput = document.getElementById('time');
    if (serviceSelect) {
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
    }
    if (bookingForm && formMessage) {
        bookingForm.addEventListener('submit', function(e) {
            e.preventDefault();
            formMessage.textContent = '';
            const service = serviceSelect ? serviceSelect.value : '';
            const date = dateInput ? dateInput.value : '';
            const time = timeInput ? timeInput.value : '';
            console.log('service:', service, 'date:', date, 'time:', time);
            const comment = document.getElementById('comment') ? document.getElementById('comment').value : '';
            if (!service || !date || !time) {
                if (!service && serviceSelect) {
                    serviceSelect.classList.add('error');
                    serviceSelect.focus();
                }
                if (!date && dateInput) {
                    dateInput.classList.add('error');
                    if (service) dateInput.focus();
                }
                if (!time && timeInput) {
                    timeInput.classList.add('error');
                    if (service && date) timeInput.focus();
                }
                formMessage.textContent = 'Пожалуйста, заполните все поля.';
                formMessage.style.color = 'red';
                return;
            }
            if (time < '10:00' || time > '20:00') {
                formMessage.textContent = 'Время записи возможно только с 10:00 до 20:00';
                formMessage.style.color = 'red';
                return;
            }
            // Сбросить ошибку при успешной отправке
            [serviceSelect, dateInput, timeInput].forEach(el => el && el.classList.remove('error'));
            const token = localStorage.getItem('token');
            fetch('/api/requests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
                body: JSON.stringify({ service: Number(service), date, time, comment })
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