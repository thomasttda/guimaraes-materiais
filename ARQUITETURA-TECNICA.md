# Guimarães Materiais para Construção — Plano de Arquitetura Técnica

> **Versão:** 1.0 | **Data:** 2026-05-21 | **Status:** Pronto para Implementação

---

## Sumário Executivo

| Prioridade | Funcionalidade | Esforço | Risco |
|---|---|---|---|
| **P0** | Autenticação e Autorização | 3 dias | Médio |
| **P0** | Controle de Estoque Real | 5 dias | Alto |
| **P0** | Gateway de Pagamento | 5 dias | Alto |
| **P1** | Área do Cliente | 4 dias | Médio |
| **P1** | Gestão de Frete | 3 dias | Médio |
| **P1** | NF-e | 7 dias | Muito Alto |
| **P1** | Relatórios Avançados | 4 dias | Baixo |
| **P1** | WhatsApp Integrado | 2 dias | Baixo |
| **P1** | Imagens de Produtos | 2 dias | Baixo |
| **P1** | Multi-usuário com Permissões | 3 dias | Médio |

**Total Estimado:** ~38 dias úteis (1 pessoa full-time)

---

## 1. Autenticação e Autorização (P0)

### 1.1 Schema do Banco

```sql
-- Tabela de usuários do sistema
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'vendedor'
    CHECK(role IN ('admin', 'vendedor', 'estoquista', 'financeiro')),
  permissions TEXT, -- JSON array: ["products.read", "products.write", ...]
  active INTEGER DEFAULT 1,
  last_login DATETIME,
  failed_login_attempts INTEGER DEFAULT 0,
  locked_until DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de tokens de sessão (JWT blacklist + refresh tokens)
CREATE TABLE IF NOT EXISTS sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  token_hash TEXT NOT NULL,
  refresh_token_hash TEXT,
  ip_address TEXT,
  user_agent TEXT,
  expires_at DATETIME NOT NULL,
  revoked INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Logs de auditoria (ações dos usuários)
CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER REFERENCES users(id),
  action TEXT NOT NULL, -- 'login', 'logout', 'create', 'update', 'delete', 'export'
  resource_type TEXT NOT NULL, -- 'product', 'order', 'quote', 'customer', 'user', etc.
  resource_id INTEGER,
  old_value TEXT, -- JSON do estado anterior
  new_value TEXT, -- JSON do novo estado
  ip_address TEXT,
  user_agent TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Alterações nas tabelas existentes
ALTER TABLE orders ADD COLUMN user_id INTEGER REFERENCES users(id);
ALTER TABLE quotes ADD COLUMN user_id INTEGER REFERENCES users(id);
ALTER TABLE notes ADD COLUMN user_id INTEGER REFERENCES users(id);

-- Índices
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token_hash ON sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at);
```

### 1.2 Rotas API

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| `POST` | `/api/auth/register` | Admin only | Criar novo usuário |
| `POST` | `/api/auth/login` | Public | Login com email + senha |
| `POST` | `/api/auth/logout` | Required | Logout (revoke token) |
| `POST` | `/api/auth/refresh` | Refresh token | Renovar access token |
| `GET` | `/api/auth/me` | Required | Dados do usuário logado |
| `PUT` | `/api/auth/me/password` | Required | Trocar senha |
| `PUT` | `/api/auth/me` | Required | Atualizar perfil |
| `GET` | `/api/users` | Admin only | Listar usuários |
| `GET` | `/api/users/:id` | Admin only | Detalhes do usuário |
| `PUT` | `/api/users/:id` | Admin only | Editar usuário |
| `PUT` | `/api/users/:id/role` | Admin only | Alterar role |
| `PUT` | `/api/users/:id/active` | Admin only | Ativar/desativar |
| `DELETE` | `/api/users/:id` | Admin only | Remover usuário |
| `GET` | `/api/audit-logs` | Admin only | Logs de auditoria |
| `GET` | `/api/audit-logs/:resourceType/:resourceId` | Required | Logs de um recurso |

**Payloads:**

```json
// POST /api/auth/login - Request
{
  "email": "admin@guimaraes.com",
  "password": "senha123"
}

// POST /api/auth/login - Response 200
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "dGhpcyBpcyBhIHJlZnJl...",
  "expiresIn": 3600,
  "user": {
    "id": 1,
    "name": "Administrador",
    "email": "admin@guimaraes.com",
    "role": "admin",
    "permissions": ["*"]
  }
}

// POST /api/auth/register - Request
{
  "name": "João Vendedor",
  "email": "joao@guimaraes.com",
  "phone": "(11) 99999-0000",
  "password": "senha123",
  "role": "vendedor"
}

// GET /api/audit-logs - Query params
?user_id=1&resource_type=product&start_date=2026-01-01&end_date=2026-05-21&page=1&limit=50
```

### 1.3 Componentes Frontend

| Componente | Tipo | Descrição |
|---|---|---|
| `LoginPage` | Página | Formulário de login com validação |
| `ProtectedRoute` | Componente | Wrapper que verifica auth antes de renderizar |
| `RoleGuard` | Componente | Verifica role/permissions antes de renderizar |
| `AuthContext` | Context | Provider com estado de auth, login, logout, refresh |
| `useAuth` | Hook | Hook para acessar estado de auth |
| `usePermissions` | Hook | Hook para verificar permissões específicas |
| `AdminLayout` | Componente | Layout admin com sidebar + header do usuário |
| `UserManagement` | Página | CRUD de usuários (admin) |
| `AuditLogViewer` | Página | Visualização de logs de auditoria |
| `ProfilePage` | Página | Editar perfil e trocar senha |

### 1.4 Fluxo de Dados

```
Frontend                          Backend                          Database
   │                                │                                │
   │  POST /api/auth/login          │                                │
   │  {email, password}             │                                │
   │ ──────────────────────────────>│                                │
   │                                │  Hash comparison (bcrypt)      │
   │                                │ ──────────────────────────────>│
   │                                │  SELECT * FROM users           │
   │                                │   WHERE email = ?              │
   │                                │ <──────────────────────────────│
   │                                │                                │
   │                                │  Generate JWT (access+refresh) │
   │                                │  Save session hash             │
   │                                │ ──────────────────────────────>│
   │                                │  INSERT INTO sessions          │
   │                                │ <──────────────────────────────│
   │                                │                                │
   │  {accessToken, user}           │                                │
   │ <──────────────────────────────│                                │
   │                                │                                │
   │  Store in localStorage         │                                │
   │  Set Authorization header      │                                │
   │                                │                                │
   │  GET /api/products             │                                │
   │  Authorization: Bearer <token> │                                │
   │ ──────────────────────────────>│                                │
   │                                │  Verify JWT signature          │
   │                                │  Check session not revoked     │
   │                                │ ──────────────────────────────>│
   │                                │  SELECT * FROM sessions        │
   │                                │ <──────────────────────────────│
   │                                │                                │
   │                                │  Log audit entry               │
   │                                │ ──────────────────────────────>│
   │                                │  INSERT INTO audit_logs        │
   │                                │ <──────────────────────────────│
   │                                │                                │
   │  {products: [...]}             │                                │
   │ <──────────────────────────────│                                │
```

