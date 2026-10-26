# ============================================================
# Dockerfile: Frontend SPA (React 19 + Vite + Nginx) - Multi-Stage
# ============================================================

# Etapa 1: Build de la aplicación React
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm install && npm cache clean --force

COPY . .

RUN npm run build

# Etapa 2: Servidor Nginx de producción
FROM nginx:alpine

# Reemplazar configuración de Nginx con el proxy configurado
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar bundle estático generado
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
