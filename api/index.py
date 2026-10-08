import sys
import os

# Set VERCEL environment variable to activate serverless /tmp storage
os.environ["VERCEL"] = "1"

current_dir = os.path.dirname(os.path.abspath(__file__))
root_dir = os.path.abspath(os.path.join(current_dir, ".."))
backend_dir = os.path.join(root_dir, "backend")

for p in [current_dir, backend_dir, root_dir, "/var/task/api", "/var/task/backend", "/var/task"]:
    if os.path.exists(p) and p not in sys.path:
        sys.path.insert(0, p)

try:
    from app.main import app
except ImportError:
    try:
        from api.app.main import app
    except ImportError:
        try:
            from backend.app.main import app
        except ImportError:
            import app.main as app_main
            app = app_main.app