### 1.5 Dependências

| Pacote | Versão | Uso |
|---|---|---|
| `bcryptjs` | ^2.4.3 | Hash de senhas |
| `jsonwebtoken` | ^9.0.2 | Geração e validação de JWT |
| `express-rate-limit` | ^7.1.5 | Rate limiting no login |
| `helmet` | ^7.1.0 | Headers de segurança |

### 1.6 Estimativa de Esforço

| Tarefa | Horas |
|---|---|
| Schema + migração | 2h |
| Backend: auth endpoints | 6h |
| Backend: middleware de auth | 4h |
| Backend: audit logging | 3h |
| Backend: user management | 4h |
| Frontend: AuthContext + hooks | 4h |
| Frontend: LoginPage | 3h |
| Frontend: ProtectedRoute + RoleGuard | 2h |
| Frontend: UserManagement page | 4h |
| Frontend: AuditLogViewer | 3h |
| Testes e ajustes | 5h |
| **Total** | **40h (~5 dias)** |

### 1.7 Riscos e Mitigações

| Risco | Impacto | Mitigação |
|---|---|---|
| sql.js não suporta transações concorrentes | Alto | Implementar fila de escrita com mutex; migrar para better-sqlite3 no futuro |
| Token JWT roubado | Alto | Refresh tokens com rotação; blacklist de sessions; short-lived access tokens (1h) |
| Senhas fracas | Médio | Política de senha mínima (8 chars, maiúscula, número, especial) |
| Brute force no login | Médio | Rate limiting (5 tentativas/min); lock account após 5 falhas; CAPTCHA após 3 falhas |
| Perda de tokens no localStorage | Baixo | Implementar refresh token automático; fallback para re-login |

---

## 2. Controle de Estoque Real (P0)

### 2.1 Schema do Banco

```sql
-- Tabela de movimentações de estoque
CREATE TABLE IF NOT EXISTS stock_movements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL REFERENCES products(id),
  type TEXT NOT NULL CHECK(type IN ('in', 'out', 'adjustment', 'return', 'transfer')),
  quantity INTEGER NOT NULL,
  unit_cost REAL, -- Preço de custo unitário no momento da movimentação
  reference_type TEXT, -- 'order', 'purchase', 'adjustment', 'return'
  reference_id INTEGER, -- ID do pedido/compra que originou a movimentação
  user_id INTEGER REFERENCES users(id),
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de inventário (contagem periódica)
CREATE TABLE IF NOT EXISTS inventory_counts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL REFERENCES products(id),
  counted_quantity INTEGER NOT NULL,
  system_quantity INTEGER NOT NULL, -- Quantidade no sistema no momento
  difference INTEGER, -- counted - system
  user_id INTEGER REFERENCES users(id),
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de compras/fornecimento (entrada de mercadoria)
CREATE TABLE IF NOT EXISTS purchases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  supplier_id INTEGER NOT NULL REFERENCES suppliers(id),
  user_id INTEGER REFERENCES users(id),
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'received', 'partial', 'cancelled')),
  total_cost REAL NOT NULL,
  notes TEXT,
  invoice_number TEXT, -- Número da nota fiscal de entrada
  expected_date TEXT,
  received_date TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Itens da compra
CREATE TABLE IF NOT EXISTS purchase_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  purchase_id INTEGER NOT NULL REFERENCES purchases(id),
  product_id INTEGER NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL,
  unit_cost REAL NOT NULL, -- Preço de custo
  total_cost REAL NOT NULL,
  received_quantity INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Alterações na tabela products
ALTER TABLE products ADD COLUMN cost_price REAL DEFAULT 0; -- Preço de custo
ALTER TABLE products ADD COLUMN location TEXT DEFAULT ''; -- Localização no estoque (ex: "A-1-3")
ALTER TABLE products ADD COLUMN barcode TEXT DEFAULT ''; -- Código de barras
ALTER TABLE products ADD COLUMN ncm TEXT DEFAULT ''; -- Código NCM para NF-e
ALTER TABLE products ADD COLUMN cest TEXT DEFAULT ''; -- CEST para substituição tributária
ALTER TABLE products ADD COLUMN origin INTEGER DEFAULT 0; -- 0=Nacional, 1=Importado
ALTER TABLE products ADD COLUMN stock_reserved INTEGER DEFAULT 0; -- Estoque reservado (pedidos não entregues)

-- Índices
CREATE INDEX IF NOT EXISTS idx_stock_movements_product ON stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_type ON stock_movements(type);
CREATE INDEX IF NOT EXISTS idx_stock_movements_created ON stock_movements(created_at);
CREATE INDEX IF NOT EXISTS idx_stock_movements_reference ON stock_movements(reference_type, reference_id);
CREATE INDEX IF NOT EXISTS idx_inventory_counts_product ON inventory_counts(product_id);
CREATE INDEX IF NOT EXISTS idx_purchases_supplier ON purchases(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchases_status ON purchases(status);
CREATE INDEX IF NOT EXISTS idx_purchase_items_purchase ON purchase_items(purchase_id);
```

### 2.2 Rotas API

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| `POST` | `/api/stock/movements` | estoquista, admin | Registrar movimentação |
| `GET` | `/api/stock/movements` | Required | Listar movimentações (filtros) |
| `GET` | `/api/stock/movements/:id` | Required | Detalhes da movimentação |
| `GET` | `/api/stock/products` | Required | Produtos com estoque (reservado/disponível) |
| `GET` | `/api/stock/products/:id/history` | Required | Histórico de estoque de um produto |
| `POST` | `/api/stock/inventory` | estoquista, admin | Registrar contagem de inventário |
| `GET` | `/api/stock/inventory` | Required | Listar inventários |
| `POST` | `/api/purchases` | admin, financeiro | Criar compra |
| `GET` | `/api/purchases` | Required | Listar compras |
| `GET` | `/api/purchases/:id` | Required | Detalhes da compra |
| `PUT` | `/api/purchases/:id/receive` | estoquista, admin | Receber mercadoria |
| `GET` | `/api/stock/report` | admin | Relatório de estoque completo |
| `GET` | `/api/stock/alerts` | Required | Alertas de estoque baixo/crítico |
| `POST` | `/api/stock/adjust` | estoquista, admin | Ajuste manual de estoque |

**Payloads:**

