const express = require('express');
require('express-async-errors');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const PDFDocument = require('pdfkit');
const { supabase, queryAll, queryOne, insert, update, remove } = require('./supabase-db');
const logoBase64 = require('./logo-b64');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'guimaraes-jwt-secret-2026';

app.use(cors());
app.use(express.json());

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.message || err);
  console.error('Stack:', err.stack);
  if (err.details) console.error('Details:', err.details);
  res.status(500).json({ error: 'Erro interno do servidor', detail: err.message });
});

function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: 'Token não fornecido' });
  try {
    req.admin = jwt.verify(header.replace('Bearer ', ''), JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido' });
  }
}

// ==================== ADMIN LOGIN ====================

app.post('/api/admin/login', async (req, res) => {
  const { email, password } = req.body;
  const admin = await queryOne('admin_users', { where: [{ field: 'email', value: email }, { field: 'password', value: password }, { field: 'active', value: 1 }] });
  if (!admin) return res.status(401).json({ error: 'Email ou senha inválidos' });
  const token = jwt.sign({ id: admin.id, name: admin.name, email: admin.email, role: admin.role }, JWT_SECRET, { expiresIn: '24h' });
  res.json({ token, name: admin.name, email: admin.email, role: admin.role });
});

app.get('/api/admin/me', authMiddleware, (req, res) => {
  res.json(req.admin);
});

// ==================== PRODUCTS ====================

