const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: 'C:\\Users\\KEIKO\\GUIMARAES\\backend\\chrome\\win64-149.0.7827.22\\chrome-win64\\chrome.exe',
    args: ['--no-sandbox']
  });

  const page = await browser.newPage();

  await page.goto('http://localhost:3002', { waitUntil: 'networkidle0', timeout: 30000 });
  await new Promise(r => setTimeout(r, 3000));

  // Check specific element styles
  const headerStyle = await page.evaluate(() => {
    const header = document.querySelector('header');
    if (!header) return 'header not found';
    const computed = window.getComputedStyle(header);
    return {
      backgroundColor: computed.backgroundColor,
      boxShadow: computed.boxShadow,
      position: computed.position
    };
  });
  console.log('Header styles:', JSON.stringify(headerStyle, null, 2));

  // Check if gradient is applied
  const mainDiv = await page.evaluate(() => {
    const div = document.querySelector('.min-h-screen');
    if (!div) return 'not found';
    const computed = window.getComputedStyle(div);
    return {
      background: computed.background,
      backgroundImage: computed.backgroundImage,
      display: computed.display
    };
  });
  console.log('Main div styles:', JSON.stringify(mainDiv, null, 2));

  // Check card styles
  const cardStyle = await page.evaluate(() => {
    const card = document.querySelector('.card');
    if (!card) return 'card not found';
    const computed = window.getComputedStyle(card);
    return {
      backgroundColor: computed.backgroundColor,
      borderRadius: computed.borderRadius,
      boxShadow: computed.boxShadow
    };
  });
  console.log('Card styles:', JSON.stringify(cardStyle, null, 2));

  await browser.close();
})();