```json
// POST /api/stock/movements - Request (entrada)
{
  "product_id": 1,
  "type": "in",
  "quantity": 50,
  "unit_cost": 25.00,
  "reference_type": "purchase",
  "reference_id": 12,
  "notes": "Recebimento compra #12"
}

// POST /api/stock/movements - Request (saída)
{
  "product_id": 3,
  "type": "out",
  "quantity": 10,
  "reference_type": "order",
  "reference_id": 45,
  "notes": "Pedido #45"
}

// POST /api/stock/adjust - Request
{
  "product_id": 5,
  "new_quantity": 145,
  "reason": "Inventário - diferença encontrada",
  "notes": "Contagem física: 145, sistema: 150"
}

// POST /api/purchases - Request
{
  "supplier_id": 1,
  "expected_date": "2026-05-28",
  "notes": "Compra mensal de argamassas",
  "items": [
    { "product_id": 1, "quantity": 100, "unit_cost": 22.50 },
    { "product_id": 2, "quantity": 50, "unit_cost": 35.00 }
  ]
}

// GET /api/stock/products - Response
[
  {
    "id": 1,
    "name": "Argamassa ACII",
    "stock": 150,
    "stock_reserved": 20,
    "stock_available": 130,
    "min_stock": 20,
    "cost_price": 22.50,
    "price": 33.99,
    "margin_percent": 51.1,
    "location": "A-1-3",
    "status": "ok" // ok, low, critical, out
  }
]
```

### 2.3 Componentes Frontend

| Componente | Tipo | Descrição |
|---|---|---|
| `StockDashboard` | Página | Visão geral do estoque (cards + gráficos) |
| `StockMovements` | Página | Listagem + filtro de movimentações |
| `StockMovementForm` | Componente | Formulário para registrar movimentação |
| `InventoryCount` | Página | Interface de contagem de inventário |
| `PurchaseManagement` | Página | CRUD de compras |
| `PurchaseReceive` | Página | Recebimento de mercadoria |
| `StockAlerts` | Componente | Widget de alertas de estoque |
| `ProductStockHistory` | Componente | Gráfico de evolução do estoque |
| `StockReport` | Página | Relatório completo exportável |

### 2.4 Fluxo de Dados

```
Compra Criada                    Recebimento                     Venda
   │                                │                               │
   │  POST /api/purchases           │                               │
   │  {supplier_id, items: [...]}   │                               │
   │ ──────────────────────────────>│                               │
   │                                │                               │
   │  INSERT INTO purchases         │                               │
   │  INSERT INTO purchase_items    │                               │
   │  (status: pending)             │                               │
   │                                │                               │
   │                                │  PUT /api/purchases/:id/receive│
   │                                │  {received_items: [...]}       │
   │                                │ ──────────────────────────────>│
   │                                │                               │
   │                                │  For each item:               │
   │                                │  UPDATE products SET          │
   │                                │    stock = stock + qty,       │
   │                                │    cost_price = new_cost      │
   │                                │  INSERT INTO stock_movements  │
   │                                │    (type: 'in')               │
   │                                │                               │
   │                                │                               │  POST /api/orders
   │                                │                               │  {items: [{product_id, qty}]}
   │                                │                               │ ──────────────────────────────>
   │                                │                               │
   │                                │                               │  Check stock_available >= qty
   │                                │                               │  UPDATE products SET
   │                                │                               │    stock = stock - qty,
   │                                │                               │    stock_reserved = reserved + qty
   │                                │                               │  INSERT INTO stock_movements
   │                                │                               │    (type: 'out')
   │                                │                               │
   │                                │                               │  On delivery confirmed:
   │                                │                               │  stock_reserved = reserved - qty
```

### 2.5 Dependências

| Pacote | Versão | Uso |
|---|---|---|
| Já existentes | - | sql.js, express |
| `recharts` | ^2.12.0 | Gráficos de estoque (frontend) |

### 2.6 Estimativa de Esforço

| Tarefa | Horas |
|---|---|
| Schema + migração de dados | 3h |
| Backend: stock movements CRUD | 6h |
| Backend: purchases CRUD | 6h |
| Backend: inventory counts | 4h |
| Backend: stock report + alerts | 4h |
| Backend: Integração com orders (auto-debit) | 3h |
| Frontend: StockDashboard | 4h |
| Frontend: StockMovements + Form | 4h |
| Frontend: InventoryCount | 3h |
| Frontend: PurchaseManagement | 5h |
| Frontend: StockReport | 3h |
| Testes e ajustes | 5h |
| **Total** | **50h (~6 dias)** |

### 2.7 Riscos e Mitigações

| Risco | Impacto | Mitigação |
|---|---|---|
| sql.js sem transações ACID reais | Muito Alto | Implementar mutex global para escritas; validar stock > 0 antes de cada saída |
| Estoque negativo por concorrência | Alto | Lock pessimista (verificar e atualizar em operação atômica); fila de escrita |
| Divergência entre físico e sistema | Médio | Inventários periódicos obrigatórios; ajustes com justificativa |
| Preço de custo desatualizado | Médio | Atualizar automaticamente no recebimento; média ponderada opcional |
| Migração de dados existentes | Baixo | Script de migração que cria movimentações iniciais para stock atual |

---

## 3. Gateway de Pagamento (P0)

### 3.1 Schema do Banco

```sql
-- Tabela de transações de pagamento
CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER REFERENCES orders(id),
  quote_id INTEGER REFERENCES quotes(id),
  note_id INTEGER REFERENCES notes(id),
  customer_id INTEGER REFERENCES customers(id),
  method TEXT NOT NULL CHECK(method IN ('pix', 'credit_card', 'debit_card', 'boleto', 'cash', 'transfer')),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK(status IN ('pending', 'approved', 'rejected', 'refunded', 'cancelled', 'expired')),
  amount REAL NOT NULL,
  gateway TEXT, -- 'mercadopago', 'pagseguro', 'efipay', 'manual'
  gateway_payment_id TEXT, -- ID retornado pelo gateway
  gateway_response TEXT, -- JSON completo da resposta do gateway
  installments INTEGER DEFAULT 1, -- Para cartão de crédito
  card_last_four TEXT, -- Últimos 4 dígitos (cartão)
  card_brand TEXT, -- Bandeira do cartão
  pix_qr_code TEXT, -- QR Code PIX (copia e cola)
  pix_expiration DATETIME, -- Expiração do PIX
  boleto_url TEXT, -- URL do boleto
  boleto_barcode TEXT, -- Linha digitável do boleto
  paid_at DATETIME,
  refunded_at DATETIME,
  refund_amount REAL,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Webhook logs (para debug de confirmações)
CREATE TABLE IF NOT EXISTS webhook_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  gateway TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload TEXT NOT NULL, -- JSON completo
  signature_valid INTEGER DEFAULT 0,
  processed INTEGER DEFAULT 0,
  error_message TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Alterações na tabela orders
ALTER TABLE orders ADD COLUMN payment_method TEXT;
ALTER TABLE orders ADD COLUMN payment_status TEXT DEFAULT 'pending';
ALTER TABLE orders ADD COLUMN payment_id INTEGER REFERENCES payments(id);

-- Índices
CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_method ON payments(method);
CREATE INDEX IF NOT EXISTS idx_payments_gateway_id ON payments(gateway_payment_id);
CREATE INDEX IF NOT EXISTS idx_payments_created ON payments(created_at);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_gateway ON webhook_logs(gateway);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_processed ON webhook_logs(processed);
```

