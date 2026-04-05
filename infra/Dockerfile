# --- Build frontend ---
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# --- Build backend ---
FROM node:20-alpine AS backend-build
WORKDIR /app/backend
COPY backend/package.json backend/package-lock.json* ./
RUN npm install
COPY backend/ ./
RUN npx prisma generate
RUN npm run build

# --- Production ---
FROM node:20-alpine
WORKDIR /app

COPY --from=backend-build /app/backend/package.json /app/backend/package-lock.json* ./
RUN npm install --omit=dev

# Prisma client gerado do build stage
COPY --from=backend-build /app/backend/node_modules/.prisma ./node_modules/.prisma
COPY --from=backend-build /app/backend/node_modules/@prisma/client ./node_modules/@prisma/client

# Prisma schema + migrations + seed
COPY --from=backend-build /app/backend/prisma ./prisma

COPY --from=backend-build /app/backend/dist ./dist
COPY --from=frontend-build /app/frontend/dist ./public

RUN mkdir -p /app/uploads && chown -R node:node /app

USER node

EXPOSE 3000

CMD sh -c "npx prisma migrate deploy && npx tsx prisma/seed.ts && node dist/server.js"
