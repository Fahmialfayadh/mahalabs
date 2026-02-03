document.addEventListener('DOMContentLoaded', () => {
    fetchAndRenderProjects();
});

async function fetchAndRenderProjects() {
    try {
        // Fetch from static JSON file for serverless compatibility
        // Add timestamp to prevent caching of the data file
        const response = await fetch('projects.json?t=' + new Date().getTime());

        // Check for fetch errors or empty data
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const projects = await response.json();
        console.log(`Loaded ${projects.length} projects from projects.json`);

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
                      <p class="project-description">${p.description}</p>
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
                  <small class="data-desc-small">${p.status === 'Active' ? 'Beta (Active)' : p.status}</small>
                </div>
                <h5 class="title-project">${p.title}</h5>
                <p class="data-desc">${p.description}</p>
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

        // Initialize Filter Logic
        initFilters(projects);

        // Initialize Dark Mode
        initDarkMode();

    } catch (error) {
        console.error('Error fetching projects:', error);
        // Show error to user to help debugging
        const featuredContainer = document.getElementById('featured-container');
        if (featuredContainer) {
            featuredContainer.innerHTML = `<div class="alert alert-danger text-center">Failed to load projects.<br>Error: ${error.message}<br>Try clearing your cache.</div>`;
        }
    }
}

function initDarkMode() {
    const toggleBtn = document.getElementById('theme-toggle');
    const body = document.body;

    // Check saved
    const savedTheme = localStorage.getItem('theme');

    // Apply immediate if saved or system pref
    if (savedTheme === 'dark') {
        body.classList.add('dark-mode');
        updateIcon(true);
    } else if (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        // System preference
        body.classList.add('dark-mode');
        updateIcon(true);
    } else {
        updateIcon(false);
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

function initFilters(projects) {
    const filterContainer = document.getElementById('filter-container');
    if (!filterContainer) return;

    // 1. Extract unique categories (simplify complex categories like "AI · Health" to specific tags or just use full string)
    // Decision: Let's use the full category string for now as it's simple, or split by ' · ' if we want granular tags.
    // The user asked for "filter kategori", and in projects.json we have "AI · Health".
    // Let's try to parse individual tags for better filtering if they are separated by ' · '.
    const allTags = new Set();
    projects.forEach(p => {
        if (p.category) {
            // Split by " · " or just take the whole string if no separator
            // Use a regex to handle potential variations
            const tags = p.category.split(/\s+·\s+/);
            tags.forEach(tag => allTags.add(tag.trim()));
        }
    });

    const sortedTags = Array.from(allTags).sort();

    // 2. Create "All" button
    let filterHtml = `<button class="filter-btn active" data-filter="all">All</button>`;

    // 3. Create other buttons
    sortedTags.forEach(tag => {
        filterHtml += `<button class="filter-btn" data-filter="${tag}">${tag}</button>`;
    });

    filterContainer.innerHTML = filterHtml;

    // 4. Add Event Listeners
    const buttons = filterContainer.querySelectorAll('.filter-btn');
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all
            buttons.forEach(b => b.classList.remove('active'));
            // Add active to clicked
            btn.classList.add('active');

            const filterValue = btn.getAttribute('data-filter');
            filterProjects(filterValue);
        });
    });
}

