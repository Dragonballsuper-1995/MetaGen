import os
import subprocess
import sys
import threading
from download_model import download, MODEL_CATALOG


def _background_download():
    preload_var = os.environ.get("PRELOAD_MODELS", "mistral-7b,phi-4-mini")
    model_keys = [k.strip() for k in preload_var.split(",") if k.strip()]
    for key in model_keys:
        if key == "all":
            for k in MODEL_CATALOG:
                try:
                    download(k)
                except Exception as e:
                    print(f"[Warning] Background download for {k} failed: {e}")
            break
        elif key in MODEL_CATALOG:
            try:
                download(key)
            except Exception as e:
                print(f"[Warning] Background download for {key} failed: {e}")


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
