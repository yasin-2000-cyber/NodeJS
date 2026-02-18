
FROM node:20-alpine AS deps
WORKDIR /app


COPY package.json package-lock.json* ./
RUN npm ci --omit=dev


FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci
COPY . .

# runtime 
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production


COPY --from=deps /app/node_modules ./node_modules


COPY ./src ./src
COPY ./sql ./sql
COPY package.json ./

EXPOSE 3000


CMD ["sh", "-c", "node src/util/wait_for_db.js && node src/util/run_migrations.js && node src/server.js"]