app.get('/api/products', async (req, res) => {
  const { category, featured, search } = req.query;
  let query = supabase.from('products').select('*').order('featured', { ascending: false }).order('name', { ascending: true });
  if (category) query = query.eq('category', category);
  if (featured === 'true') query = query.eq('featured', 1);
  if (search) query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
  const { data: products, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  // Enrich with supplier name
  const enriched = await Promise.all(products.map(async (p) => {
    if (p.supplier_id) {
      const { data: sup } = await supabase.from('suppliers').select('name').eq('id', p.supplier_id).single();
      return { ...p, supplier_name: sup?.name || null };
    }
    return { ...p, supplier_name: null };
  }));
  res.json(enriched);
});

app.get('/api/products/:id', async (req, res) => {
  const product = await queryOne('products', { where: [{ field: 'id', value: req.params.id }] });
  if (!product) return res.status(404).json({ error: 'Produto não encontrado' });
  res.json(product);
});

app.get('/api/categories', async (req, res) => {
  const products = await queryAll('products', { select: 'category', order: { field: 'category' } });
  const cats = [...new Set(products.map(p => p.category))];
  res.json(cats);
});

app.post('/api/products', async (req, res) => {
  const { name, description, price, unit, category, image, featured, stock, min_stock, supplier_id } = req.body;
  const data = await insert('products', {
    name, description, price, unit, category, image: image || '',
    featured: featured ? 1 : 0, stock: stock || 0, min_stock: min_stock || 10, supplier_id: supplier_id || null
  });
  res.status(201).json(data[0]);
});

app.put('/api/products/:id', async (req, res) => {
  const { name, description, price, unit, category, image, featured, stock, min_stock, supplier_id } = req.body;
  const data = await update('products', {
    name, description, price, unit, category, image: image || '',
    featured: featured ? 1 : 0, stock: stock || 0, min_stock: min_stock || 10, supplier_id: supplier_id || null
  }, 'id', req.params.id);
  if (!data.length) return res.status(404).json({ error: 'Produto não encontrado' });
  res.json(data[0]);
});

app.delete('/api/products/:id', async (req, res) => {
  await remove('products', 'id', req.params.id);
  res.json({ message: 'Produto removido com sucesso' });
});

// ==================== QUOTES ====================

app.post('/api/quotes', async (req, res) => {
  const { customer_name, customer_email, customer_phone, customer_address, items, message } = req.body;
  const data = await insert('quotes', {
    customer_name, customer_email, customer_phone, customer_address,
    items: JSON.stringify(items), message: message || ''
  });
  res.status(201).json(data[0]);
});

app.get('/api/quotes', async (req, res) => {
  const data = await queryAll('quotes', { order: { field: 'created_at', ascending: false } });
  res.json(data);
});

app.put('/api/quotes/:id', async (req, res) => {
  const { status } = req.body;
  const data = await update('quotes', { status }, 'id', req.params.id);
  if (!data.length) return res.status(404).json({ error: 'Orçamento não encontrado' });
  res.json(data[0]);
});

// ==================== ORDERS ====================

app.post('/api/orders', async (req, res) => {
  const { customer_name, customer_email, customer_phone, customer_address, items, total } = req.body;
  const orderData = await insert('orders', {
    customer_name, customer_email, customer_phone, customer_address,
    items: JSON.stringify(items), total
  });
  const orderId = orderData[0].id;
  await insert('deliveries', { order_id: orderId, customer_name, customer_phone, customer_address, status: 'preparing' });
  await insert('cash_flow', { type: 'income', category: 'vendas', description: `Pedido #${orderId}`, amount: total, payment_method: 'pending', reference_id: orderId, reference_type: 'order' });
  res.status(201).json(orderData[0]);
});

app.get('/api/orders', async (req, res) => {
  const data = await queryAll('orders', { order: { field: 'created_at', ascending: false } });
  res.json(data);
});

app.put('/api/orders/:id', async (req, res) => {
  const { status, delivery_status, delivery_date, delivery_notes } = req.body;
  const updates = {};
  if (status) updates.status = status;
  if (delivery_status) updates.delivery_status = delivery_status;
  if (delivery_date) updates.delivery_date = delivery_date;
  if (delivery_notes) updates.delivery_notes = delivery_notes;
  const data = await update('orders', updates, 'id', req.params.id);
  if (!data.length) return res.status(404).json({ error: 'Pedido não encontrado' });
  res.json(data[0]);
});

// ==================== DELIVERIES ====================

app.get('/api/deliveries', async (req, res) => {
  const { status } = req.query;
  let query = supabase.from('deliveries').select('*').order('created_at', { ascending: false });
  if (status) query = query.eq('status', status);
  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  // Enrich with driver info
  const enriched = await Promise.all(data.map(async (d) => {
    if (d.driver_id) {
      const { data: drv } = await supabase.from('drivers').select('vehicle, license_plate').eq('id', d.driver_id).single();
      return { ...d, vehicle: drv?.vehicle || null, license_plate: drv?.license_plate || null };
    }
    return { ...d, vehicle: null, license_plate: null };
  }));
  res.json(enriched);
});

app.get('/api/deliveries/:id', async (req, res) => {
  const { data: delivery, error } = await supabase.from('deliveries').select('*').eq('id', req.params.id).single();
  if (error || !delivery) return res.status(404).json({ error: 'Entrega não encontrada' });
  if (delivery.order_id) {
    const { data: order } = await supabase.from('orders').select('items, total').eq('id', delivery.order_id).single();
    delivery.items = order?.items || [];
    delivery.total = order?.total || 0;
  }
  res.json(delivery);
});

app.put('/api/deliveries/:id', async (req, res) => {
  const { status, driver_name, driver_phone, estimated_date, notes, tracking_code } = req.body;
  const updates = {};
  if (status) updates.status = status;
  if (driver_name) updates.driver_name = driver_name;
  if (driver_phone) updates.driver_phone = driver_phone;
  if (estimated_date) updates.estimated_date = estimated_date;
  if (notes) updates.notes = notes;
  if (tracking_code) updates.tracking_code = tracking_code;
  if (status === 'delivered') updates.delivered_date = new Date().toISOString();
  const data = await update('deliveries', updates, 'id', req.params.id);
  if (!data.length) return res.status(404).json({ error: 'Entrega não encontrada' });

  const statusMessages = {
    preparing: 'Seu pedido está sendo preparado',
    ready: 'Seu pedido está pronto para entrega',
    out_for_delivery: 'Seu pedido saiu para entrega!',
    delivered: 'Seu pedido foi entregue com sucesso!',
  };
  if (status && statusMessages[status]) {
    await insert('notifications', { type: 'order_status', title: 'Atualização de Entrega', message: statusMessages[status], reference_id: parseInt(req.params.id), reference_type: 'delivery' });
  }
  res.json(data[0]);
});

// ==================== CASH FLOW ====================

app.get('/api/cash-flow', async (req, res) => {
  const { type, start_date, end_date } = req.query;
  const where = [];
  if (type) where.push({ field: 'type', value: type });
  if (start_date) where.push({ field: 'created_at', op: 'gte', value: start_date });
  if (end_date) where.push({ field: 'created_at', op: 'lte', value: end_date + ' 23:59:59' });
  const data = await queryAll('cash_flow', { where, order: { field: 'created_at', ascending: false } });
  res.json(data);
});

app.post('/api/cash-flow', async (req, res) => {
  const { type, category, description, amount, payment_method, reference_id, reference_type } = req.body;
  const data = await insert('cash_flow', { type, category, description, amount, payment_method: payment_method || 'cash', reference_id: reference_id || null, reference_type: reference_type || null });
  res.status(201).json(data[0]);
});

app.put('/api/cash-flow/:id', async (req, res) => {
  const { type, category, description, amount, payment_method } = req.body;
  const data = await update('cash_flow', { type, category, description, amount, payment_method }, 'id', req.params.id);
  if (!data.length) return res.status(404).json({ error: 'Registro não encontrado' });
  res.json(data[0]);
});

app.delete('/api/cash-flow/:id', async (req, res) => {
  await remove('cash_flow', 'id', req.params.id);
  res.json({ message: 'Registro removido' });
});

// ==================== BILLS ====================

app.get('/api/bills', async (req, res) => {
  const { status } = req.query;
  const where = [];
  if (status) where.push({ field: 'status', value: status });
  const data = await queryAll('bills', { where, order: { field: 'due_date', ascending: true } });
  res.json(data);
});

app.post('/api/bills', async (req, res) => {
  const { title, description, amount, due_date, reminder_days, supplier, barcode } = req.body;
  const data = await insert('bills', { title, description, amount, due_date, reminder_days: reminder_days || 3, supplier: supplier || '', barcode: barcode || '' });
  res.status(201).json(data[0]);
});

app.put('/api/bills/:id', async (req, res) => {
  const { title, description, amount, due_date, status, paid_date, payment_method, reminder_days, supplier } = req.body;
  const updates = {};
  if (title) updates.title = title;
  if (description) updates.description = description;
  if (amount) updates.amount = amount;
  if (due_date) updates.due_date = due_date;
  if (status) updates.status = status;
  if (paid_date) updates.paid_date = paid_date;
  if (payment_method) updates.payment_method = payment_method;
  if (reminder_days) updates.reminder_days = reminder_days;
  if (supplier) updates.supplier = supplier;
  const data = await update('bills', updates, 'id', req.params.id);
  if (!data.length) return res.status(404).json({ error: 'Conta não encontrada' });
  res.json(data[0]);
});

app.delete('/api/bills/:id', async (req, res) => {
  await remove('bills', 'id', req.params.id);
  res.json({ message: 'Conta removida' });
});

// ==================== CUSTOMERS ====================

app.get('/api/customers', async (req, res) => {
  const { search } = req.query;
  const where = [];
  if (search) where.push({ op: 'or', value: `name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%` });
  const data = await queryAll('customers', { where, order: { field: 'name', ascending: true } });
  res.json(data);
});

app.get('/api/customers/:id', async (req, res) => {
  const customer = await queryOne('customers', { where: [{ field: 'id', value: req.params.id }] });
  if (!customer) return res.status(404).json({ error: 'Cliente não encontrado' });
  const orders = await queryAll('orders', { where: [{ field: 'customer_phone', value: customer.phone }], order: { field: 'created_at', ascending: false } });
  customer.orders = orders;
  res.json(customer);
});

app.post('/api/customers', async (req, res) => {
  const { name, email, phone, cpf, address, neighborhood, city, state, zip_code, notes } = req.body;
  const data = await insert('customers', { name, email, phone, cpf, address, neighborhood, city, state, zip_code, notes: notes || '' });
  res.status(201).json(data[0]);
});

app.put('/api/customers/:id', async (req, res) => {
  const { name, email, phone, cpf, address, neighborhood, city, state, zip_code, notes } = req.body;
  const data = await update('customers', { name, email, phone, cpf, address, neighborhood, city, state, zip_code, notes }, 'id', req.params.id);
  if (!data.length) return res.status(404).json({ error: 'Cliente não encontrado' });
  res.json(data[0]);
});

app.delete('/api/customers/:id', async (req, res) => {
  await remove('customers', 'id', req.params.id);
  res.json({ message: 'Cliente removido' });
});

// ==================== DRIVERS ====================

app.post('/api/drivers/login', async (req, res) => {
  const { username, password } = req.body;
  const driver = await queryOne('drivers', { where: [{ field: 'username', value: username }, { field: 'password', value: password }, { field: 'active', value: 1 }] });
  if (!driver) return res.status(401).json({ error: 'Usuário ou senha inválidos' });
  res.json(driver);
});

app.get('/api/drivers', async (req, res) => {
  const { active } = req.query;
  const where = [];
  if (active === 'true') where.push({ field: 'active', value: 1 });
  const data = await queryAll('drivers', { where, order: { field: 'name', ascending: true } });
  res.json(data);
});

app.get('/api/drivers/:id', async (req, res) => {
  const driver = await queryOne('drivers', { where: [{ field: 'id', value: req.params.id }] });
  if (!driver) return res.status(404).json({ error: 'Entregador não encontrado' });
  const deliveries = await queryAll('deliveries', { where: [{ field: 'driver_id', value: req.params.id }], order: { field: 'created_at', ascending: false } });
  driver.deliveries = deliveries;
  const location = await queryOne('driver_locations', { where: [{ field: 'driver_id', value: req.params.id }], order: { field: 'timestamp', ascending: false } });
  driver.current_location = location;
  res.json(driver);
});

app.post('/api/drivers', async (req, res) => {
  const { name, username, phone, email, cpf, cnh, vehicle, license_plate, password } = req.body;
  const data = await insert('drivers', { name, username, phone, email, cpf, cnh, vehicle, license_plate, password: password || '123456' });
  res.status(201).json(data[0]);
});

app.put('/api/drivers/:id', async (req, res) => {
  const { name, username, phone, email, cpf, cnh, vehicle, license_plate, password, active } = req.body;
  const data = await update('drivers', { name, username, phone, email, cpf, cnh, vehicle, license_plate, password, active: active ? 1 : 0 }, 'id', req.params.id);
  if (!data.length) return res.status(404).json({ error: 'Entregador não encontrado' });
  res.json(data[0]);
});

app.delete('/api/drivers/:id', async (req, res) => {
  await remove('drivers', 'id', req.params.id);
  res.json({ message: 'Entregador removido' });
});

app.post('/api/drivers/:id/location', async (req, res) => {
  const { lat, lng, accuracy, speed, delivery_id } = req.body;
  await insert('driver_locations', { driver_id: req.params.id, delivery_id: delivery_id || null, lat, lng, accuracy: accuracy || 0, speed: speed || 0 });
  await update('drivers', { current_lat: lat, current_lng: lng }, 'id', req.params.id);
  if (delivery_id) {
    await update('deliveries', { current_lat: lat, current_lng: lng }, 'id', delivery_id);
  }
  res.json({ message: 'Localização atualizada', lat, lng });
});

app.get('/api/drivers/:id/location', async (req, res) => {
  const location = await queryOne('driver_locations', { where: [{ field: 'driver_id', value: req.params.id }], order: { field: 'timestamp', ascending: false } });
  res.json(location || { lat: null, lng: null });
});

app.get('/api/drivers/:id/locations', async (req, res) => {
  const { limit } = req.query;
  const data = await queryAll('driver_locations', { where: [{ field: 'driver_id', value: req.params.id }], order: { field: 'timestamp', ascending: false }, limit: parseInt(limit) || 50 });
  res.json(data);
});

app.get('/api/drivers/:id/deliveries', async (req, res) => {
  const { status } = req.query;
  let query = supabase.from('deliveries').select('*').eq('driver_id', req.params.id).order('created_at', { ascending: false });
  if (status) query = query.eq('status', status);
  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  const enriched = await Promise.all(data.map(async (d) => {
    if (d.order_id) {
      const { data: order } = await supabase.from('orders').select('total, items').eq('id', d.order_id).single();
      return { ...d, order_total: order?.total || null, items: order?.items || [] };
    }
    return { ...d, order_total: null, items: [] };
  }));
  res.json(enriched);
});

app.put('/api/deliveries/:id/assign', async (req, res) => {
  const { driver_id } = req.body;
  const driver = await queryOne('drivers', { where: [{ field: 'id', value: driver_id }] });
  if (!driver) return res.status(404).json({ error: 'Entregador não encontrado' });
  const data = await update('deliveries', { driver_id, driver_name: driver.name, driver_phone: driver.phone, status: 'ready' }, 'id', req.params.id);
  if (!data.length) return res.status(404).json({ error: 'Entrega não encontrada' });
  await insert('notifications', { type: 'order_status', title: 'Nova Entrega Atribuída', message: `Entrega #${req.params.id} atribuída ao motorista ${driver.name}`, reference_id: parseInt(req.params.id), reference_type: 'delivery' });
  res.json({ message: 'Entrega atribuída', driver_id });
});

app.post('/api/deliveries/:id/update-status', async (req, res) => {
  const { status, driver_id, lat, lng, notes, photo_url, signature_url } = req.body;
  const updates = { status };
  if (lat && lng) { updates.current_lat = lat; updates.current_lng = lng; }
  if (notes) updates.notes = notes;
  if (status === 'delivered') updates.delivered_date = new Date().toISOString();
  await update('deliveries', updates, 'id', req.params.id);
  await insert('delivery_updates', { delivery_id: req.params.id, driver_id, status, lat: lat || null, lng: lng || null, notes: notes || '', photo_url: photo_url || '', signature_url: signature_url || '' });
  if (status === 'delivered') {
    await supabase.rpc('increment_driver_deliveries', { driver_id });
  }
  const statusMessages = {
    preparing: 'Seu pedido está sendo preparado',
    ready: 'Seu pedido está pronto para entrega',
    out_for_delivery: 'Seu pedido saiu para entrega! Acompanhe em tempo real.',
    delivered: 'Seu pedido foi entregue com sucesso!',
  };
  if (statusMessages[status]) {
    await insert('notifications', { type: 'order_status', title: 'Atualização de Entrega', message: statusMessages[status], reference_id: parseInt(req.params.id), reference_type: 'delivery' });
  }
  const delivery = await queryOne('deliveries', { select: 'customer_name', where: [{ field: 'id', value: req.params.id }] });
  const customerName = delivery ? delivery.customer_name : `#${req.params.id}`;
  const actionLabel = { preparing: 'Preparando', ready: 'Pronto', out_for_delivery: 'Saiu para entrega', delivered: 'Entregue' };
  await insert('driver_activity_logs', { driver_id, action: `delivery.${status}`, description: `${actionLabel[status] || status} — ${customerName}`, details: JSON.stringify({ delivery_id: parseInt(req.params.id), status }), lat: lat || null, lng: lng || null });
  // GPS ping no momento da mudança de status
  if (lat && lng && status === 'out_for_delivery') {
    try { const address = await reverseGeocode(lat, lng); await insert('driver_activity_logs', { driver_id, action: 'gps.out_for_delivery', description: `Saiu para entrega — ${customerName} em ${address || `${lat.toFixed(4)}, ${lng.toFixed(4)}`}`, lat, lng, address: address || '' }); } catch {}
  }
  if (lat && lng && status === 'delivered') {
    try { const address = await reverseGeocode(lat, lng); await insert('driver_activity_logs', { driver_id, action: 'gps.delivered', description: `Entregue — ${customerName} em ${address || `${lat.toFixed(4)}, ${lng.toFixed(4)}`}`, lat, lng, address: address || '' }); } catch {}
  }
  res.json({ message: 'Status atualizado', status });
});

app.get('/api/deliveries/:id/updates', async (req, res) => {
  const { data, error } = await supabase.from('delivery_updates').select('*').eq('delivery_id', req.params.id).order('timestamp', { ascending: true });
  if (error) return res.status(500).json({ error: error.message });
  const enriched = await Promise.all(data.map(async (u) => {
    const { data: drv } = await supabase.from('drivers').select('name').eq('id', u.driver_id).single();
    return { ...u, driver_name: drv?.name || null };
  }));
  res.json(enriched);
});

// ==================== DRIVER TIMECLOCK ====================

app.post('/api/drivers/:id/timeclock', async (req, res) => {
  const { type } = req.body;
  const today = new Date().toISOString().split('T')[0];
  const now = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', hour12: false });
  const records = await queryAll('driver_timeclock', { where: [{ field: 'driver_id', value: req.params.id }, { field: 'date', value: today }] });
  let record = records[0] || null;
  if (!record) {
    if (type !== 'entry') return res.status(400).json({ error: 'Registre a entrada primeiro' });
    const data = await insert('driver_timeclock', { driver_id: req.params.id, date: today, entry_time: now });
    await insert('driver_activity_logs', { driver_id: req.params.id, action: 'timeclock.entry', description: `Entrada registrada às ${now}`, details: JSON.stringify({ date: today, time: now }) });
    return res.status(201).json(data[0]);
  }
  if (type === 'restart') {
    await remove('driver_timeclock', 'id', record.id);
    const data = await insert('driver_timeclock', { driver_id: req.params.id, date: today, entry_time: now });
    await insert('driver_activity_logs', { driver_id: req.params.id, action: 'timeclock.restart', description: `Jornada reiniciada às ${now}`, details: JSON.stringify({ date: today, time: now }) });
    return res.json(data[0]);
  }
  const fieldMap = { entry: 'entry_time', lunch_start: 'lunch_start', lunch_end: 'lunch_end', exit: 'exit_time' };
  const actionLabels = { entry: 'Entrada', lunch_start: 'Almoço', lunch_end: 'Retorno', exit: 'Saída' };
  if (record[fieldMap[type]]) return res.status(400).json({ error: 'Este registro já foi feito hoje' });
  const data = await update('driver_timeclock', { [fieldMap[type]]: now }, 'id', record.id);
  await insert('driver_activity_logs', { driver_id: req.params.id, action: `timeclock.${type}`, description: `${actionLabels[type]} registrada às ${now}`, details: JSON.stringify({ date: today, time: now }) });
  res.json(data[0]);
});

app.get('/api/drivers/:id/timeclock/today', async (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const record = await queryOne('driver_timeclock', { where: [{ field: 'driver_id', value: req.params.id }, { field: 'date', value: today }] });
  res.json(record || { date: today, entry_time: null, lunch_start: null, lunch_end: null, exit_time: null });
});

app.get('/api/drivers/:id/timeclock', async (req, res) => {
  const { limit } = req.query;
  const data = await queryAll('driver_timeclock', { where: [{ field: 'driver_id', value: req.params.id }], order: { field: 'date', ascending: false }, limit: parseInt(limit) || 30 });
  res.json(data);
});

// ==================== DRIVER ACTIVITY LOGS ====================

async function reverseGeocode(lat, lng) {
  try {
    const https = require('https');
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=pt`;
    return new Promise((resolve) => {
      https.get(url, { headers: { 'User-Agent': 'GuimaraesDriverApp/1.0' } }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try { const json = JSON.parse(data); resolve(json.display_name || 'Endereço não encontrado'); }
          catch { resolve(`${lat.toFixed(4)}, ${lng.toFixed(4)}`); }
        });
      }).on('error', () => resolve(`${lat.toFixed(4)}, ${lng.toFixed(4)}`));
    });
  } catch { return `${lat.toFixed(4)}, ${lng.toFixed(4)}`; }
}

app.post('/api/drivers/:id/activity-log', async (req, res) => {
  const { action, description, details, lat, lng, address } = req.body;
  let resolvedAddress = address || '';
  if (lat && lng && !resolvedAddress) resolvedAddress = await reverseGeocode(lat, lng);
  const data = await insert('driver_activity_logs', { driver_id: req.params.id, action, description: description || '', details: details ? JSON.stringify(details) : null, lat: lat || null, lng: lng || null, address: resolvedAddress });
  res.status(201).json(data[0]);
});

app.get('/api/drivers/:id/activity-logs', async (req, res) => {
  const { limit, action, start_date, end_date } = req.query;
  let query = supabase.from('driver_activity_logs').select('*').eq('driver_id', req.params.id).order('created_at', { ascending: false });
  if (action) query = query.eq('action', action);
  if (start_date) query = query.gte('created_at', start_date);
  if (end_date) query = query.lte('created_at', end_date + ' 23:59:59');
  if (limit) query = query.limit(parseInt(limit));
  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json((data || []).map(log => ({ ...log, details: log.details ? (typeof log.details === 'string' ? JSON.parse(log.details) : log.details) : null })));
});

app.post('/api/drivers/:id/gps-pulse', async (req, res) => {
  const { lat, lng, speed, movement, moved, was_moving } = req.body;
  const action = movement === 'driving' ? 'gps.driving' : 'gps.stopped';
  const address = await reverseGeocode(lat, lng);
  const movimentoInfo = moved ? ' (moveu desde último ping)' : ' (mesma localização)';
  const description = movement === 'driving'
    ? `Em movimento — ${address}`
    : `Parado — ${address}${movimentoInfo}`;
  const data = await insert('driver_activity_logs', { driver_id: req.params.id, action, description, lat, lng, address });
  await update('drivers', { current_lat: lat, current_lng: lng }, 'id', req.params.id);
  await insert('driver_locations', { driver_id: req.params.id, lat, lng, accuracy: 0, speed: speed || 0 });
  res.json(data[0]);
});

app.get('/api/drivers/:id/gps-stops', async (req, res) => {
  const data = await queryAll('driver_activity_logs', {
    where: [{ field: 'driver_id', value: req.params.id }, { field: 'action', value: 'gps.stopped' }],
    order: { field: 'created_at', ascending: false }, limit: 50
  });
  res.json(data);
});

// ==================== ADMIN - LOGS E MONITORAMENTO ====================

app.get('/api/admin/activity-logs', async (req, res) => {
  const { driver_id, action, start_date, end_date, limit } = req.query;
  let query = supabase.from('driver_activity_logs').select('*').order('created_at', { ascending: false });
  if (driver_id) query = query.eq('driver_id', driver_id);
  if (action) query = query.eq('action', action);
  if (start_date) query = query.gte('created_at', start_date);
  if (end_date) query = query.lte('created_at', end_date + ' 23:59:59');
  if (limit) query = query.limit(parseInt(limit));
  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  const enriched = await Promise.all(data.map(async (log) => {
    const { data: drv } = await supabase.from('drivers').select('name, vehicle, license_plate').eq('id', log.driver_id).single();
    return {
      ...log, driver_name: drv?.name || null, vehicle: drv?.vehicle || null, license_plate: drv?.license_plate || null,
      details: log.details ? (typeof log.details === 'string' ? JSON.parse(log.details) : log.details) : null
    };
  }));
  res.json(enriched);
});

app.get('/api/admin/drivers/summary', async (req, res) => {
  const drivers = await queryAll('drivers', { order: { field: 'name' } });
  const enriched = await Promise.all(drivers.map(async (d) => {
    const today = new Date().toISOString().split('T')[0];
    const tc = await queryOne('driver_timeclock', { where: [{ field: 'driver_id', value: d.id }, { field: 'date', value: today }] });
    const stopsToday = await queryAll('driver_activity_logs', {
      where: [
        { field: 'driver_id', value: d.id },
        { field: 'action', value: 'gps.stopped' },
        { field: 'created_at', op: 'gte', value: `${today}T00:00:00` }
      ]
    });
    const gpsHour = await queryAll('driver_activity_logs', {
      where: [
        { field: 'driver_id', value: d.id },
        { field: 'action', op: 'like', value: 'gps.%' },
        { field: 'created_at', op: 'gte', value: new Date(Date.now() - 3600000).toISOString() }
      ]
    });
    return {
      ...d, today_entry: tc?.entry_time || null, today_lunch_start: tc?.lunch_start || null,
      today_lunch_end: tc?.lunch_end || null, today_exit: tc?.exit_time || null,
      stops_today: stopsToday.length, gps_pulses_hour: gpsHour.length
    };
  }));
  res.json(enriched);
});

app.get('/api/admin/gps-stops', async (req, res) => {
  const { driver_id, start_date, end_date, limit } = req.query;
  let query = supabase.from('driver_activity_logs').select('*').eq('action', 'gps.stopped').order('created_at', { ascending: false });
  if (driver_id) query = query.eq('driver_id', driver_id);
  if (start_date) query = query.gte('created_at', start_date);
  if (end_date) query = query.lte('created_at', end_date + ' 23:59:59');
  if (limit) query = query.limit(parseInt(limit));
  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  const enriched = await Promise.all(data.map(async (s) => {
    const { data: drv } = await supabase.from('drivers').select('name, vehicle').eq('id', s.driver_id).single();
    return { ...s, driver_name: drv?.name || null, vehicle: drv?.vehicle || null };
  }));
  res.json(enriched);
});

// ==================== DELIVERY CHECKLIST ====================

app.get('/api/deliveries/:id/checklist', async (req, res) => {
  const { data: delivery, error } = await supabase.from('deliveries').select('*').eq('id', req.params.id).single();
  if (error || !delivery) return res.status(404).json({ error: 'Entrega não encontrada' });
  let { data: items } = await supabase.from('delivery_checklist').select('*').eq('delivery_id', req.params.id);
  if (!items || items.length === 0) {
    const { data: order } = await supabase.from('orders').select('items').eq('id', delivery.order_id).single();
    if (order?.items) {
      const orderItems = Array.isArray(order.items) ? order.items : (typeof order.items === 'string' ? JSON.parse(order.items) : []);
      for (const item of orderItems) {
        await supabase.from('delivery_checklist').insert({ delivery_id: parseInt(req.params.id), driver_id: delivery.driver_id || 0, item_name: item.name, item_quantity: item.quantity || 1 });
      }
      const { data: newItems } = await supabase.from('delivery_checklist').select('*').eq('delivery_id', req.params.id);
      items = newItems || [];
    }
  }
  res.json({ delivery_id: parseInt(req.params.id), items: items || [] });
});

app.put('/api/deliveries/:id/checklist/:itemId', async (req, res) => {
  const { checked, driver_id } = req.body;
  const now = checked ? new Date().toISOString() : null;
  await update('delivery_checklist', { checked: checked ? 1 : 0, checked_at: now }, 'id', req.params.itemId);
  const item = await queryOne('delivery_checklist', { select: 'item_name', where: [{ field: 'id', value: req.params.itemId }] });
  if (item && driver_id) {
    await insert('driver_activity_logs', { driver_id, action: 'delivery.checklist', description: checked ? `Conferido: ${item.item_name}` : `Desmarcado: ${item.item_name}`, details: JSON.stringify({ delivery_id: parseInt(req.params.id), item: item.item_name, checked: !!checked }) });
  }
  res.json({ id: parseInt(req.params.itemId), checked: !!checked });
});

app.put('/api/deliveries/:id/observation', async (req, res) => {
  const { observation, driver_id } = req.body;
  await update('deliveries', { observation }, 'id', req.params.id);
  if (driver_id && observation) {
    await insert('driver_activity_logs', { driver_id, action: 'delivery.observation', description: 'Observação salva', details: JSON.stringify({ delivery_id: parseInt(req.params.id), observation }) });
  }
  res.json({ message: 'Observação salva' });
});

// ==================== ROTA ====================

app.put('/api/drivers/:id/route-order', async (req, res) => {
  const { delivery_ids } = req.body;
  for (let i = 0; i < delivery_ids.length; i++) {
    await update('deliveries', { route_order: i }, 'id', delivery_ids[i]);
  }
  res.json({ message: 'Rota atualizada' });
});

// ==================== ADMIN MONITORING ====================

app.get('/api/admin/drivers/map', async (req, res) => {
  const { data: drivers } = await supabase.from('drivers').select('*').eq('active', 1);
  const enriched = await Promise.all((drivers || []).map(async (d) => {
    const { data: loc } = await supabase.from('driver_locations').select('lat, lng, timestamp').eq('driver_id', d.id).order('timestamp', { ascending: false }).limit(1).single();
    const { count: activeDel } = await supabase.from('deliveries').select('*', { count: 'exact', head: true }).eq('driver_id', d.id).not('status', 'in', '("delivered","cancelled")');
    const today = new Date().toISOString().split('T')[0];
    const { data: tc } = await supabase.from('driver_timeclock').select('*').eq('driver_id', d.id).eq('date', today).single();
    return {
      ...d, current_lat: loc?.lat || d.current_lat, current_lng: loc?.lng || d.current_lng,
      last_location_update: loc?.timestamp || d.last_location_update,
      active_deliveries: activeDel || 0,
      today_entry: tc?.entry_time || null, today_lunch_start: tc?.lunch_start || null,
      today_lunch_end: tc?.lunch_end || null, today_exit: tc?.exit_time || null
    };
  }));
  res.json(enriched);
});

app.get('/api/drivers/:id/route', async (req, res) => {
  const { data, error } = await supabase.from('deliveries').select('*').eq('driver_id', req.params.id).order('route_order', { ascending: true }).order('created_at', { ascending: true });
  if (error) return res.status(500).json({ error: error.message });
  const enriched = await Promise.all(data.map(async (d) => {
    if (d.order_id) {
      const { data: order } = await supabase.from('orders').select('total, items').eq('id', d.order_id).single();
      return { ...d, order_total: order?.total || null, items: order?.items || [] };
    }
    return { ...d, order_total: null, items: [] };
  }));
  res.json(enriched);
});

app.get('/api/deliveries/:id/track', async (req, res) => {
  const { data: delivery, error } = await supabase.from('deliveries').select('*').eq('id', req.params.id).single();
  if (error || !delivery) return res.status(404).json({ error: 'Entrega não encontrada' });
  if (delivery.order_id) {
    const { data: order } = await supabase.from('orders').select('items, total').eq('id', delivery.order_id).single();
    delivery.items = order?.items || [];
    delivery.total = order?.total || 0;
  }
  const { data: updates } = await supabase.from('delivery_updates').select('*').eq('delivery_id', req.params.id).order('timestamp', { ascending: true });
  const enrichedUpdates = await Promise.all((updates || []).map(async (u) => {
    const { data: drv } = await supabase.from('drivers').select('name, vehicle, license_plate').eq('id', u.driver_id).single();
    return { ...u, driver_name: drv?.name || null, vehicle: drv?.vehicle || null, license_plate: drv?.license_plate || null };
  }));
  delivery.updates = enrichedUpdates;
  if (delivery.driver_id) {
    const { data: dl } = await supabase.from('driver_locations').select('lat, lng, timestamp').eq('driver_id', delivery.driver_id).order('timestamp', { ascending: false }).limit(1).single();
    delivery.driver_location = dl || null;
  }
  res.json(delivery);
});

// ==================== NOTIFICATIONS ====================

app.get('/api/notifications', async (req, res) => {
  const { unread } = req.query;
  const where = unread === 'true' ? [{ field: 'read', value: 0 }] : [];
  const data = await queryAll('notifications', { where, order: { field: 'created_at', ascending: false }, limit: 50 });
  res.json(data);
});

app.put('/api/notifications/:id/read', async (req, res) => {
  await update('notifications', { read: 1 }, 'id', req.params.id);
  res.json({ message: 'Notificação marcada como lida' });
});

app.put('/api/notifications/read-all', async (req, res) => {
  await supabase.from('notifications').update({ read: 1 }).eq('read', 0);
  res.json({ message: 'Todas as notificações marcadas como lidas' });
});

// ==================== COUPONS ====================

app.get('/api/coupons', async (req, res) => {
  const { active } = req.query;
  const where = active === 'true' ? [{ field: 'active', value: 1 }] : [];
  const data = await queryAll('coupons', { where, order: { field: 'created_at', ascending: false } });
  res.json(data);
});

app.post('/api/coupons', async (req, res) => {
  const { code, description, discount_type, discount_value, min_purchase, max_uses, valid_from, valid_until } = req.body;
  const data = await insert('coupons', { code: code.toUpperCase(), description, discount_type, discount_value, min_purchase: min_purchase || 0, max_uses: max_uses || 0, valid_from, valid_until });
  res.status(201).json(data[0]);
});

app.put('/api/coupons/:id', async (req, res) => {
  const { code, description, discount_type, discount_value, min_purchase, max_uses, valid_from, valid_until, active } = req.body;
  const data = await update('coupons', { code: code.toUpperCase(), description, discount_type, discount_value, min_purchase, max_uses, valid_from, valid_until, active: active ? 1 : 0 }, 'id', req.params.id);
  if (!data.length) return res.status(404).json({ error: 'Cupom não encontrado' });
  res.json(data[0]);
});

app.delete('/api/coupons/:id', async (req, res) => {
  await remove('coupons', 'id', req.params.id);
  res.json({ message: 'Cupom removido' });
});

// ==================== SUPPLIERS ====================

app.get('/api/suppliers', async (req, res) => {
  const { active } = req.query;
  const where = active === 'true' ? [{ field: 'active', value: 1 }] : [];
  const data = await queryAll('suppliers', { where, order: { field: 'name', ascending: true } });
  res.json(data);
});

app.post('/api/suppliers', async (req, res) => {
  const { name, contact_name, phone, email, address, cnpj, notes } = req.body;
  const data = await insert('suppliers', { name, contact_name, phone, email, address, cnpj, notes: notes || '' });
  res.status(201).json(data[0]);
});

app.put('/api/suppliers/:id', async (req, res) => {
  const { name, contact_name, phone, email, address, cnpj, notes, active } = req.body;
  const data = await update('suppliers', { name, contact_name, phone, email, address, cnpj, notes, active: active ? 1 : 0 }, 'id', req.params.id);
  if (!data.length) return res.status(404).json({ error: 'Fornecedor não encontrado' });
  res.json(data[0]);
});

app.delete('/api/suppliers/:id', async (req, res) => {
  await remove('suppliers', 'id', req.params.id);
  res.json({ message: 'Fornecedor removido' });
});

// ==================== NOTES ====================

async function generateNoteNumber(type, customerName) {
  const prefix = type === 'quote' ? 'ORC' : 'VND';
  const year = new Date().getFullYear();
  const { count } = await supabase.from('notes').select('*', { count: 'exact', head: true }).eq('type', type);
  const num = (count || 0) + 1;
  const seq = `${prefix}-${year}-${String(num).padStart(4, '0')}`;
  if (!customerName) return seq;
  const name = customerName
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .substring(0, 30)
    .replace(/-+$/, '');
  if (!name) return seq;
  return `${seq}-${name}`;
}

app.get('/api/notes', async (req, res) => {
  const { type, status, customer_phone } = req.query;
  const where = [];
  if (type) where.push({ field: 'type', value: type });
  if (status) where.push({ field: 'status', value: status });
  if (customer_phone) where.push({ field: 'customer_phone', value: customer_phone });
  const data = await queryAll('notes', { where, order: { field: 'created_at', ascending: false } });
  res.json(data);
});

app.get('/api/notes/:id', async (req, res) => {
  const note = await queryOne('notes', { where: [{ field: 'id', value: req.params.id }] });
  if (!note) return res.status(404).json({ error: 'Nota não encontrada' });
  res.json(note);
});

app.post('/api/notes', async (req, res) => {
  const { type, customer_name, customer_phone, customer_email, customer_address, customer_cpf, attendant_name, items, subtotal, discount, discount_type, total, observations, payment_method } = req.body;
  const number = await generateNoteNumber(type, customer_name);
  const data = await insert('notes', { type, number, customer_name, customer_phone, customer_email: customer_email || '', customer_address: customer_address || '', customer_cpf: customer_cpf || '', attendant_name: attendant_name || '', items: items || [], subtotal, discount: discount || 0, discount_type: discount_type || 'fixed', total, observations: observations || '', payment_method: payment_method || '' });
  res.status(201).json(data[0]);
});

app.put('/api/notes/:id', async (req, res) => {
  const fields = ['type', 'customer_name', 'customer_phone', 'customer_email', 'customer_address', 'customer_cpf', 'attendant_name', 'subtotal', 'discount', 'discount_type', 'total', 'observations', 'status', 'payment_method'];
  const updates = {};
  for (const f of fields) {
    if (req.body[f] !== undefined) updates[f] = req.body[f];
  }
  if (req.body.items) updates.items = req.body.items;
  const data = await update('notes', updates, 'id', req.params.id);
  if (!data.length) return res.status(404).json({ error: 'Nota não encontrada' });
  res.json(data[0]);
});

app.delete('/api/notes/:id', async (req, res) => {
  await remove('notes', 'id', req.params.id);
  res.json({ message: 'Nota removida' });
});

// ==================== PDF ====================

app.get('/api/notes/:id/pdf', async (req, res) => {
  const note = await queryOne('notes', { where: [{ field: 'id', value: req.params.id }] });
  if (!note) return res.status(404).json({ error: 'Nota não encontrada' });

  const settingsArr = await queryAll('app_settings');
  const settings = {};
  settingsArr.forEach(s => { settings[s.key] = s.value; });

  const doc = new PDFDocument({ size: 'A4', margin: 40 });
  const items = typeof note.items === 'string' ? JSON.parse(note.items) : (note.items || []);

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${note.number}.pdf"`);
  doc.pipe(res);

  const storeName = settings.store_name || 'Guimaraes Materiais para Construcao';
  const storeCnpj = settings.store_cnpj || '51.803.643/0001-04';
  const storePhone = settings.store_phone || '(73) 99154-6335';
  const storeAddress = settings.store_address || 'Av. Beira Rio, Iguape, Ilhéus - BA (Frente a Igreja Católica) CEP - 45658-446';

  // Blue header background
  doc.rect(0, 0, 595, 120).fill('#1e40af');

  // Store info on the left
  doc.fillColor('#ffffff').fontSize(20).font('Helvetica-Bold').text(storeName, 40, 15);
  doc.fontSize(9).font('Helvetica').text('Materiais para Construcao', 40, 40);
  doc.fontSize(7).font('Helvetica').text(`CNPJ: ${storeCnpj}`, 40, 58);
  doc.text(`Tel: ${storePhone}`, 40, 70);
  doc.text(storeAddress, 40, 82, { width: 320 });

  // Logo on the right (with error protection)
  try { doc.image(Buffer.from(logoBase64, 'base64'), 420, 8, { width: 100, height: 70 }); } catch {}

  // Type label on the right, below the logo
  const typeLabel = note.type === 'quote' ? 'ORÇAMENTO' : 'VENDA';
  doc.fillColor('#f97316').fontSize(12).font('Helvetica-Bold').text(typeLabel, 410, 83);
  doc.fillColor('#ffffff').fontSize(8).font('Helvetica');
  doc.text(`${note.number}`, 410, 100);

  let y = 145;
  doc.fillColor('#1e40af').fontSize(11).font('Helvetica-Bold').text('DADOS DO CLIENTE', 40, y);
  y += 15;
  doc.fillColor('#333333').fontSize(9).font('Helvetica');
  doc.text(`Nome: ${note.customer_name}`, 40, y); y += 14;
  doc.text(`Telefone: ${note.customer_phone}`, 40, y); y += 14;
  if (note.customer_email) { doc.text(`Email: ${note.customer_email}`, 40, y); y += 14; }
  if (note.customer_cpf) { doc.text(`CPF: ${note.customer_cpf}`, 40, y); y += 14; }
  if (note.customer_address) { doc.text(`Endereco: ${note.customer_address}`, 40, y); y += 14; }
  if (note.attendant_name) { doc.text(`Atendente: ${note.attendant_name}`, 40, y); y += 14; }

  // Right side info: date, payment
  const infoX = 400;
  let infoY = 145;
  doc.fillColor('#1e40af').fontSize(9).font('Helvetica-Bold');
  doc.text(`Data: ${new Date(note.created_at).toLocaleDateString('pt-BR')}`, infoX, infoY); infoY += 14;
  if (note.type === 'sale' && note.payment_method) {
    doc.text(`Pagamento: ${note.payment_method}`, infoX, infoY); infoY += 14;
  }

  y = Math.max(y, infoY) + 10;

  // Items table header
  doc.rect(40, y, 515, 22).fill('#f3f4f6');
  doc.fillColor('#333333').fontSize(8).font('Helvetica-Bold');
  doc.text('PRODUTO', 50, y + 6);
  doc.text('QTD', 280, y + 6, { width: 30, align: 'center' });
  doc.text('UN', 320, y + 6, { width: 30, align: 'center' });
  doc.text('PRECO UNIT.', 360, y + 6, { width: 60, align: 'right' });
  doc.text('TOTAL', 470, y + 6, { width: 60, align: 'right' });

  y += 28;
  doc.font('Helvetica').fontSize(8).fillColor('#333333');
  (items || []).forEach((item, i) => {
    if (y > 740) { doc.addPage(); y = 40; }
    if (i % 2 === 0) { doc.rect(40, y - 4, 515, 18).fill('#f9fafb'); }
    const name = (item.name || 'Item').substring(0, 45);
    const qty = item.quantity || 1;
    const unit = item.unit || 'UND';
    const price = item.price || 0;
    const total = price * qty;
    doc.text(name, 50, y);
    doc.text(String(qty), 280, y, { width: 30, align: 'center' });
    doc.text(unit, 320, y, { width: 30, align: 'center' });
    doc.text(`R$ ${price.toFixed(2).replace('.', ',')}`, 360, y, { width: 60, align: 'right' });
    doc.text(`R$ ${total.toFixed(2).replace('.', ',')}`, 470, y, { width: 60, align: 'right' });
    y += 18;
  });

  y += 10;
  const totBoxY = y;
  doc.rect(370, totBoxY, 185, 5).fill('#f3f4f6');
  y += 5;
  doc.fontSize(8).font('Helvetica').fillColor('#666666');
  doc.text('Subtotal:', 380, y);
  doc.text(`R$ ${(note.subtotal || 0).toFixed(2).replace('.', ',')}`, 470, y, { width: 75, align: 'right' });
  y += 15;
  if ((note.discount || 0) > 0) {
    doc.text(`Desconto (${note.discount_type === 'percentage' ? note.discount + '%' : 'R$'}):`, 380, y);
    const discountAmount = note.discount_type === 'percentage' ? (note.subtotal || 0) * (note.discount / 100) : (note.discount || 0);
    doc.text(`- R$ ${discountAmount.toFixed(2).replace('.', ',')}`, 470, y, { width: 75, align: 'right' });
    y += 15;
  }
  doc.rect(370, y, 185, 1).fill('#333333');
  y += 6;
  doc.fontSize(11).font('Helvetica-Bold').fillColor('#1e40af');
  doc.text('TOTAL:', 380, y);
  doc.text(`R$ ${(note.total || 0).toFixed(2).replace('.', ',')}`, 470, y, { width: 75, align: 'right' });

  if (note.observations) {
    y += 25;
    doc.fillColor('#1e40af').fontSize(10).font('Helvetica-Bold').text('OBSERVACOES', 40, y);
    y += 14;
    doc.fillColor('#666666').fontSize(8).font('Helvetica').text(note.observations, 40, y, { width: 515 });
  }

  doc.fillColor('#999999').fontSize(7).font('Helvetica').text('Guimaraes Materiais para Construcao - Documento gerado eletronicamente', 40, 780, { align: 'center' });
  doc.end();
});

