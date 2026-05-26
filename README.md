# Guimarães Materiais para Construção

Sistema completo para loja de materiais de construção com catálogo, carrinho, orçamento, painel administrativo financeiro, entregas, CRM e muito mais.

## 🚀 Como Rodar

### Backend (Porta 3001)
```bash
cd backend
npm install
node server.js
```

### Frontend (Porta 3002)
```bash
cd frontend
npm install
npm run dev
```

### Acesso no Celular
Na mesma rede Wi-Fi, acesse: **http://10.0.0.100:3002**

## 📊 Acessos

| Página | URL |
|--------|-----|
| Loja | http://localhost:3002 |
| Admin Dashboard | http://localhost:3002/admin |
| Admin Produtos | http://localhost:3002/admin/produtos |
| Admin Financeiro | http://localhost:3002/admin/financeiro |
| Admin Contas a Pagar | http://localhost:3002/admin/contas |
| Admin Entregas | http://localhost:3002/admin/entregas |
| Admin Clientes | http://localhost:3002/admin/clientes |
| Admin Cupons | http://localhost:3002/admin/cupons |
| Admin Fornecedores | http://localhost:3002/admin/fornecedores |
| Admin Notificações | http://localhost:3002/admin/notificacoes |
| Admin Orçamentos | http://localhost:3002/admin/orcamentos |
| Admin Pedidos | http://localhost:3002/admin/pedidos |
| Admin Configurações | http://localhost:3002/admin/configuracoes |

## 🔌 API Endpoints

### Produtos
| Endpoint | Método | Descrição |
|----------|--------|-----------|
| /api/products | GET | Listar produtos (filtros: category, featured, search) |
| /api/products/:id | GET/PUT/DELETE | CRUD produto individual |
| /api/categories | GET | Listar categorias |

### Pedidos e Orçamentos
| Endpoint | Método | Descrição |
|----------|--------|-----------|
| /api/quotes | POST/GET | Solicitar/Listar orçamentos |
| /api/quotes/:id | PUT | Atualizar status do orçamento |
| /api/orders | POST/GET | Criar/Listar pedidos |
| /api/orders/:id | PUT | Atualizar status do pedido |

### Financeiro
| Endpoint | Método | Descrição |
|----------|--------|-----------|
| /api/cash-flow | GET/POST | Listar/Criar lançamentos |
| /api/cash-flow/:id | PUT/DELETE | Editar/Remover lançamento |
| /api/bills | GET/POST | Listar/Criar contas a pagar |
| /api/bills/:id | PUT/DELETE | Pagar/Editar/Remover conta |

### Entregas
| Endpoint | Método | Descrição |
|----------|--------|-----------|
| /api/deliveries | GET | Listar entregas (filtro: status) |
| /api/deliveries/:id | GET/PUT | Detalhes/Atualizar entrega |

### Clientes (CRM)
| Endpoint | Método | Descrição |
|----------|--------|-----------|
| /api/customers | GET/POST | Listar/Criar clientes |
| /api/customers/:id | GET/PUT/DELETE | Detalhes/Editar/Remover |

### Cupons
| Endpoint | Método | Descrição |
|----------|--------|-----------|
| /api/coupons | GET/POST | Listar/Criar cupons |
| /api/coupons/:id | PUT/DELETE | Editar/Remover cupom |

### Fornecedores
| Endpoint | Método | Descrição |
|----------|--------|-----------|
| /api/suppliers | GET/POST | Listar/Criar fornecedores |
| /api/suppliers/:id | PUT/DELETE | Editar/Remover fornecedor |

### Notificações
| Endpoint | Método | Descrição |
|----------|--------|-----------|
| /api/notifications | GET | Listar notificações |
| /api/notifications/:id/read | PUT | Marcar como lida |
| /api/notifications/read-all | PUT | Marcar todas como lidas |

### Dashboard
| Endpoint | Método | Descrição |
|----------|--------|-----------|
| /api/dashboard | GET | Estatísticas completas |
| /api/settings | GET/PUT | Configurações da loja |
| /api/banners | GET/POST/PUT/DELETE | Banners promocionais |
| /api/check-reminders | GET | Verificar lembretes de contas e estoque |

## 🎯 Funcionalidades

