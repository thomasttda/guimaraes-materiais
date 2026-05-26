const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: 'C:\\Users\\KEIKO\\GUIMARAES\\backend\\chrome\\win64-149.0.7827.22\\chrome-win64\\chrome.exe',
    args: ['--no-sandbox']
  });
  const page = await browser.newPage();
  await page.goto('http://localhost:3002/admin/notificacoes', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await new Promise(r => setTimeout(r, 2000));
  const text = await page.evaluate(() => document.body.innerText);
  console.log('Page text:', text.substring(0, 300));
  await browser.close();
})();