// ==================== BANNERS ====================

app.get('/api/banners', async (req, res) => {
  const data = await queryAll('banners', { where: [{ field: 'active', value: 1 }], order: { field: 'order_index', ascending: true } });
  res.json(data);
});

app.post('/api/banners', async (req, res) => {
  const { title, subtitle, image, link, order_index } = req.body;
  const data = await insert('banners', { title, subtitle, image: image || '', link: link || '', order_index: order_index || 0 });
  res.status(201).json(data[0]);
});

app.put('/api/banners/:id', async (req, res) => {
  const { title, subtitle, image, link, active, order_index } = req.body;
  const data = await update('banners', { title, subtitle, image, link, active: active ? 1 : 0, order_index }, 'id', req.params.id);
  if (!data.length) return res.status(404).json({ error: 'Banner não encontrado' });
  res.json(data[0]);
});

app.delete('/api/banners/:id', async (req, res) => {
  await remove('banners', 'id', req.params.id);
  res.json({ message: 'Banner removido com sucesso' });
});

// ==================== SETTINGS ====================

app.get('/api/settings', async (req, res) => {
  const settings = await queryAll('app_settings');
  const obj = {};
  settings.forEach(s => { obj[s.key] = s.value; });
  res.json(obj);
});

app.put('/api/settings/:key', async (req, res) => {
  const { value } = req.body;
  await supabase.from('app_settings').upsert({ key: req.params.key, value }, { onConflict: 'key' });
  res.json({ key: req.params.key, value });
});

