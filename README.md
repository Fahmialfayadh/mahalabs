# MahaLabs

MahaLabs is a web-based platform designed for data analysis portfolio showcase and experimental project documentation. It functions as a hybrid system that can operate as a dynamic Flask application or a static single-page application (SPA) with JSON-based data persistence.

## Project Overview

The platform serves two primary purposes:
1.  **Experiment Showcase**: A portfolio interface to display data projects, visualizations, and experimental concepts.
2.  **MahaInsight (Knowledge Base)**: A documentation hub for technical articles, system architecture notes, and data stories.

## Technical Architecture

The system avoids heavy frontend frameworks in favor of performance and simplicity, using a "Zero-Build" approach.

### Stack
*   **Backend**: Python (Flask) - Provides API endpoints for CRUD operations on projects and documentation.
*   **Frontend**: Native HTML5, CSS3, and Vanilla JavaScript.
    *   **Styling**: Custom CSS with CSS Variables for theming (Light/Dark mode) and Bootstrap 5 for grid/layout.
    *   **Interactivity**: ES6+ JavaScript for DOM manipulation, dynamic content rendering, and state management.
*   **Data Storage**: File-based JSON persistence (`projects.json`, `docs.json`). This ensures the application is portable and requires no external database server for basic operation.

### Key Features

*   **Dual-Mode Operation**:
    *   **Dynamic Mode**: Runs with `app.py`, allowing administration (CRUD) of content via API endpoints.
    *   **Static Mode**: Implements fallback logic in the frontend (`fetch` API) to load content directly from JSON files if the backend API is unreachable.
*   **Responsive Design**: Mobile-first architecture with collapsible navigation and grid adaptations for various screen sizes.
*   **Dark Mode System**: Global theme management using `localStorage` persistence and CSS variables.
*   **Markdown Rendering**: Integrated `marked.js` to render Markdown content dynamically within the documentation interface.
*   **Search & Filtering**: Client-side filtering logic for projects based on tags and categories.

## Project Structure

```
mahalabsv2/
├── app.py                  # Main Flask application and API routes
├── projects.json           # Data store for portfolio projects
├── docs.json               # Data store for documentation articles
├── requirements-dev.txt    # Python dependencies
├── index.html              # Main landing page (Experiments)
├── docs.html               # Knowledge Base interface
├── about.html              # About page
├── admin.html              # Admin interface for content management
└── assets/                 # Static resources
    ├── style.css           # Core styles
    ├── docs.css            # Documentation-specific styles
    ├── lab.js              # Project rendering logic
    └── theme.js            # Theme toggling logic
```



## API Endpoints

When running with Flask (`app.py`), the following endpoints are available:

*   `GET /api/projects`: Retrieve all projects.
*   `POST /api/projects`: Create or update a project.
*   `DELETE /api/projects/<id>`: Delete a project.
*   `GET /api/docs`: Retrieve all documentation articles.
*   `POST /api/docs`: Create or update an article.
*   `DELETE /api/docs/<id>`: Delete an article.

## Administrative Functions

The `admin.html` page provides a GUI for:
*   Adding new experiments/projects.
*   Writing and editing documentation (supports Markdown).
*   Managing existing content.

Note: In a production environment, access to `admin.html` and write-operations should be secured.

## License

[MIT License](LICENSE)
