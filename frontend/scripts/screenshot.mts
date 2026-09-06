import { chromium } from 'playwright';

async function takeScreenshots() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 430, height: 932 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  const pages = [
    { url: 'http://localhost:3003/login', name: 'login' },
    { url: 'http://localhost:3003/admin/dashboard', name: 'dashboard' },
    { url: 'http://localhost:3003/student/audit', name: 'audit' },
    { url: 'http://localhost:3003/teacher/dashboard', name: 'teacher' },
  ];

  for (const p of pages) {
    await page.goto(p.url, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await page.screenshot({
      path: `F:/xm/SGADQRS/.omo/evidence/${p.name}.png`,
      fullPage: true,
    });
    console.log(`Done: ${p.name}`);
  }

  await browser.close();
  console.log('All done!');
}

takeScreenshots().catch(console.error);
