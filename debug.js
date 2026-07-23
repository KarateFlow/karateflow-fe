const { chromium } = require('@playwright/test');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));
  await page.goto('http://localhost:4200/athletes/1/tests/new');
  await page.waitForTimeout(2000);
  console.log("Rows before click:", await page.locator('app-exercise-form-row').count());
  await page.getByRole('button', { name: /\+ aggiungi esercizio/i }).click();
  await page.waitForTimeout(2000);
  console.log("Rows after click:", await page.locator('app-exercise-form-row').count());
  const html = await page.content();
  console.log("HTML has input[placeholder='Titolo']?", html.includes('placeholder="Titolo"'));
  await browser.close();
})();
