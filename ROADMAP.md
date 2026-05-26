# Roadmap Guimarães Materiais para Construção

> **Versão:** 1.0 | **Data:** 2026-05-21 | **Status:** Pronto para Execução

---

## 1. VISÃO GERAL

Transformar o sistema atual do Guimarães Materiais para Construção — que já opera com catálogo, carrinho, admin financeiro, entregas e CRM — em uma plataforma completa de varejo de materiais de construção, com autenticação segura, controle real de estoque, pagamentos integrados (PIX/cartão/boleto), área do cliente autoatendimento, gestão de frete inteligente, emissão de NF-e, WhatsApp automatizado e relatórios gerenciais, competindo em funcionalidades com Telhanorte, Leroy Merlin e CISS, mantendo a stack atual (Express + sql.js + React + Tailwind) e entregando valor testável a cada semana.

---

## 2. PRINCÍPIOS DE GESTÃO

1. **Entregável toda sexta** — Cada sprint termina com algo que o usuário pode clicar, testar e validar. Nada de "em progresso" por semanas.
2. **Não quebre o que funciona** — O sistema já opera. Novas funcionalidades são adicionadas sem quebrar rotas, páginas ou fluxos existentes.
3. **Simples primeiro, sofisticado depois** — Prefira um botão "Copiar PIX" que funciona hoje a um checkout completo que demora 3 semanas. Itere.
4. **Uma dependência externa por sprint** — Não acumule integrações (Mercado Pago + WhatsApp + FocusNFe no mesmo sprint). Uma por vez, bem testada.
5. **Autenticação é a base de tudo** — Sem auth, não há área do cliente, não há permissões, não há auditoria. É o Sprint 1, sem exceção.
6. **Dados reais > dados seed** — A partir do Sprint 2, teste com dados reais do negócio. Seed data mascara bugs que aparecem só em produção.
7. **Documente decisões, não código** — Comentários explicam "como", o roadmap explica "por quê". Decisões arquiteturais ficam neste documento.

---

## 3. ROADMAP POR SPRINTS

### Sprint 1 — "Portas Trancadas" (Autenticação + Segurança Básica)

**Duração:** 5 dias (seg-sex)
**Objetivo:** Proteger o admin com login/senha e criar sistema de usuários com permissões.

**Funcionalidades entregues:**
- Tabela `users` com roles (admin, vendedor, estoquista, financeiro)
- Hash de senhas com bcryptjs
- JWT access token (1h) + refresh token (7 dias)
- Login page com validação e rate limiting (5 tentativas/min)
- Middleware de auth em todas as rotas admin
- ProtectedRoute no frontend
- Session management com blacklist
- Audit log básico (login/logout/crud)
- CRUD de usuários (admin cria/edita/remove)
- Seed do usuário admin inicial

**Entregável testável:** Acessar `/admin` exige login. Admin logado vê nome e role no header. Admin pode criar conta para vendedor. Vendedor logado não acessa rotas de admin financeiro.

**Dependências externas:** Nenhuma.

**Riscos e mitigação:**
| Risco | Mitigação |
|---|---|
| sql.js sem transações concorrentes | Mutex global para escritas no banco |
| Token JWT roubado | Access token de 1h + refresh com rotação + blacklist |
| Perder acesso admin | Script de recovery que cria admin via CLI |

**Definition of Done:**
- [ ] Login/logout funcionam com JWT
- [ ] Todas as rotas `/admin/*` exigem auth
- [ ] Roles funcionam (admin vs vendedor)
- [ ] Rate limiting no login ativo
- [ ] Audit log registra ações
- [ ] Admin pode criar/remover usuários
- [ ] Token refresh automático funciona
- [ ] Nenhum endpoint admin acessível sem token

---

### Sprint 2 — "Contagem Real" (Estoque Real + Movimentações)

**Duração:** 5 dias
**Objetivo:** Transformar o campo `stock` atual em um sistema real de movimentações com entrada, saída, reserva e inventário.

**Funcionalidades entregues:**
- Tabela `stock_movements` (in, out, adjustment, return)
- Tabela `purchases` + `purchase_items` (compras de fornecedor)
- Tabela `inventory_counts` (contagem física)
- Colunas novas em products: `cost_price`, `location`, `barcode`, `stock_reserved`
- API de movimentações com validação (não permite estoque negativo)
- Débito automático de estoque ao criar pedido
- Reserva de estoque ao aprovar pedido
- Baixa de reserva ao confirmar entrega
- Dashboard de estoque com alertas visuais
- Página de recebimento de mercadoria
- Ajuste manual com justificativa obrigatória
- Relatório de estoque exportável (CSV)

