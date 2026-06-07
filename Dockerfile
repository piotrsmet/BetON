# Dockerfile dla backendu Node.js i frontendu React (wspólny obraz serwujący statyczne pliki)

# Etap 1: Budowanie frontendu
FROM node:18-alpine AS frontend-builder

WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install

COPY frontend/ ./
RUN npm run build

# Etap 2: Środowisko uruchomieniowe backendu
FROM node:18-alpine

WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm install

COPY backend/ ./
# Kopiowanie zbudowanych plików frontendu, by backend (express) mógł je serwować
COPY --from=frontend-builder /app/frontend/dist /app/frontend/dist

# Wygenerowanie klienta Prisma
RUN npx prisma generate

EXPOSE 5001

CMD ["node", "server.js"]
