
AOS.init();
let allDocs = [];

async function fetchDocs() {
    try {
        // Try to fetch from API first (when app.py is running)
        let response = await fetch('/api/docs');

        // If API fails (404, etc), fall back to docs.json for static mode
        if (!response.ok) {
            console.log('API not available, loading from docs.json...');
            response = await fetch('docs.json');
        }

        allDocs = await response.json();
        renderSidebar();

        // Mobile: show article list, Desktop: load first article
        if (window.innerWidth <= 768) {
            renderMobileArticleList();
            showArticleList();
        } else if (window.location.hash) {
            const id = window.location.hash.substring(1);
            loadDocContent(id);
        } else if (allDocs.length > 0) {
            loadDocContent(allDocs[0].id);
        } else {
            document.getElementById('docs-nav-content').innerHTML = '<p class="text-muted small">No documents found.</p>';
        }
    } catch (error) {
        console.error('Failed to load docs:', error);
        // Try fallback to docs.json
        try {
            const fallbackResponse = await fetch('docs.json');
            allDocs = await fallbackResponse.json();
            renderSidebar();
            if (allDocs.length > 0) {
                loadDocContent(allDocs[0].id);
            }
        } catch (fallbackError) {
            console.error('Fallback also failed:', fallbackError);
            document.getElementById('docs-nav-content').innerHTML = '<p class="text-muted small">Failed to load documents.</p>';
        }
    }
}


function renderSidebar() {
    const nav = document.getElementById('docs-nav-content');
    nav.innerHTML = '';

    // Group by Category
    const grouped = allDocs.reduce((acc, doc) => {
        const cat = doc.category || 'General';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(doc);
        return acc;
    }, {});

    // Convert to array and sort categories based on the lowest 'order' of a doc inside them
    const sortedCategories = Object.keys(grouped).map(cat => {
        const docs = grouped[cat];
        // Find min order in this category
        const minOrder = Math.min(...docs.map(d => d.order !== undefined ? d.order : 999));
        return { name: cat, docs, minOrder };
    }).sort((a, b) => a.minOrder - b.minOrder);

    sortedCategories.forEach(categoryObj => {
        const category = categoryObj.name;
        const catHeader = document.createElement('div');
        catHeader.className = 'docs-nav-category';
        catHeader.textContent = category;
        nav.appendChild(catHeader);

        // Sort docs by 'order' then 'title'
        const sortedDocs = categoryObj.docs.sort((a, b) => {
            const orderA = a.order !== undefined ? a.order : 999;
            const orderB = b.order !== undefined ? b.order : 999;
            if (orderA !== orderB) return orderA - orderB;
            return a.title.localeCompare(b.title);
        });

        sortedDocs.forEach(doc => {
            const link = document.createElement('a');
            link.className = 'docs-nav-item';
            link.href = `#${doc.id}`;
            link.textContent = doc.title;
            link.onclick = (e) => {
                // Allow hash update
                // Scroll to top of content wrapper or just stay
                setTimeout(() => loadDocContent(doc.id), 0);
            };
            link.dataset.id = doc.id;
            nav.appendChild(link);
        });
    });
}

