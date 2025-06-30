document.addEventListener('DOMContentLoaded', function() {
    const bookingForm = document.getElementById('booking-form');
    const formMessage = document.getElementById('form-message');

    // Автозаполнение из localStorage
    if (bookingForm) {
        const nameInput = document.getElementById('name');
        const phoneInput = document.getElementById('phone');
        const token = localStorage.getItem('token');
        if (token && nameInput && phoneInput) {
            fetch('/api/profile', {
                headers: { 'Authorization': 'Bearer ' + token }
            })
            .then(res => res.ok ? res.json() : null)
            .then(user => {
                if (user) {
                    nameInput.value = user.fio;
                    phoneInput.value = user.phone;
                    nameInput.readOnly = true;
                    phoneInput.readOnly = true;
                }
            });
        } else if (nameInput && phoneInput) {
            nameInput.readOnly = false;
            phoneInput.readOnly = false;
        }
    }

    if (bookingForm) {
        bookingForm.addEventListener('submit', function(e) {
            e.preventDefault();

            const name = document.getElementById('name').value;
            const service = document.getElementById('service').selectedOptions[0].text;
            const date = document.getElementById('date').value;
            const time = document.getElementById('time').value;
            const phone = document.getElementById('phone').value;
            const comment = document.getElementById('comment') ? document.getElementById('comment').value : '';

            // Basic validation
            const nameRegex = /^[А-Яа-яA-Za-zЁё\s]{1,40}$/;
            if (!name || !service || !date || !time || !phone) {
                formMessage.textContent = 'Пожалуйста, заполните все поля.';
                formMessage.style.color = 'red';
                return;
            }
            if (!nameRegex.test(name)) {
                formMessage.textContent = 'Имя должно содержать только буквы и быть не длиннее 40 символов.';
                formMessage.style.color = 'red';
                return;
            }
            // Проверка телефона по маске: +7 (XXX) XXX-XX-XX (18 символов)
            if (phone.length !== 18) {
                formMessage.textContent = 'Пожалуйста, введите корректный номер телефона полностью.';
                formMessage.style.color = 'red';
                return;
            }

            // Проверка времени (если нужно)
            if (time < '10:00' || time > '20:00') {
                formMessage.textContent = 'Время записи возможно только с 10:00 до 20:00';
                formMessage.style.color = 'red';
                return;
            }

            // Сохраняем имя и телефон в localStorage
            localStorage.setItem('afrodita_name', name);
            localStorage.setItem('afrodita_phone', phone);

            // Отправка заявки на сервер
            fetch('https://afrodita.onrender.com/api/requests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, phone, service, date, time, comment })
            })
            .then(res => res.json())
            .then(data => {
                if (data.error) {
                    formMessage.textContent = data.error;
                    formMessage.style.color = 'red';
                } else {
                    formMessage.textContent = `Спасибо, ${name}! Ваша заявка отправлена.`;
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

    const nameInput = document.getElementById('name');
    if (nameInput) {
        nameInput.addEventListener('input', function(e) {
            this.value = this.value.replace(/[^А-Яа-яA-Za-zЁё\s]/g, '');
            if (this.value.length > 40) {
                this.value = this.value.slice(0, 40);
            }
        });
    }
}); 