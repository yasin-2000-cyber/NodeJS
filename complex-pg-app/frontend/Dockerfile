# ---------- build ----------
FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .

# If you're using a bundler (Vite/Webpack), set build output to /app/dist:
# RUN npm run build

# If you're NOT using a bundler (your frontend is plain html/css/js),
# we'll just "publish" the files as-is.
RUN mkdir -p /out && cp -r index.html styles.css app.js /out/

# ---------- runtime ----------
FROM nginx:1.27-alpine AS runtime

# Optional: custom nginx config (recommended)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built static files
# If using bundler: COPY --from=build /app/dist /usr/share/nginx/html
COPY --from=build /out /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

