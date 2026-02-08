const API_BASE = '/api';

document.addEventListener('DOMContentLoaded', () => {
    fetchProjects();
    fetchDocs();
    setupForms();
});

// --- Projects Logic ---

async function fetchProjects() {
    const listContainer = document.getElementById('projects-list');
    if (!listContainer) return;

    listContainer.innerHTML = '<div class="text-center p-3">Loading projects...</div>';

    try {
        const response = await fetch(`${API_BASE}/projects`);
        if (!response.ok) throw new Error('Failed to load projects');
        const projects = await response.json();

        renderProjects(projects);
    } catch (error) {
        console.error('Error:', error);
        listContainer.innerHTML = `<div class="alert alert-danger">Error loading projects: ${error.message}</div>`;
    }
}

function renderProjects(projects) {
    const listContainer = document.getElementById('projects-list');
    listContainer.innerHTML = '';

    if (!projects || projects.length === 0) {
        listContainer.innerHTML = '<div class="text-muted text-center">No projects found.</div>';
        return;
    }

    projects.forEach(project => {
        const item = document.createElement('div');
        item.className = 'item-row';
        item.innerHTML = `
            <div>
                <h5 class="mb-1">${project.title} <span class="badge bg-secondary" style="font-size: 0.7em">${project.id}</span></h5>
                <small class="text-muted">${project.category} · ${project.status}</small>
            </div>
            <div class="d-flex gap-2">
                <button class="btn btn-sm btn-outline-primary" onclick="window.editProject('${project.id}')">Edit</button>
                <button class="btn btn-sm btn-outline-danger" onclick="window.deleteProject('${project.id}')">Delete</button>
            </div>
        `;
        listContainer.appendChild(item);
    });
}

// --- Docs Logic ---

async function fetchDocs() {
    const listContainer = document.getElementById('docs-list');
    if (!listContainer) return;

    listContainer.innerHTML = '<div class="text-center p-3">Loading documents...</div>';

    try {
        const response = await fetch(`${API_BASE}/docs`);
        if (!response.ok) throw new Error('Failed to load docs');
        const docs = await response.json();

        renderDocs(docs);
    } catch (error) {
        console.error('Error:', error);
        listContainer.innerHTML = `<div class="alert alert-danger">Error loading documents: ${error.message}</div>`;
    }
}

function renderDocs(docs) {
    const listContainer = document.getElementById('docs-list');
    listContainer.innerHTML = '';

    if (!docs || docs.length === 0) {
        listContainer.innerHTML = '<div class="text-muted text-center">No documents found.</div>';
        return;
    }

    docs.forEach(doc => {
        const item = document.createElement('div');
        item.className = 'item-row';
        item.innerHTML = `
            <div>
                <h5 class="mb-1">${doc.title} <span class="badge bg-info text-dark" style="font-size: 0.7em">${doc.category}</span></h5>
                <small class="text-muted">ID: ${doc.id}</small>
            </div>
            <div class="d-flex gap-2">
                <button class="btn btn-sm btn-outline-primary" onclick="window.editDoc('${doc.id}')">Edit</button>
                <button class="btn btn-sm btn-outline-danger" onclick="window.deleteDoc('${doc.id}')">Delete</button>
            </div>
        `;
        listContainer.appendChild(item);
    });
}

// --- Form & Action Handlers ---

