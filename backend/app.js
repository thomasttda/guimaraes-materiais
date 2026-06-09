const express = require('express');
require('express-async-errors');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const path = require('path');
const { supabase, queryAll, queryOne, insert, update, remove } = require('./supabase-db');

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

app.post('/api/deliveries', async (req, res) => {
  const { note_id, driver_id, customer_name, customer_phone, customer_address } = req.body;
  if (!driver_id || !customer_name || !customer_phone) {
    return res.status(400).json({ error: 'driver_id, customer_name e customer_phone são obrigatórios' });
  }
  const driver = await queryOne('drivers', { where: [{ field: 'id', value: driver_id }] });
  if (!driver) return res.status(404).json({ error: 'Motorista não encontrado' });
  const data = await insert('deliveries', {
    note_id: note_id || null,
    driver_id,
    driver_name: driver.name,
    driver_phone: driver.phone,
    customer_name,
    customer_phone,
    customer_address: customer_address || '',
    status: 'ready'
  });
  if (note_id) {
    await update('notes', { status: 'confirmed' }, 'id', note_id);
  }
  await insert('notifications', {
    type: 'order_status',
    title: 'Nova Entrega',
    message: `Entrega para ${customer_name} atribuída ao motorista ${driver.name}`,
    reference_id: data[0]?.id,
    reference_type: 'delivery'
  });
  res.status(201).json(data[0]);
});

app.get('/api/deliveries', async (req, res) => {
  const { status } = req.query;
  let query = supabase.from('deliveries').select('*').order('created_at', { ascending: false });
  if (status) query = query.eq('status', status);
  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  // Enrich with driver info
  const enriched = await Promise.all(data.map(async (d) => {
    let extra = {};
    if (d.driver_id) {
      const { data: drv } = await supabase.from('drivers').select('vehicle, license_plate').eq('id', d.driver_id).single();
      extra = { ...extra, vehicle: drv?.vehicle || null, license_plate: drv?.license_plate || null };
    }
    if (d.note_id) {
      const { data: nt } = await supabase.from('notes').select('number, items, total').eq('id', d.note_id).single();
      extra = { ...extra, note_number: nt?.number || null, items: nt?.items || [], total: nt?.total || 0 };
    }
    return { ...d, ...extra };
  }));
  res.json(enriched);
});