**Entregável testável:** Criar um pedido debita estoque automaticamente. Receber uma compra incrementa estoque e registra movimentação. Tentar vender sem estoque gera erro. Dashboard mostra produtos com estoque baixo/crítico/zerado.

**Dependências externas:** Nenhuma.

**Riscos e mitigação:**
| Risco | Mitigação |
|---|---|
| Estoque negativo por concorrência | Verificação atômica antes de cada débito |
| Migração de dados existentes | Script cria movimentação "in" inicial para cada produto |
| sql.js sem ACID | Fila de escrita sequencial + validação pré-operacional |

**Definition of Done:**
- [ ] Movimentação de entrada registra e atualiza stock
- [ ] Movimentação de saída valida stock disponível
- [ ] Pedido novo debita estoque automaticamente
- [ ] Compra recebida incrementa estoque
- [ ] Inventário registra diferença e gera ajuste
- [ ] Dashboard mostra stock_available vs stock_reserved
- [ ] Alertas de estoque baixo funcionam
- [ ] Relatório CSV exporta dados corretos

---

### Sprint 3 — "Pagamento na Mão" (PIX + Checkout Básico)

**Duração:** 6 dias
**Objetivo:** Integrar Mercado Pago para receber PIX com QR Code e confirmação automática via webhook.

**Funcionalidades entregues:**
- Tabela `payments` com todos os status
- Tabela `webhook_logs` para debug
- Integração Mercado Pago SDK (PIX)
- Endpoint `POST /api/payments/pix` gera QR Code
- Endpoint `POST /api/payments/webhook/mercadopago` processa confirmação
- Polling de fallback (30s) caso webhook falhe
- Página de checkout com seleção de método (PIX primeiro)
- Componente QR Code com timer de expiração (30 min)
- Botão "Copiar código PIX"
- Status de pagamento em tempo real (pending → approved)
- Ao aprovar: atualiza order, cria cash_flow, envia notificação
- Admin vê pagamentos com filtros por status/método
- Estorno manual (admin)

**Entregável testável:** Criar pedido → escolher PIX → ver QR Code → pagar no sandbox → sistema confirma automaticamente → pedido muda para "pago" → fluxo de caixa registra entrada.

**Dependências externas:**
- Conta Mercado Pago (sandbox gratuito)
- Access Token + Public Key
- Webhook URL (ngrok para desenvolvimento local)

**Riscos e mitigação:**
| Risco | Mitigação |
|---|---|
| Webhook não chega em localhost | ngrok + polling de fallback |
| Pagamento duplicado | Validação por order_id antes de criar |
| PIX expira | Timer visual + botão regenerar |
| Gateway fora do ar | Fallback para "pagamento manual" no admin |

**Definition of Done:**
- [ ] QR Code PIX gera corretamente no sandbox
- [ ] Webhook processa e atualiza status
- [ ] Polling de fallback funciona
- [ ] Order atualiza para "paid" automaticamente
- [ ] Cash flow registra entrada automaticamente
- [ ] Notificação de pagamento confirmado dispara
- [ ] Admin pode estornar pagamento
- [ ] Pagamento manual funciona como fallback

---

### Sprint 4 — "Minha Guimarães" (Área do Cliente)

**Duração:** 5 dias
**Objetivo:** Dar ao cliente final um portal autoatendimento para ver pedidos, favoritos e endereços.

**Funcionalidades entregues:**
- Registro/login de cliente (separado de usuários admin)
- Verificação de email com token
- Reset de senha por email
- Dashboard do cliente com resumo
- Histórico de pedidos com detalhes e status
- Rastreamento de entrega integrado
- Produtos favoritos (adicionar/remover)
- Endereços salvos (CRUD)
- Botão "Reordenar" (repetir pedido anterior)
- Botão de favoritar nas páginas de produto
- Perfil editável (nome, telefone, email)

**Entregável testável:** Cliente se registra → faz login → vê pedidos anteriores → favorita produto → salva endereço → clica "Reordenar" → carrinho preenche com itens do pedido anterior.

**Dependências externas:** Nenhuma (usa mesma tabela `users` com role `customer`).

