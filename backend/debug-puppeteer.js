const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: 'C:\\Users\\KEIKO\\GUIMARAES\\backend\\chrome\\win64-149.0.7827.22\\chrome-win64\\chrome.exe',
    args: ['--no-sandbox']
  });

  const page = await browser.newPage();

  page.on('console', msg => console.log('CONSOLE:', msg.type(), msg.text().substring(0, 200)));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
  page.on('response', res => {
    if (res.status() >= 400) {
      console.log('HTTP ERROR:', res.status(), res.url().substring(0, 100));
    }
  });

  await page.goto('http://localhost:3002', { waitUntil: 'networkidle0', timeout: 30000 });
  await new Promise(r => setTimeout(r, 5000));

  console.log('\n=== FINAL STATE ===');
  console.log('Title:', await page.title());

  const rootContent = await page.evaluate(() => {
    const root = document.getElementById('root');
    return {
      childCount: root?.children.length,
      firstChildTag: root?.firstElementChild?.tagName,
      innerHTML: root?.innerHTML?.substring(0, 300)
    };
  });
  console.log('Root:', JSON.stringify(rootContent, null, 2));

  await browser.close();
})();