app.get('/api/deliveries/:id', async (req, res) => {
  const { data: delivery, error } = await supabase.from('deliveries').select('*').eq('id', req.params.id).single();
  if (error || !delivery) return res.status(404).json({ error: 'Entrega não encontrada' });
  if (delivery.note_id) {
    const { data: note } = await supabase.from('notes').select('number, items, total, type').eq('id', delivery.note_id).single();
    delivery.note_number = note?.number || null;
    delivery.items = note?.items || [];
    delivery.total = note?.total || 0;
  } else if (delivery.order_id) {
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

// ==================== SELLERS ====================

app.get('/api/sellers', async (req, res) => {
  const data = await supabase.from('sellers').select('id, name, phone, email, active, created_at').eq('active', 1).order('name', { ascending: true });
  res.json(data.data || []);
});

async function syncSellerAdminUser(seller, password) {
  if (!seller.email) return;
  const existing = await queryOne('admin_users', { where: [{ field: 'email', value: seller.email }] });
  const userData = { name: seller.name, email: seller.email, password: password || 'guimaraes@2026', role: 'seller', active: seller.active !== undefined ? seller.active : 1 };
  if (existing) {
    await update('admin_users', userData, 'id', existing.id);
  } else {
    await supabase.from('admin_users').insert(userData).select();
  }
}

function sanitizeSeller(s) {
  if (!s) return s;
  const { password, ...rest } = s;
  return rest;
}

app.post('/api/sellers', async (req, res) => {
  const { name, phone, email, password } = req.body;
  if (!name) return res.status(400).json({ error: 'Nome é obrigatório' });
  const data = await insert('sellers', { name, phone: phone || '', email: email || '', password: password || 'guimaraes@2026' });
  const seller = data[0];
  if (seller.email) await syncSellerAdminUser(seller, password);
  res.status(201).json(sanitizeSeller(seller));
});

app.put('/api/sellers/:id', async (req, res) => {
  const { name, phone, email, password } = req.body;
  const updates = {};
  if (name !== undefined) updates.name = name;
  if (phone !== undefined) updates.phone = phone;
  if (email !== undefined) updates.email = email;
  if (password !== undefined) updates.password = password;
  const data = await update('sellers', updates, 'id', req.params.id);
  if (!data.length) return res.status(404).json({ error: 'Vendedor não encontrado' });
  const seller = data[0];
  if (seller.email) await syncSellerAdminUser(seller, password);
  res.json(sanitizeSeller(seller));
});

app.delete('/api/sellers/:id', async (req, res) => {
  const seller = await queryOne('sellers', { where: [{ field: 'id', value: req.params.id }] });
  await update('sellers', { active: 0 }, 'id', req.params.id);
  if (seller && seller.email) {
    const adminUser = await queryOne('admin_users', { where: [{ field: 'email', value: seller.email }] });
    if (adminUser) await update('admin_users', { active: 0 }, 'id', adminUser.id);
  }
  res.json({ message: 'Vendedor removido' });
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
  data.forEach(n => { n.items = parseItems(n.items); });
  res.json(data);
});

async function logAdminAction(userInfo, action, resourceType, resourceId, description, details) {
  try {
    await supabase.from('admin_activity_logs').insert({
      user_id: userInfo?.id || null,
      user_name: userInfo?.name || 'Sistema',
      action, resource_type: resourceType, resource_id: resourceId,
      description: description || '',
      details: details || null
    }).select();
  } catch {}
}

function parseItems(items) {
  if (Array.isArray(items)) return items;
  if (typeof items === 'string') {
    try { const p = JSON.parse(items); return Array.isArray(p) ? p : []; } catch { return []; }
  }
  if (items && typeof items === 'object') {
    // handle case where items is an object with numeric keys instead of array
    const vals = Object.values(items);
    if (vals.length && typeof vals[0] === 'object') return vals;
  }
  return [];
}

app.get('/api/notes/:id', async (req, res) => {
  const note = await queryOne('notes', { where: [{ field: 'id', value: req.params.id }] });
  if (!note) return res.status(404).json({ error: 'Nota não encontrada' });
  note.items = parseItems(note.items);
  res.json(note);
});

app.post('/api/notes', async (req, res) => {
  const { type, customer_name, customer_phone, customer_email, customer_address, customer_cpf, attendant_name, items, subtotal, discount, discount_type, total, observations, payment_method, pix_discount } = req.body;
  const number = await generateNoteNumber(type, customer_name);

  // Auto-register customer if not exists
  if (customer_name && customer_phone) {
    const existing = await queryOne('customers', { where: [{ field: 'phone', value: customer_phone }] });
    if (!existing) {
      await supabase.from('customers').insert({
        name: customer_name, phone: customer_phone,
        email: customer_email || '', address: customer_address || '',
        cpf: customer_cpf || '', city: '', state: '', notes: ''
      }).select();
    }
  }

  // Try with pix_discount first (for databases that have the column), fallback without
  let data;
  try {
    data = await insert('notes', { type, number, customer_name, customer_phone, customer_email: customer_email || '', customer_address: customer_address || '', customer_cpf: customer_cpf || '', attendant_name: attendant_name || '', items: items || [], subtotal, discount: discount || 0, discount_type: discount_type || 'fixed', total, observations: observations || '', payment_method: payment_method || '', pix_discount: pix_discount || 0 });
  } catch (e) {
    if (e.message && e.message.includes('pix_discount')) {
      data = await insert('notes', { type, number, customer_name, customer_phone, customer_email: customer_email || '', customer_address: customer_address || '', customer_cpf: customer_cpf || '', attendant_name: attendant_name || '', items: items || [], subtotal, discount: discount || 0, discount_type: discount_type || 'fixed', total, observations: observations || '', payment_method: payment_method || '' });
    } else {
      throw e;
    }
  }
  const noteData = data[0];
  await logAdminAction({ name: attendant_name || 'Sistema' }, 'create', 'note', noteData?.id, `${type === 'quote' ? 'Orçamento' : 'Venda'} ${number} - ${customer_name}`);
  res.status(201).json(noteData);
});

app.put('/api/notes/:id', async (req, res) => {
  const fields = ['type', 'customer_name', 'customer_phone', 'customer_email', 'customer_address', 'customer_cpf', 'attendant_name', 'subtotal', 'discount', 'discount_type', 'total', 'observations', 'status', 'payment_method', 'pix_discount'];
  const updates = {};
  let oldStatus;
  if (req.body.status !== undefined) {
    const old = await queryOne('notes', { where: [{ field: 'id', value: req.params.id }] });
    oldStatus = old?.status;
  }
  for (const f of fields) {
    if (req.body[f] !== undefined) updates[f] = req.body[f];
  }
  if (req.body.items) updates.items = req.body.items;
  let data;
  try {
    data = await update('notes', updates, 'id', req.params.id);
  } catch (e) {
    if (e.message && e.message.includes('pix_discount')) {
      delete updates.pix_discount;
      data = await update('notes', updates, 'id', req.params.id);
    } else {
      throw e;
    }
  }
  if (!data.length) return res.status(404).json({ error: 'Nota não encontrada' });
  const updated = data[0];
  if (oldStatus && updated.status !== oldStatus) {
    await logAdminAction(
      { name: req.body.attendant_name || 'Sistema' },
      'status_change', 'note', updated.id,
      `${updated.number}: ${oldStatus} → ${updated.status}`,
      { from: oldStatus, to: updated.status }
    );
  }
  res.json(updated);
});

app.delete('/api/notes/:id', async (req, res) => {
  await remove('notes', 'id', req.params.id);
  res.json({ message: 'Nota removida' });
});

// ==================== ADMIN ACTIVITY LOGS ====================

app.get('/api/admin/activity-logs/admin', async (req, res) => {
  const { resource_type, resource_id, limit } = req.query;
  let query = supabase.from('admin_activity_logs').select('*').order('created_at', { ascending: true });
  if (resource_type) query = query.eq('resource_type', resource_type);
  if (resource_id) {
    const ids = resource_id.split(',').map(Number).filter(n => !isNaN(n));
    if (ids.length === 1) query = query.eq('resource_id', ids[0]);
    else if (ids.length > 1) query = query.in('resource_id', ids);
  }
  if (limit) query = query.limit(parseInt(limit));
  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
});

// ==================== PDF / PRINT ====================

function escapeHtml(str) {
  return (str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function fmtMoney(val) {
  return 'R$ ' + (parseFloat(val) || 0).toFixed(2).replace('.', ',');
}

app.get('/api/notes/:id/pdf', async (req, res) => {
  const note = await queryOne('notes', { where: [{ field: 'id', value: req.params.id }] });
  if (!note) return res.status(404).json({ error: 'Nota não encontrada' });
  res.setHeader('Content-Type', 'text/html; charset=utf-8');

  const settingsArr = await queryAll('app_settings');
  const settings = {};
  settingsArr.forEach(s => { settings[s.key] = s.value; });

  const items = parseItems(note.items);
  const storeName = escapeHtml(settings.store_name || 'Guimarães Materiais para Construção');
  const storeCnpj = escapeHtml(settings.store_cnpj || '51.803.643/0001-04');
  const storePhone = escapeHtml(settings.store_phone || '(73) 99154-6335');
  const storeAddress = escapeHtml(settings.store_address || 'Av. Beira Rio, Iguape, Ilhéus - BA');
  const customerName = escapeHtml(note.customer_name);
  const customerPhone = escapeHtml(note.customer_phone);
  const customerEmail = escapeHtml(note.customer_email || '');
  const customerCpf = escapeHtml(note.customer_cpf || '');
  const customerAddress = escapeHtml(note.customer_address || '');
  const attendant = escapeHtml(note.attendant_name || '');
  const typeLabel = note.type === 'quote' ? 'ORÇAMENTO' : 'VENDA';
  const createdAt = new Date(note.created_at).toLocaleDateString('pt-BR');
  const obs = escapeHtml(note.observations || '');

  const subtotal = items.reduce((s, i) => s + (parseFloat(i.price) || 0) * (parseInt(i.quantity) || 1), 0);
  const discountAmount = note.discount_type === 'percentage' ? subtotal * (parseFloat(note.discount) || 0) / 100 : (parseFloat(note.discount) || 0);

  let itemsHtml = '';
  (items || []).forEach((item, i) => {
    const name = escapeHtml(item.name || 'Item');
    const qty = parseInt(item.quantity) || 1;
    const unit = escapeHtml(item.unit || 'UND');
    const price = parseFloat(item.price) || 0;
    const total = price * qty;
    itemsHtml += `<tr${i % 2 === 0 ? ' class="even"' : ''}><td class="prod">${name}</td><td class="qtd">${qty}</td><td class="un">${unit}</td><td class="preco">${fmtMoney(price)}</td><td class="total">${fmtMoney(total)}</td></tr>`;
  });

  res.send(`<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>${note.number}</title>
<style>
  @page { size: A4; margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; color: #333; font-size: 12px; line-height: 1.4; }
  .header { background: #1e40af; color: #fff; padding: 20px 20px; display: flex; justify-content: space-between; align-items: flex-start; }
  .header .left h1 { font-size: 18px; margin-bottom: 2px; }
  .header .left .sub { font-size: 11px; color: #bfdbfe; }
  .header .left .info { font-size: 9px; color: #bfdbfe; margin-top: 4px; line-height: 1.5; }
  .header .right { text-align: right; }
  .header .right .badge { background: #f97316; color: #fff; padding: 4px 14px; font-weight: bold; font-size: 13px; display: inline-block; margin-bottom: 6px; }
  .header .right .det { font-size: 10px; color: #bfdbfe; margin-top: 2px; }
  .section { padding: 14px 20px; border-bottom: 1px solid #e5e7eb; }
  .section h2 { color: #1e40af; font-size: 12px; font-weight: bold; margin-bottom: 10px; }
  .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; font-size: 11px; }
  .grid2 .label { color: #6b7280; }
  .grid2 .value { font-weight: 500; }
  .grid2 .full { grid-column: span 2; }
  table.items { width: 100%; border-collapse: collapse; font-size: 10px; }
  table.items th { background: #f3f4f6; text-align: left; padding: 6px 8px; font-weight: 600; color: #333; }
  table.items th.right { text-align: right; }
  table.items th.center { text-align: center; }
  table.items td { padding: 5px 8px; border-bottom: 1px solid #f3f4f6; }
  table.items .even { background: #f9fafb; }
  table.items .prod { max-width: 280px; }
  table.items .qtd, table.items .un { text-align: center; }
  table.items .preco, table.items .total { text-align: right; }
  .totals { margin-top: 12px; display: flex; justify-content: flex-end; }
  .totals table { width: 200px; font-size: 11px; }
  .totals td { padding: 3px 0; }
  .totals .label { color: #6b7280; }
  .totals .val { text-align: right; }
  .totals .line { border-top: 2px solid #1e40af; }
  .totals .big { font-size: 14px; font-weight: bold; color: #1e40af; }
  .obs { padding: 14px 20px; background: #f9fafb; font-size: 10px; color: #6b7280; }
  .obs h2 { color: #1e40af; font-size: 11px; font-weight: bold; margin-bottom: 4px; }
  .footer { text-align: center; padding: 10px 20px; font-size: 8px; color: #9ca3af; border-top: 1px solid #e5e7eb; }
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
</style>
</head>
<body>
  <div class="header">
    <div class="left">
      <h1>${storeName}</h1>
      <div class="sub">Materiais para Construção</div>
      <div class="info">CNPJ: ${storeCnpj}<br>Tel: ${storePhone}<br>${storeAddress}</div>
    </div>
    <div class="right">
      <div class="badge">${typeLabel}</div>
      <div class="det">Nº ${note.number}</div>
      <div class="det">${createdAt}</div>
      ${note.type === 'sale' && note.payment_method ? `<div class="det">Pagamento: ${escapeHtml(note.payment_method)}</div>` : ''}
    </div>
  </div>

  <div class="section">
    <h2>DADOS DO CLIENTE</h2>
    <div class="grid2">
      <div><div class="label">Nome</div><div class="value">${customerName}</div></div>
      <div><div class="label">Telefone</div><div class="value">${customerPhone}</div></div>
      ${customerEmail ? `<div><div class="label">Email</div><div class="value">${customerEmail}</div></div>` : ''}
      ${customerCpf ? `<div><div class="label">CPF</div><div class="value">${customerCpf}</div></div>` : ''}
      ${customerAddress ? `<div class="full"><div class="label">Endereço</div><div class="value">${customerAddress}</div></div>` : ''}
      ${attendant ? `<div><div class="label">Atendente</div><div class="value">${attendant}</div></div>` : ''}
    </div>
  </div>

  <div class="section">
    <h2>ITENS</h2>
    <table class="items">
      <thead>
        <tr><th>Produto</th><th class="center">Qtd</th><th class="center">Un</th><th class="right">Preço Unit.</th><th class="right">Total</th></tr>
      </thead>
      <tbody>
        ${itemsHtml || '<tr><td colspan="5" style="text-align:center;padding:20px;color:#999">Nenhum item</td></tr>'}
      </tbody>
    </table>
    <div class="totals">
      <table>
        <tr><td class="label">Subtotal:</td><td class="val">${fmtMoney(subtotal)}</td></tr>
        ${note.discount > 0 ? `<tr><td class="label">Desconto (${note.discount_type === 'percentage' ? note.discount + '%' : 'R$'}):</td><td class="val">- ${fmtMoney(discountAmount)}</td></tr>` : ''}
        <tr class="line"><td class="big">TOTAL:</td><td class="val big">${fmtMoney(note.total)}</td></tr>
        ${note.payment_method === 'PIX' && parseFloat(note.pix_discount) > 0 ? `<tr><td class="label" style="padding-top:8px;font-weight:bold;color:#16a34a">Pagamento via PIX:</td><td class="val" style="padding-top:8px;font-weight:bold;color:#16a34a">${fmtMoney(note.total - (parseFloat(note.pix_discount) || 0))}</td></tr><tr><td class="label" style="color:#16a34a;font-size:9px">(desconto PIX: ${fmtMoney(note.pix_discount)})</td><td class="val" style="color:#16a34a;font-size:9px"></td></tr>` : ''}
      </table>
    </div>
  </div>

  ${obs ? `<div class="obs"><h2>OBSERVAÇÕES</h2><p>${obs}</p></div>` : ''}

  <div class="footer">${storeName} - CNPJ ${storeCnpj} - Documento gerado eletronicamente</div>
  ${req.query.print === '1' ? '<script>window.onload=function(){window.print();}</script>' : ''}
</body>
</html>`);
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
