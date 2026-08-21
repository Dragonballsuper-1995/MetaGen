import os
import subprocess
import sys
import threading
from download_model import download


def _background_download():
    try:
        download()
    except Exception as e:
        print(f"[Warning] Background GGUF model download encountered error: {e}")


if __name__ == "__main__":
    # Launch model download in background thread so Uvicorn starts immediately (<1s)
    bg_thread = threading.Thread(target=_background_download, daemon=True)
    bg_thread.start()

    # Start the web server immediately on Hugging Face port 7860
    print("Starting uvicorn on 0.0.0.0:7860...")
    subprocess.run([
        sys.executable, "-m", "uvicorn", "backend.main:app",
        "--host", "0.0.0.0", "--port", "7860"
    ])
