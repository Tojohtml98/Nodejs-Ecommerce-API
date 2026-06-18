#!/usr/bin/env bash
# Demo end-to-end: levanta el servicio FastAPI, golpea los endpoints contra el
# PostgreSQL real (el de postgres/docker-compose.yml ya seedeado) y lo apaga.
set -euo pipefail
cd "$(dirname "$0")"

source .venv/bin/activate

echo "→ Levantando uvicorn en :8000 ..."
uvicorn app.main:app --port 8000 --log-level warning &
SERVER_PID=$!
trap 'kill $SERVER_PID 2>/dev/null || true' EXIT

# Esperar a que responda /health
for _ in $(seq 1 20); do
  if curl -sf http://localhost:8000/health >/dev/null 2>&1; then break; fi
  sleep 0.5
done

echo
echo "=== GET /health ==="
curl -s http://localhost:8000/health | python -m json.tool

echo
echo "=== GET /products?category=mates&limit=2 ==="
curl -s "http://localhost:8000/products?category=mates&limit=2" | python -m json.tool

echo
echo "=== GET /products/3 ==="
curl -s http://localhost:8000/products/3 | python -m json.tool

echo
echo "=== GET /analytics/by-category ==="
curl -s http://localhost:8000/analytics/by-category | python -m json.tool

echo
echo "=== GET /analytics/inventory ==="
curl -s http://localhost:8000/analytics/inventory | python -m json.tool

echo
echo "✅ Demo completa."
