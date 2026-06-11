#!/bin/bash
# Download model
python download_model.py

# Start uvicorn
python -m uvicorn backend.main:app --host 0.0.0.0 --port 7860