### 3.2 Rotas API

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| `POST` | `/api/payments/pix` | Public | Gerar PIX para pedido |
| `POST` | `/api/payments/card` | Public | Processar pagamento com cartão |
| `POST` | `/api/payments/boleto` | Public | Gerar boleto para pedido |
| `GET` | `/api/payments/:id/status` | Public | Verificar status do pagamento |
| `POST` | `/api/payments/webhook/mercadopago` | Public | Webhook Mercado Pago |
| `POST` | `/api/payments/webhook/pagseguro` | Public | Webhook PagSeguro |
| `POST` | `/api/payments/:id/refund` | admin, financeiro | Estornar pagamento |
| `GET` | `/api/payments` | Required | Listar pagamentos (filtros) |
| `GET` | `/api/payments/:id` | Required | Detalhes do pagamento |
| `GET` | `/api/payments/report` | admin, financeiro | Relatório de pagamentos |

**Payloads:**

```json
// POST /api/payments/pix - Request
{
  "order_id": 45,
  "amount": 1250.00,
  "customer": {
    "name": "João da Silva",
    "cpf": "123.456.789-00",
    "email": "joao@email.com"
  }
}

// POST /api/payments/pix - Response 201
{
  "payment_id": 12,
  "status": "pending",
  "pix_qr_code": "00020126580014br.gov.bcb.pix...",
  "pix_expiration": "2026-05-21T18:30:00Z",
  "amount": 1250.00
}

// POST /api/payments/card - Request
{
  "order_id": 45,
  "amount": 1250.00,
  "installments": 3,
  "card": {
    "token": "tok_visa_1234", // Token gerado pelo SDK frontend
    "holder_name": "João da Silva",
    "installments": 3
  },
  "customer": {
    "name": "João da Silva",
    "cpf": "123.456.789-00",
    "email": "joao@email.com"
  }
}

// POST /api/payments/webhook/mercadopago - Request (do gateway)
{
  "action": "payment.updated",
  "data": { "id": 123456789 },
  "type": "payment"
}

// Webhook processing flow:
// 1. Receive webhook
// 2. Validate signature
// 3. Log to webhook_logs
// 4. Query gateway API for payment details
// 5. Update payments table
// 6. If approved: update order status, create cash_flow entry, trigger notifications
```

### 3.3 Componentes Frontend

| Componente | Tipo | Descrição |
|---|---|---|
| `CheckoutPage` | Página | Fluxo de checkout com seleção de pagamento |
| `PaymentMethodSelector` | Componente | Seleção PIX/Cartão/Boleto |
| `PixPayment` | Componente | QR Code + copia e cola + timer |
| `CardPaymentForm` | Componente | Formulário de cartão (usando SDK do gateway) |
| `BoletoPayment` | Componente | Exibição do boleto + linha digitável |
| `PaymentStatus` | Componente | Status em tempo real (polling) |
| `PaymentManagement` | Página | Gestão de pagamentos (admin) |
| `PaymentReport` | Página | Relatório de pagamentos com filtros |
| `RefundModal` | Componente | Modal de estorno |

### 3.4 Fluxo de Dados

```
Cliente                          Backend                     Gateway (ex: Mercado Pago)
  │                                │                                │
  │  POST /api/payments/pix        │                                │
  │  {order_id, amount, customer}  │                                │
  │ ──────────────────────────────>│                                │
  │                                │  Create payment record         │
  │                                │  (status: pending)             │
  │                                │ ──────────────────────────────>│
  │                                │  POST /v1/payments             │
  │                                │  {transaction_amount, ...}     │
  │                                │ <──────────────────────────────│
  │                                │  {id, point_of_interaction,    │
  │                                │   transaction_data: {qr_code}} │
  │                                │                                │
  │  {payment_id, pix_qr_code,     │                                │
  │   pix_expiration}              │                                │
  │ <──────────────────────────────│                                │
  │                                │                                │
  │  Display QR Code               │                                │
  │  Start polling status          │                                │
  │                                │                                │
  │  GET /api/payments/:id/status  │                                │
  │ ──────────────────────────────>│                                │
  │  (polling a cada 5s)           │  Return cached status          │
  │ <──────────────────────────────│                                │
  │                                │                                │
  │                                │  [Cliente paga via app banco]  │
  │                                │                                │
  │                                │  Webhook notification          │
  │                                │ <──────────────────────────────│
  │                                │  POST /webhook                 │
  │                                │  {action: "payment.updated",   │
  │                                │   data: {id: 123456789}}       │
  │                                │                                │
  │                                │  Validate signature            │
  │                                │  GET /v1/payments/123456789    │
  │                                │ <──────────────────────────────│
  │                                │  {status: "approved"}          │
  │                                │                                │
  │                                │  UPDATE payments               │
  │                                │    SET status = 'approved'     │
  │                                │  UPDATE orders                 │
  │                                │    SET payment_status = 'paid' │
  │                                │  INSERT INTO cash_flow         │
  │                                │  INSERT INTO notifications     │
  │                                │                                │
  │  {status: "approved"}          │                                │
  │ <──────────────────────────────│                                │
  │                                │                                │
  │  Redirect to order confirmation│                                │
```

### 3.5 Dependências

| Pacote | Versão | Uso |
|---|---|---|
| `mercadopago` | ^2.0.10 | SDK Mercado Pago (PIX, cartão, boleto) |
| `crypto` | built-in | Validação de webhook signatures |

**Serviços Externos:**
- **Mercado Pago** (recomendado): PIX, cartão, boleto, documentação completa em PT-BR
- Alternativas: PagSeguro, EFI (Gerencianet), Stripe (cartão apenas)

**Configuração necessária:**
```
MERCADOPAGO_ACCESS_TOKEN=APP_USR-xxxxx-xxxxx-xxxxx
MERCADOPAGO_PUBLIC_KEY=APP_USR-xxxxx-xxxxx
MERCADOPAGO_WEBHOOK_URL=https://seu-dominio.com/api/payments/webhook/mercadopago
```

### 3.6 Estimativa de Esforço

| Tarefa | Horas |
|---|---|
| Schema + configuração gateway | 3h |
| Backend: PIX integration | 6h |
| Backend: Card integration | 8h |
| Backend: Boleto integration | 4h |
| Backend: Webhook handling | 6h |
| Backend: Refund flow | 3h |
| Backend: Payment reports | 3h |
| Frontend: CheckoutPage | 6h |
| Frontend: Payment components | 6h |
| Frontend: PaymentManagement | 4h |
| Testes (sandbox) | 5h |
| **Total** | **54h (~7 dias)** |

### 3.7 Riscos e Mitigações

| Risco | Impacto | Mitigação |
|---|---|---|
| Webhook não chega | Alto | Polling de fallback a cada 30s; retry manual no admin |
| Pagamento duplicado | Alto | Idempotência por order_id; verificar payment existente antes de criar |
| Dados de cartão expostos | Muito Alto | NUNCA armazenar dados de cartão; usar tokenização do gateway |
| PIX expira sem pagamento | Médio | Timer no frontend; permitir regeneração; cleanup automático |
| Gateway fora do ar | Médio | Fallback para pagamento manual; fila de retry para webhooks |
| Fraude com cartão | Alto | Usar análise de risco do gateway; 3D Secure quando disponível |

