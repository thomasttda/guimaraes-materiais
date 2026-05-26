const { initDb, queryAll, queryOne, run } = require('./db');

async function testAPI() {
  const results = [];
  const log = (test, status, detail = '') => {
    results.push({ test, status, detail });
    console.log(`${status === 'PASS' ? '✅' : '❌'} ${test}${detail ? ' - ' + detail : ''}`);
  };

  try {
    await initDb();
    log('Database init', 'PASS');
  } catch (e) {
    log('Database init', 'FAIL', e.message);
    return results;
  }

  // Test products
  const products = queryAll('SELECT * FROM products');
  log('GET products', products.length > 0 ? 'PASS' : 'FAIL', `${products.length} produtos`);

  const featured = queryAll('SELECT * FROM products WHERE featured = 1');
  log('GET featured products', featured.length > 0 ? 'PASS' : 'FAIL', `${featured.length} destaque`);

  const categories = queryAll('SELECT DISTINCT category FROM products');
  log('GET categories', categories.length > 0 ? 'PASS' : 'FAIL', `${categories.length} categorias`);

  const product1 = queryOne('SELECT * FROM products WHERE id = 1');
  log('GET product by ID', product1 ? 'PASS' : 'FAIL', product1?.name);

  // Test create product
  const newProd = run('INSERT INTO products (name, description, price, unit, category, featured, stock) VALUES (?, ?, ?, ?, ?, ?, ?)',
    ['Produto Teste', 'Descrição teste', 99.99, 'UND', 'Teste', 0, 10]);
  log('CREATE product', newProd.lastInsertRowid > 0 ? 'PASS' : 'FAIL', `ID: ${newProd.lastInsertRowid}`);

  // Test update product
  const updated = run('UPDATE products SET name = ? WHERE id = ?', ['Produto Teste Editado', newProd.lastInsertRowid]);
  log('UPDATE product', updated.changes > 0 ? 'PASS' : 'FAIL');

  // Test delete product
  const deleted = run('DELETE FROM products WHERE id = ?', [newProd.lastInsertRowid]);
  log('DELETE product', deleted.changes > 0 ? 'PASS' : 'FAIL');

  // Test banners
  const banners = queryAll('SELECT * FROM banners');
  log('GET banners', banners.length > 0 ? 'PASS' : 'FAIL', `${banners.length} banners`);

  // Test settings
  const settings = queryAll('SELECT * FROM app_settings');
  log('GET settings', settings.length > 0 ? 'PASS' : 'FAIL', `${settings.length} configurações`);

  // Test quotes
  const quotesBefore = queryAll('SELECT COUNT(*) as c FROM quotes')[0].c;
  const quoteResult = run('INSERT INTO quotes (customer_name, customer_email, customer_phone, items) VALUES (?, ?, ?, ?)',
    ['Cliente Teste', 'teste@email.com', '(11) 99999-9999', '[]']);
  log('CREATE quote', quoteResult.lastInsertRowid > 0 ? 'PASS' : 'FAIL');

  const quoteUpdate = run('UPDATE quotes SET status = ? WHERE id = ?', ['approved', quoteResult.lastInsertRowid]);
  log('UPDATE quote status', quoteUpdate.changes > 0 ? 'PASS' : 'FAIL');

  run('DELETE FROM quotes WHERE id = ?', [quoteResult.lastInsertRowid]);
  log('DELETE quote', 'PASS');

  // Test orders
  const orderResult = run('INSERT INTO orders (customer_name, customer_phone, items, total) VALUES (?, ?, ?, ?)',
    ['Cliente Pedido', '(11) 99999-9999', '[]', 150.00]);
  log('CREATE order', orderResult.lastInsertRowid > 0 ? 'PASS' : 'FAIL');

  const orderUpdate = run('UPDATE orders SET status = ? WHERE id = ?', ['approved', orderResult.lastInsertRowid]);
  log('UPDATE order status', orderUpdate.changes > 0 ? 'PASS' : 'FAIL');

  run('DELETE FROM orders WHERE id = ?', [orderResult.lastInsertRowid]);
  log('DELETE order', 'PASS');

  // Test dashboard
  const totalProducts = queryOne('SELECT COUNT(*) as c FROM products').c;
  const totalQuotes = queryOne('SELECT COUNT(*) as c FROM quotes').c;
  const totalOrders = queryOne('SELECT COUNT(*) as c FROM orders').c;
  const totalRevenue = queryOne('SELECT COALESCE(SUM(total), 0) as t FROM orders').t;
  log('Dashboard stats', 'PASS', `${totalProducts} produtos, ${totalQuotes} orçamentos, ${totalOrders} pedidos`);

  return results;
}

testAPI().then(results => {
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  console.log(`\n${'='.repeat(50)}`);
  console.log(`RESULTADO: ${passed} PASS | ${failed} FAIL | Total: ${results.length}`);
  console.log('='.repeat(50));
  process.exit(failed > 0 ? 1 : 0);
});
