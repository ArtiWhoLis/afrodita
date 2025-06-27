document.addEventListener('DOMContentLoaded', function() {
    const bookingForm = document.getElementById('booking-form');
    const formMessage = document.getElementById('form-message');

    // Автозаполнение из localStorage
    if (bookingForm) {
        const nameInput = document.getElementById('name');
        const phoneInput = document.getElementById('phone');
        if (nameInput && localStorage.getItem('afrodita_name')) {
            nameInput.value = localStorage.getItem('afrodita_name');
        }
        if (phoneInput && localStorage.getItem('afrodita_phone')) {
            phoneInput.value = localStorage.getItem('afrodita_phone');
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
            if (!name || !service || !date || !time || !phone) {
                formMessage.textContent = 'Пожалуйста, заполните все поля.';
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
}); 