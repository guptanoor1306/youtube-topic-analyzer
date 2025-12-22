# Use Python 3.10 slim image
FROM python:3.10-slim

# Set working directory
WORKDIR /app

# Copy the entire project
COPY . .

# Install dependencies from backend/requirements.txt
RUN pip install --no-cache-dir -r backend/requirements.txt

# Change to backend directory
WORKDIR /app/backend

# Expose port (Railway will override with $PORT)
EXPOSE 8000

# Use ENTRYPOINT instead of CMD (harder for Railway to override)
ENTRYPOINT ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]

