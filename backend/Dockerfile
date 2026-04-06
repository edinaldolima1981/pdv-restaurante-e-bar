FROM node:20-alpine

WORKDIR /app

# Copiar package.json e instalar deps
COPY package*.json ./
RUN npm install --only=production

# Copiar código
COPY . .

# Expor porta
EXPOSE 3004

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3004/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Iniciar servidor
CMD ["node", "server.js"]