// Render Mobile Article List
function renderMobileArticleList() {
    const articleList = document.getElementById('mobile-article-list');
    if (!articleList || window.innerWidth > 768) return;

    articleList.innerHTML = '';

    allDocs.forEach(doc => {
        const card = document.createElement('div');
        card.className = 'mobile-article-card';
        card.dataset.id = doc.id;
        const lastUpdated = doc.last_updated ? new Date(doc.last_updated).toLocaleDateString() : 'Unknown';

        // Create excerpt from content (first 100 chars)
        const excerpt = doc.content.replace(/[#*`]/g, '').substring(0, 100) + '...';

        card.innerHTML = `
            <div class="card-category">${doc.category || 'General'}</div>
            <div class="card-title">${doc.title}</div>
            <div class="card-excerpt">${excerpt}</div>
            <div class="card-updated">Last updated: ${lastUpdated}</div>
        `;

        card.addEventListener('click', () => {
            loadDocContent(doc.id);
            showArticleDetail();
        });

        articleList.appendChild(card);
    });
}

function showArticleList() {
    const articleList = document.getElementById('mobile-article-list');
    const mainContent = document.getElementById('docs-main-content');
    const backBtn = document.getElementById('mobile-back-btn');

    if (window.innerWidth <= 768 && articleList && mainContent) {
        articleList.classList.remove('hidden');
        mainContent.classList.add('list-mode');
        if (backBtn) backBtn.classList.add('hidden');

        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

function showArticleDetail() {
    const articleList = document.getElementById('mobile-article-list');
    const mainContent = document.getElementById('docs-main-content');
    const backBtn = document.getElementById('mobile-back-btn');

    if (window.innerWidth <= 768 && articleList && mainContent) {
        articleList.classList.add('hidden');
        mainContent.classList.remove('list-mode');
        if (backBtn) backBtn.classList.remove('hidden');

        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

function loadDocContent(id) {
    const doc = allDocs.find(d => d.id === id);

    if (!doc) return;
    // Update URL without reloading
    const newUrl = window.location.pathname + '?id=' + id;
    window.history.pushState({ id: id }, '', newUrl);
    // Update Active State
    document.querySelectorAll('.docs-nav-item').forEach(el => el.classList.remove('active'));
    const activeLink = document.querySelector(`.docs-nav-item[data-id="${id}"]`);
    if (activeLink) activeLink.classList.add('active');

    // Build Audio Player HTML if audio_file exists
    let audioPlayerHTML = '';
    if (doc.audio_file) {
        audioPlayerHTML = `
                    <div class="audio-player minimalist" id="audio-player">
                        <button class="audio-player-btn" id="audio-play-btn" aria-label="Play">
                            <i class="fa-solid fa-play audio-play-icon" id="audio-play-icon"></i>
                        </button>
                        
                        <div class="audio-label">Listen to Document</div>
                        
                        <div class="audio-separator"></div>
                        
                        <div class="audio-track-info">
                            <div class="audio-time-display">
                                <span id="audio-current">0:00</span> <span class="text-muted">/</span> <span id="audio-duration">--:--</span>
                            </div>
                            <input type="range" class="audio-slider" id="audio-progress" value="0" min="0" max="100">
                        </div>

                         <div class="audio-speed-controls">
                            <button class="audio-speed-btn active" data-speed="1">1x</button>
                            <button class="audio-speed-btn" data-speed="1.25">1.25x</button>
                            <button class="audio-speed-btn" data-speed="1.5">1.5x</button>
                            <button class="audio-speed-btn" data-speed="2">2x</button>
                        </div>
                        
                        <button class="audio-share-btn" id="audio-share-btn" aria-label="Share">
                            <i class="fa-solid fa-link"></i> Share
                        </button>

                        <audio id="audio-element" src="assets/audio/${doc.audio_file}" preload="metadata"></audio>
                    </div>
                `;
    }

    // Render Content
    const container = document.getElementById('docs-main-content');
    container.innerHTML = `
    <div data-aos="fade-in" class="docs-article-container fade-in">
        <div class="d-flex justify-content-between align-items-center mb-3">
            <span class="badge bg-secondary">${doc.category}</span>
            <div class="d-flex gap-2 align-items-center">
                <button class="mobile-browse-btn" id="mobile-browse-btn">
                    <i class="fa-solid fa-list me-1"></i> Article List
                </button>
                <button class="btn btn-sm btn-outline-secondary" onclick="toggleFullscreen()" title="Toggle Fullscreen">
                    <i class="fa-solid fa-expand" id="fullscreen-icon"></i>
                </button>
            </div>
        </div>
        ${audioPlayerHTML}
        <div class="mt-5 pt-3 border-top text-muted small">
            Last updated: ${doc.last_updated || 'Just now'}
        </div>
        <div class="docs-content mt-4" id="docs-content-container">
            ${marked.parse(doc.content)}
        </div>
        <div class="mt-5 pt-3 border-top text-muted small">
            Last updated: ${doc.last_updated || 'Just now'}
        </div>
    </div>
    `;

    // Initialize Audio Player if present
    if (doc.audio_file) {
        initAudioPlayer();
    }

    // Attach browse button click handler (button is dynamically created above)
    const browseBtn = document.getElementById('mobile-browse-btn');

    if (browseBtn) {
        browseBtn.onclick = function (e) {
            e.preventDefault();
            e.stopPropagation();
            showArticleList();
        };
    }

    // On mobile, switch to detail view when article loads
    if (window.innerWidth <= 768) {
        showArticleDetail();
    }
}

function initAudioPlayer() {
    const audio = document.getElementById('audio-element');
    const playBtn = document.getElementById('audio-play-btn');
    const playIcon = document.getElementById('audio-play-icon');
    const progress = document.getElementById('audio-progress');
    const currentTimeEl = document.getElementById('audio-current');
    const durationEl = document.getElementById('audio-duration');
    const speedBtns = document.querySelectorAll('.audio-speed-btn');

    if (!audio) return;

    // Format time helper
    function formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    // Play/Pause
    playBtn.addEventListener('click', () => {
        if (audio.paused) {
            audio.play();
            playIcon.classList.remove('fa-play');
            playIcon.classList.add('fa-pause');
        } else {
            audio.pause();
            playIcon.classList.remove('fa-pause');
            playIcon.classList.add('fa-play');
        }
    });

    // Update duration when metadata loads
    audio.addEventListener('loadedmetadata', () => {
        durationEl.textContent = formatTime(audio.duration);
        progress.max = Math.floor(audio.duration);
    });

    // Update progress bar as audio plays
    audio.addEventListener('timeupdate', () => {
        progress.value = Math.floor(audio.currentTime);
        currentTimeEl.textContent = formatTime(audio.currentTime);
    });

    // Seek when slider changes
    progress.addEventListener('input', () => {
        audio.currentTime = progress.value;
    });

    // Reset on end
    audio.addEventListener('ended', () => {
        playIcon.classList.remove('fa-pause');
        playIcon.classList.add('fa-play');
        progress.value = 0;
        currentTimeEl.textContent = '0:00';
    });

    // Speed controls
    speedBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            speedBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            audio.playbackRate = parseFloat(btn.dataset.speed);
        });
    });

    // Share Button
    // Share Button
    const shareBtn = document.getElementById('audio-share-btn');
    if (shareBtn) {
        shareBtn.addEventListener('click', async () => {
            try {
                await navigator.clipboard.writeText(window.location.href);

                // Visual feedback (No fading - keep visible)
                const originalHTML = '<i class="fa-solid fa-link"></i> Share';
                shareBtn.innerHTML = '<i class="fa-solid fa-check"></i> Copied';

                setTimeout(() => {
                    shareBtn.innerHTML = originalHTML;
                }, 2000);

            } catch (err) {
                console.error('Failed to copy link:', err);
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    fetchDocs();

    // Back button handler
    const backBtn = document.getElementById('mobile-back-btn');
    if (backBtn) {
        backBtn.addEventListener('click', (e) => {
            e.preventDefault();
            showArticleList();
        });
    }

    // On mobile, start with article list
    if (window.innerWidth <= 768) {
        setTimeout(() => {
            renderMobileArticleList();
            showArticleList();
        }, 300);
    }
});



// Fullscreen Logic
function toggleFullscreen() {
    const container = document.querySelector('.docs-interface');
    const icon = document.getElementById('fullscreen-icon');

    if (!document.fullscreenElement) {
        if (container.requestFullscreen) {
            container.requestFullscreen();
        } else if (container.mozRequestFullScreen) { // Firefox
            container.mozRequestFullScreen();
        } else if (container.webkitRequestFullscreen) { // Chrome, Safari and Opera
            container.webkitRequestFullscreen();
        } else if (container.msRequestFullscreen) { // IE/Edge
            container.msRequestFullscreen();
        }
        icon.classList.remove('fa-expand');
        icon.classList.add('fa-compress');
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
        icon.classList.remove('fa-compress');
        icon.classList.add('fa-expand');
    }
}

let fullscreenMouseMoveHandler = null;

document.addEventListener('fullscreenchange', () => {
    const icon = document.getElementById('fullscreen-icon');
    const sidebar = document.querySelector('.docs-sidebar');

    if (document.fullscreenElement) {
        // Entered Fullscreen
        if (icon) {
            icon.classList.remove('fa-expand');
            icon.classList.add('fa-compress');
        }

        // Add mouse tracker for sidebar
        if (!fullscreenMouseMoveHandler && sidebar) {
            fullscreenMouseMoveHandler = (e) => {
                // Show if near left edge
                if (e.clientX <= 20) {
                    sidebar.classList.add('fullscreen-visible');
                }
                // Hide if moved away from sidebar (width 280px + buffer)
                else if (e.clientX > 290) {
                    sidebar.classList.remove('fullscreen-visible');
                }
            };
            document.addEventListener('mousemove', fullscreenMouseMoveHandler);
        }
    } else {
        // Exited Fullscreen
        if (icon) {
            icon.classList.remove('fa-compress');
            icon.classList.add('fa-expand');
        }

        // Cleanup
        if (sidebar) sidebar.classList.remove('fullscreen-visible');
        if (fullscreenMouseMoveHandler) {
            document.removeEventListener('mousemove', fullscreenMouseMoveHandler);
            fullscreenMouseMoveHandler = null;
        }
    }
});
function getDocIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id'); // Akan mengembalikan null kalau tidak ada ?id=
}

// Handler utama saat URL berubah (karena tombol Back/Forward)
window.addEventListener('popstate', () => {
    const id = getDocIdFromUrl();
    if (id) {
        loadDocContent(id);
    } else {
        // Balikin ke konten default atau dokumen pertama jika ID hilang
        loadDocContent(allDocs[0].id);
    }
});

window.addEventListener('hashchange', () => {
    //jangan dari search
    const urlParams = new URLSearchParams(window.location.search);
    const initialId = urlParams.get('id');
    const id = getDocIdFromUrl();
    if (id) {
        loadDocContent(id);
    } else {
        // Jika cuma /docs.html, tampilkan yang pertama
        loadDocContent(allDocs[0].id);
    }
});

window.addEventListener('load', () => {
});
