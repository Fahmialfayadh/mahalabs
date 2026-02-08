from flask import Flask, render_template, request, jsonify, send_from_directory
import json
import os
import uuid

app = Flask(__name__, static_folder='assets', template_folder='.')

DATA_FILE = 'projects.json'
DOCS_FILE = 'docs.json'

def load_projects():
    if not os.path.exists(DATA_FILE):
        return []
    with open(DATA_FILE, 'r') as f:
        return json.load(f)

def load_docs():
    if not os.path.exists(DOCS_FILE):
        return []
    with open(DOCS_FILE, 'r') as f:
        return json.load(f)

def save_projects(projects):
    with open(DATA_FILE, 'w') as f:
        json.dump(projects, f, indent=2)

def save_docs(docs):
    with open(DOCS_FILE, 'w') as f:
        json.dump(docs, f, indent=2)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/admin')
def admin():
    return render_template('admin.html')

@app.route('/docs')
def docs():
    return render_template('docs.html')

@app.route('/assets/<path:path>')
def send_assets(path):
    return send_from_directory('assets', path)

@app.route('/projects.json')
def send_projects_json():
    return send_from_directory('.', 'projects.json')

@app.route('/api/projects', methods=['GET'])
def get_projects():
    projects = load_projects()
    return jsonify(projects)

@app.route('/api/projects', methods=['POST'])
def add_project():
    projects = load_projects()
    data = request.json
    
    # Check if updating existing
    if 'id' in data and data['id']:
        for i, p in enumerate(projects):
            if p['id'] == data['id']:
                projects[i] = data
                save_projects(projects)
                return jsonify(data)
    
    # Create new
    new_project = {
        "id": data.get('id') if data.get('id') else str(uuid.uuid4()),
        "title": data.get('title', ''),
        "description": data.get('description', ''),
        "category": data.get('category', ''),
        "is_featured": data.get('is_featured', False),
        "link": data.get('link', '#'),
        "image": data.get('image', 'project_preview.png'),
        "status": data.get('status', 'Active'),
        "tag_color": data.get('tag_color', '')
    }
    projects.append(new_project)
    save_projects(projects)
    return jsonify(new_project)

@app.route('/api/projects/<id>', methods=['DELETE'])
def delete_project(id):
    projects = load_projects()
    projects = [p for p in projects if p['id'] != id]
    save_projects(projects)
    save_projects(projects)
    return jsonify({"success": True})

@app.route('/api/docs', methods=['GET'])
def get_docs():
    docs = load_docs()
    return jsonify(docs)

@app.route('/api/docs', methods=['POST'])
def add_doc():
    docs = load_docs()
    data = request.json
    
    # Check if updating existing
    if 'id' in data and data['id']:
        for i, d in enumerate(docs):
            if d['id'] == data['id']:
                docs[i] = data
                save_docs(docs)
                return jsonify(data)
    
    # Create new
    new_doc = {
        "id": data.get('id') if data.get('id') else str(uuid.uuid4()),
        "title": data.get('title', ''),
        "category": data.get('category', 'General'),
        "content": data.get('content', ''),
        "last_updated": data.get('last_updated', '')
    }
    docs.append(new_doc)
    save_docs(docs)
    return jsonify(new_doc)

@app.route('/api/docs/<id>', methods=['DELETE'])
def delete_doc(id):
    docs = load_docs()
    docs = [d for d in docs if d['id'] != id]
    save_docs(docs)
    return jsonify({"success": True})

if __name__ == '__main__':
    app.run(debug=True, port=5000)