// ==================== DASHBOARD ====================

app.get('/api/dashboard', async (req, res) => {
  const { count: totalProducts } = await supabase.from('products').select('*', { count: 'exact', head: true });
  const { count: totalQuotes } = await supabase.from('quotes').select('*', { count: 'exact', head: true });
  const { count: pendingQuotes } = await supabase.from('quotes').select('*', { count: 'exact', head: true }).eq('status', 'pending');
  const { count: totalOrders } = await supabase.from('orders').select('*', { count: 'exact', head: true });
  const orders = await supabase.from('orders').select('total').neq('status', 'cancelled');
  const totalRevenue = orders.data?.reduce((sum, o) => sum + (o.total || 0), 0) || 0;
  const { data: income } = await supabase.from('cash_flow').select('amount').eq('type', 'income');
  const totalIncome = income?.reduce((sum, r) => sum + (r.amount || 0), 0) || 0;
  const { data: expense } = await supabase.from('cash_flow').select('amount').eq('type', 'expense');
  const totalExpense = expense?.reduce((sum, r) => sum + (r.amount || 0), 0) || 0;
  const cashBalance = totalIncome - totalExpense;
  const { count: pendingBills } = await supabase.from('bills').select('*', { count: 'exact', head: true }).eq('status', 'pending');
  const { data: overdueData } = await supabase.from('bills').select('amount').eq('status', 'pending').lt('due_date', new Date().toISOString().split('T')[0]);
  const overdueBills = overdueData?.length || 0;
  const { data: billsData } = await supabase.from('bills').select('amount').eq('status', 'pending');
  const totalBillsAmount = billsData?.reduce((sum, b) => sum + (b.amount || 0), 0) || 0;
  const { count: pendingDeliveries } = await supabase.from('deliveries').select('*', { count: 'exact', head: true }).in('status', ['preparing', 'ready', 'out_for_delivery']);
  const { count: totalNotes } = await supabase.from('notes').select('*', { count: 'exact', head: true });
  const lowStock = await supabase.from('products').select('id, name, stock, min_stock').lte('stock', 'min_stock');
  const { data: monthlyOrders } = await supabase.from('orders').select('total, created_at').neq('status', 'cancelled').gte('created_at', new Date(Date.now() - 180 * 86400000).toISOString());
  const monthlyRev = {};
  (monthlyOrders || []).forEach(o => {
    const m = new Date(o.created_at).toISOString().slice(0, 7);
    monthlyRev[m] = (monthlyRev[m] || 0) + (o.total || 0);
  });
  const monthlyRevenue = Object.entries(monthlyRev).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 6).map(([month, total]) => ({ month, total }));
  const topProducts = await supabase.from('products').select('name, category, stock, price').order('featured', { ascending: false }).order('stock', { ascending: false }).limit(5);
  const { data: catData } = await supabase.from('products').select('category');
  const catCount = {};
  (catData || []).forEach(p => { catCount[p.category] = (catCount[p.category] || 0) + 1; });
  const categories = Object.entries(catCount).sort((a, b) => b[1] - a[1]).map(([category, count]) => ({ category, count }));
  const { count: unreadNotifications } = await supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('read', 0);

  res.json({ totalProducts, totalQuotes, pendingQuotes, totalOrders, totalRevenue, cashBalance, totalIncome, totalExpense, pendingBills, overdueBills, totalBillsAmount, pendingDeliveries, totalNotes, lowStock: lowStock.data || [], monthlyRevenue, topProducts: topProducts.data || [], categories, unreadNotifications });
});