**Riscos e mitigação:**
| Risco | Mitigação |
|---|---|
| Confundir users admin com customers | Role `customer` separada; endpoints dedicados `/api/customer/*` |
| Email de verificação não envia | Por enquanto, auto-verifica; implementar SMTP depois |

**Definition of Done:**
- [ ] Cliente registra e faz login
- [ ] Dashboard mostra pedidos e favoritos
- [ ] Histórico de pedidos com detalhes completos
- [ ] Rastreamento de entrega visível
- [ ] Favoritos funcionam (add/remove)
- [ ] Endereços CRUD completo
- [ ] Reordenar preenche carrinho
- [ ] Perfil editável

---

### Sprint 5 — "Frete Inteligente" (Gestão de Frete + Regiões)

**Duração:** 4 dias
**Objetivo:** Calcular frete por região/CEP e permitir agendamento de entrega.

**Funcionalidades entregues:**
- Tabela `delivery_regions` (nome, CEPs, taxa base, prazo)
- Tabela `delivery_schedules` (data, horário)
- API `POST /api/freight/calculate` por CEP ou bairro
- Frete grátis acima de valor mínimo configurável
- Exibição de frete no checkout antes do pagamento
- Agendamento de entrega pelo cliente
- Admin confirma/ajusta agendamento
- Colunas novas em deliveries: `region_id`, `freight_cost`, `scheduled_date`, `time_slot`
- Regiões CRUD no admin
- 5 regiões seed (Centro, Zona Norte, Zona Sul, Leste, Oeste)

**Entregável testável:** Cliente informa CEP → vê frete calculado + prazo → escolhe data de entrega → admin confirma → frete aparece no pedido e no financeiro.

**Dependências externas:** Nenhuma.

**Riscos e mitigação:**
| Risco | Mitigação |
|---|---|
| CEP não mapeado | Região "Outros" com taxa padrão |
| Frete incorreto | Admin pode ajustar manualmente por pedido |

**Definition of Done:**
- [ ] Cálculo de frete por CEP funciona
- [ ] Frete grátis aplica acima do mínimo
- [ ] Cliente agenda entrega
- [ ] Admin confirma agenda
- [ ] Frete registrado no pedido e cash flow
- [ ] Regiões CRUD no admin

---

### Sprint 6 — "Zap do Guimarães" (WhatsApp + Imagens)

**Duração:** 5 dias
**Objetivo:** Integrar WhatsApp Cloud API para notificações automáticas e adicionar upload de imagens de produtos.

**Funcionalidades entregues:**
- Tabela `whatsapp_messages` + `whatsapp_templates`
- Integração WhatsApp Cloud API (Meta)
- 7 templates pré-configurados (orçamento, pedido, entrega, pagamento)
- Envio automático: orçamento aprovado, pedido confirmado, entrega saiu, entrega entregue
- Envio manual: admin digita mensagem para cliente específico
- Log de mensagens enviadas/recebidas
- Upload de imagens de produtos (multer, local storage)
- Tabela `product_images` (múltiplas por produto)
- Galeria de imagens na página de produto
- Thumbnail generation (sharp)
- Imagem primária configurável

**Entregável testável:** Admin aprova orçamento → cliente recebe WhatsApp automático. Admin faz upload de 3 fotos de produto → página do produto mostra galeria com thumbnail.

**Dependências externas:**
- WhatsApp Cloud API (Meta) — gratuito até 1000 conversas/mês
- Phone ID + Access Token
- ngrok para webhook em dev

**Riscos e mitigação:**
| Risco | Mitigação |
|---|---|
| Templates não aprovados pela Meta | Usar templates utilitários (aprovação mais rápida) |
| Imagens pesadas | Compressão automática + max 5MB + resize |
| Storage local enche | Configurar limite; migrar para S3 no futuro |

**Definition of Done:**
- [ ] Template de pedido confirmado envia via WhatsApp
- [ ] Template de entrega envia ao mudar status
- [ ] Admin envia mensagem manual
- [ ] Log de mensagens visível no admin
- [ ] Upload de imagem de produto funciona
- [ ] Galeria exibe múltiplas imagens
- [ ] Thumbnail gera automaticamente
- [ ] Imagem primária configurável

---

### Sprint 7 — "NF-e e Notas" (Emissão Fiscal + Cartão)

**Duração:** 6 dias
**Objetivo:** Emitir NF-e via API de terceiro (FocusNFe) e adicionar pagamento com cartão de crédito.

