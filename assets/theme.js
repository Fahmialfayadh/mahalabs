document.addEventListener('DOMContentLoaded', () => {
    initDarkMode();
});

function initDarkMode() {
    const toggleBtn = document.getElementById('theme-toggle');
    const body = document.body;

    // Check saved
    const savedTheme = localStorage.getItem('theme');

    // Apply immediate if saved or system pref
    // Apply dark mode by default unless 'light' is explicitly saved
    if (savedTheme === 'light') {
        body.classList.remove('dark-mode');
        updateIcon(false);
    } else {
        // Default to dark mode (saved='dark' or null)
        body.classList.add('dark-mode');
        updateIcon(true);
    }

    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            const isDark = body.classList.toggle('dark-mode');
            localStorage.setItem('theme', isDark ? 'dark' : 'light');

            // Add slight animation to button
            toggleBtn.style.transform = 'rotate(360deg)';
            setTimeout(() => {
                toggleBtn.style.transform = '';
            }, 300);

            updateIcon(isDark);
        });
    }

    function updateIcon(isDark) {
        if (!toggleBtn) return;
        toggleBtn.innerHTML = isDark ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-solid fa-moon"></i>';
        toggleBtn.setAttribute('aria-label', isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode');
    }
}
