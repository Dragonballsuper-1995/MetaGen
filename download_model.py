import os
from huggingface_hub import hf_hub_download

REPO_ID = "SujalChhajed925/yt-seo-mistral-merged"
FILENAME = "custom-mistral-yt-seo-Q4_K_M.gguf"
LOCAL_DIR = "backend/model"

def download():
    target_path = os.path.join(LOCAL_DIR, FILENAME)
    if os.path.exists(target_path):
        print(f"Model already exists at {target_path}, skipping download.")
        return

    print(f"Downloading {FILENAME} from {REPO_ID}...")
    os.makedirs(LOCAL_DIR, exist_ok=True)
    path = hf_hub_download(
        repo_id=REPO_ID,
        filename=FILENAME,
        local_dir=LOCAL_DIR
    )
    print(f"Model downloaded to: {path}")

if __name__ == "__main__":
    download()