**Funcionalidades entregues:**
- Tabela `fiscal_invoices` + `company_fiscal_data`
- Integração FocusNFe (ou eNotas) para emissão
- Dados fiscais da empresa configuráveis no admin
- Colunas NCM, CEST, origin em products (já previstas no Sprint 2)
- Emitir NF-e a partir de pedido aprovado
- Consultar status na SEFAZ
- Cancelar NF-e com motivo
- Download XML e DANFE (PDF)
- Lista de NF-e emitidas com filtros
- Pagamento com cartão de crédito (Mercado Pago)
- Parcelamento (até 12x)
- Tokenização de cartão (dados não passam pelo backend)
- 3D Secure quando disponível

**Entregável testável:** Pedido aprovado → admin clica "Emitir NF-e" → NF-e autorizada → download DANFE. Cliente escolhe cartão → parcela em 3x → pagamento aprovado.

**Dependências externas:**
- Conta FocusNFe (ou eNotas) — plano básico
- Certificado digital A1 da empresa
- Mercado Pago já configurado (Sprint 3)

**Riscos e mitigação:**
| Risco | Mitigação |
|---|---|
| Certificado digital expirado | Alerta 30 dias antes no dashboard |
| Rejeição SEFAZ | Log detalhado + retry + fallback manual |
| Dados NCM/CEST faltando | Validação antes de emitir; bloqueia se incompleto |

**Definition of Done:**
- [ ] NF-e emite e retorna status autorizado
- [ ] DANFE download funciona
- [ ] Cancelamento com motivo funciona
- [ ] Dados fiscais da empresa editáveis
- [ ] Cartão de crédito processa no sandbox
- [ ] Parcelamento funciona (até 12x)
- [ ] Tokenização de cartão segura

---

### Sprint 8 — "Visão Geral" (Relatórios + Multi-usuário Avançado)

**Duração:** 5 dias
**Objetivo:** Dashboards gerenciais com relatórios exportáveis e permissões granulares por usuário.

**Funcionalidades entregues:**
- Relatório de vendas (por período, categoria, vendedor)
- Relatório financeiro (entradas, saídas, saldo, DRE simplificado)
- Curva ABC de produtos (Pareto 80/20)
- Relatório de clientes (top clientes, ticket médio, frequência)
- Relatório de estoque (giro, produtos parados, margem)
- Exportação CSV e Excel (xlsx)
- Gráficos com recharts (vendas mensais, top produtos)
- Permissões granulares por usuário (JSON de permissions)
- RoleGuard no frontend (esconde/mostra seções por permissão)
- Audit log avançado (quem mudou o quê e quando)
- Página de logs de auditoria no admin

**Entregável testável:** Admin abre relatórios → filtra por mês → vê gráfico de vendas → exporta Excel. Vendedor logado vê apenas pedidos e clientes, não vê financeiro.

**Dependências externas:** Nenhuma.

**Riscos e mitigação:**
| Risco | Mitigação |
|---|---|
| Queries lentas com muitos dados | Índices nas colunas de filtro; paginação |
| Export travar com muitos registros | Limite de 10k linhas; streaming se necessário |

**Definition of Done:**
- [ ] 5 relatórios geram dados corretos
- [ ] Gráficos renderizam com recharts
- [ ] Export CSV e Excel funciona
- [ ] Permissões granulares funcionam
- [ ] RoleGuard esconde seções corretamente
- [ ] Audit log mostra ações detalhadas

---

### Sprint 9 — "Fidelidade e Promoções" (Preços por Cliente + Cupons Avançados)

**Duração:** 4 dias
**Objetivo:** Programa de fidelidade básico, preços diferenciados por cliente e promoções avançadas.

**Funcionalidades entregues:**
- Tabela `loyalty_points` (acumula por compra, gasta por desconto)
- Regra: R$1 gasto = 1 ponto; 100 pontos = R$5 desconto
- Exibição de pontos no dashboard do cliente
- Resgate de pontos no checkout
- Tabela `customer_prices` (preço específico por produto por cliente)
- Preço especial visível apenas para o cliente logado
- Cupons avançados: por categoria, por produto, primeira compra, uso único
- Promoções por período (blackout dates)
- Banner de promoção na home
- Desconto PIX configurável (ex: 5% off)

**Entregável testável:** Cliente compra R$500 → ganha 500 pontos → próxima compra resgata R$25 de desconto. Admin cria cupom "CIMENTO10" → 10% off apenas em cimentos → válido até fim do mês.

**Dependências externas:** Nenhuma.

