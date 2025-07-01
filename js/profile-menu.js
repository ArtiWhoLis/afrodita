// profile-menu.js
// Динамически управляет кнопкой профиля/входа в хедере

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
        // Получаем имя пользователя
        fetch('/api/profile', { headers: { 'Authorization': 'Bearer ' + token } })
            .then(res => res.ok ? res.json() : null)
            .then(user => {
                if (!user) throw new Error();
                actions.innerHTML = `
                  <div class="profile-menu">
                    <button class="profile-btn" id="profileBtn" type="button">
                      <span class="profile-avatar">${user.fio[0] || '?'}</span>
                      <span class="profile-name">${user.fio.split(' ')[0]}</span>
                      <svg class="profile-arrow" width="16" height="16" viewBox="0 0 20 20"><path d="M5 8l5 5 5-5" stroke="#888" stroke-width="2" fill="none"/></svg>
                    </button>
                    <div class="profile-dropdown" id="profileDropdown">
                      <a href="profile.html">Профиль</a>
                      <a href="#" id="logoutLink">Выйти</a>
                    </div>
                  </div>
                `;
                // Выпадающее меню
                const btn = document.getElementById('profileBtn');
                const dropdown = document.getElementById('profileDropdown');
                btn.addEventListener('click', function(e) {
                  e.stopPropagation();
                  dropdown.classList.toggle('open');
                });
                document.body.addEventListener('click', function(e) {
                  // Не закрывать, если клик по кнопке
                  if (e.target === btn || btn.contains(e.target)) return;
                  dropdown.classList.remove('open');
                });
                // Выход
                document.getElementById('logoutLink').onclick = (e) => {
                  e.preventDefault();
                  localStorage.removeItem('token');
                  window.location.href = 'login.html';
                };
            })
            .catch(() => {
                localStorage.removeItem('token');
                showAuthButtons();
            });
    } else {
        showAuthButtons();
    }
}); 