FROM python:3.9-slim

WORKDIR /app

# Install dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Create directories with proper permissions for Hugging Face Spaces (which runs as non-root)
RUN mkdir -p /app/backend/uploads /app/backend/chroma_db && \
    chmod -R 777 /app/backend/uploads /app/backend/chroma_db

# Copy backend code
COPY backend /app/backend/
# Copy sample documents so they can be loaded by the backend
COPY sample_documents /app/sample_documents/

# Hugging Face Spaces run on port 7860
EXPOSE 7860

WORKDIR /app/backend

# The command to start the FastAPI server on port 7860
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]
