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
                      <img src="assets/${p.image}" alt="${p.title}" class="project-mockup" loading="lazy">
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
        initSearch(projects);

        // Initialize Filter Logic
        initFilters(projects);

        // Initialize Dark Mode (Moved to theme.js)
        // initDarkMode();

    } catch (error) {
        console.error('Error fetching projects:', error);
        // Show error to user to help debugging
        const featuredContainer = document.getElementById('featured-container');
        if (featuredContainer) {
            featuredContainer.innerHTML = `<div class="alert alert-danger text-center">Failed to load projects.<br>Error: ${error.message}<br>Try clearing your cache.</div>`;
        }
    }
}

// SHARED STATE & LOGIC
const appState = {
    activeTags: new Set(),
    searchTerm: ''
};

function updateAppFilters() {
    // 1. Sync UI
    // Search Tags
    document.querySelectorAll('.search-tag').forEach(el => {
        if (appState.activeTags.has(el.textContent)) {
            el.classList.add('active');
        } else {
            el.classList.remove('active');
        }
    });

    // Bottom Filter Buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        const filter = btn.getAttribute('data-filter');
        if (filter === 'all') {
            if (appState.activeTags.size === 0) btn.classList.add('active');
            else btn.classList.remove('active');
        } else {
            if (appState.activeTags.has(filter)) btn.classList.add('active');
            else btn.classList.remove('active');
        }
    });

    // 2. Execute Filtering
    const term = appState.searchTerm.toLowerCase();
    const allCards = document.querySelectorAll('.lab-card'); // All bottom cards
    const featuredContainer = document.getElementById('featured-container');
    const featuredCards = featuredContainer ? document.querySelectorAll('#featured-container > a, #featured-container > div') : []; // Featured cards

    let hasFeaturedMatch = false;

    // Helper: Check if card matches
    const checkMatch = (card) => {
        const title = card.querySelector('.title-project')?.textContent.toLowerCase() || '';
        const desc = card.querySelector('p')?.textContent.toLowerCase() || '';
        const badge = card.querySelector('.badge-lab');
        const categoryText = badge ? badge.textContent : '';

        // Text Match
        const isTextMatch = title.includes(term) || desc.includes(term);

        // Tag Match
        let isTagMatch = true;
        if (appState.activeTags.size > 0) {
            // OR Logic: Match ANY active tag
            isTagMatch = [...appState.activeTags].some(tag => categoryText.includes(tag));
        }

        return isTextMatch && isTagMatch;
    };

    // Filter Featured
    featuredCards.forEach(card => {
        // Direct child might be <a> wrapper or <div> depending on structure
        // The checkMatch expects the element with content. 
        // Let's ensure we target the content wrapper if needed.
        // Current structure: <a ...><div id="featured-card">...</div></a>
        // But checkMatch uses querySelector which searches deep. So <a> wrapper is fine.

        if (checkMatch(card)) {
            card.style.display = 'block';
            hasFeaturedMatch = true;
        } else {
            card.style.display = 'none';
        }
    });

    // Toggle Featured Section
    const featuredSection = document.getElementById('featured-section');
    if (featuredSection) {
        // Exception: If fully empty search (no text, no tags), show all. 
        // But checkMatch covers that (isTextMatch=true, isTagMatch=true).
        featuredSection.style.display = hasFeaturedMatch ? 'block' : 'none';
    }

    // Filter All Experiments
    allCards.forEach(card => {
        const container = card.closest('a') || card;
        if (checkMatch(card)) {
            container.style.display = '';
        } else {
            container.style.display = 'none';
        }
    });

    // Refresh AOS to ensure new layout is recognized
    if (window.AOS) {
        window.AOS.refresh();
    }
}