---

## 4. Área do Cliente (P1)

### 4.1 Schema do Banco

```sql
-- Tabela de contas de clientes (login)
CREATE TABLE IF NOT EXISTS customer_accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER NOT NULL REFERENCES customers(id),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  email_verified INTEGER DEFAULT 0,
  verification_token TEXT,
  reset_token TEXT,
  reset_token_expires DATETIME,
  last_login DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Lista de favoritos do cliente
CREATE TABLE IF NOT EXISTS customer_favorites (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER NOT NULL REFERENCES customers(id),
  product_id INTEGER NOT NULL REFERENCES products(id),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(customer_id, product_id)
);

-- Endereços salvos do cliente
CREATE TABLE IF NOT EXISTS customer_addresses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER NOT NULL REFERENCES customers(id),
  label TEXT DEFAULT 'Principal', -- 'Principal', 'Trabalho', etc.
  zip_code TEXT,
  street TEXT,
  number TEXT,
  complement TEXT,
  neighborhood TEXT,
  city TEXT,
  state TEXT,
  is_default INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_customer_accounts_email ON customer_accounts(email);
CREATE INDEX IF NOT EXISTS idx_customer_accounts_customer ON customer_accounts(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_favorites_customer ON customer_favorites(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_addresses_customer ON customer_addresses(customer_id);
```

### 4.2 Rotas API

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| `POST` | `/api/customer/auth/register` | Public | Criar conta de cliente |
| `POST` | `/api/customer/auth/login` | Public | Login do cliente |
| `POST` | `/api/customer/auth/forgot-password` | Public | Solicitar reset de senha |
| `POST` | `/api/customer/auth/reset-password` | Public | Resetar senha com token |
| `POST` | `/api/customer/auth/verify-email` | Public | Verificar email |
| `GET` | `/api/customer/me` | Customer | Perfil do cliente |
| `PUT` | `/api/customer/me` | Customer | Atualizar perfil |
| `PUT` | `/api/customer/me/password` | Customer | Trocar senha |
| `GET` | `/api/customer/orders` | Customer | Pedidos do cliente |
| `GET` | `/api/customer/orders/:id` | Customer | Detalhes do pedido |
| `GET` | `/api/customer/favorites` | Customer | Produtos favoritos |
| `POST` | `/api/customer/favorites/:productId` | Customer | Adicionar favorito |
| `DELETE` | `/api/customer/favorites/:productId` | Customer | Remover favorito |
| `GET` | `/api/customer/addresses` | Customer | Endereços salvos |
| `POST` | `/api/customer/addresses` | Customer | Novo endereço |
| `PUT` | `/api/customer/addresses/:id` | Customer | Editar endereço |
| `DELETE` | `/api/customer/addresses/:id` | Customer | Remover endereço |
| `POST` | `/api/customer/reorder/:orderId` | Customer | Reordenar pedido anterior |

### 4.3 Componentes Frontend

| Componente | Tipo | Descrição |
|---|---|---|
| `CustomerLoginPage` | Página | Login/registro de cliente |
| `CustomerDashboard` | Página | Dashboard do cliente |
| `CustomerOrders` | Página | Histórico de pedidos |
| `CustomerOrderDetail` | Página | Detalhes de um pedido |
| `CustomerFavorites` | Página | Produtos favoritos |
| `CustomerAddresses` | Página | Gestão de endereços |
| `CustomerProfile` | Página | Editar perfil |
| `CustomerLayout` | Componente | Layout da área do cliente |
| `FavoriteButton` | Componente | Botão de favoritar produto |
| `ReorderButton` | Componente | Botão de reordenar |

### 4.4 Estimativa de Esforço

| Tarefa | Horas |
|---|---|
| Schema + migração | 2h |
| Backend: auth endpoints (cliente) | 6h |
| Backend: favorites CRUD | 3h |
| Backend: addresses CRUD | 3h |
| Backend: reorder logic | 2h |
| Frontend: CustomerLayout + LoginPage | 4h |
| Frontend: Dashboard + Orders | 5h |
| Frontend: Favorites + Addresses | 4h |
| Frontend: Profile page | 2h |
| Frontend: FavoriteButton + ReorderButton | 2h |
| Testes | 3h |
| **Total** | **36h (~4 dias)** |

---

## 5. Gestão de Frete (P1)

### 5.1 Schema do Banco

```sql
-- Tabela de regiões de entrega
CREATE TABLE IF NOT EXISTS delivery_regions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL, -- 'Centro', 'Zona Norte', etc.
  description TEXT,
  cities TEXT, -- JSON array de cidades cobertas
  zip_code_ranges TEXT, -- JSON: [{start: "01000-000", end: "01999-999"}]
  base_fee REAL NOT NULL, -- Taxa base da região
  fee_per_km REAL DEFAULT 0, -- Taxa adicional por km
  min_purchase_for_free REAL DEFAULT 0, -- Compra mínima para frete grátis
  estimated_days_min INTEGER DEFAULT 1,
  estimated_days_max INTEGER DEFAULT 3,
  active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de agendamentos de entrega
CREATE TABLE IF NOT EXISTS delivery_schedules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  delivery_id INTEGER NOT NULL REFERENCES deliveries(id),
  scheduled_date TEXT NOT NULL,
  scheduled_time_slot TEXT, -- 'morning' (7-12), 'afternoon' (12-18), 'evening' (18-21)
  customer_notes TEXT,
  confirmed INTEGER DEFAULT 0,
  confirmed_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Alterações na tabela deliveries
ALTER TABLE deliveries ADD COLUMN region_id INTEGER REFERENCES delivery_regions(id);
ALTER TABLE deliveries ADD COLUMN freight_cost REAL DEFAULT 0;
ALTER TABLE deliveries ADD COLUMN scheduled_date TEXT;
ALTER TABLE deliveries ADD COLUMN time_slot TEXT;
ALTER TABLE deliveries ADD COLUMN distance_km REAL;

-- Índices
CREATE INDEX IF NOT EXISTS idx_delivery_regions_active ON delivery_regions(active);
CREATE INDEX IF NOT EXISTS idx_delivery_schedules_delivery ON delivery_schedules(delivery_id);
CREATE INDEX IF NOT EXISTS idx_delivery_schedules_date ON delivery_schedules(scheduled_date);
```

### 5.2 Rotas API

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| `GET` | `/api/freight/regions` | Public | Listar regiões ativas |
| `POST` | `/api/freight/calculate` | Public | Calcular frete por CEP/endereço |
| `POST` | `/api/freight/schedule` | Customer | Agendar entrega |
| `PUT` | `/api/freight/schedule/:id` | admin | Confirmar/agendar entrega |
| `GET` | `/api/freight/schedule/:deliveryId` | Required | Ver agendamento |
| `POST` | `/api/freight/regions` | admin | Criar região |
| `PUT` | `/api/freight/regions/:id` | admin | Editar região |
| `DELETE` | `/api/freight/regions/:id` | admin | Remover região |

**Payloads:**

