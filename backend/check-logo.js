const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: 'C:\\Users\\KEIKO\\GUIMARAES\\backend\\chrome\\win64-149.0.7827.22\\chrome-win64\\chrome.exe',
    args: ['--no-sandbox']
  });

  const page = await browser.newPage();
  await page.goto('http://localhost:3002', { waitUntil: 'networkidle0', timeout: 15000 });
  await new Promise(r => setTimeout(r, 2000));

  const imgs = await page.$$('img');
  console.log('Images found:', imgs.length);
  for (const img of imgs) {
    const alt = await img.evaluate(el => el.alt);
    const src = await img.evaluate(el => el.src);
    console.log('  alt:', alt, '| src:', src);
  }

  await browser.close();
})();
