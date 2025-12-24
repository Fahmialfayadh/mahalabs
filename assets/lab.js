// Initialize AOS with staggered animation for cards
document.addEventListener('DOMContentLoaded', () => {
    // Add AOS attributes to cards programmatically
    const cards = document.querySelectorAll('.col-md-6');
    cards.forEach((col, index) => {
        if (col.querySelector('.lab-card')) {
            col.setAttribute('data-aos', 'fade-up');
            // Stagger delay: 100, 200, 300, 400, then repeat
            let delay = ((index % 4) + 1) * 100;
            col.setAttribute('data-aos-delay', delay);
        }
    });

    // Initialize AOS after adding attributes
    AOS.init({
        duration: 800,
        once: true,
        offset: 50
    });
});

// Original DOMContentLoaded listener (we can merge or keep separate, keeping separate for safer replacement)
document.addEventListener('DOMContentLoaded', () => {
    const cards = document.querySelectorAll('.lab-card');
    const modal = document.getElementById('projectModal');
    const closeBtn = document.getElementById('closeModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalDesc = document.getElementById('modalDesc');
    const modalImage = document.getElementById('modalImage');
    const modalLink = document.getElementById('modalLink');

    const modalOverlay = document.getElementById('modalOverlay');

    // Open Modal
    cards.forEach(card => {
        card.addEventListener('click', () => {
            const title = card.getAttribute('data-title');
            const desc = card.getAttribute('data-desc');
            const image = card.getAttribute('data-image');
            const link = card.getAttribute('data-link');
            const status = card.getAttribute('data-status');

            modalTitle.textContent = title;
            modalImage.src = image;

            // Reset overlay
            modalOverlay.classList.remove('active');
            modalOverlay.textContent = '';

            if (status === 'coming-soon' || status === 'beta') {
                modalDesc.textContent = "Something exciting is in the works! Stay tuned for the reveal.";
                modalLink.style.display = 'none'; // Hide the button

                // Show overlay with specific text
                modalOverlay.textContent = status === 'beta' ? 'Beta Access' : 'Coming Soon';
                modalOverlay.classList.add('active');
            } else {
                modalDesc.textContent = desc;
                modalLink.href = link;
                modalLink.target = '_blank';
                modalLink.style.display = 'inline-block';
                modalLink.textContent = "View Website";
            }

            modal.classList.add('active');
        });
    });

    // Close Modal
    closeBtn.addEventListener('click', () => {
        modal.classList.remove('active');
    });

    // Close when clicking outsid2e
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            modal.classList.remove('active');
        }
    });

    // Search Functionality
    const searchInput = document.querySelector('.search-input');
    const featuredSection = document.getElementById('featured-section');
    const allSection = document.getElementById('all-experiments');

    if (searchInput && featuredSection && allSection) {
        // Select cards only within the "All experiments" section for filtering
        const allCards = allSection.querySelectorAll('.lab-card');

        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();

            if (searchTerm.length > 2) {
                // Hide Featured section for cleaner look
                featuredSection.style.display = 'none';

                // Filter All Experiments
                allCards.forEach(card => {
                    const title = card.getAttribute('data-title').toLowerCase();
                    const desc = card.getAttribute('data-desc').toLowerCase();
                    const col = card.closest('.col-md-6'); // Adjust selector as needed

                    if (title.includes(searchTerm) || desc.includes(searchTerm)) {
                        col.style.display = '';
                    } else {
                        col.style.display = 'none';
                    }
                });
            } else {
                // Reset view when search is cleared or too short
                featuredSection.style.display = 'block';
                allCards.forEach(card => {
                    const col = card.closest('.col-md-6');
                    col.style.display = '';
                });
            }
        });
    }
});
