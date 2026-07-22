# syntax=docker/dockerfile:1
# Single-container build: Node builds the React SPA, then a Python image serves the
# FastAPI API AND the built SPA (StaticFiles + deep-link catch-all) on port 80. This is
# the image the k8s Deployment runs (one container, containerPort 80, behind the ingress
# that strips the /e2e-lane-fastapi-react prefix).

# ---- Stage 1: build the React SPA ---------------------------------------------------
FROM node:20-alpine AS web
WORKDIR /web
# Vite base MUST include the ingress prefix so asset URLs resolve under it. IMAGE_NAME
# equals the ingress prefix segment for this lane.
ARG BASE_PATH=/e2e-lane-fastapi-react/
COPY web/package*.json ./
RUN npm ci --no-audit --no-fund --loglevel=error
COPY web/ ./
RUN npx vite build --base="${BASE_PATH}"

# ---- Stage 2: FastAPI runtime serving API + SPA -------------------------------------
FROM python:3.12-slim
WORKDIR /app
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    STATIC_DIR=/app/static \
    BASE_PATH=/e2e-lane-fastapi-react

COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Backend source (app/, seed.py, init_db, …).
COPY backend/ ./
# Built SPA served by FastAPI StaticFiles + catch-all.
COPY --from=web /web/dist ./static

EXPOSE 80
# Ensure tables + seed (non-fatal), then serve. Startup also calls init_db() defensively.
CMD sh -c 'python -m app.init_db || true; python seed.py || true; uvicorn app.main:app --host 0.0.0.0 --port 80'