**Riscos e mitigação:**
| Risco | Mitigação |
|---|---|
| Conflito de descontos (cupom + pontos + PIX) | Regra de prioridade: PIX > cupom > pontos |
| Preço por cliente vaza para outros | Verificação de role/customer_id em cada query |

**Definition of Done:**
- [ ] Pontos acumulam por compra
- [ ] Resgate de pontos reduz total do pedido
- [ ] Preço por cliente aparece apenas para aquele cliente
- [ ] Cupons por categoria funcionam
- [ ] Promoções por período ativam/desativam sozinhas
- [ ] Desconto PIX aplica automaticamente

---

### Sprint 10 — "Calculadora e PWA" (Calculadora de Obra + Installable)

**Duração:** 5 dias
**Objetivo:** Calculadoras de material para o cliente e transformar o frontend em PWA instalável.

**Funcionalidades entregues:**
- Calculadora de argamassa/rejunte (m² → sacos)
- Calculadora de tinta (m² → litros → galões)
- Calculadora de piso/cerâmica (m² → peças + 10% perda)
- Calculadora de concreto (volume → sacos cimento + areia + brita)
- Calculadora de tijolo/bloco (m² → unidades)
- Calculadora de telhado (m² → telhas + estrutura)
- Calculadora de elétrica (cômodos → fios + disjuntores)
- Calculadora de hidráulica (pontos → tubos + conexões)
- Cada calculadora adiciona itens ao carrinho direto
- PWA: manifest.json + service worker
- Install prompt no mobile
- Cache offline de catálogo
- Ícone de app na home screen

**Entregável testável:** Cliente abre calculadora de piso → digita 30m² → sistema calcula 33 peças (com perda) → clica "Adicionar ao carrinho" → itens vão para o carrinho. Celular mostra "Instalar app Guimarães".

**Dependências externas:** Nenhuma.

**Riscos e mitigação:**
| Risco | Mitigação |
|---|---|
| Cálculos imprecisos | Usar fórmulas padrão da indústria; disclaimer |
| Service worker cache desatualizado | Strategy: stale-while-revalidate + versioning |

**Definition of Done:**
- [ ] 8 calculadoras funcionam com resultados razoáveis
- [ ] Calculadoras adicionam ao carrinho
- [ ] PWA installável no Android/iOS
- [ ] Catálogo funciona offline (cacheado)
- [ ] Manifest.json válido

---

### Sprint 11 — "Auto-Pilot" (Busca Inteligente + Auto-reposição + Cron Jobs)

**Duração:** 4 dias
**Objetivo:** Busca com fuzzy matching, alertas automáticos de reposição e jobs agendados.

**Funcionalidades entregues:**
- Busca fuzzy (tolera erros de digitação)
- Busca por sinônimos ("cimento" = "argamassa" em alguns contextos)
- Busca por categoria + produto simultaneamente
- Auto-reposição: quando stock < min_stock, cria sugestão de compra
- Sugestão de quantidade baseada em média de vendas (últimos 30 dias)
- Cron jobs: verificação de contas a vencer (diário)
- Cron jobs: verificação de estoque baixo (diário)
- Cron jobs: limpeza de PIX expirados (horário)
- Cron jobs: backup automático do banco (diário)
- Dashboard de jobs com histórico de execução

**Entregável testável:** Busca "argamassa aci 2" encontra "Argamassa ACII". Produto com estoque baixo gera sugestão de compra automática. Job diário verifica contas a vencer e envia notificação.

**Dependências externas:** Nenhuma (node-cron para jobs).

**Riscos e mitigação:**
| Risco | Mitigação |
|---|---|
| node-cron para se server cair | Job externo (cron do SO) como fallback |
| Sugestão de compra imprecisa | Admin aprova/rejeta antes de criar compra |

**Definition of Done:**
- [ ] Busca fuzzy encontra produtos com typos
- [ ] Busca por sinônimos funciona
- [ ] Auto-reposição gera sugestões corretas
- [ ] Jobs executam nos horários configurados
- [ ] Backup automático do banco funciona
- [ ] Histórico de jobs visível

---

### Sprint 12 — "Polimento Final" (Performance + UX + Hardening)

**Duração:** 5 dias
**Objetivo:** Otimizar performance, corrigir bugs acumulados, melhorar UX e preparar para produção.

