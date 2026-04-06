# 🚀 PDV Restaurante e Bar - Deployment no VPS

## Visão Geral

Este é o plano de deployment completo do PDV Restaurante migrado de Firebase para auto-hospedado com:
- **Frontend**: React/Vite (porta 8082)
- **Backend**: Node.js/Express (porta 3004)
- **Database**: PostgreSQL 16 (porta 5434)
- **Orquestração**: Docker Compose

## Arquitetura

```
┌─────────────────────────────────────┐
│        Caddy Reverse Proxy          │ (porta 80/443)
└──────────────┬──────────────────────┘
               │
       ┌───────┴────────┐
       │                │
   ┌───▼────────┐  ┌───▼─────────┐
   │  Frontend  │  │   Backend    │
   │  Nginx     │  │  Express     │
   │  :8082     │  │  :3004       │
   └────────────┘  └───┬─────────┘
                       │
                   ┌───▼──────┐
                   │ PostgreSQL│
                   │   :5434   │
                   └───────────┘
```

## Pré-requisitos

- ✅ VPS Hostinger (82.25.75.245)
- ✅ Docker e Docker Compose instalados
- ✅ Git configurado
- ✅ Node.js 20+ (no host, caso necessário)

## Instalação Rápida (1 Command)

```bash
# No VPS, execute:
cd /tmp && curl -O https://seu-servidor/deploy.sh && chmod +x deploy.sh && sudo ./deploy.sh
```

## Instalação Manual Passo-a-Passo

### 1️⃣ Preparar Diretório

```bash
cd /opt
rm -rf pdv-restaurante
git clone https://github.com/edinaldolima1981/pdv-restaurante-e-bar.git pdv-restaurante
cd pdv-restaurante
```

### 2️⃣ Copiar Arquivos de Configuração

Os arquivos necessários já estão aqui:
- `docker-compose.yml`
- `Dockerfile.frontend` (renomear para `Dockerfile.frontend`)
- `backend/Dockerfile`
- `backend/server.js`
- `backend/package.json`
- `nginx.conf`
- `init.sql`
- `.env`

### 3️⃣ Estrutura de Diretórios

```
/opt/pdv-restaurante/
├── docker-compose.yml
├── Dockerfile.frontend
├── nginx.conf
├── init.sql
├── .env
├── .gitignore
├── package.json (ORIGINAL)
├── src/ (ORIGINAL)
├── public/ (ORIGINAL)
├── backend/
│   ├── Dockerfile
│   ├── server.js
│   ├── package.json
│   └── db.js (opcional)
└── ...outros arquivos originais
```

### 4️⃣ Configurar Variáveis de Ambiente

Editar `.env`:

```bash
# Mudar senhas!
DB_PASSWORD=NOVA_SENHA_SUPER_SEGURA_123
JWT_SECRET=NOVO_SECRET_JWT_SUPER_SEGURO_456
```

### 5️⃣ Build e Deploy

```bash
# Build das imagens
docker-compose build

# Start dos containers
docker-compose up -d

# Verificar status
docker-compose ps

# Ver logs
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f db
```

### 6️⃣ Teste de Conectividade

```bash
# API
curl http://localhost:3004/health

# Database
curl http://localhost:3004/api/test

# Frontend
curl http://localhost:8082
```

## Caddy Reverse Proxy (Opcional)

Se quer usar Caddy para múltiplos subdomínios:

```
# /etc/caddy/Caddyfile ou /var/www/Caddyfile

pdv.seu-dominio.com {
  reverse_proxy localhost:8082
}

api.seu-dominio.com {
  reverse_proxy localhost:3004
}
```

Reload:
```bash
sudo caddy reload -c /etc/caddy/Caddyfile
```

## Gerenciar Serviços

### Ver Status
```bash
docker-compose ps
docker-compose logs backend
```

### Parar
```bash
docker-compose down
```

### Reiniciar
```bash
docker-compose restart backend
docker-compose restart frontend
```

### Limpar Tudo
```bash
docker-compose down -v  # Remove volumes também!
```

### Atualizar Frontend
```bash
cd /opt/pdv-restaurante
git pull origin main
docker-compose build frontend
docker-compose up -d frontend
```

## Variáveis de Ambiente

### Backend (.env)

| Variável | Padrão | Descrição |
|----------|--------|-----------|
| `NODE_ENV` | `production` | Ambiente de execução |
| `DB_HOST` | `db` | Host do PostgreSQL |
| `DB_PORT` | `5432` | Porta do PostgreSQL |
| `DB_USER` | `pdvrestaurante` | Usuário do banco |
| `DB_PASSWORD` | `pdvrestaurante123` | Senha do banco |
| `DB_NAME` | `pdv_restaurante` | Nome do banco |
| `PORT` | `3004` | Porta da API |
| `JWT_SECRET` | *vazio* | Secret JWT (MUDE ISSO!) |

### Frontend (Vite)

| Variável | Padrão | Descrição |
|----------|--------|-----------|
| `VITE_API_URL` | `http://localhost:3004` | URL da API |

## Schema PostgreSQL

O `init.sql` cria automaticamente:

- `empresas` - Multi-tenancy
- `usuarios` - Colaboradores/staff
- `categorias` - Cardápio
- `produtos` - Itens do cardápio
- `mesas` - Mesas do restaurante
- `pedidos` - Pedidos/orders
- `pedido_itens` - Items de pedidos
- `vendas` - Histórico de vendas

## Troubleshooting

### Backend não conecta ao DB
```bash
docker-compose logs db
docker-compose exec db psql -U pdvrestaurante -d pdv_restaurante -c "\dt"
```

### Frontend não carrega
```bash
docker-compose logs frontend
docker-compose exec frontend cat /etc/nginx/conf.d/default.conf
```

### Limpar Tudo e Recomeçar
```bash
docker-compose down -v
docker system prune -a
docker-compose build --no-cache
docker-compose up -d
```

### Ver Banco de Dados

```bash
docker-compose exec db psql -U pdvrestaurante -d pdv_restaurante

# Listar tabelas
\dt

# Ver dados de empresas
SELECT * FROM empresas;

# Sair
\q
```

## Atualizações

### Atualizar Código

```bash
cd /opt/pdv-restaurante
git pull origin main
docker-compose build
docker-compose up -d
```

### Backup do Banco

```bash
docker-compose exec db pg_dump -U pdvrestaurante pdv_restaurante > backup-$(date +%Y%m%d-%H%M%S).sql
```

### Restore do Banco

```bash
cat backup-20260406.sql | docker-compose exec -T db psql -U pdvrestaurante pdv_restaurante
```

## Monitoramento

### Logs em Tempo Real

```bash
# Todos os logs
docker-compose logs -f

# Apenas backend
docker-compose logs -f backend

# Últimas 100 linhas
docker-compose logs --tail 100 backend
```

### Métricas

```bash
docker stats
```

## Dúvidas?

- Backend API: `http://localhost:3004/health`
- Frontend: `http://localhost:8082`
- Database: `localhost:5434`

---

**Desenvolvido com ❤️ para Altamira**
