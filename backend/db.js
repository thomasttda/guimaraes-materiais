const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'guimaraes.db');

let db = null;
let SQL = null;

async function initDb() {
  SQL = await initSqlJs();

  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  // Tabelas existentes
  db.run(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL,
      unit TEXT DEFAULT 'UND',
      category TEXT NOT NULL,
      image TEXT,
      featured INTEGER DEFAULT 0,
      stock INTEGER DEFAULT 0,
      min_stock INTEGER DEFAULT 10,
      supplier_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS quotes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_name TEXT NOT NULL,
      customer_email TEXT,
      customer_phone TEXT NOT NULL,
      customer_address TEXT,
      items TEXT NOT NULL,
      message TEXT,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_name TEXT NOT NULL,
      customer_email TEXT,
      customer_phone TEXT NOT NULL,
      customer_address TEXT,
      items TEXT NOT NULL,
      total REAL NOT NULL,
      status TEXT DEFAULT 'pending',
      delivery_status TEXT DEFAULT 'preparing',
      delivery_date TEXT,
      delivery_notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS banners (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      subtitle TEXT,
      image TEXT,
      link TEXT,
      active INTEGER DEFAULT 1,
      order_index INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS app_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT UNIQUE NOT NULL,
      value TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // NOVAS TABELAS

  // Fluxo de Caixa
  db.run(`
    CREATE TABLE IF NOT EXISTS cash_flow (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
      category TEXT NOT NULL,
      description TEXT,
      amount REAL NOT NULL,
      payment_method TEXT DEFAULT 'cash',
      reference_id INTEGER,
      reference_type TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Contas a Pagar / Boletos
  db.run(`
    CREATE TABLE IF NOT EXISTS bills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      amount REAL NOT NULL,
      due_date TEXT NOT NULL,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'paid', 'overdue', 'cancelled')),
      reminder_days INTEGER DEFAULT 3,
      reminder_sent INTEGER DEFAULT 0,
      paid_date TEXT,
      payment_method TEXT,
      barcode TEXT,
      supplier TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Entregas
  db.run(`
    CREATE TABLE IF NOT EXISTS deliveries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      customer_name TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      customer_address TEXT NOT NULL,
      status TEXT DEFAULT 'preparing' CHECK(status IN ('preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled')),
      driver_name TEXT,
      driver_phone TEXT,
      estimated_date TEXT,
      delivered_date TEXT,
      notes TEXT,
      tracking_code TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Clientes
  db.run(`
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT NOT NULL,
      cpf TEXT,
      address TEXT,
      neighborhood TEXT,
      city TEXT,
      state TEXT,
      zip_code TEXT,
      notes TEXT,
      total_orders INTEGER DEFAULT 0,
      total_spent REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Notificações
  db.run(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL CHECK(type IN ('bill_reminder', 'order_status', 'stock_alert', 'general')),
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      read INTEGER DEFAULT 0,
      reference_id INTEGER,
      reference_type TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Cupons
  db.run(`
    CREATE TABLE IF NOT EXISTS coupons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      description TEXT,
      discount_type TEXT DEFAULT 'percentage' CHECK(discount_type IN ('percentage', 'fixed')),
      discount_value REAL NOT NULL,
      min_purchase REAL DEFAULT 0,
      max_uses INTEGER DEFAULT 0,
      used_count INTEGER DEFAULT 0,
      valid_from TEXT,
      valid_until TEXT,
      active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Fornecedores
  db.run(`
    CREATE TABLE IF NOT EXISTS suppliers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      contact_name TEXT,
      phone TEXT,
      email TEXT,
      address TEXT,
      cnpj TEXT,
      notes TEXT,
      active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Alertas de Estoque
  db.run(`
    CREATE TABLE IF NOT EXISTS stock_alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      product_name TEXT NOT NULL,
      current_stock INTEGER NOT NULL,
      min_stock INTEGER NOT NULL,
      acknowledged INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Entregadores / Motoristas
  db.run(`
    CREATE TABLE IF NOT EXISTS drivers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      username TEXT UNIQUE,
      phone TEXT NOT NULL,
      email TEXT,
      cpf TEXT,
      cnh TEXT,
      vehicle TEXT,
      license_plate TEXT,
      password TEXT DEFAULT '123456',
      active INTEGER DEFAULT 1,
      current_lat REAL,
      current_lng REAL,
      last_location_update DATETIME,
      total_deliveries INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Localizações em Tempo Real dos Entregadores
  db.run(`
    CREATE TABLE IF NOT EXISTS driver_locations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      driver_id INTEGER NOT NULL,
      delivery_id INTEGER,
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      accuracy REAL,
      speed REAL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Histórico de Atualizações de Entrega
  db.run(`
    CREATE TABLE IF NOT EXISTS delivery_updates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      delivery_id INTEGER NOT NULL,
      driver_id INTEGER NOT NULL,
      status TEXT NOT NULL,
      lat REAL,
      lng REAL,
      notes TEXT,
      photo_url TEXT,
      signature_url TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // ==================== NOVAS TABELAS DO APP MOTORISTA ====================

  // Bater Ponto (Entrada, Almoço, Retorno, Saída)
  db.run(`
    CREATE TABLE IF NOT EXISTS driver_timeclock (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      driver_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      entry_time TEXT,
      lunch_start TEXT,
      lunch_end TEXT,
      exit_time TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Checklist de pré-entrega (itens conferidos)
  db.run(`
    CREATE TABLE IF NOT EXISTS delivery_checklist (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      delivery_id INTEGER NOT NULL,
      driver_id INTEGER NOT NULL,
      item_name TEXT NOT NULL,
      item_quantity REAL NOT NULL,
      checked INTEGER DEFAULT 0,
      checked_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Log de Atividades do Motorista (ações, GPS, histórico completo)
  db.run(`
    CREATE TABLE IF NOT EXISTS driver_activity_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      driver_id INTEGER NOT NULL,
      action TEXT NOT NULL,
      description TEXT,
      details TEXT,
      lat REAL,
      lng REAL,
      address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Vincular entregas a motoristas (ignora se coluna já existe)
  try { db.run(`ALTER TABLE deliveries ADD COLUMN driver_id INTEGER`); } catch(e) {}
  try { db.run(`ALTER TABLE deliveries ADD COLUMN current_lat REAL`); } catch(e) {}
  try { db.run(`ALTER TABLE deliveries ADD COLUMN current_lng REAL`); } catch(e) {}
  try { db.run(`ALTER TABLE deliveries ADD COLUMN last_update DATETIME`); } catch(e) {}
  try { db.run(`ALTER TABLE deliveries ADD COLUMN observation TEXT DEFAULT ''`); } catch(e) {}
  try { db.run(`ALTER TABLE deliveries ADD COLUMN route_order INTEGER DEFAULT 0`); } catch(e) {}

  // Notas (Orçamentos e Vendas)
  db.run(`
    CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL CHECK(type IN ('quote', 'sale')),
      number TEXT UNIQUE NOT NULL,
      customer_name TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      customer_email TEXT,
      customer_address TEXT,
      customer_cpf TEXT,
      attendant_name TEXT,
      items TEXT NOT NULL,
      subtotal REAL NOT NULL,
      discount REAL DEFAULT 0,
      discount_type TEXT DEFAULT 'fixed',
      total REAL NOT NULL,
      observations TEXT,
      status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'sent', 'approved', 'completed', 'cancelled')),
      pdf_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Seed products
  const productCount = db.exec('SELECT COUNT(*) as count FROM products');
  if (!productCount.length || productCount[0].values[0][0] === 0) {
    const seedProducts = [
      ['Argamassa ACII - Votorantim', 'Argamassa colante para pisos e paredes internas e externas', 33.99, 'UND', 'Argamassas', 1, 150, 20],
      ['Argamassa ACIII Flexivel - Votorantim', 'Argamassa colante flexivel para areas internas e externas', 47.99, 'UND', 'Argamassas', 1, 120, 20],
      ['Cimento CP II 50kg', 'Cimento Portland composto para uso geral', 38.90, 'SACO', 'Cimento', 1, 200, 30],
      ['Areia Media 20kg', 'Areia media lavada para construcao', 12.50, 'SACO', 'Areia e Brita', 0, 300, 50],
      ['Brita 1 20kg', 'Brita numero 1 para concreto e fundacao', 14.90, 'SACO', 'Areia e Brita', 0, 250, 50],
      ['Tijolo Ceramic 9x19x19', 'Tijolo ceramic para alvenaria', 0.85, 'UND', 'Tijolos', 0, 5000, 500],
      ['Bloco de Concreto 14x19x39', 'Bloco de concreto estrutural', 3.50, 'UND', 'Tijolos', 0, 2000, 200],
      ['Tinta Acrilica Premium 18L', 'Tinta acrilica para paredes internas e externas', 189.90, 'LAT', 'Tintas', 1, 80, 10],
      ['Massa Corrida 25kg', 'Massa corrida para acabamento de paredes', 45.00, 'SACO', 'Tintas', 0, 100, 15],
      ['Rejunte Flexivel 1kg', 'Rejunte flexivel para pisos e azulejos', 12.90, 'UND', 'Rejuntes', 0, 200, 30],
      ['Impermeabilizante 18L', 'Impermeabilizante acrilico para lajes e paredes', 159.90, 'BAL', 'Impermeabilizantes', 1, 60, 10],
      ['Vergalhao CA-50 3/8 12m', 'Vergalhao de aco CA-50 para concreto armado', 42.90, 'BAR', 'Ferro e Aco', 0, 500, 50],
      ['Tela Soldada 15x15 2.5mm', 'Tela soldada para lajes e muros', 89.90, 'UND', 'Ferro e Aco', 0, 100, 10],
      ['Tubo PVC Esgoto 100mm 6m', 'Tubo de PVC para esgoto', 52.00, 'BAR', 'Hidraulica', 0, 150, 20],
      ['Tubo PVC Agua 25mm 6m', 'Tubo de PVC para agua fria', 18.90, 'BAR', 'Hidraulica', 0, 200, 30],
      ['Fio Eletrico 2.5mm 100m', 'Fio eletrico flexivel para instalacoes', 189.00, 'ROL', 'Eletrica', 0, 80, 10],
      ['Disjuntor 20A', 'Disjuntor termomagnetico monofasico', 15.90, 'UND', 'Eletrica', 0, 300, 50],
      ['Porta de Madeira Interna', 'Porta de madeira para uso interno', 189.00, 'UND', 'Portas e Janelas', 0, 40, 5],
      ['Janela de Aluminio 100x120', 'Janela de aluminio com vidro', 349.00, 'UND', 'Portas e Janelas', 0, 25, 5],
      ['Piso Ceramic 60x60', 'Piso ceramic para salas e quartos', 45.90, 'M2', 'Pisos', 1, 500, 50],
    ];

    const stmt = db.prepare('INSERT INTO products (name, description, price, unit, category, featured, stock, min_stock) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
    seedProducts.forEach(p => stmt.run(p));
    stmt.free();
  }

  // Seed banners
  const bannerCount = db.exec('SELECT COUNT(*) FROM banners');
  if (!bannerCount.length || bannerCount[0].values[0][0] === 0) {
    db.run(`INSERT INTO banners (title, subtitle, active, order_index) VALUES
      ('Oferta de Maio', 'Confira nossas promocoes especiais', 1, 1),
      ('Toda Linha Votomassa', 'Encontre na Guimaraes Materiais para Construcao', 1, 2)
    `);
  }

  // Seed settings
  const settingsCount = db.exec('SELECT COUNT(*) FROM app_settings');
  if (!settingsCount.length || settingsCount[0].values[0][0] === 0) {
    db.run(`INSERT INTO app_settings (key, value) VALUES
      ('store_name', 'Guimaraes Materiais para Construcao'),
      ('store_phone', '(00) 0000-0000'),
      ('store_address', 'Rua Exemplo, 123 - Centro'),
      ('store_hours', 'Seg-Sex: 7h-18h | Sab: 7h-13h'),
      ('whatsapp_number', '5500000000000'),
      ('store_email', 'contato@guimaraesmateriais.com.br')
    `);
  }

  // Seed coupons
  const couponCount = db.exec('SELECT COUNT(*) FROM coupons');
  if (!couponCount.length || couponCount[0].values[0][0] === 0) {
    db.run(`INSERT INTO coupons (code, description, discount_type, discount_value, min_purchase, max_uses, valid_until, active) VALUES
      ('PROMO10', '10% de desconto na primeira compra', 'percentage', 10, 100, 100, '2026-12-31', 1),
      ('FRETEGRATIS', 'Frete grátis acima de R$200', 'fixed', 0, 200, 50, '2026-12-31', 1)
    `);
  }

  // Seed suppliers
  const supplierCount = db.exec('SELECT COUNT(*) FROM suppliers');
  if (!supplierCount.length || supplierCount[0].values[0][0] === 0) {
    db.run(`INSERT INTO suppliers (name, contact_name, phone, email, active) VALUES
      ('Votorantim Cimentos', 'João Silva', '(11) 3000-1000', 'vendas@votorantim.com', 1),
      ('Distribuidora ABC', 'Maria Santos', '(11) 3000-2000', 'contato@abc.com', 1),
      ('Ferreira Materiais', 'Carlos Oliveira', '(11) 3000-3000', 'vendas@ferreira.com', 1)
    `);
  }

  // Seed sample cash flow
  const cashCount = db.exec('SELECT COUNT(*) FROM cash_flow');
  if (!cashCount.length || cashCount[0].values[0][0] === 0) {
    const today = new Date().toISOString().split('T')[0];
    db.run(`INSERT INTO cash_flow (type, category, description, amount, payment_method) VALUES
      ('income', 'vendas', 'Venda #1001 - Argamassas', 1500.00, 'pix'),
      ('income', 'vendas', 'Venda #1002 - Tintas', 890.50, 'card'),
      ('income', 'vendas', 'Venda #1003 - Ferragens', 2340.00, 'cash'),
      ('expense', 'fornecedores', 'Compra Votorantim - Argamassas', 3500.00, 'boleto'),
      ('expense', 'fornecedores', 'Compra Distribuidora ABC - Tintas', 1200.00, 'pix'),
      ('expense', 'aluguel', 'Aluguel do ponto comercial', 2500.00, 'boleto'),
      ('expense', 'funcionarios', 'Folha de pagamento', 4500.00, 'transfer'),
      ('expense', 'energia', 'Conta de energia', 450.00, 'boleto'),
      ('income', 'vendas', 'Venda #1004 - Hidraulica', 670.00, 'pix'),
      ('income', 'vendas', 'Venda #1005 - Eletrica', 1230.00, 'card')
    `);
  }

  // Seed sample bills
  const billsCount = db.exec('SELECT COUNT(*) FROM bills');
  if (!billsCount.length || billsCount[0].values[0][0] === 0) {
    const today = new Date();
    const due1 = new Date(today.getTime() + 5 * 86400000).toISOString().split('T')[0];
    const due2 = new Date(today.getTime() + 15 * 86400000).toISOString().split('T')[0];
    const due3 = new Date(today.getTime() + 30 * 86400000).toISOString().split('T')[0];
    db.run(`INSERT INTO bills (title, description, amount, due_date, status, reminder_days, supplier) VALUES
      ('Aluguel Junho', 'Aluguel do ponto comercial', 2500.00, '${due1}', 'pending', 3, 'Imobiliaria XYZ'),
      ('Energia Eletrica', 'Conta de luz - Maio', 450.00, '${due2}', 'pending', 5, 'Companhia Energetica'),
      ('Fornecedor Votorantim', 'Boleto fornecedor argamassas', 3500.00, '${due3}', 'pending', 7, 'Votorantim Cimentos'),
      ('Agua e Esgoto', 'Conta de agua', 180.00, '${due1}', 'pending', 3, 'SABESP'),
      ('Internet', 'Mensalidade internet', 150.00, '${due2}', 'pending', 5, ' provedor local')
    `);
  }

  // Seed sample deliveries
  const deliveryCount = db.exec('SELECT COUNT(*) FROM deliveries');
  if (!deliveryCount.length || deliveryCount[0].values[0][0] === 0) {
    db.run(`INSERT INTO deliveries (order_id, customer_name, customer_phone, customer_address, status, estimated_date) VALUES
      (1, 'João da Silva', '(11) 99999-1111', 'Rua das Flores, 123 - Centro', 'out_for_delivery', '2026-05-22'),
      (2, 'Maria Oliveira', '(11) 99999-2222', 'Av. Brasil, 456 - Jardim', 'preparing', '2026-05-23'),
      (3, 'Carlos Santos', '(11) 99999-3333', 'Rua São Paulo, 789 - Vila Nova', 'delivered', '2026-05-20')
    `);
  }

  // Seed sample customers
  const customerCount = db.exec('SELECT COUNT(*) FROM customers');
  if (!customerCount.length || customerCount[0].values[0][0] === 0) {
    db.run(`INSERT INTO customers (name, email, phone, address, neighborhood, city, state, total_orders, total_spent) VALUES
      ('João da Silva', 'joao@email.com', '(11) 99999-1111', 'Rua das Flores, 123', 'Centro', 'São Paulo', 'SP', 5, 2500.00),
      ('Maria Oliveira', 'maria@email.com', '(11) 99999-2222', 'Av. Brasil, 456', 'Jardim América', 'São Paulo', 'SP', 3, 1800.00),
      ('Carlos Santos', 'carlos@email.com', '(11) 99999-3333', 'Rua São Paulo, 789', 'Vila Nova', 'Guarulhos', 'SP', 8, 4200.00),
      ('Ana Costa', 'ana@email.com', '(11) 99999-4444', 'Rua Minas Gerais, 321', 'Centro', 'Osasco', 'SP', 2, 950.00),
      ('Pedro Lima', 'pedro@email.com', '(11) 99999-5555', 'Av. Paulista, 1000', 'Bela Vista', 'São Paulo', 'SP', 12, 7800.00)
    `);
  }

  // Add username column if missing (for databases created before this column existed)
  try { db.run(`ALTER TABLE drivers ADD COLUMN username TEXT`); } catch(e) { /* column already exists */ }

  // Seed sample drivers
  const driverCount = db.exec('SELECT COUNT(*) FROM drivers');
  if (!driverCount.length || driverCount[0].values[0][0] === 0) {
    db.run(`INSERT INTO drivers (name, username, phone, email, cpf, cnh, vehicle, license_plate, password, active, current_lat, current_lng) VALUES
      ('Thiago Guimarães', 'thiago.motorista', '(73) 98877-4455', 'thiago.guimaraes@email.com', '123.456.789-00', '12345678901', 'Ford F700', 'ABC-1D23', 'thiago.guimaraes', 1, -14.7889, -39.0465),
      ('Thiago Gordo', 'thiago.gordo', '(73) 98877-4456', 'thiago.gordo@email.com', '987.654.321-00', '98765432109', 'Caçamba', 'DEF-4E56', 'thiago.guimaraes', 1, -14.7920, -39.0510)
    `);
  } else {
    // Update existing drivers
    db.run(`UPDATE drivers SET name = 'Thiago Guimarães', username = 'thiago.motorista', phone = '(73) 98877-4455', email = 'thiago.guimaraes@email.com', vehicle = 'Ford F700', license_plate = 'ABC-1D23', password = 'thiago.guimaraes', current_lat = -14.7889, current_lng = -39.0465 WHERE id = 1`);
    db.run(`UPDATE drivers SET name = 'Thiago Gordo', username = 'thiago.gordo', phone = '(73) 98877-4456', email = 'thiago.gordo@email.com', vehicle = 'Caçamba', license_plate = 'DEF-4E56', password = 'thiago.guimaraes', current_lat = -14.7920, current_lng = -39.0510 WHERE id = 2`);
    db.run(`DELETE FROM drivers WHERE id > 2`);
  }

  saveDb();
  console.log('Banco de dados inicializado com sucesso!');
}

function saveDb() {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
  }
}

function rowToObject(columns, values) {
  const obj = {};
  columns.forEach((col, i) => { obj[col] = values[i]; });
  return obj;
}

function queryAll(sql, params = []) {
  const stmt = db.prepare(sql);
  if (params.length) stmt.bind(params);
  const results = [];
  while (stmt.step()) {
    results.push(rowToObject(stmt.getColumnNames(), stmt.get()));
  }
  stmt.free();
  return results;
}

function queryOne(sql, params = []) {
  const results = queryAll(sql, params);
  return results[0] || null;
}

function run(sql, params = []) {
  const stmt = db.prepare(sql);
  if (params.length) stmt.bind(params);
  stmt.step();
  const changes = db.getRowsModified();
  const lastId = queryOne('SELECT last_insert_rowid() as id').id;
  stmt.free();
  saveDb();
  return { lastInsertRowid: lastId, changes };
}

module.exports = { initDb, queryAll, queryOne, run, saveDb };