**Funcionalidades entregues:**
- Otimização de queries SQL (índices, EXPLAIN)
- Cache de respostas frequentes (produtos, categorias)
- Compressão gzip no Express
- Lazy loading de imagens no frontend
- Paginação em todas as listas longas
- Skeleton loaders no frontend
- Tratamento de erros global (frontend + backend)
- Validação de inputs com Joi/Zod
- Helmet + CORS configurados para produção
- Variáveis de ambiente (.env) para todas as configs
- Script de deploy automatizado
- Documentação API (OpenAPI/Swagger básico)
- Testes de integração críticos
- Checklist de go-live

**Entregável testável:** Sistema roda com `NODE_ENV=production`. Todas as páginas carregam em <2s. Erros são tratados graciosamente. Deploy via script único.

**Dependências externas:** Nenhuma.

**Riscos e mitigação:**
| Risco | Mitigação |
|---|---|
| Regressão em funcionalidades existentes | Testar cada fluxo do README.md |
| Performance piora com dados reais | Profiling antes e depois; rollback se necessário |

**Definition of Done:**
- [ ] Todas as páginas carregam em <2s
- [ ] Zero erros não tratados no console
- [ ] Helmet + CORS + rate limiting ativos
- [ ] .env com todas as configurações
- [ ] Script de deploy funciona
- [ ] Testes de integração passam
- [ ] Documentação API gerada

---

## 4. MATRIZ DE DEPENDÊNCIAS

```
Sprint 1 (Auth) ─────────────────────────────────────────────────┐
    │                                                            │
    ├──→ Sprint 2 (Estoque) ──────────────────┐                  │
    │                                          │                  │
    ├──→ Sprint 3 (Pagamentos) ──┐             │                  │
    │                             │             │                  │
    ├──→ Sprint 4 (Área Cliente) ─┤             │                  │
    │                             │             │                  │
    │                             ↓             ↓                  │
    │                         Sprint 5 (Frete) ←───────────────────┘
    │                             │
    │                             ↓
    ├──→ Sprint 6 (WhatsApp + Imagens) ← depende de Auth (S1)
    │
    ├──→ Sprint 7 (NF-e + Cartão) ← depende de Pagamentos (S3) + Estoque (S2)
    │
    ├──→ Sprint 8 (Relatórios) ← depende de Estoque (S2) + Auth (S1)
    │
    ├──→ Sprint 9 (Fidelidade) ← depende de Área Cliente (S4) + Pagamentos (S3)
    │
    ├──→ Sprint 10 (Calculadora + PWA) ← independente (pode rodar em paralelo com S6-S9)
    │
    ├──→ Sprint 11 (Auto-Pilot) ← depende de Estoque (S2) + Auth (S1)
    │
    └──→ Sprint 12 (Polimento) ← depende de TODOS os anteriores
```

**Dependências críticas (ordem obrigatória):**
1. Sprint 1 → TODOS (auth é pré-requisito universal)
2. Sprint 2 → Sprint 7, Sprint 8, Sprint 11 (estoque alimenta relatórios, NF-e, auto-reposição)
3. Sprint 3 → Sprint 7, Sprint 9 (pagamentos alimenta NF-e, fidelidade)
4. Sprint 4 → Sprint 9 (área do cliente alimenta fidelidade)

**Pode rodar em paralelo (se houver equipe):**
- Sprint 10 (Calculadora + PWA) é independente e pode começar após Sprint 1

---

## 5. MÉTRICAS DE SUCESSO

| Métrica | Meta Sprint 4 | Meta Sprint 8 | Meta Sprint 12 | Como medir |
|---|---|---|---|---|
| Tempo de login | <2s | <2s | <1s | DevTools Network |
| Tempo de carregamento home | <3s | <2s | <1.5s | Lighthouse |
| Zero erros 500 em produção | — | — | 99.9% uptime | Logs do servidor |
| Pedidos com pagamento online | — | 50% | 80% | % orders com payment_status=paid |
| Estoque preciso (sistema vs físico) | — | 95% | 99% | Inventário periódico |
| NF-e emitidas sem erro | — | 90% | 98% | % fiscal_invoices com status=authorized |
| Clientes com conta ativa | — | 30% dos clientes | 60% | customer_accounts / customers |
| WhatsApp entregue com sucesso | — | 95% | 99% | whatsapp_messages.status=delivered |
| Lighthouse Performance score | — | >70 | >90 | `npx lighthouse` |
| Bugs críticos abertos | <5 | <3 | 0 | Issue tracker |

