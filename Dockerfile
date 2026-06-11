# Use Python 3.11 slim for a more modern runtime
FROM python:3.11-slim

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PORT=7860 \
    HOME=/home/user

# Create user early
RUN useradd -m -u 1000 user
WORKDIR $HOME/app

# Install system dependencies as root
RUN apt-get update && apt-get install -y \
    build-essential \
    python3-dev \
    cmake \
    git \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install as root
COPY requirements_hf.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements_hf.txt

# Copy the rest of the application
COPY . .

# Fix permissions for the whole app directory
RUN chown -R 1000:1000 $HOME/app

# Switch to the non-root user
USER user
ENV PATH="/home/user/.local/bin:${PATH}"

# Environment variables for the app
ENV MODEL_PATH=backend/model/custom-mistral-yt-seo-Q4_K_M.gguf
ENV GENERATION_STRATEGY=tfidf_streaming
ENV LOG_LEVEL=INFO

# Expose port
EXPOSE 7860

# Start via Python wrapper
CMD ["python", "run_app.py"]
