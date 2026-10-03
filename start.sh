#!/bin/bash
# ============================================
# AI Infrastructure Monitor - Startup Script
# ============================================
set -e
cd "$(dirname "$0")"

echo "============================================"
echo "  MotorGuard AI - Predictive Maintenance"
echo "============================================"

# Check Python
PYTHON_CMD="python3"
if ! command -v python3 &> /dev/null; then
    if command -v python &> /dev/null; then
        PYTHON_CMD="python"
    else
        echo "ERROR: Python 3 not found. Install Python 3.8+ first."
        exit 1
    fi
fi

echo "Python: $($PYTHON_CMD --version)"

# Check and install dependencies
echo ""
echo "[1/2] Checking dependencies..."
$PYTHON_CMD -m pip install -r requirements.txt

echo "Dependencies OK."

# Start unified backend & frontend server
echo ""
echo "[2/2] Starting unified server on http://localhost:8000 ..."
echo "       Dashboard & Control Room: http://localhost:8000"
echo "       Interactive Swagger Docs: http://localhost:8000/docs"
echo ""

$PYTHON_CMD -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
