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

  const pages = [
    { url: '/admin/financeiro', name: '13-admin-financeiro', check: 'Entradas' },
    { url: '/admin/contas', name: '14-admin-contas', check: 'Contas a Pagar' },
    { url: '/admin/entregas', name: '15-admin-entregas', check: 'Entregas' },
    { url: '/admin/clientes', name: '16-admin-clientes', check: 'Clientes' },
    { url: '/admin/cupons', name: '17-admin-cupons', check: 'Cupons' },
    { url: '/admin/fornecedores', name: '18-admin-fornecedores', check: 'Fornecedores' },
    { url: '/admin/notificacoes', name: '19-admin-notificacoes', check: 'Notificacoes' },
  ];

  let passed = 0;
  let failed = 0;

  for (const p of pages) {
    try {
      await page.goto(`${FRONTEND_URL}${p.url}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await sleep(2000);
      const bodyText = await page.evaluate(() => document.body.innerText);
      if (bodyText.includes(p.check)) {
        console.log(`✅ ${p.name} - ${p.check}`);
        passed++;
      } else {
        console.log(`❌ ${p.name} - "${p.check}" não encontrado`);
        failed++;
      }
      await takeScreenshot(page, p.name);
    } catch (e) {
      console.log(`❌ ${p.name} - ${e.message}`);
      failed++;
    }
  }

  console.log(`\n${'='.repeat(50)}`);
  console.log(`NOVAS PAGINAS: ${passed} PASS | ${failed} FAIL | Total: ${pages.length}`);
  console.log('='.repeat(50));

  await browser.close();
})();
