# Stage 1: Build the frontend
FROM node:18-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
# We pass an empty string or relative path if needed, but Cloud Run sets env vars at runtime. 
# Vite bakes in env vars at build time, so for API calls to the same origin, we can configure Vite to use a relative path.
# Wait, if they are served from the same host, the frontend can just hit '/api' instead of an absolute URL.
# Set VITE_API_BASE_URL to empty so frontend makes relative API calls to the same origin
ENV VITE_API_BASE_URL=""
RUN npm run build

# Stage 2: Build the backend and copy frontend build
FROM node:18-alpine
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci --only=production
COPY backend/ ./

# Copy built frontend static files from stage 1
COPY --from=frontend-builder /app/frontend/dist /app/frontend/dist

# Expose port
EXPOSE 5000

# Start server
CMD ["npm", "start"]