### Loja (Cliente)
- ✅ Página inicial com banners e produtos em destaque
- ✅ Catálogo com busca e filtro por categorias
- ✅ 20 produtos de construção pré-cadastrados
- ✅ Carrinho de compras com persistência local
- ✅ Solicitação de orçamento com formulário
- ✅ Finalização de pedido direto do carrinho
- ✅ Layout responsivo mobile-first

### Admin - Dashboard
- ✅ Estatísticas gerais (produtos, pedidos, receita, saldo)
- ✅ Gráfico de receita mensal
- ✅ Produtos por categoria
- ✅ Alertas de estoque baixo
- ✅ Pedidos e entregas recentes
- ✅ Notificações em tempo real
- ✅ Ações rápidas para todas as seções

### Admin - Financeiro
- ✅ Fluxo de caixa (entradas e saídas)
- ✅ Categorias personalizáveis
- ✅ Formas de pagamento (Dinheiro, PIX, Cartão, Boleto, Transferência)
- ✅ Filtros por tipo e período
- ✅ Resumo com entradas, saídas e saldo
- ✅ Lançamentos automáticos ao criar pedidos

### Admin - Contas a Pagar
- ✅ Cadastro de contas/boletos com vencimento
- ✅ Sistema de lembretes automáticos (dias antes do vencimento)
- ✅ Marcação de pagamento com data e método
- ✅ Filtros por status (Pendente, Pago, Vencido)
- ✅ Alertas visuais para contas vencidas
- ✅ Notificações push automáticas

### Admin - Entregas
- ✅ Painel de entregas vinculado aos pedidos
- ✅ Status visual com fluxo: Preparando → Pronto → Saiu para Entrega → Entregue
- ✅ Avanço rápido de status com notificação automática ao cliente
- ✅ Cadastro de motorista e telefone
- ✅ Código de rastreio
- ✅ Data estimada de entrega
- ✅ Filtros por status

### Admin - Clientes (CRM)
- ✅ Cadastro completo (nome, telefone, email, CPF, endereço)
- ✅ Busca por nome, telefone ou email
- ✅ Histórico de pedidos por cliente
- ✅ Total gasto e quantidade de pedidos
- ✅ Visualização detalhada do perfil

### Admin - Cupons e Promoções
- ✅ Cupons com desconto em % ou valor fixo
- ✅ Compra mínima para uso
- ✅ Limite de usos e validade
- ✅ Ativar/desativar cupons

### Admin - Fornecedores
- ✅ Cadastro completo (empresa, contato, CNPJ, telefone, email)
- ✅ Vinculação de fornecedores aos produtos
- ✅ Ativar/desativar fornecedores

### Admin - Notificações
- ✅ Notificações de contas vencendo
- ✅ Notificações de status de entrega
- ✅ Alertas de estoque baixo
- ✅ Marcar como lida individual ou todas

### Admin - Produtos
- ✅ CRUD completo com imagem, categoria, estoque mínimo
- ✅ Alerta visual para estoque baixo
- ✅ Destaque na página inicial

### Admin - Pedidos
- ✅ Lista completa com status
- ✅ Aprovação e separação de pedidos
- ✅ Detalhes dos itens

### Admin - Configurações
- ✅ Nome, telefone, email, endereço da loja
- ✅ Horário de funcionamento
- ✅ WhatsApp para contato

## 📦 Dados Seed

O sistema já vem com dados de exemplo:
- **20 produtos** em 12 categorias
- **10 lançamentos financeiros** (entradas e saídas)
- **5 contas a pagar** com datas variadas
- **3 entregas** em diferentes status
- **5 clientes** com histórico
- **2 cupons** de desconto
- **3 fornecedores**
- **2 banners** promocionais

## 🧪 Testes

Todos os testes passaram com sucesso:
- **23/23** testes de frontend e API
- **7/7** novas páginas admin testadas
- Screenshots em `testes-screenshots/`

## ️ Tech Stack

- **Backend:** Node.js + Express + SQL.js (SQLite)
- **Frontend:** React + Vite + Tailwind CSS 4
- **Banco:** SQLite (arquivo local, sem instalação)
- **Testes:** Puppeteer (screenshots automatizados)
