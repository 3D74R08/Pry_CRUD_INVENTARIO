# ============================================================
# Dockerfile: API Core (Node.js + Express) - DevSecOps Hardened
# ============================================================
FROM node:20-alpine AS base

WORKDIR /app

# Crear directorio de subidas y configurar permisos para el usuario sin privilegios 'node'
RUN mkdir -p /app/uploads && chown -R node:node /app

COPY package*.json ./

RUN npm install --omit=dev && npm cache clean --force

COPY --chown=node:node . .

USER node

EXPOSE 5000

ENV NODE_ENV=production

CMD ["node", "src/app.js"]
