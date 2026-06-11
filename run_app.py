import subprocess
import sys
import os
from download_model import download

if __name__ == "__main__":
    # Ensure model is downloaded
    try:
        download()
    except Exception as e:
        print(f"Error during model download: {e}")
        # We don't exit here, maybe the model is already there or download failed but app can start
    
    # Start the web server
    print("Starting uvicorn...")
    subprocess.run([
        sys.executable, "-m", "uvicorn", "backend.main:app",
        "--host", "0.0.0.0", "--port", "7860"
    ])
