import { chromium } from 'playwright';

const BASE = 'http://localhost:5174';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  // 模拟 admin 登录
  await page.goto(`${BASE}/login`);
  await page.waitForTimeout(300);
  await page.evaluate(() => {
    localStorage.setItem('scms_token', 'tok');
    localStorage.setItem('scms_user', JSON.stringify({ id: 1, username: 'admin', realName: '管理员', role: 'admin', phone: '138' }));
  });
  await page.goto(`${BASE}/admin/dashboard`);
  await page.waitForTimeout(3000);

  const html = await page.content();
  console.log('Page URL:', page.url());
  console.log('Has sidebar-item?', await page.locator('.sidebar-item').count());
  console.log('Has desktop-sidebar?', await page.locator('.desktop-sidebar').count());
  console.log('Has bento-grid?', await page.locator('.bento-grid').count());
  console.log('Body classes:', await page.locator('body').getAttribute('class'));

  // 截图
  await page.screenshot({ path: 'f:/xm/SGADQRS/frontend/audit-debug.png', fullPage: true });
  console.log('Screenshot saved');

  // 查看是否有 alert 或错误信息
  const bodyText = await page.locator('body').textContent();
  console.log('Body text preview:', bodyText?.slice(0, 500));

  await browser.close();
})();