function filterProjects(category) {
    const allCards = document.querySelectorAll('.lab-card, #featured-card');
    const filterContainer = document.getElementById('filter-container');

    // 0. Auto Scroll to top of experiments
    if (filterContainer) {
        // Scroll slightly above the filter container for better context
        const rect = filterContainer.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const targetY = rect.top + scrollTop - 100; // 100px buffer

        window.scrollTo({
            top: targetY,
            behavior: 'smooth'
        });
    }

    // 1. Fade OUT non-matching visible 
    allCards.forEach(card => {
        let container = card;
        if (card.id === 'featured-card') {
            container = card.closest('a') || card;
        } else if (card.classList.contains('lab-card')) {
            container = card.closest('a') || card;
        }

        const badge = card.querySelector('.badge-lab');
        const cardCategory = badge ? badge.textContent : '';

        // Determine MATCH
        let isMatch = false;
        if (category === 'all') {
            isMatch = true;
        } else {
            isMatch = cardCategory.includes(category);
        }

        // HIDE LOGIC: If currently visible (display != 'none') AND Match is False -> Fade Out
        if (container.style.display !== 'none' && !isMatch) {
            card.classList.add('animating-out');
            card.classList.remove('animating-in'); // Ensure no conflict
        }
    });

    // 2. Wait for fade out, then Toggle Display and Trigger Enter Animation
    setTimeout(() => {
        let matchIndex = 0; // For staggering

        allCards.forEach(card => {
            let container = card;
            if (card.id === 'featured-card') {
                container = card.closest('a') || card;
            } else if (card.classList.contains('lab-card')) {
                container = card.closest('a') || card;
            }

            const badge = card.querySelector('.badge-lab');
            const cardCategory = badge ? badge.textContent : '';

            // Check match again
            let isMatch = false;
            if (category === 'all') {
                isMatch = true;
            } else {
                isMatch = cardCategory.includes(category);
            }

            if (isMatch) {
                // SHOW logic
                // If it was hidden OR it was visible (no change), make sure it's correct
                // If it was animating out (e.g. rapid switch), stop that.
                card.classList.remove('animating-out');

                if (container.style.display === 'none') {
                    // Was hidden, needs to show
                    container.style.display = '';

                    // Add Staggered Entrance
                    // Use css animation with delay
                    card.style.animationDelay = `${matchIndex * 0.05}s`; // 50ms stagger
                    card.classList.add('animating-in');

                    // Clean up animation class after it runs? 
                    // Not strictly necessary if we reset matchIndex logic on next run
                    // But good practice:
                    card.addEventListener('animationend', () => {
                        card.classList.remove('animating-in');
                        card.style.animationDelay = '';
                    }, { once: true });

                } else {
                    // Was already visible and matches? 
                    // Just ensure it's fully opaque/visible
                    // No need to re-animate if it didn't leave?
                    // Depends on "stiffness". If we want *everything* to reflow nicely...
                    // Let's just keep it stable if it didn't move.
                }

                matchIndex++;

            } else {
                // HIDE logic
                // It should have faded out by now due to Step 1.
                // Just set display none.
                container.style.display = 'none';
                card.classList.remove('animating-out'); // Reset state
                card.classList.remove('animating-in');
            }
        });
    }, 300); // Wait for the exit animation (300ms)
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

    // Add close logic for overlay click if not already covered
    window.onclick = function (event) {
        if (event.target == modal) {
            modal.classList.remove('active');
        }
    }

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
    const featuredContainer = document.getElementById('featured-container'); // Need container, not section
    const allSection = document.getElementById('all-experiments');

    if (searchInput && featuredSection && allSection && featuredContainer) {
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const allCards = allSection.querySelectorAll('.lab-card');

            const featuredCards = Array.from(featuredContainer.children);

            let firstMatch = null;
            let hasFeaturedMatch = false;

            if (searchTerm.length > 0) {
                // 1. Filter Display of Featured Cards Individually
                featuredCards.forEach(card => {
                    // Try to find title/desc inside
                    const title = card.querySelector('.title-project')?.textContent.toLowerCase() || '';
                    const desc = card.querySelector('p')?.textContent.toLowerCase() || '';

                    if (title.includes(searchTerm) || desc.includes(searchTerm)) {
                        card.style.display = 'block'; // Or '' if flex/grid issues, but block is safe for A tag
                        hasFeaturedMatch = true;
                        if (!firstMatch) firstMatch = card;
                    } else {
                        card.style.display = 'none';
                    }
                });

                // Show/Hide Featured Section based on if ANY featured card matches
                if (hasFeaturedMatch) {
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
                        if (!firstMatch) firstMatch = container;
                    } else {
                        container.style.display = 'none';
                    }
                });

                // 3. Auto-scroll removed from here (moved to keydown)
            } else {
                // Reset view
                featuredSection.style.display = 'block';
                featuredCards.forEach(c => c.style.display = ''); // Reset display
                allCards.forEach(card => {
                    const container = card.closest('a') || card;
                    container.style.display = '';
                });
            }
        });

        // Add Enter key listener for scrolling
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault(); // Prevent form submission if inside a form

                const searchTerm = searchInput.value.toLowerCase();
                if (searchTerm.length === 0) return;

                // Find first visible match again (since state might have changed or just to be sure)
                // We re-query visible elements or reuse logic. 
                // Simplest is to find the first visible card in the DOM order.

                // Check Featured First
                const featuredCards = Array.from(featuredContainer.children);
                let firstMatch = featuredCards.find(c => c.style.display !== 'none' && c.offsetParent !== null);

                // If not in featured, check all experiments
                if (!firstMatch) {
                    const allCards = Array.from(allSection.querySelectorAll('.lab-card'));
                    firstMatch = allCards.find(c => {
                        const container = c.closest('a') || c;
                        return container.style.display !== 'none' && container.offsetParent !== null;
                    });
                    // If found in allCards, make sure we target the container if it exists
                    if (firstMatch && firstMatch.closest('a')) firstMatch = firstMatch.closest('a');
                }

                if (firstMatch) {
                    firstMatch.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }
        });
    }
}
