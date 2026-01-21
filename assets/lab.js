document.addEventListener('DOMContentLoaded', () => {
    fetchAndRenderProjects();
});

async function fetchAndRenderProjects() {
    try {
        // Fetch from static JSON file for serverless compatibility
        // Using relative path 'projects.json' instead of absolute '/projects.json' to be safer
        const response = await fetch('projects.json');
        const projects = await response.json();

        const featuredContainer = document.getElementById('featured-container');
        const experimentsGrid = document.querySelector('.experiments-grid');

        // Clear existing content (if any)
        featuredContainer.innerHTML = '';
        experimentsGrid.innerHTML = '';

        // Filter projects
        const featuredProjects = projects.filter(p => p.is_featured);
        const otherProjects = projects.filter(p => !p.is_featured);

        // Render Featured
        featuredProjects.forEach(p => {
            const cardHtml = `
                <a href="${p.link}" class="text-decoration-none text-dark" target="_blank">
                  <div id="featured-card" class="mb-4"> <!-- Added mb-4 for spacing -->
                    <div class="featured-content">
                      <span class="badge badge-lab">${p.category}</span>
                      <h5 class="title-project">${p.title}</h5>
                      <p class="text-muted">${p.description}</p>
                      <div class="d-flex align-items-center mt-auto">
                        <span class="fw-bold small text-primary">
                            ${p.status === 'beta' || p.status === 'coming-soon' ? 'View Details' : 'Try Experiment'}
                        </span>
                        <i class="fa-solid fa-arrow-right ms-2 small text-primary"></i>
                      </div>
                    </div>
                    <div class="featured-visual">
                      <img src="assets/${p.image}" alt="${p.title}" class="project-mockup">
                    </div>
                  </div>
                </a>
            `;
            featuredContainer.innerHTML += cardHtml;
        });

        // Render Other Experiments
        otherProjects.forEach((p, index) => {
            // Apply AOS delay
            const delay = ((index % 4) + 1) * 100;
            const isSpan2 = index === 0 ? 'span-2' : ''; // Example logic: make first one span-2 or based on some property
            // Note: Original hardcoded Item 2 (MahaInsight) was span-2. 
            // We can match this by checking if it's "MahaInsight" or just standardizing.
            // Let's make "MahaInsight" span-2 if present, or just the first one.
            const spanClass = p.title === 'MahaInsight' ? 'span-2' : '';

            // Handle badge color
            const badgeStyle = p.tag_color ? `style="background-color: ${p.tag_color};"` : '';

            const cardHtml = `
              <div class="lab-card ${spanClass}" 
                   data-aos="fade-up" 
                   data-aos-delay="${delay}" 
                   data-title="${p.title}"
                   data-desc="${p.description}"
                   data-image="assets/${p.image}" 
                   data-link="${p.link}" 
                   data-status="${p.status}">
                <div class="d-flex justify-content-between align-items-start mb-4">
                  <span class="badge badge-lab" ${badgeStyle}>${p.category}</span>
                  <small class="text-muted">${p.status === 'Active' ? 'Beta (Active)' : p.status}</small>
                </div>
                <h5 class="title-project">${p.title}</h5>
                <p class="text-muted">${p.description}</p>
              </div>
            `;
            experimentsGrid.innerHTML += cardHtml;
        });

        // Initialize AOS
        // Note: AOS was locally imported via script tag in index.html, so it should be available globally.
        if (window.AOS) {
            window.AOS.init({
                duration: 800,
                once: true,
                offset: 50
            });
        }

        // Initialize Modal Logic
        initModal();

        // Initialize Search Logic
        initSearch();

    } catch (error) {
        console.error('Error fetching projects:', error);
    }
}

function initModal() {
    const cards = document.querySelectorAll('.lab-card');
    const modal = document.getElementById('projectModal');
    const closeBtn = document.getElementById('closeModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalDesc = document.getElementById('modalDesc');
    const modalImage = document.getElementById('modalImage');
    const modalLink = document.getElementById('modalLink');
    const modalOverlay = document.getElementById('modalOverlay');

    if (!modal) return;

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
                modalLink.style.display = 'none';
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

    closeBtn.addEventListener('click', () => {
        modal.classList.remove('active');
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            modal.classList.remove('active');
        }
    });
}

function initSearch() {
    const searchInput = document.querySelector('.search-input');
    const featuredSection = document.getElementById('featured-section');
    const allSection = document.getElementById('all-experiments');

    if (searchInput && featuredSection && allSection) {
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const allCards = allSection.querySelectorAll('.lab-card');

            if (searchTerm.length > 0) {
                // 1. Check Featured Section (Check all text content)
                const featuredText = featuredSection.textContent.toLowerCase();

                if (featuredText.includes(searchTerm)) {
                    featuredSection.style.display = 'block';
                } else {
                    featuredSection.style.display = 'none';
                }

                // 2. Filter All Experiments
                allCards.forEach(card => {
                    const title = card.querySelector('.title-project')?.textContent.toLowerCase() || '';
                    const desc = card.querySelector('p')?.textContent.toLowerCase() || '';
                    const container = card.closest('a') || card;

                    if (title.includes(searchTerm) || desc.includes(searchTerm)) {
                        container.style.display = '';
                    } else {
                        container.style.display = 'none';
                    }
                });
            } else {
                // Reset view
                featuredSection.style.display = 'block';
                allCards.forEach(card => {
                    const container = card.closest('a') || card;
                    container.style.display = '';
                });
            }
        });
    }
}
