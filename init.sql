-- Criar extensões necessárias
CREATE EXTENSION IF NOT EXISTS uuid-ossp;
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Tabela de Empresas (Multi-tenancy)
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

-- Tabela de Usuários/Colaboradores
CREATE TABLE IF NOT EXISTS usuarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  telefone VARCHAR(20),
  pin VARCHAR(10),
  senha_hash VARCHAR(255),
  perfil VARCHAR(50) DEFAULT 'colaborador', -- admin, gerente, garcom, cozinha, caixa
  ativo BOOLEAN DEFAULT true,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_usuarios_empresa ON usuarios(empresa_id);

-- Tabela de Categorias
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

CREATE INDEX idx_categorias_empresa ON categorias(empresa_id);

-- Tabela de Produtos/Itens de Cardápio
CREATE TABLE IF NOT EXISTS produtos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  categoria_id UUID NOT NULL REFERENCES categorias(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  descricao TEXT,
  preco DECIMAL(10, 2) NOT NULL,
  tempo_preparo INT DEFAULT 0, -- em minutos
  imagem_url VARCHAR(500),
  ativo BOOLEAN DEFAULT true,
  departamento VARCHAR(50), -- cozinha, bar
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_produtos_empresa ON produtos(empresa_id);
CREATE INDEX idx_produtos_categoria ON produtos(categoria_id);

-- Tabela de Mesas
CREATE TABLE IF NOT EXISTS mesas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  numero INT NOT NULL,
  capacidade INT DEFAULT 4,
  localizacao VARCHAR(100),
  ativa BOOLEAN DEFAULT true,
  criada_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_mesas_empresa ON mesas(empresa_id);
CREATE UNIQUE INDEX idx_mesas_numero_empresa ON mesas(empresa_id, numero);

-- Tabela de Pedidos
CREATE TABLE IF NOT EXISTS pedidos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  mesa_id UUID REFERENCES mesas(id) ON DELETE SET NULL,
  usuario_id UUID NOT NULL REFERENCES usuarios(id),
  numero_pedido INT NOT NULL,
  status VARCHAR(50) DEFAULT 'aberto', -- aberto, preparo, pronto, entregue, cancelado
  total DECIMAL(10, 2) DEFAULT 0,
  observacoes TEXT,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  entregue_em TIMESTAMP
);

CREATE INDEX idx_pedidos_empresa ON pedidos(empresa_id);
CREATE INDEX idx_pedidos_mesa ON pedidos(mesa_id);
CREATE INDEX idx_pedidos_usuario ON pedidos(usuario_id);
CREATE INDEX idx_pedidos_status ON pedidos(status);

-- Tabela de Itens do Pedido
CREATE TABLE IF NOT EXISTS pedido_itens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pedido_id UUID NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  produto_id UUID NOT NULL REFERENCES produtos(id),
  quantidade INT NOT NULL DEFAULT 1,
  preco_unitario DECIMAL(10, 2) NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pendente', -- pendente, preparando, pronto, entregue
  observacoes TEXT,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_pedido_itens_pedido ON pedido_itens(pedido_id);
CREATE INDEX idx_pedido_itens_produto ON pedido_itens(produto_id);

-- Tabela de Caixa/Vendas
CREATE TABLE IF NOT EXISTS vendas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  pedido_id UUID REFERENCES pedidos(id),
  usuario_id UUID NOT NULL REFERENCES usuarios(id),
  valor_total DECIMAL(10, 2) NOT NULL,
  forma_pagamento VARCHAR(50), -- dinheiro, credito, debito, pix
  status VARCHAR(50) DEFAULT 'concluida',
  criada_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_vendas_empresa ON vendas(empresa_id);
CREATE INDEX idx_vendas_data ON vendas(criada_em);

-- Grants pra user pdvrestaurante
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO pdvrestaurante;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO pdvrestaurante;