function setupForms() {
    // Project Form
    const projectForm = document.getElementById('addProjectForm');
    if (projectForm) {
        projectForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const formData = {
                id: document.getElementById('proj-id').value,
                title: document.getElementById('proj-title').value,
                description: document.getElementById('proj-desc').value,
                category: document.getElementById('proj-tags').value.replace(/,\s*/g, ' · '), // Normalize to ' · ' separator
                image: document.getElementById('proj-img').value,
                link: document.getElementById('proj-link').value,
                // Defaults
                status: 'Active',
                is_featured: false
            };

            try {
                const response = await fetch(`${API_BASE}/projects`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });

                if (!response.ok) throw new Error('Failed to save project');

                alert('Project saved successfully!');

                // Reset Form and State
                projectForm.reset();
                const btn = projectForm.querySelector('button[type="submit"]');
                if (btn) btn.textContent = 'Add Project';
                document.getElementById('proj-id').readOnly = false;

                fetchProjects(); // Refresh list

            } catch (error) {
                console.error(error);
                alert(`Error saving project: ${error.message}`);
            }
        });
    }

    // Doc Form
    const docForm = document.getElementById('addDocForm');
    if (docForm) {
        docForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const formData = {
                id: document.getElementById('doc-id').value,
                title: document.getElementById('doc-title').value,
                category: document.getElementById('doc-category').value,
                content: document.getElementById('doc-content').value,
                audio_file: document.getElementById('doc-audio').value,
                last_updated: new Date().toLocaleString()
            };

            try {
                const response = await fetch(`${API_BASE}/docs`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });

                if (!response.ok) throw new Error('Failed to save document');

                alert('Document saved successfully!');

                // Reset Form and State
                docForm.reset();
                const btn = docForm.querySelector('button[type="submit"]');
                if (btn) btn.textContent = 'Add Document';
                document.getElementById('doc-id').readOnly = false;

                fetchDocs(); // Refresh list

            } catch (error) {
                console.error(error);
                alert(`Error saving document: ${error.message}`);
            }
        });
    }
}

// Mock Edit/Delete functions (attached to window for inline onclick access)
window.editProject = async function (id) {
    try {
        const response = await fetch(`${API_BASE}/projects`);
        const projects = await response.json();
        const project = projects.find(p => p.id === id);

        if (project) {
            document.getElementById('proj-id').value = project.id;
            document.getElementById('proj-title').value = project.title;
            document.getElementById('proj-desc').value = project.description;
            document.getElementById('proj-tags').value = project.category; // Note: Will show with ' · ' separator
            document.getElementById('proj-img').value = project.image;
            document.getElementById('proj-link').value = project.link;

            // Switch tab to projects
            const tabEl = document.querySelector('#tab-projects');
            const tab = bootstrap.Tab.getOrCreateInstance(tabEl);
            tab.show();

            // UI Updates for Edit
            const btn = document.querySelector('#addProjectForm button[type="submit"]');
            if (btn) btn.textContent = 'Update Project';
            document.getElementById('proj-id').readOnly = true;

            window.scrollTo({ top: 0, behavior: 'smooth' });
            // alert(`Editing ${project.id}. Update form and click 'Update Project' to save changes.`);
        }
    } catch (e) {
        console.error(e);
    }
};

window.deleteProject = async function (id) {
    if (confirm(`Are you sure you want to delete project: ${id}?`)) {
        try {
            const response = await fetch(`${API_BASE}/projects/${id}`, {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error('Delete failed');
            fetchProjects();
        } catch (error) {
            alert(`Error deleting: ${error.message}`);
        }
    }
};

window.editDoc = async function (id) {
    try {
        const response = await fetch(`${API_BASE}/docs`);
        const docs = await response.json();
        const doc = docs.find(d => d.id === id);

        if (doc) {
            document.getElementById('doc-id').value = doc.id;
            document.getElementById('doc-title').value = doc.title;
            document.getElementById('doc-category').value = doc.category;
            document.getElementById('doc-content').value = doc.content;
            document.getElementById('doc-audio').value = doc.audio_file || '';

            // Switch tab
            const tabEl = document.querySelector('#tab-docs');
            const tab = bootstrap.Tab.getOrCreateInstance(tabEl);
            tab.show();

            // UI Updates for Edit
            const btn = document.querySelector('#addDocForm button[type="submit"]');
            if (btn) btn.textContent = 'Update Document';
            document.getElementById('doc-id').readOnly = true;

            window.scrollTo({ top: 0, behavior: 'smooth' });
            // alert(`Editing ${doc.id}. Update form and click 'Update Document' to save changes.`);
        }
    } catch (e) {
        console.error(e);
    }
};

window.deleteDoc = async function (id) {
    if (confirm(`Are you sure you want to delete document: ${id}?`)) {
        try {
            const response = await fetch(`${API_BASE}/docs/${id}`, {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error('Delete failed');
            fetchDocs();
        } catch (error) {
            alert(`Error deleting: ${error.message}`);
        }
    }
};
