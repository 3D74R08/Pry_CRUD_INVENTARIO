# ============================================================
# Dockerfile: Worker Asíncrono (Node.js 22 LTS) - Headless (Sin exposición HTTP)
# ============================================================
FROM node:22-alpine AS base

WORKDIR /app

# Crear directorio de trabajo y asegurar permisos sin privilegios de root
RUN mkdir -p /app/uploads && chown -R node:node /app

COPY package*.json ./

RUN npm install --omit=dev && npm cache clean --force

COPY --chown=node:node . .

USER node

ENV NODE_ENV=production

# El worker es un proceso autónomo de fondo (daemon) sin puertos de red
CMD ["node", "src/worker.js"]
