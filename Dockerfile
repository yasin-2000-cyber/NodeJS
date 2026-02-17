
FROM node:20-alpine AS build

WORKDIR /app

COPY node-complex-api/package.json node-complex-api/package-lock.json* ./
COPY node-complex-api/tsconfig.json ./

RUN npm ci

COPY node-complex-api/src ./src
COPY node-complex-api/prisma ./prisma

RUN npx prisma generate
RUN npm run build


FROM node:20-alpine AS runtime

WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app/node_modules ./node_modules

COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma

EXPOSE 3000

CMD ["sh", "-c", "npx prisma db push && node dist/server.js"]
