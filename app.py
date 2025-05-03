import os
import logging
import json
import tempfile
from flask import Flask, render_template, request, jsonify, send_file, session, flash
from werkzeug.utils import secure_filename
from utils.file_processor import extract_text_from_file
from utils.embeddings import generate_embeddings

# Configure logging
logging.basicConfig(level=logging.DEBUG)

app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "default-secret-key")

# File upload settings
ALLOWED_EXTENSIONS = {'pdf', 'docx', 'xlsx', 'xls'}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload_file():
    # Check if the post request has the file part
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    
    file = request.files['file']
    
    # If user does not select a file, browser submits an empty file
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    if not allowed_file(file.filename):
        return jsonify({'error': f'Invalid file type. Allowed types: {", ".join(ALLOWED_EXTENSIONS)}'}), 400
    
    # Check file size
    file.seek(0, os.SEEK_END)
    file_size = file.tell()
    file.seek(0)
    
    if file_size > MAX_FILE_SIZE:
        return jsonify({'error': f'File too large. Maximum size is {MAX_FILE_SIZE/1024/1024:.1f}MB'}), 400
    
    try:
        # Save file to a temporary location
        filename = secure_filename(file.filename)
        temp_dir = tempfile.mkdtemp()
        file_path = os.path.join(temp_dir, filename)
        file.save(file_path)
        
        # Extract text from the file
        text = extract_text_from_file(file_path, filename)
        
        if not text:
            return jsonify({'error': 'Could not extract text from the file'}), 400
        
        # Generate embeddings
        embeddings = generate_embeddings(text)
        
        # Create a temporary JSON file with the embeddings
        output_path = os.path.join(temp_dir, 'embeddings.json')
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump({
                'filename': filename,
                'text': text,
                'embeddings': embeddings.tolist()  # Convert numpy array to list
            }, f, ensure_ascii=False, indent=2)
        
        session['output_file'] = output_path
        
        return jsonify({
            'success': True,
            'message': 'File processed successfully',
            'filename': filename,
            'text_length': len(text),
            'embedding_size': len(embeddings)
        })
    
    except Exception as e:
        logging.error(f"Error processing file: {str(e)}")
        return jsonify({'error': f'Error processing file: {str(e)}'}), 500

@app.route('/download')
def download():
    output_file = session.get('output_file')
    
    if not output_file or not os.path.exists(output_file):
        flash('No processed file found. Please upload a file first.', 'error')
        return render_template('index.html')
    
    return send_file(
        output_file,
        as_attachment=True,
        download_name='embeddings.json',
        mimetype='application/json'
    )

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