```json
// POST /api/freight/calculate - Request
{
  "zip_code": "01001-000",
  // ou
  "city": "São Paulo",
  "neighborhood": "Centro",
  "cart_total": 450.00,
  "cart_weight": 120 // kg (opcional, para cálculo)
}

// POST /api/freight/calculate - Response
{
  "region": "Centro",
  "base_fee": 25.00,
  "additional_fee": 0,
  "total_freight": 25.00,
  "free_freight": false,
  "estimated_days": "1-2 dias úteis"
}

// POST /api/freight/schedule - Request
{
  "delivery_id": 12,
  "scheduled_date": "2026-05-25",
  "time_slot": "morning",
  "customer_notes": "Prédio com portaria 24h"
}
```

### 5.3 Estimativa de Esforço: ~24h (3 dias)

---

## 6. NF-e - Nota Fiscal Eletrônica (P1)

### 6.1 Schema do Banco

```sql
-- Tabela de notas fiscais emitidas
CREATE TABLE IF NOT EXISTS fiscal_invoices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  note_id INTEGER REFERENCES notes(id),
  order_id INTEGER REFERENCES orders(id),
  access_key TEXT UNIQUE, -- Chave de acesso 44 dígitos
  nfe_number INTEGER, -- Número da NF-e
  nfe_series INTEGER DEFAULT 1, -- Série
  status TEXT DEFAULT 'draft'
    CHECK(status IN ('draft', 'pending', 'authorized', 'rejected', 'cancelled', 'denied')),
  sefaz_protocol TEXT, -- Protocolo de autorização SEFAZ
  sefaz_status_code INTEGER, -- Código de status SEFAZ
  sefaz_status_message TEXT, -- Mensagem SEFAZ
  xml_sent TEXT, -- XML enviado (path ou conteúdo)
  xml_received TEXT, -- XML recebido com protocolo
  danfe_url TEXT, -- URL do DANFE para download
  issued_at DATETIME,
  cancelled_at DATETIME,
  cancellation_reason TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de configurações da empresa para NF-e
CREATE TABLE IF NOT EXISTS company_fiscal_data (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_name TEXT NOT NULL,
  trade_name TEXT,
  cnpj TEXT NOT NULL,
  state_registration TEXT, -- Inscrição estadual
  municipal_registration TEXT, -- Inscrição municipal
  tax_regime TEXT DEFAULT 'simples' -- 'simples', 'presumido', 'real'
    CHECK(tax_regime IN ('simples', 'presumido', 'real')),
  cnae TEXT,
  address TEXT,
  number TEXT,
  complement TEXT,
  neighborhood TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  phone TEXT,
  email TEXT,
  responsible_name TEXT, -- Responsável pela emissão
  certificate_path TEXT, -- Path do certificado digital A1
  certificate_password TEXT, -- Senha do certificado (criptografada)
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de CFOP/NCM mapeados por produto
-- (já adicionados NCM, CEST na tabela products na seção 2)

-- Índices
CREATE INDEX IF NOT EXISTS idx_fiscal_invoices_note ON fiscal_invoices(note_id);
CREATE INDEX IF NOT EXISTS idx_fiscal_invoices_order ON fiscal_invoices(order_id);
CREATE INDEX IF NOT EXISTS idx_fiscal_invoices_status ON fiscal_invoices(status);
CREATE INDEX IF NOT EXISTS idx_fiscal_invoices_access_key ON fiscal_invoices(access_key);
```

### 6.2 Rotas API

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| `POST` | `/api/nfe/emit` | admin, financeiro | Emitir NF-e |
| `GET` | `/api/nfe/:id/status` | Required | Consultar status na SEFAZ |
| `POST` | `/api/nfe/:id/cancel` | admin, financeiro | Cancelar NF-e |
| `GET` | `/api/nfe/:id/xml` | Required | Baixar XML da NF-e |
| `GET` | `/api/nfe/:id/danfe` | Required | Baixar DANFE (PDF) |
| `GET` | `/api/nfe` | Required | Listar NF-e emitidas |
| `GET` | `/api/nfe/report` | admin | Relatório fiscal |
| `GET` | `/api/nfe/company-data` | admin | Dados fiscais da empresa |
| `PUT` | `/api/nfe/company-data` | admin | Atualizar dados fiscais |

### 6.3 Dependências

| Pacote | Versão | Uso |
|---|---|---|
| `node-nfe` ou `fiscal` | - | Geração de XML NF-e |
| Alternativa: API externa | - | FocusNFe, eNotas, ou PlugNFe (recomendado) |

**Recomendação:** Usar API de terceiro (FocusNFe ou eNotas) ao invés de implementar geração de XML manualmente. Isso reduz complexidade e mantém conformidade com legislação.

### 6.4 Estimativa de Esforço: ~56h (7 dias)

### 6.5 Riscos e Mitigações

| Risco | Impacto | Mitigação |
|---|---|---|
| Certificado digital expirado | Alto | Alerta 30 dias antes; monitoramento automático |
| Rejeição SEFAZ | Alto | Log detalhado; retry automático; fallback manual |
| Dados fiscais desatualizados | Médio | Validação antes da emissão; revisão periódica |
| Mudança na legislação | Médio | Usar API de terceiro que atualiza automaticamente |
| Cancelamento fora do prazo | Alto | Alerta de prazo (24h para cancelamento) |

---

## 7. Relatórios Avançados (P1)

### 7.1 Schema do Banco

```sql
-- Tabela de relatórios salvos
CREATE TABLE IF NOT EXISTS saved_reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER REFERENCES users(id),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('sales', 'inventory', 'financial', 'abc', 'customers', 'custom')),
  filters TEXT, -- JSON dos filtros salvos
  schedule TEXT, -- JSON: {frequency: 'daily'|'weekly'|'monthly', email: '...'}
  last_generated DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de relatórios gerados (cache)
CREATE TABLE IF NOT EXISTS report_cache (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  report_id INTEGER REFERENCES saved_reports(id),
  user_id INTEGER REFERENCES users(id),
  type TEXT NOT NULL,
  filters TEXT, -- JSON dos filtros usados
  data TEXT NOT NULL, -- JSON do resultado
  generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME
);
```

### 7.2 Rotas API

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| `GET` | `/api/reports/sales` | admin, financeiro | Relatório de vendas |
| `GET` | `/api/reports/financial` | admin, financeiro | Relatório financeiro |
| `GET` | `/api/reports/inventory` | admin, estoquista | Relatório de estoque |
| `GET` | `/api/reports/abc` | admin | Curva ABC de produtos |
| `GET` | `/api/reports/customers` | admin | Relatório de clientes |
| `GET` | `/api/reports/customers/top` | admin | Top clientes por valor |
| `GET` | `/api/reports/products/top` | admin | Top produtos vendidos |
| `GET` | `/api/reports/export/:type` | admin | Exportar relatório (CSV/PDF/XLSX) |
| `POST` | `/api/reports/save` | admin | Salvar configuração de relatório |
| `GET` | `/api/reports/saved` | admin | Listar relatórios salvos |

