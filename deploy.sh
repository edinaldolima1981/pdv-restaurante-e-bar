#!/bin/bash

set -e

echo "🚀 Iniciando deployment do PDV Restaurante..."

# 1. Clonar repositório
echo "📥 Clonando repositório..."
cd /opt
rm -rf pdv-restaurante 2>/dev/null || true
git clone https://github.com/edinaldolima1981/pdv-restaurante-e-bar.git pdv-restaurante
cd pdv-restaurante

# 2. Criar estrutura de diretórios
echo "📁 Criando estrutura de diretórios..."
mkdir -p backend
mkdir -p .env

# 3. Copiar arquivos de configuração
echo "⚙️  Copiando arquivos de configuração..."
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  db:
    image: postgres:16-alpine
    container_name: pdv-restaurante-db
    environment:
      POSTGRES_USER: pdvrestaurante
      POSTGRES_PASSWORD: ${DB_PASSWORD:-pdvrestaurante123}
      POSTGRES_DB: pdv_restaurante
      POSTGRES_INITDB_ARGS: "--encoding=UTF8"
    ports:
      - "5434:5432"
    volumes:
      - pdv_restaurante_db:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
    networks:
      - pdv_network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U pdvrestaurante"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: pdv-restaurante-backend
    environment:
      NODE_ENV: production
      DB_HOST: db
      DB_PORT: 5432
      DB_USER: pdvrestaurante
      DB_PASSWORD: ${DB_PASSWORD:-pdvrestaurante123}
      DB_NAME: pdv_restaurante
      PORT: 3004
      JWT_SECRET: ${JWT_SECRET:-seu-secret-jwt-super-seguro-aqui}
    ports:
      - "3004:3004"
    depends_on:
      db:
        condition: service_healthy
    volumes:
      - ./backend:/app
      - /app/node_modules
    networks:
      - pdv_network
    restart: unless-stopped

  frontend:
    build:
      context: ./
      dockerfile: Dockerfile.frontend
      args:
        VITE_API_URL: http://localhost:3004
    container_name: pdv-restaurante-frontend
    environment:
      VITE_API_URL: http://localhost:3004
    ports:
      - "8082:5173"
    depends_on:
      - backend
    networks:
      - pdv_network
    restart: unless-stopped

volumes:
  pdv_restaurante_db:

networks:
  pdv_network:
    driver: bridge
EOF

# 4. Criar Dockerfile do frontend
cat > Dockerfile.frontend << 'EOF'
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 5173
CMD ["nginx", "-g", "daemon off;"]
EOF

# 5. Criar nginx.conf
cat > nginx.conf << 'EOF'
server {
    listen 5173;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://backend:3004;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
EOF

# 6. Criar backend/Dockerfile
mkdir -p backend
cat > backend/Dockerfile << 'EOF'
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --only=production
COPY . .
EXPOSE 3004
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3004/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"
CMD ["node", "server.js"]
EOF

# 7. Criar backend/server.js
cat > backend/server.js << 'EOF'
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();

// Database pool
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// Middlewares
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Rota de teste
app.get('/api/test', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ 
      message: 'Connection to database successful',
      time: result.rows[0]
    });
  } catch (err) {
    console.error('Database connection error:', err);
    res.status(500).json({ error: 'Database connection failed' });
  }
});

// Rota de empresas
app.get('/api/empresas', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM empresas WHERE ativa = true ORDER BY criada_em DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 3004;
app.listen(PORT, () => {
  console.log(`🚀 PDV Restaurante API running on port ${PORT}`);
});
EOF

# 8. Criar backend/package.json
cat > backend/package.json << 'EOF'
{
  "name": "pdv-restaurante-backend",
  "version": "1.0.0",
  "description": "PDV Restaurante API",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "pg": "^8.11.3"
  }
}
EOF

# 9. Criar init.sql
cat > init.sql << 'EOF'
CREATE EXTENSION IF NOT EXISTS uuid-ossp;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS empresas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome VARCHAR(255) NOT NULL,
  cnpj VARCHAR(18) UNIQUE,
  email VARCHAR(255),
  telefone VARCHAR(20),
  endereco TEXT,
  ativa BOOLEAN DEFAULT true,
  criada_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizada_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS usuarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  telefone VARCHAR(20),
  pin VARCHAR(10),
  senha_hash VARCHAR(255),
  perfil VARCHAR(50) DEFAULT 'colaborador',
  ativo BOOLEAN DEFAULT true,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_usuarios_empresa ON usuarios(empresa_id);

