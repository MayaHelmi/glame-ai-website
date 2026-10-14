/**
 * Login/Signup interactivity — PLACEHOLDER prototype only.
 * No real authentication is wired up: submitting either form just
 * navigates to home.html so the click-through flow can be reviewed.
 */
(function () {
  const passwordInput = document.getElementById('password-input');
  const toggleButton = document.getElementById('toggle-password');
  const eyeIcon = document.getElementById('eye-icon');

  if (toggleButton && passwordInput && eyeIcon) {
    toggleButton.addEventListener('click', function () {
      const isPassword = passwordInput.getAttribute('type') === 'password';
      passwordInput.setAttribute('type', isPassword ? 'text' : 'password');
      eyeIcon.textContent = isPassword ? 'visibility_off' : 'visibility';
    });
  }

  const form = document.getElementById('auth-form');
  if (form) {
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      window.location.href = 'home.html';
    });
  }
})();
