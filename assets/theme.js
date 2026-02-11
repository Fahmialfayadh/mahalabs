document.addEventListener('DOMContentLoaded', () => {
    initDarkMode();
});

function initDarkMode() {
    const toggleBtn = document.getElementById('theme-toggle');
    const body = document.body;
    const html = document.documentElement;

    // Check saved
    const savedTheme = localStorage.getItem('theme');

    // Apply immediate if saved or system pref
    // Default to 'light' unless 'dark' is explicitly saved
    const isDark = (savedTheme === 'dark');

    if (isDark) {
        html.classList.add('dark-mode');
        body.classList.add('dark-mode');
        updateIcon(true);
    } else {
        html.classList.remove('dark-mode');
        body.classList.remove('dark-mode');
        updateIcon(false);
    }

    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            // Toggle on BOTH elements
            const isDarkBody = body.classList.toggle('dark-mode');
            const isDarkHtml = html.classList.toggle('dark-mode');

            // Sync just in case they were out of sync (though above logic prevents it mostly)
            const isnowDark = isDarkBody || isDarkHtml;

            if (isDarkBody !== isDarkHtml) {
                // Force sync based on body toggle result
                if (isDarkBody) html.classList.add('dark-mode');
                else html.classList.remove('dark-mode');
            }

            localStorage.setItem('theme', isnowDark ? 'dark' : 'light');

            // Add slight animation to button
            toggleBtn.style.transform = 'rotate(360deg)';
            setTimeout(() => {
                toggleBtn.style.transform = '';
            }, 300);

            updateIcon(isnowDark);
        });
    }

    function updateIcon(isDark) {
        if (!toggleBtn) return;
        toggleBtn.innerHTML = isDark ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-solid fa-moon"></i>';
        toggleBtn.setAttribute('aria-label', isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode');
    }
}