### 7.3 Componentes Frontend

| Componente | Tipo | Descrição |
|---|---|---|
| `ReportsDashboard` | Página | Dashboard de relatórios |
| `SalesReport` | Página | Relatório de vendas com gráficos |
| `FinancialReport` | Página | Relatório financeiro |
| `AbcCurve` | Página | Curva ABC com gráfico de Pareto |
| `InventoryReport` | Página | Relatório de estoque |
| `CustomerReport` | Página | Relatório de clientes |
| `ReportExporter` | Componente | Botão de exportação (CSV/PDF/XLSX) |
| `DateRangePicker` | Componente | Seletor de período reutilizável |
| `ReportChart` | Componente | Componente de gráfico reutilizável |

### 7.4 Dependências

| Pacote | Versão | Uso |
|---|---|---|
| `recharts` | ^2.12.0 | Gráficos (já listado na seção 2) |
| `xlsx` | ^0.18.5 | Exportação Excel |
| `csv-stringify` | ^6.4.6 | Exportação CSV |

### 7.5 Estimativa de Esforço: ~32h (4 dias)

---

## 8. WhatsApp Integrado (P1)

### 8.1 Schema do Banco

```sql
-- Tabela de mensagens WhatsApp
CREATE TABLE IF NOT EXISTS whatsapp_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_phone TEXT NOT NULL,
  direction TEXT NOT NULL CHECK(direction IN ('outbound', 'inbound')),
  type TEXT NOT NULL DEFAULT 'text'
    CHECK(type IN ('text', 'template', 'image', 'document', 'button', 'list')),
  content TEXT NOT NULL, -- Texto ou JSON do template
  template_name TEXT, -- Nome do template (se aplicável)
  status TEXT DEFAULT 'pending'
    CHECK(status IN ('pending', 'sent', 'delivered', 'read', 'failed')),
  reference_type TEXT, -- 'order', 'quote', 'delivery', 'payment'
  reference_id INTEGER,
  whatsapp_message_id TEXT, -- ID retornado pela API
  error_message TEXT,
  sent_at DATETIME,
  delivered_at DATETIME,
  read_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de templates de mensagem
CREATE TABLE IF NOT EXISTS whatsapp_templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL CHECK(category IN ('marketing', 'utility', 'authentication')),
  language TEXT DEFAULT 'pt_BR',
  body TEXT NOT NULL, -- Corpo do template com variáveis {{1}}, {{2}}
  variables TEXT, -- JSON: ["customer_name", "order_number", ...]
  approved INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Configurações WhatsApp
ALTER TABLE app_settings ADD COLUMN whatsapp_api_token TEXT DEFAULT '';
ALTER TABLE app_settings ADD COLUMN whatsapp_phone_id TEXT DEFAULT '';
ALTER TABLE app_settings ADD COLUMN whatsapp_webhook_verify_token TEXT DEFAULT '';
```

### 8.2 Rotas API

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| `POST` | `/api/whatsapp/send` | Required | Enviar mensagem |
| `POST` | `/api/whatsapp/send-template` | Required | Enviar template |
| `POST` | `/api/whatsapp/webhook` | Public | Webhook WhatsApp Cloud API |
| `GET` | `/api/whatsapp/messages` | Required | Listar mensagens |
| `GET` | `/api/whatsapp/templates` | admin | Listar templates |
| `POST` | `/api/whatsapp/templates` | admin | Criar template |
| `POST` | `/api/whatsapp/quote/:id/send` | Required | Enviar orçamento via WhatsApp |
| `POST` | `/api/whatsapp/order/:id/notify` | Required | Notificar status do pedido |

### 8.3 Templates Predefinidos

```
1. ORCAMENTO_ENVIADO: "Olá {{1}}! Seu orçamento #{{2}} foi enviado. Total: R$ {{3}}. Acesse: {{4}}"
2. PEDIDO_CONFIRMADO: "Olá {{1}}! Pedido #{{2}} confirmado. Total: R$ {{3}}. Previsão: {{4}}"
3. ENTREGA_SAIU: "Olá {{1}}! Seu pedido #{{2}} saiu para entrega! Previsão: {{3}}"
4. ENTREGA_REALIZADA: "Olá {{1}}! Pedido #{{2}} entregue. Avalie: {{3}}"
5. PAGAMENTO_CONFIRMADO: "Olá {{1}}! Pagamento de R$ {{2}} confirmado. Pedido #{{3}}"
6. BOLETO_ENVIADO: "Olá {{1}}! Boleto de R$ {{2}} gerado. Vencimento: {{3}}. Link: {{4}}"
7. LEMBRETE_CONTA: "Olá! A conta {{1}} de R$ {{2}} vence em {{3}}. Evite juros!"
```

### 8.4 Dependências

| Pacote | Versão | Uso |
|---|---|---|
| `axios` | ^1.6.7 | HTTP client para WhatsApp Cloud API |

**Serviço Externo:** WhatsApp Cloud API (Meta) - gratuito até 1000 conversas/mês

### 8.5 Estimativa de Esforço: ~16h (2 dias)

---

## 9. Imagens de Produtos (P1)

### 9.1 Schema do Banco

```sql
-- Tabela de imagens de produtos
CREATE TABLE IF NOT EXISTS product_images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL REFERENCES products(id),
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  alt_text TEXT,
  is_primary INTEGER DEFAULT 0,
  order_index INTEGER DEFAULT 0,
  file_size INTEGER, -- bytes
  mime_type TEXT,
  width INTEGER,
  height INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Alteração: a coluna 'image' existente em products se torna a imagem primária
-- ou é depreciada em favor da nova tabela

-- Índices
CREATE INDEX IF NOT EXISTS idx_product_images_product ON product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_images_primary ON product_images(product_id, is_primary);
CREATE INDEX IF NOT EXISTS idx_product_images_order ON product_images(product_id, order_index);
```

### 9.2 Rotas API

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| `POST` | `/api/products/:id/images` | admin, estoquista | Upload de imagem |
| `GET` | `/api/products/:id/images` | Public | Listar imagens do produto |
| `PUT` | `/api/products/:id/images/:imageId` | admin | Editar imagem (alt, primary, order) |
| `DELETE` | `/api/products/:id/images/:imageId` | admin | Remover imagem |
| `PUT` | `/api/products/:id/images/reorder` | admin | Reordenar imagens |

### 9.3 Componentes Frontend

| Componente | Tipo | Descrição |
|---|---|---|
| `ImageUploader` | Componente | Drag & drop upload com preview |
| `ImageGallery` | Componente | Galeria de imagens do produto |
| `ImageEditor` | Componente | Editar alt text, definir primary, reordenar |
| `ProductImageField` | Componente | Campo de imagem no form de produto |

### 9.4 Dependências

| Pacote | Versão | Uso |
|---|---|---|
| `multer` | ^1.4.5-lts.1 | Upload de arquivos |
| `sharp` | ^0.33.2 | Resize/otimização de imagens |
| `@aws-sdk/client-s3` | ^3.500.0 | S3 storage (opcional) |

