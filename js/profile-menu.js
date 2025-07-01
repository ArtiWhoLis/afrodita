// profile-menu.js
// Современная, надёжная кнопка профиля с выпадающим меню

document.addEventListener('DOMContentLoaded', function() {
    const actions = document.getElementById('header-actions');
    if (!actions) return;
    const token = localStorage.getItem('token');
    function showAuthButtons() {
        actions.innerHTML = `
          <a href="booking.html" class="btn">Записаться онлайн</a>
          <a href="login.html" class="btn btn-secondary">Вход</a>
        `;
    }
    if (token) {
        fetch('/api/profile', { headers: { 'Authorization': 'Bearer ' + token } })
            .then(res => res.ok ? res.json() : null)
            .then(user => {
                if (!user) throw new Error();
                actions.innerHTML = `
                  <div class="profile-menu">
                    <button class="profile-btn" id="profileBtn" type="button" aria-haspopup="true" aria-expanded="false">
                      <span class="profile-avatar">${user.fio[0] || '?'}</span>
                      <span class="profile-name">${user.fio.split(' ')[0]}</span>
                      <svg class="profile-arrow" width="16" height="16" viewBox="0 0 20 20"><path d="M5 8l5 5 5-5" stroke="#888" stroke-width="2" fill="none"/></svg>
                    </button>
                    <div class="profile-dropdown" id="profileDropdown" tabindex="-1">
                      <a href="profile.html">Профиль</a>
                      <a href="#" id="logoutLink">Выйти</a>
                    </div>
                  </div>
                `;
                const btn = document.getElementById('profileBtn');
                const dropdown = document.getElementById('profileDropdown');
                let isOpen = false;
                function openMenu() {
                  dropdown.classList.add('open');
                  btn.setAttribute('aria-expanded', 'true');
                  isOpen = true;
                }
                function closeMenu() {
                  dropdown.classList.remove('open');
                  btn.setAttribute('aria-expanded', 'false');
                  isOpen = false;
                }
                btn.addEventListener('click', function(e) {
                  e.preventDefault();
                  if (isOpen) {
                    closeMenu();
                  } else {
                    openMenu();
                  }
                });
                // Закрытие по клику вне меню
                document.addEventListener('click', function(e) {
                  if (!btn.contains(e.target) && !dropdown.contains(e.target)) {
                    closeMenu();
                  }
                });
                // Закрытие по Esc
                document.addEventListener('keydown', function(e) {
                  if (e.key === 'Escape') closeMenu();
                });
                // Выход
                document.getElementById('logoutLink').onclick = (e) => {
                  e.preventDefault();
                  localStorage.removeItem('token');
                  window.location.href = 'login.html';
                };
                // Для отладки
                console.log('Профиль-меню инициализировано');
            })
            .catch(() => {
                localStorage.removeItem('token');
                showAuthButtons();
            });
    } else {
        showAuthButtons();
    }
}); 