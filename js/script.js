document.addEventListener('DOMContentLoaded', function() {
    const bookingForm = document.getElementById('booking-form');
    const formMessage = document.getElementById('form-message');

    if (bookingForm) {
        bookingForm.addEventListener('submit', function(e) {
            e.preventDefault(); // Prevent actual form submission

            const name = document.getElementById('name').value;
            const service = document.getElementById('service').selectedOptions[0].text;
            
            // Basic validation
            if (!name || !service || !document.getElementById('date').value || !document.getElementById('time').value) {
                 formMessage.textContent = 'Пожалуйста, заполните все поля.';
                 formMessage.style.color = 'red';
                 return;
            }

            const timeValue = document.getElementById('time').value;
            // Проверка времени
            if (timeValue < '10:00' || timeValue > '20:00') {
                formMessage.textContent = 'Время записи возможно только с 10:00 до 20:00';
                formMessage.style.color = 'red';
                return;
            }

            // Проверка занятости времени
            const dateValue = document.getElementById('date').value;
            let requests = JSON.parse(localStorage.getItem('requests') || '[]');
            const isBusy = requests.some(r => r.date === dateValue && r.time === timeValue);
            if (isBusy) {
                formMessage.textContent = 'Это время уже занято. Пожалуйста, выберите другое.';
                formMessage.style.color = 'red';
                return;
            }

            formMessage.textContent = `Спасибо, ${name}! Вы записаны на услугу "${service}". Мы скоро свяжемся с вами.`;
            formMessage.style.color = 'green';
            
            // Сохраняем заявку в LocalStorage
            const phone = document.getElementById('phone').value;
            const date = document.getElementById('date').value;
            const time = document.getElementById('time').value;
            const comment = document.getElementById('comment') ? document.getElementById('comment').value : '';
            const request = { name, phone, service, date, time, comment };
            requests.push(request);
            localStorage.setItem('requests', JSON.stringify(requests));
            
            bookingForm.reset();
        });
    }
}); 