**Armazenamento:**
- **Opção 1 (simples):** Local em `backend/uploads/products/`
- **Opção 2 (produção):** AWS S3, Cloudflare R2, ou Firebase Storage

### 9.5 Estimativa de Esforço: ~16h (2 dias)

---

## 10. Multi-usuário com Permissões (P1)

> **Nota:** Esta funcionalidade é uma extensão da Seção 1 (Autenticação). Aqui detalhamos as permissões granulares.

### 10.1 Matriz de Permissões

```
Permission Key              | admin | vendedor | estoquista | financeiro
----------------------------|-------|----------|------------|-----------
products.read               |   ✓   |    ✓     |     ✓      |     ✓
products.write              |   ✓   |    ✓     |     ✓      |
products.delete             |   ✓   |          |            |
products.cost_price         |   ✓   |          |     ✓      |     ✓
quotes.read                 |   ✓   |    ✓     |            |     ✓
quotes.write                |   ✓   |    ✓     |            |
quotes.approve              |   ✓   |    ✓     |            |
orders.read                 |   ✓   |    ✓     |            |     ✓
orders.write                |   ✓   |    ✓     |            |
orders.cancel               |   ✓   |    ✓     |            |     ✓
customers.read              |   ✓   |    ✓     |            |     ✓
customers.write             |   ✓   |    ✓     |            |
stock.read                  |   ✓   |          |     ✓      |     ✓
stock.write                 |   ✓   |          |     ✓      |
stock.adjust                |   ✓   |          |     ✓      |
purchases.read              |   ✓   |          |     ✓      |     ✓
purchases.write             |   ✓   |          |     ✓      |
deliveries.read             |   ✓   |    ✓     |            |     ✓
deliveries.assign           |   ✓   |          |            |
deliveries.update           |   ✓   |          |     ✓      |
payments.read               |   ✓   |          |            |     ✓
payments.refund             |   ✓   |          |            |     ✓
bills.read                  |   ✓   |          |            |     ✓
bills.write                 |   ✓   |          |            |     ✓
bills.pay                   |   ✓   |          |            |     ✓
reports.read                |   ✓   |          |            |     ✓
reports.export              |   ✓   |          |            |     ✓
nfe.emit                    |   ✓   |          |            |     ✓
nfe.cancel                  |   ✓   |          |            |     ✓
users.read                  |   ✓   |          |            |
users.write                 |   ✓   |          |            |
settings.read               |   ✓   |    ✓     |     ✓      |     ✓
settings.write              |   ✓   |          |            |
audit_logs.read             |   ✓   |          |            |
```

### 10.2 Middleware de Permissões

```javascript
// middleware/permissions.js
function requirePermission(permission) {
  return (req, res, next) => {
    const user = req.user; // Set by auth middleware
    if (!user) return res.status(401).json({ error: 'Não autenticado' });
    if (user.role === 'admin') return next(); // Admin tem acesso total

    const permissions = JSON.parse(user.permissions || '[]');
    if (permissions.includes('*') || permissions.includes(permission)) {
      return next();
    }
    res.status(403).json({ error: 'Permissão negada' });
  };
}

// Usage:
// app.get('/api/products', requirePermission('products.read'), (req, res) => {...});
// app.post('/api/products', requirePermission('products.write'), (req, res) => {...});
```

### 10.3 Estimativa de Esforço: ~24h (3 dias)

---

## Resumo Geral de Esforço

| # | Funcionalidade | Prioridade | Horas | Dias |
|---|---|---|---|---|
| 1 | Autenticação e Autorização | P0 | 40 | 5 |
| 2 | Controle de Estoque Real | P0 | 50 | 6 |
| 3 | Gateway de Pagamento | P0 | 54 | 7 |
| 4 | Área do Cliente | P1 | 36 | 4 |
| 5 | Gestão de Frete | P1 | 24 | 3 |
| 6 | NF-e | P1 | 56 | 7 |
| 7 | Relatórios Avançados | P1 | 32 | 4 |
| 8 | WhatsApp Integrado | P1 | 16 | 2 |
| 9 | Imagens de Produtos | P1 | 16 | 2 |
| 10 | Multi-usuário/Permissões | P1 | 24 | 3 |
| | **TOTAL** | | **348** | **43** |

> **Nota:** Os dias assumem 8h/dia. Com 2 desenvolvedores, o tempo de calendário pode ser reduzido em ~40% considerando paralelização adequada.

---

## Ordem Recomendada de Implementação

```
Sprint 1 (Semana 1-2):  Autenticação + Multi-usuário/Permissões
Sprint 2 (Semana 3-4):  Controle de Estoque Real
Sprint 3 (Semana 5-6):  Gateway de Pagamento
Sprint 4 (Semana 7):    Área do Cliente + Gestão de Frete
Sprint 5 (Semana 8):    WhatsApp + Imagens de Produtos
Sprint 6 (Semana 9-10): Relatórios Avançados
Sprint 7 (Semana 11-12): NF-e
```

---

## Migração: sql.js → better-sqlite3 (Recomendação Futura)

O sistema atual usa `sql.js` (SQLite compilado para WebAssembly), que tem limitações:
- Sem transações concorrentes reais
- Todo o banco em memória (salva em disco periodicamente)
- Sem WAL mode, sem foreign keys enforcement

**Recomendação:** Migrar para `better-sqlite3` quando o sistema entrar em produção:

```json
// Novo package.json backend
{
  "dependencies": {
    "better-sqlite3": "^11.0.0",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "express-rate-limit": "^7.1.5",
    "helmet": "^7.1.0",
    "multer": "^1.4.5-lts.1",
    "sharp": "^0.33.2",
    "mercadopago": "^2.0.10",
    "axios": "^1.6.7",
    "xlsx": "^0.18.5"
  }
}
```

A migração é simples porque a API de `better-sqlite3` é muito similar ao `sql.js`:

```javascript
// db.js com better-sqlite3
const Database = require('better-sqlite3');
const db = new Database(path.join(__dirname, 'guimaraes.db'));

// Habilitar foreign keys e WAL mode
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Transações reais
const insertMovement = db.transaction((movement) => {
  db.prepare('INSERT INTO stock_movements ...').run(movement);
  db.prepare('UPDATE products SET stock = stock + ? WHERE id = ?').run(
    movement.quantity, movement.product_id
  );
});
```

---

## Checklist de Produção

- [ ] HTTPS obrigatório (Let's Encrypt)
- [ ] Variáveis de ambiente (.env) para todas as credenciais
- [ ] Backup automático do banco (diário)
- [ ] Rate limiting em todas as rotas públicas
- [ ] CORS configurado para domínios específicos
- [ ] Logging estruturado (winston ou pino)
- [ ] Health check endpoint
- [ ] Certificado digital A1 válido para NF-e
- [ ] Webhook URL configurada e testada (pagamento + WhatsApp)
- [ ] Política de retenção de logs de auditoria
- [ ] LGPD: consentimento de dados, direito de exclusão

---

*Documento gerado em 2026-05-21. Revisar antes de cada sprint.*