CREATE TABLE IF NOT EXISTS categorias (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  descricao TEXT,
  icone VARCHAR(100),
  ativa BOOLEAN DEFAULT true,
  ordem INT DEFAULT 0,
  criada_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_categorias_empresa ON categorias(empresa_id);

CREATE TABLE IF NOT EXISTS produtos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  categoria_id UUID NOT NULL REFERENCES categorias(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  descricao TEXT,
  preco DECIMAL(10, 2) NOT NULL,
  tempo_preparo INT DEFAULT 0,
  imagem_url VARCHAR(500),
  ativo BOOLEAN DEFAULT true,
  departamento VARCHAR(50),
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_produtos_empresa ON produtos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_produtos_categoria ON produtos(categoria_id);

CREATE TABLE IF NOT EXISTS mesas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  numero INT NOT NULL,
  capacidade INT DEFAULT 4,
  localizacao VARCHAR(100),
  ativa BOOLEAN DEFAULT true,
  criada_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_mesas_empresa ON mesas(empresa_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_mesas_numero_empresa ON mesas(empresa_id, numero);

CREATE TABLE IF NOT EXISTS pedidos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  mesa_id UUID REFERENCES mesas(id) ON DELETE SET NULL,
  usuario_id UUID NOT NULL REFERENCES usuarios(id),
  numero_pedido INT NOT NULL,
  status VARCHAR(50) DEFAULT 'aberto',
  total DECIMAL(10, 2) DEFAULT 0,
  observacoes TEXT,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  entregue_em TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pedidos_empresa ON pedidos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_mesa ON pedidos(mesa_id);

CREATE TABLE IF NOT EXISTS pedido_itens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pedido_id UUID NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  produto_id UUID NOT NULL REFERENCES produtos(id),
  quantidade INT NOT NULL DEFAULT 1,
  preco_unitario DECIMAL(10, 2) NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pendente',
  observacoes TEXT,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pedido_itens_pedido ON pedido_itens(pedido_id);

CREATE TABLE IF NOT EXISTS vendas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  pedido_id UUID REFERENCES pedidos(id),
  usuario_id UUID NOT NULL REFERENCES usuarios(id),
  valor_total DECIMAL(10, 2) NOT NULL,
  forma_pagamento VARCHAR(50),
  status VARCHAR(50) DEFAULT 'concluida',
  criada_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_vendas_empresa ON vendas(empresa_id);
CREATE INDEX IF NOT EXISTS idx_vendas_data ON vendas(criada_em);

GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO pdvrestaurante;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO pdvrestaurante;
EOF

# 10. Criar .env
cat > .env << 'EOF'
NODE_ENV=production
DB_HOST=db
DB_PORT=5432
DB_USER=pdvrestaurante
DB_PASSWORD=pdvrestaurante123
DB_NAME=pdv_restaurante
PORT=3004
HOST=0.0.0.0
JWT_SECRET=seu-secret-jwt-super-seguro-aqui-mude-isso
VITE_API_URL=http://localhost:3004
LOG_LEVEL=info
EOF

# 11. Parar containers antigos
echo "🛑 Parando containers antigos..."
docker-compose down 2>/dev/null || true

# 12. Remover containers e volumes se existirem
echo "🗑️  Limpando containers antigos..."
docker rm pdv-restaurante-db pdv-restaurante-backend pdv-restaurante-frontend 2>/dev/null || true

# 13. Build e start
echo "🔨 Building Docker images..."
docker-compose build

echo "🚀 Iniciando serviços..."
docker-compose up -d

# 14. Wait for services
echo "⏳ Aguardando serviços ficarem prontos..."
sleep 10

# 15. Check status
echo "✅ Deployment completo!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 PDV Restaurante está rodando!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📍 Frontend: http://localhost:8082"
echo "📍 Backend:  http://localhost:3004"
echo "📍 DB:       localhost:5434"
echo ""
echo "🧪 Teste de conexão:"
curl http://localhost:3004/api/test 2>/dev/null | jq . || echo "Serviço ainda iniciando..."
echo ""
echo "📊 Status dos containers:"
docker-compose ps
