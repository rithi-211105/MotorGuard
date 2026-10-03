# ============================================
# Stage 1: Build Frontend (React + Vite)
# ============================================
FROM node:20-alpine AS frontend-builder
WORKDIR /app
COPY package*.json vite.config.js ./
COPY dashboard/ ./dashboard/
RUN npm ci --prefer-offline --no-audit || npm install
RUN npm run build

# ============================================
# Stage 2: Backend + Unified Server (FastAPI)
# ============================================
FROM python:3.11-slim
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY backend/ ./backend/
COPY ml/ ./ml/
COPY scripts/ ./scripts/
COPY docs/ ./docs/
COPY esp32_firmware/ ./esp32_firmware/
COPY MotorsData_rev.xlsx ./MotorsData_rev.xlsx
COPY start.sh start.bat pyrightconfig.json ./

# Copy built frontend assets from Stage 1 into dashboard/dist
COPY --from=frontend-builder /app/dashboard/dist ./dashboard/dist

# Expose port (Default: 8000)
ENV PORT=8000
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD curl -f http://localhost:${PORT}/health || exit 1

# Start unified Uvicorn server
CMD ["python", "-m", "uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
