// profile-menu.js
// Простая логика открытия/закрытия меню профиля без fetch

document.addEventListener('DOMContentLoaded', function() {
  const menu = document.querySelector('.profile-menu');
  const btn = document.getElementById('profileBtn');
  const dropdown = document.getElementById('profileDropdown');
  if (!menu || !btn || !dropdown) return;
  let isOpen = false;
  function openMenu() {
    menu.classList.add('open');
    btn.setAttribute('aria-expanded', 'true');
    isOpen = true;
  }
  function closeMenu() {
    menu.classList.remove('open');
    btn.setAttribute('aria-expanded', 'false');
    isOpen = false;
  }
  btn.addEventListener('click', function(e) {
    e.preventDefault();
    isOpen ? closeMenu() : openMenu();
  });
  document.addEventListener('click', function(e) {
    if (!menu.contains(e.target)) closeMenu();
  });
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') closeMenu();
  });
  // Выход (заглушка)
  const logout = document.getElementById('logoutLink');
  if (logout) {
    logout.onclick = function(e) {
      e.preventDefault();
      alert('Здесь будет выход из аккаунта');
    };
  }
}); 