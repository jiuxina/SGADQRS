const { chromium } = require('playwright');
const { execSync, spawn } = require('child_process');

async function main() {
  // Start vite preview server
  const server = spawn('npx', ['vite', 'preview', '--port', '5199'], {
    cwd: 'F:\\xm\\SGADQRS\\frontend-demo-ios26',
    stdio: 'pipe',
    shell: true,
  });

  // Wait for server to start
  await new Promise((resolve) => setTimeout(resolve, 4000));

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 430, height: 932 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  const screenshots = [
    { url: 'http://localhost:5199/login', name: 'ios26-demo-login.png' },
    { url: 'http://localhost:5199/admin/dashboard', name: 'ios26-demo-dashboard.png' },
    { url: 'http://localhost:5199/student/audit', name: 'ios26-demo-student.png' },
    { url: 'http://localhost:5199/teacher/dashboard', name: 'ios26-demo-teacher.png' },
  ];

  for (const s of screenshots) {
    console.log(`Navigating to ${s.url}...`);
    await page.goto(s.url, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(2000);
    await page.screenshot({
      path: `F:/xm/SGADQRS/.omo/evidence/${s.name}`,
      fullPage: true,
    });
    console.log(`Saved: ${s.name}`);
  }

  // Dark mode
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('http://localhost:5199/login', { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(2000);
  await page.screenshot({
    path: 'F:/xm/SGADQRS/.omo/evidence/ios26-demo-dark.png',
    fullPage: true,
  });
  console.log('Saved: ios26-demo-dark.png');

  await browser.close();
  server.kill();
  console.log('Done!');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
