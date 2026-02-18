# ---------- deps ----------
FROM node:20-alpine AS deps
WORKDIR /app

# Install deps first for better layer caching
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

# ---------- build (optional: if you later add TS/build step) ----------
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci
COPY . .
# If you have a build step (TypeScript), enable this:
# RUN npm run build

# ---------- runtime ----------
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

# Copy production node_modules
COPY --from=deps /app/node_modules ./node_modules

# Copy source (for plain JS). If you build to /dist, copy /dist instead.
COPY ./src ./src
COPY ./sql ./sql
COPY package.json ./

EXPOSE 3000

# Run SQL migration then start server
# Uses DATABASE_URL from environment
CMD ["sh", "-c", "node src/util/wait_for_db.js && node src/util/run_migrations.js && node src/server.js"]

