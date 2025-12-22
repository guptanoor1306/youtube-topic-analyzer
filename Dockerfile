# Use Python 3.10 slim image
FROM python:3.10-slim

# Set working directory
WORKDIR /app

# Copy the entire project
COPY . .

# Install dependencies from backend/requirements.txt
RUN pip install --no-cache-dir -r backend/requirements.txt

# Make start script executable
RUN chmod +x /app/start.sh

# Expose port (Railway will override with $PORT)
EXPOSE 8000

# Run start script
CMD ["/app/start.sh"]