function initFilters(projects) {
    const filterContainer = document.getElementById('filter-container');
    if (!filterContainer) return;

    const allTags = new Set();
    projects.forEach(p => {
        if (p.category) {
            const tags = p.category.split(/\s+·\s+/);
            tags.forEach(tag => allTags.add(tag.trim()));
        }
    });

    const sortedTags = Array.from(allTags).sort();

    // Create Buttons
    let filterHtml = `<button class="filter-btn active" data-filter="all">All</button>`;
    sortedTags.forEach(tag => {
        filterHtml += `<button class="filter-btn" data-filter="${tag}">${tag}</button>`;
    });

    filterContainer.innerHTML = filterHtml;

    // Add Event Listeners with SHARED STATE
    const buttons = filterContainer.querySelectorAll('.filter-btn');
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            const filterValue = btn.getAttribute('data-filter');

            if (filterValue === 'all') {
                appState.activeTags.clear();
            } else {
                // Toggle logic identical to top search
                if (appState.activeTags.has(filterValue)) {
                    appState.activeTags.delete(filterValue);
                } else {
                    appState.activeTags.add(filterValue);
                }
            }

            updateAppFilters();
        });
    });
}

function filterProjects(category) {
    // Legacy function replaced by updateAppFilters, keeping empty or redirecting just in case
    // Not needed if initFilters uses updateAppFilters directly.
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

function initSearch(projects) {
    const searchInput = document.querySelector('.search-input');
    const featuredSection = document.getElementById('featured-section');
    const featuredContainer = document.getElementById('featured-container');
    const allSection = document.getElementById('all-experiments');
    const overlay = document.getElementById('search-overlay');
    const body = document.body;
    const suggestionsContainer = document.getElementById('search-suggestions');

    if (searchInput && featuredSection && allSection && featuredContainer) {
        // Populate Suggestions
        if (suggestionsContainer && projects) {
            const allTags = new Set();
            projects.forEach(p => {
                if (p.category) {
                    const tags = p.category.split(/\s+·\s+/);
                    tags.forEach(tag => allTags.add(tag.trim()));
                }
            });

            const tags = Array.from(allTags).slice(0, 6);

            suggestionsContainer.innerHTML = ''; // Clear
            tags.forEach(tag => {
                const tagEl = document.createElement('div');
                tagEl.classList.add('search-tag');
                tagEl.textContent = tag;

                // Prevent focus loss on mousedown
                tagEl.addEventListener('mousedown', (e) => {
                    e.preventDefault();
                });

                tagEl.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();

                    // Update Shared State
                    if (appState.activeTags.has(tag)) {
                        appState.activeTags.delete(tag);
                    } else {
                        appState.activeTags.add(tag);
                    }

                    updateAppFilters();
                    searchInput.focus();
                });
                suggestionsContainer.appendChild(tagEl);
            });
        }

        // Overlay Logic
        searchInput.addEventListener('focus', () => {
            body.classList.add('search-active');
        });

        // Robust blur handler
        searchInput.addEventListener('blur', () => {
            setTimeout(() => {
                body.classList.remove('search-active');
            }, 100);
        });

        if (overlay) {
            overlay.addEventListener('click', () => {
                body.classList.remove('search-active');
                searchInput.blur();
            });
        }

        searchInput.addEventListener('input', (e) => {
            appState.searchTerm = searchInput.value;
            updateAppFilters();
        });

        // Add Enter and Escape key listener
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                body.classList.remove('search-active');
                searchInput.blur();
                return;
            }

            if (e.key === 'Enter') {
                e.preventDefault();

                // If empty search and enter pressed, go to featured
                if (appState.searchTerm.length === 0 && appState.activeTags.size === 0) {
                    const featured = document.getElementById('featured-section');
                    if (featured) {
                        featured.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        body.classList.remove('search-active');
                        searchInput.blur();
                    }
                    return;
                }

                // If matches found, scroll to first
                const firstMatch = document.querySelector('.lab-card:not([style*="display: none"]), #featured-card:not([style*="display: none"])');
                if (firstMatch) {
                    firstMatch.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    body.classList.remove('search-active');
                    searchInput.blur();
                }
            }
        });
    }
}