**Checkpoints de validação:**
- **Sprint 4:** Sistema tem auth, estoque, pagamentos, área do cliente funcionando. É um MVP vendável.
- **Sprint 8:** Sistema compete com players médios do mercado. Relatórios dão visibilidade total.
- **Sprint 12:** Sistema está pronto para produção em escala. Performance, segurança e UX polidos.

---

## 6. CHECKLIST DE VALIDAÇÃO POR SPRINT

### Sprint 1 — Auth
- [ ] Login com email/senha funciona
- [ ] Senha hash no banco (bcrypt)
- [ ] JWT access + refresh token
- [ ] Rate limiting no login (5/min)
- [ ] `/admin` bloqueado sem token
- [ ] Admin cria/remove usuários
- [ ] RoleGuard funciona (vendedor não vê financeiro)
- [ ] Audit log registra login/logout
- [ ] Token refresh automático antes de expirar
- [ ] Logout revoga token

### Sprint 2 — Estoque
- [ ] Movimentação de entrada incrementa stock
- [ ] Movimentação de saída valida stock > 0
- [ ] Pedido debita estoque automaticamente
- [ ] Reserva de estoque ao aprovar pedido
- [ ] Baixa de reserva ao entregar
- [ ] Compra recebida gera movimentação "in"
- [ ] Inventário registra diferença
- [ ] Ajuste manual exige justificativa
- [ ] Dashboard mostra stock_available
- [ ] Alertas de estoque baixo disparam
- [ ] Relatório CSV exporta corretamente

### Sprint 3 — Pagamentos (PIX)
- [ ] QR Code PIX gera no sandbox
- [ ] Código "copia e cola" funciona
- [ ] Timer de expiração (30 min)
- [ ] Webhook processa confirmação
- [ ] Polling fallback funciona
- [ ] Order → paid automaticamente
- [ ] Cash flow registra entrada
- [ ] Notificação de pagamento dispara
- [ ] Admin estorna pagamento
- [ ] Pagamento manual como fallback

### Sprint 4 — Área do Cliente
- [ ] Registro de cliente funciona
- [ ] Login de cliente separado de admin
- [ ] Dashboard do cliente carrega
- [ ] Histórico de pedidos completo
- [ ] Rastreamento de entrega visível
- [ ] Favoritos add/remove
- [ ] Endereços CRUD
- [ ] Reordenar preenche carrinho
- [ ] Perfil editável

### Sprint 5 — Frete
- [ ] Cálculo por CEP funciona
- [ ] Regiões com taxas diferentes
- [ ] Frete grátis acima do mínimo
- [ ] Frete aparece no checkout
- [ ] Cliente agenda entrega
- [ ] Admin confirma agendamento
- [ ] Frete registrado no pedido
- [ ] Regiões CRUD no admin

### Sprint 6 — WhatsApp + Imagens
- [ ] Template de pedido envia via WhatsApp
- [ ] Template de entrega envia
- [ ] Admin envia mensagem manual
- [ ] Log de mensagens visível
- [ ] Upload de imagem funciona
- [ ] Galeria de produto exibe
- [ ] Thumbnail gera automaticamente
- [ ] Imagem primária configurável
- [ ] Compressão de imagem funciona

### Sprint 7 — NF-e + Cartão
- [ ] NF-e emite com status autorizado
- [ ] DANFE download funciona
- [ ] Cancelamento com motivo
- [ ] Dados fiscais editáveis
- [ ] Cartão processa no sandbox
- [ ] Parcelamento até 12x
- [ ] Tokenização segura (sem dados no backend)
- [ ] NCM/CEST validados antes de emitir

### Sprint 8 — Relatórios
- [ ] Relatório de vendas com filtros
- [ ] Relatório financeiro (DRE)
- [ ] Curva ABC (Pareto)
- [ ] Relatório de clientes
- [ ] Relatório de estoque
- [ ] Export CSV funciona
- [ ] Export Excel funciona
- [ ] Gráficos com recharts
- [ ] Permissões granulares funcionam
- [ ] Audit log avançado visível

### Sprint 9 — Fidelidade
- [ ] Pontos acumulam por compra
- [ ] Resgate de pontos no checkout
- [ ] Pontos visíveis no dashboard
- [ ] Preço por cliente funciona
- [ ] Cupons por categoria
- [ ] Promoções por período
- [ ] Desconto PIX automático
- [ ] Regra de prioridade de descontos