// ==================== CHECK REMINDERS ====================

app.get('/api/check-reminders', async (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const { data: billsToRemind } = await supabase
    .from('bills')
    .select('*')
    .eq('status', 'pending')
    .eq('reminder_sent', 0);

  let remindersCreated = 0;
  for (const bill of billsToRemind || []) {
    const dueDate = new Date(bill.due_date);
    const diffDays = Math.ceil((dueDate.getTime() - Date.now()) / 86400000);
    if (diffDays <= bill.reminder_days) {
      await insert('notifications', { type: 'bill_reminder', title: 'Conta vencendo em breve!', message: `A conta "${bill.title}" de R$ ${bill.amount.toFixed(2)} vence em ${bill.due_date}`, reference_id: bill.id, reference_type: 'bill' });
      await update('bills', { reminder_sent: 1 }, 'id', bill.id);
      remindersCreated++;
    }
  }

  const { data: lowStock } = await supabase.from('products').select('*').lte('stock', 'min_stock');
  let lowStockAlerts = 0;
  for (const product of lowStock || []) {
    const existing = await queryOne('stock_alerts', { where: [{ field: 'product_id', value: product.id }, { field: 'acknowledged', value: 0 }] });
    if (!existing) {
      await insert('stock_alerts', { product_id: product.id, product_name: product.name, current_stock: product.stock, min_stock: product.min_stock });
      await insert('notifications', { type: 'stock_alert', title: 'Estoque baixo!', message: `O produto "${product.name}" está com estoque baixo (${product.stock} unidades)`, reference_id: product.id, reference_type: 'product' });
      lowStockAlerts++;
    }
  }

  res.json({ remindersCreated, lowStockAlerts });
});

// ==================== START ====================

module.exports = app;
