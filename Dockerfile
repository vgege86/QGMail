# Stage 1: Build frontend
FROM node:20-alpine AS frontend-build
WORKDIR /build/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stage 2: Build backend
FROM node:20-alpine AS backend-build
WORKDIR /build/backend
COPY backend/package*.json ./
RUN npm ci
COPY backend/ ./
RUN npm run build

# Stage 3: Production image (ARM64 compatible via node:20-alpine)
FROM node:20-alpine AS final
WORKDIR /app

COPY backend/package*.json ./
RUN npm ci --omit=dev

COPY --from=backend-build /build/backend/dist ./dist
COPY --from=frontend-build /build/frontend/dist ./public

RUN mkdir -p /app/sessions

EXPOSE 3000
CMD ["node", "dist/index.js"]