### Sprint 10 — Calculadora + PWA
- [ ] 8 calculadoras funcionam
- [ ] Calculadoras adicionam ao carrinho
- [ ] PWA installável
- [ ] Manifest.json válido
- [ ] Service worker cacheia catálogo
- [ ] Funciona offline (catálogo)

### Sprint 11 — Auto-Pilot
- [ ] Busca fuzzy funciona
- [ ] Busca por sinônimos
- [ ] Auto-reposição gera sugestões
- [ ] Job de contas a vencer executa
- [ ] Job de estoque baixo executa
- [ ] Job de limpeza PIX expirados
- [ ] Backup automático do banco
- [ ] Histórico de jobs visível

### Sprint 12 — Polimento
- [ ] Lighthouse Performance >90
- [ ] Zero erros 500 não tratados
- [ ] Helmet + CORS ativos
- [ ] .env com todas as configs
- [ ] Script de deploy funciona
- [ ] Testes de integração passam
- [ ] Documentação API gerada
- [ ] Todas as funcionalidades dos sprints anteriores funcionando juntas

---

## 7. PLANO DE CONTINGÊNCIA

### Se um sprint atrasar

| Situação | Ação |
|---|---|
| Sprint atrasa 1-2 dias | Compensar no fim de semana; reduzir escopo do próximo sprint |
| Sprint atrasa 3+ dias | Cortar funcionalidades "nice to have" do sprint; manter o entregável mínimo |
| Sprint inteiro falha | Reavaliar estimativa; dividir em 2 sprints; comunicar stakeholders |

### Se uma integração externa falha

| Integração | Plano B |
|---|---|
| Mercado Pago indisponível | Pagamento manual no admin + PIX manual (copia e cola da conta) |
| WhatsApp API bloqueada | Notificações por email + SMS (Twilio) como fallback |
| FocusNFe indisponível | Emissão manual pelo sistema do governo + upload do XML |
| ngrok cai | Usar localtunnel ou Cloudflare Tunnel como alternativa |

### Se dados corrompem

| Cenário | Ação |
|---|---|
| sql.js corrompe | Backup diário automático (Sprint 11); restore do último backup |
| Migração falha | Script de rollback; backup pré-migração obrigatório |
| Estoque diverge | Inventário de emergência; ajuste manual com justificativa |

### Se performance degrada

| Sintoma | Ação |
|---|---|
| Queries lentas | Adicionar índices; EXPLAIN ANALYZE; cache de respostas |
| Frontend lento | Code splitting; lazy loading; reduzir bundle size |
| sql.js travando | Migrar para better-sqlite3 (drop-in replacement, 1 dia de trabalho) |

### Escalabilidade futura (pós-Sprint 12)

| Limitação atual | Solução futura |
|---|---|
| sql.js single-thread | Migrar para better-sqlite3 → PostgreSQL |
| Storage local de imagens | Migrar para S3/Cloud Storage |
| Sem CI/CD | GitHub Actions + deploy automático |
| Sem monitoramento | Sentry + Health checks + Uptime monitoring |
| Sem testes automatizados | Jest + Supertest + Playwright E2E |

---

## RESUMO EXECUTIVO

| Sprint | Nome | Dias | Entrega Principal |
|---|---|---|---|
| 1 | Portas Trancadas | 5 | Auth + Users + Permissões |
| 2 | Contagem Real | 5 | Estoque real + Movimentações |
| 3 | Pagamento na Mão | 6 | PIX + Checkout |
| 4 | Minha Guimarães | 5 | Área do Cliente |
| 5 | Frete Inteligente | 4 | Cálculo de Frete + Agendamento |
| 6 | Zap do Guimarães | 5 | WhatsApp + Imagens |
| 7 | NF-e e Notas | 6 | Emissão Fiscal + Cartão |
| 8 | Visão Geral | 5 | Relatórios + Permissões Granulares |
| 9 | Fidelidade e Promoções | 4 | Pontos + Preços por Cliente |
| 10 | Calculadora e PWA | 5 | 8 Calculadoras + App Instalável |
| 11 | Auto-Pilot | 4 | Busca Fuzzy + Auto-reposição + Jobs |
| 12 | Polimento Final | 5 | Performance + Hardening + Deploy |
| **TOTAL** | | **59 dias** | **Plataforma completa** |

> **59 dias úteis ≈ 12 semanas ≈ 3 meses** com 1 pessoa full-time.
> Com 2 pessoas, sprints independentes (ex: S10 pode rodar em paralelo) reduzem para ~10 semanas.
