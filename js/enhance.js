// Анимация появления fade-in
function onScrollFadeIn() {
    document.querySelectorAll('.fade-in').forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight - 60) {
            el.classList.add('visible');
        }
    });
}
window.addEventListener('scroll', onScrollFadeIn);
document.addEventListener('DOMContentLoaded', onScrollFadeIn);

// Кнопка "Наверх"
const toTopBtn = document.getElementById('toTopBtn');
window.addEventListener('scroll', function() {
    if (window.scrollY > 300) {
        toTopBtn.style.display = 'block';
    } else {
        toTopBtn.style.display = 'none';
    }
});
toTopBtn && toTopBtn.addEventListener('click', function() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

// FAQ-аккордеон
const faqItems = document.querySelectorAll('.faq-item');
faqItems.forEach(item => {
    item.addEventListener('click', function() {
        this.classList.toggle('open');
    });
});

// Маска для телефона
const phoneInput = document.getElementById('phone');
if (phoneInput) {
    phoneInput.addEventListener('input', function(e) {
        let x = this.value.replace(/\D/g, '').slice(0, 11);
        let formatted = '+7 ';
        if (x.length > 1) formatted += '(' + x.slice(1, 4);
        if (x.length >= 4) formatted += ') ' + x.slice(4, 7);
        if (x.length >= 7) formatted += '-' + x.slice(7, 9);
        if (x.length >= 9) formatted += '-' + x.slice(9, 11);
        this.value = formatted.trim();
    });
} 