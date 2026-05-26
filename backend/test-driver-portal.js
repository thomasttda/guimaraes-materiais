const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const SCREENSHOTS_DIR = path.join(__dirname, '..', 'testes-screenshots');
const FRONTEND_URL = 'http://localhost:3002';

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function takeScreenshot(page, name) {
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `${name}.png`), fullPage: false });
  console.log(`  ${name}.png`);
}

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: 'C:\\Users\\KEIKO\\GUIMARAES\\backend\\chrome\\win64-149.0.7827.22\\chrome-win64\\chrome.exe',
    args: ['--no-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  let passed = 0;
  let failed = 0;

  // Test 1: Driver Login Page
  console.log('\n=== PORTAL DO ENTREGADOR ===');
  try {
    await page.goto(`${FRONTEND_URL}/entregador/login`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await sleep(2000);
    const text = await page.evaluate(() => document.body.innerText);
    if (text.includes('Portal do Entregador')) {
      console.log('✅ Login do Entregador');
      passed++;
    } else {
      console.log('❌ Login do Entregador - "Portal do Entregador" não encontrado');
      failed++;
    }
    await takeScreenshot(page, '20-driver-login');
  } catch (e) { console.log(`❌ Driver Login - ${e.message}`); failed++; }

  // Test 2: Driver Login
  try {
    await page.locator('input[type="tel"]').fill('(11) 98888-1111');
    await page.locator('input[type="password"]').fill('123456');
    await page.locator('button[type="submit"]').click();
    await sleep(3000);
    const text = await page.evaluate(() => document.body.innerText);
    if (text.includes('Roberto') || text.includes('Entregas')) {
      console.log('✅ Login realizado com sucesso');
      passed++;
    } else {
      console.log('❌ Login falhou');
      failed++;
    }
    await takeScreenshot(page, '21-driver-dashboard');
  } catch (e) { console.log(`❌ Driver Dashboard - ${e.message}`); failed++; }

  // Test 3: Admin Motoristas
  try {
    await page.goto(`${FRONTEND_URL}/admin/motoristas`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await sleep(2000);
    const text = await page.evaluate(() => document.body.innerText);
    if (text.includes('Motorista') || text.includes('Roberto')) {
      console.log('✅ Admin Motoristas');
      passed++;
    } else {
      console.log('❌ Admin Motoristas - conteúdo não encontrado');
      failed++;
    }
    await takeScreenshot(page, '22-admin-motoristas');
  } catch (e) { console.log(`❌ Admin Motoristas - ${e.message}`); failed++; }

  // Test 4: Driver API - Login
  try {
    const loginResult = await page.evaluate(async () => {
      const res = await fetch('/api/drivers/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: '(11) 98888-1111', password: '123456' })
      });
      return res.json();
    });
    if (loginResult.name) {
      console.log('✅ API Driver Login -', loginResult.name);
      passed++;
    } else {
      console.log('❌ API Driver Login falhou');
      failed++;
    }
  } catch (e) { console.log(`❌ API Driver Login - ${e.message}`); failed++; }

  // Test 5: Driver API - Deliveries
  try {
    const deliveries = await page.evaluate(async () => {
      const res = await fetch('/api/drivers/1/deliveries');
      return res.json();
    });
    console.log(`✅ API Driver Deliveries - ${deliveries.length} entregas`);
    passed++;
  } catch (e) { console.log(`❌ API Driver Deliveries - ${e.message}`); failed++; }

  // Test 6: Driver API - Location Update
  try {
    const locResult = await page.evaluate(async () => {
      const res = await fetch('/api/drivers/1/location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat: -23.5505, lng: -46.6333, accuracy: 10 })
      });
      return res.json();
    });
    if (locResult.message) {
      console.log('✅ API Driver Location Update');
      passed++;
    } else {
      console.log('❌ API Driver Location Update falhou');
      failed++;
    }
  } catch (e) { console.log(`❌ API Driver Location - ${e.message}`); failed++; }

  // Test 7: Drivers List API
  try {
    const drivers = await page.evaluate(async () => {
      const res = await fetch('/api/drivers');
      return res.json();
    });
    console.log(`✅ API Drivers List - ${drivers.length} motoristas`);
    passed++;
  } catch (e) { console.log(`❌ API Drivers List - ${e.message}`); failed++; }

  console.log(`\n${'='.repeat(50)}`);
  console.log(`PORTAL ENTREGADOR: ${passed} PASS | ${failed} FAIL | Total: ${passed + failed}`);
  console.log('='.repeat(50));

  await browser.close();
})();
