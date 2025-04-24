import os
import time
import datetime
import logging
import zipfile
import io
import glob
import functools
from flask import Flask, render_template, request, Response, jsonify, flash, session, send_file, url_for, redirect
import requests
from data_manager import data_manager

# Setup logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "dev_secret_key")

# Rate limiting configuration
RATE_LIMIT_SECONDS = data_manager.get_setting("RATE_LIMIT_SECONDS", 60)  # Minimum time between uploads (60 seconds)
DEFAULT_TOKENS = data_manager.get_setting("DEFAULT_TOKENS", 5)          # Each IP gets 5 tokens per day

# Store token information by IP
user_tokens = {}  # Format: { ip: { "tokens": int, "last_upload": float, "date": "YYYY-MM-DD" } }

def get_user_info(ip):
    """Get or initialize user token information."""
    today_str = datetime.date.today().strftime("%Y-%m-%d")
    
    if ip not in user_tokens or user_tokens[ip]["date"] != today_str:
        user_tokens[ip] = {"tokens": DEFAULT_TOKENS, "last_upload": 0, "date": today_str}
    
    return user_tokens[ip]

def check_maintenance_mode():
    """Check if the system is in maintenance mode."""
    return data_manager.get_setting("MAINTENANCE_MODE", False)

def maintenance_required(f):
    """Decorator to check for maintenance mode and redirect if enabled."""
    @functools.wraps(f)
    def decorated_function(*args, **kwargs):
        # Skip maintenance check for maintenance toggle routes
        if request.path in ['/btr', '/nbtr']:
            return f(*args, **kwargs)
        
        # Check if maintenance mode is enabled
        if check_maintenance_mode():
            maintenance_message = data_manager.get_setting("MAINTENANCE_MESSAGE", 
                                  "System is currently undergoing maintenance. Please try again later.")
            return render_template('maintenance.html', maintenance_message=maintenance_message)
        return f(*args, **kwargs)
    return decorated_function

# Apply maintenance check to app
app.before_request(lambda: maintenance_required(lambda: None)())

@app.route('/')
def index():
    """Render the main upload page."""
    ip = request.remote_addr
    user_info = get_user_info(ip)
    
    now = time.time()
    cooldown_remaining = max(0, RATE_LIMIT_SECONDS - (now - user_info["last_upload"]))
    
    return render_template('index.html', 
                           tokens_remaining=user_info["tokens"],
                           cooldown_remaining=int(cooldown_remaining))
                           
@app.route('/about')
def about():
    """Render the project information page."""
    ip = request.remote_addr
    user_info = get_user_info(ip)
    
    # Get information about the project structure
    project_files = {}
    dirs_to_scan = ['.', 'static', 'static/css', 'static/js', 'templates']
    
    for directory in dirs_to_scan:
        files = []
        for file_path in glob.glob(os.path.join(directory, '*.*')):
            if '__pycache__' not in file_path and '.git' not in file_path:
                # Get file size
                size = os.path.getsize(file_path)
                # Format size
                if size < 1024:
                    size_str = f"{size} bytes"
                elif size < 1024 * 1024:
                    size_str = f"{size/1024:.1f} KB"
                else:
                    size_str = f"{size/(1024*1024):.1f} MB"
                
                # Get last modified time
                mod_time = datetime.datetime.fromtimestamp(os.path.getmtime(file_path))
                mod_time_str = mod_time.strftime("%Y-%m-%d %H:%M:%S")
                
                files.append({
                    'name': os.path.basename(file_path),
                    'path': file_path,
                    'size': size_str,
                    'modified': mod_time_str
                })
        
        if files:
            project_files[directory] = files
    
    now = time.time()
    cooldown_remaining = max(0, RATE_LIMIT_SECONDS - (now - user_info["last_upload"]))
    
    return render_template('about.html', 
                          project_files=project_files,
                          tokens_remaining=user_info["tokens"],
                          cooldown_remaining=int(cooldown_remaining))

@app.route('/check_status')
def check_status():
    """API endpoint to check user's current tokens and cooldown status."""
    ip = request.remote_addr
    user_info = get_user_info(ip)
    
    now = time.time()
    cooldown_remaining = max(0, RATE_LIMIT_SECONDS - (now - user_info["last_upload"]))
    
    return jsonify({
        "tokens_remaining": user_info["tokens"],
        "cooldown_remaining": int(cooldown_remaining),
        "can_upload": user_info["tokens"] > 0 and cooldown_remaining == 0
    })

