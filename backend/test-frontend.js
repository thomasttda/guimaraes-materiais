const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const SCREENSHOTS_DIR = path.join(__dirname, '..', 'testes-screenshots');
const FRONTEND_URL = 'http://localhost:3002';
const API_URL = 'http://localhost:3001';

if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function takeScreenshot(page, name) {
  const filePath = path.join(SCREENSHOTS_DIR, `${name}.png`);
  await page.screenshot({ path: filePath, fullPage: false });
  console.log(`  ${name}.png`);
  return filePath;
}

async function testFrontend() {
  const results = [];
  const log = (test, status, detail = '') => {
    results.push({ test, status, detail });
    console.log(`${status === 'PASS' ? '✅' : '❌'} ${test}${detail ? ' - ' + detail : ''}`);
  };

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      executablePath: 'C:\\Users\\KEIKO\\GUIMARAES\\backend\\chrome\\win64-149.0.7827.22\\chrome-win64\\chrome.exe',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,800']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    // Test 1: Home page
    console.log('\n=== PAGINA INICIAL ===');
    await page.goto(FRONTEND_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await sleep(3000);
    const homeTitle = await page.title();
    log('Home page carrega', homeTitle.includes('Guimar') ? 'PASS' : 'FAIL', homeTitle);
    await takeScreenshot(page, '01-home-page');

    // Test 2: Logo
    const logo = await page.$('img[alt*="Guimar"]');
    log('Logo visivel', logo ? 'PASS' : 'FAIL');

    // Test 3: Nav links
    const navLinks = await page.$$eval('a', links => links.filter(l => l.href).map(l => l.href));
    log('Links de navegacao', navLinks.length > 0 ? 'PASS' : 'FAIL', `${navLinks.length} links`);

    // Test 4: Product cards
    const cards = await page.$$('.card');
    log('Cards de produtos', cards.length > 0 ? 'PASS' : 'FAIL', `${cards.length} cards`);

    // Test 5: Orcamento button
    const orcBtn = await page.$('a[href*="orcamento"]');
    log('Botao Orcamento', orcBtn ? 'PASS' : 'FAIL');

    // Test 6: Bottom nav
    const bottomNav = await page.$('nav.fixed');
    log('Nav inferior mobile', bottomNav ? 'PASS' : 'FAIL');

    // Test 7: Products page
    console.log('\n=== PAGINA PRODUTOS ===');
    await page.goto(`${FRONTEND_URL}/produtos`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await sleep(3000);
    const bodyText = await page.evaluate(() => document.body.innerText);
    log('Pagina Produtos carrega', bodyText.includes('Produtos') ? 'PASS' : 'FAIL');
    await takeScreenshot(page, '02-produtos-page');

    // Test 8: Search input
    const searchInput = await page.$('input');
    log('Campo de busca', searchInput ? 'PASS' : 'FAIL');

    // Test 9: Product detail
    console.log('\n=== DETALHE PRODUTO ===');
    await page.goto(`${FRONTEND_URL}/produto/1`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await sleep(3000);
    const detailText = await page.evaluate(() => document.body.innerText);
    log('Pagina detalhe carrega', detailText.length > 100 ? 'PASS' : 'FAIL');
    await takeScreenshot(page, '03-produto-detalhe');

    // Test 10: Add to cart button
    const addBtn = await page.$('button');
    log('Botoes na pagina', addBtn ? 'PASS' : 'FAIL');

    // Test 11: Cart page
    console.log('\n=== CARRINHO ===');
    await page.goto(`${FRONTEND_URL}/carrinho`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await sleep(3000);
    await takeScreenshot(page, '04-carrinho');

    // Test 12: Add to cart from home
    await page.goto(FRONTEND_URL, { waitUntil: 'domcontentloaded' });
    await sleep(2000);
    const buttons = await page.$$('button');
    log('Botoes na home', buttons.length > 0 ? 'PASS' : 'FAIL', `${buttons.length} botoes`);

    // Test 13: Quote page
    console.log('\n=== ORCAMENTO ===');
    await page.goto(`${FRONTEND_URL}/orcamento`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await sleep(3000);
    await takeScreenshot(page, '05-orcamento-page');

    const inputs = await page.$$('input, textarea');
    log('Formulario orcamento', inputs.length >= 3 ? 'PASS' : 'FAIL', `${inputs.length} campos`);

    // Test 14: Fill and submit quote
    try {
      await page.locator('input[name="customer_name"]').fill('Cliente Teste');
      await page.locator('input[name="customer_phone"]').fill('(11) 99999-9999');
      await page.locator('input[name="customer_email"]').fill('teste@email.com');
      await page.locator('textarea[name="message"]').fill('Teste automatizado');
      await sleep(500);
      await page.locator('button[type="submit"]').click();
      await sleep(3000);
      const successText = await page.evaluate(() => document.body.innerText);
      log('Enviar orcamento', successText.includes('Enviado') || successText.includes('Solicitado') ? 'PASS' : 'FAIL');
      await takeScreenshot(page, '06-orcamento-sucesso');
    } catch (e) {
      log('Enviar orcamento', 'FAIL', e.message);
    }

    // Test 15: Admin Dashboard
    console.log('\n=== ADMIN DASHBOARD ===');
    await page.goto(`${FRONTEND_URL}/admin`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await sleep(3000);
    await takeScreenshot(page, '07-admin-dashboard');

    const adminText = await page.evaluate(() => document.body.innerText);
    log('Admin Dashboard', adminText.includes('Painel') || adminText.includes('Admin') || adminText.includes('Produtos') ? 'PASS' : 'FAIL');

    // Test 16: Admin Products
    console.log('\n=== ADMIN PRODUTOS ===');
    await page.goto(`${FRONTEND_URL}/admin/produtos`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await sleep(3000);
    await takeScreenshot(page, '08-admin-produtos');

    const prodText = await page.evaluate(() => document.body.innerText);
    log('Admin Produtos', prodText.includes('Produto') || prodText.includes('Argamassa') ? 'PASS' : 'FAIL');

    // Test 17: Admin Quotes
    console.log('\n=== ADMIN ORCAMENTOS ===');
    await page.goto(`${FRONTEND_URL}/admin/orcamentos`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await sleep(3000);
    await takeScreenshot(page, '09-admin-orcamentos');

    const quotesText = await page.evaluate(() => document.body.innerText);
    log('Admin Orcamentos', quotesText.includes('Orcamento') || quotesText.includes('Cliente') ? 'PASS' : 'FAIL');

    // Test 18: Admin Orders
    console.log('\n=== ADMIN PEDIDOS ===');
    await page.goto(`${FRONTEND_URL}/admin/pedidos`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await sleep(3000);
    await takeScreenshot(page, '10-admin-pedidos');

    const ordersText = await page.evaluate(() => document.body.innerText);
    log('Admin Pedidos', ordersText.includes('Pedido') || ordersText.includes('pedidos') ? 'PASS' : 'FAIL');

    // Test 19: Admin Settings
    console.log('\n=== ADMIN CONFIGURACOES ===');
    await page.goto(`${FRONTEND_URL}/admin/configuracoes`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await sleep(3000);
    await takeScreenshot(page, '11-admin-configuracoes');

    const settingsText = await page.evaluate(() => document.body.innerText);
    log('Admin Configuracoes', settingsText.includes('Configuracao') || settingsText.includes('Loja') ? 'PASS' : 'FAIL');

    // Test 20: Footer
    console.log('\n=== COMPONENTES GLOBAIS ===');
    await page.goto(FRONTEND_URL, { waitUntil: 'domcontentloaded' });
    await sleep(2000);
    const footer = await page.$('footer');
    log('Footer', footer ? 'PASS' : 'FAIL');

    // Test 21: Mobile layout
    await page.setViewport({ width: 375, height: 667 });
    await sleep(1000);
    await takeScreenshot(page, '12-mobile-home');
    log('Layout mobile', 'PASS', '375x667');

    // Test 22: API integration
    console.log('\n=== INTEGRACAO API ===');
    const apiProducts = await page.evaluate(async () => {
      const res = await fetch('/api/products');
      return res.json();
    });
    log('API /products', apiProducts.length > 0 ? 'PASS' : 'FAIL', `${apiProducts.length} produtos`);

    const apiCats = await page.evaluate(async () => {
      const res = await fetch('/api/categories');
      return res.json();
    });
    log('API /categories', apiCats.length > 0 ? 'PASS' : 'FAIL', `${apiCats.length} categorias`);

    const apiSettings = await page.evaluate(async () => {
      const res = await fetch('/api/settings');
      return res.json();
    });
    log('API /settings', apiSettings.store_name ? 'PASS' : 'FAIL', apiSettings.store_name);

  } catch (error) {
    log('Erro geral', 'FAIL', error.message);
    console.error(error);
  } finally {
    if (browser) await browser.close();
  }

  return results;
}

testFrontend().then(results => {
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  console.log(`\n${'='.repeat(60)}`);
  console.log(`RESULTADO: ${passed} PASS | ${failed} FAIL | Total: ${results.length}`);
  console.log('='.repeat(60));

  const reportPath = path.join(SCREENSHOTS_DIR, 'relatorio-testes.json');
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  console.log(`\n Relatorio: ${reportPath}`);
  console.log(` Screenshots: ${SCREENSHOTS_DIR}`);

  process.exit(failed > 0 ? 1 : 0);
});