@app.route('/upload_game', methods=['POST'])
def upload_game():
    """Handle game upload to Roblox."""
    ip = request.remote_addr
    now = time.time()
    
    # Get or initialize user info
    user_info = get_user_info(ip)
    
    # Check rate limit
    if now - user_info["last_upload"] < RATE_LIMIT_SECONDS:
        wait = int(RATE_LIMIT_SECONDS - (now - user_info["last_upload"]))
        return Response(f"Vui lòng đợi thêm {wait} giây trước khi tải lên tiếp theo.", status=429)
    
    # Check tokens remaining
    if user_info["tokens"] <= 0:
        return Response("Bạn đã sử dụng hết MT Token hôm nay.", status=403)
    
    # Get required parameters from form
    apikey = request.form.get('apikey')
    universe_id = request.form.get('universe_id')
    place_id = request.form.get('place_id')
    file = request.files.get('file')
    
    # Validate form data
    if not (apikey and universe_id and place_id and file):
        return Response("Thiếu thông tin bắt buộc.", status=400)
    
    if not file.filename.endswith('.rbxl'):
        return Response("File không hợp lệ. Vui lòng tải lên file .rbxl.", status=400)
    
    # Read file data
    file_data = file.read()
    
    # Call Roblox API to publish the game with versionType=Published
    url = f'https://apis.roblox.com/universes/v1/{universe_id}/places/{place_id}/versions?versionType=Published'
    headers = {
        'x-api-key': apikey,
        'Content-Type': 'application/octet-stream'
    }
    
    try:
        logger.debug(f"Sending request to Roblox API: {url}")
        r = requests.post(url, headers=headers, data=file_data)
        
        # Update upload information
        user_tokens[ip]["last_upload"] = now
        user_tokens[ip]["tokens"] -= 1
        
        if r.status_code in [200, 201]:
            logger.info(f"Upload successful for IP {ip}")
            return Response(f"Tải lên thành công: {r.text}", status=r.status_code)
        else:
            logger.warning(f"Upload failed with status {r.status_code}: {r.text}")
            return Response(f"Tải lên thất bại: {r.status_code} - {r.text}", status=r.status_code)
    
    except Exception as e:
        logger.error(f"Error during upload: {str(e)}")
        return Response(f"Lỗi trong quá trình tải lên: {str(e)}", status=500)

@app.route('/dpa')
def download_project_archive():
    """Create and send a zip file containing all project files."""
    logger.info("Creating project zip archive for download")
    
    # Create a BytesIO object to store the zip file
    memory_file = io.BytesIO()
    
    # Create a ZipFile object
    with zipfile.ZipFile(memory_file, 'w', zipfile.ZIP_DEFLATED) as zf:
        # List of directories to include
        dirs_to_include = ['.', 'static', 'static/css', 'static/js', 'templates']
        
        # Add files from each directory
        for directory in dirs_to_include:
            for file_path in glob.glob(os.path.join(directory, '*.*')):
                # Don't include '__pycache__', '.git', etc.
                if '__pycache__' not in file_path and '.git' not in file_path:
                    # Get the arcname (path within the zip file)
                    if directory == '.':
                        arcname = os.path.basename(file_path)
                    else:
                        arcname = file_path
                    
                    # Add file to the zip
                    try:
                        zf.write(file_path, arcname)
                        logger.debug(f"Added {file_path} to zip archive")
                    except Exception as e:
                        logger.error(f"Error adding {file_path} to zip: {str(e)}")
    
    # Seek to the beginning of the BytesIO object
    memory_file.seek(0)
    
    # Create a timestamp for the filename
    timestamp = datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
    
    # Return the zip file as an attachment
    return send_file(
        memory_file,
        mimetype='application/zip',
        as_attachment=True,
        download_name=f'roblox_uploader_project_{timestamp}.zip'
    )

@app.errorhandler(404)
def page_not_found(error):
    """Handle 404 errors with a custom page."""
    logger.info(f"404 error occurred: {request.path}")
    return render_template('404.html'), 404

@app.errorhandler(500)
def server_error(error):
    """Handle 500 errors with a custom page."""
    logger.error(f"500 error occurred: {str(error)}")
    return render_template('500.html', error_message="Máy chủ gặp sự cố nghiêm trọng khi xử lý yêu cầu của bạn. Đội kỹ thuật của chúng tôi đã được thông báo và đang khắc phục vấn đề."), 500

@app.route('/btr')
def enable_maintenance():
    """Enable maintenance mode."""
    data_manager.toggle_maintenance_mode(True)
    
    # Log the action
    logger.info("Maintenance mode enabled")
    
    return redirect(url_for('index'))

@app.route('/nbtr')
def disable_maintenance():
    """Disable maintenance mode."""
    data_manager.toggle_maintenance_mode(False)
    
    # Log the action
    logger.info("Maintenance mode disabled")
    
    return redirect(url_for('index'))

@app.route('/test-500')
def test_500_error():
    """Route to deliberately trigger a 500 error for testing."""
    # Cố tình gây lỗi bằng cách chia cho 0
    x = 1 / 0
    return "This line will never be reached due to the error above"

if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5000, debug=True)
