import { chromium } from 'playwright';

const BASE = 'http://localhost:5174';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  await page.goto(`${BASE}/login`);
  await page.waitForTimeout(500);

  // 设置 localStorage
  await page.evaluate(() => {
    localStorage.setItem('scms_token', 'tok');
    localStorage.setItem('scms_user', JSON.stringify({ id: 1, username: 'admin', realName: '管理员', role: 'admin', phone: '138' }));
  });

  // 验证 localStorage
  const stored = await page.evaluate(() => ({
    token: localStorage.getItem('scms_token'),
    user: localStorage.getItem('scms_user'),
  }));
  console.log('LocalStorage after set:', stored);

  // 直接访问 dashboard
  await page.goto(`${BASE}/admin/dashboard`);
  await page.waitForTimeout(2000);
  console.log('URL after goto dashboard:', page.url());

  // 再次检查 localStorage（看是否被清除）
  const stored2 = await page.evaluate(() => ({
    token: localStorage.getItem('scms_token'),
    user: localStorage.getItem('scms_user'),
  }));
  console.log('LocalStorage after dashboard:', stored2);

  // 检查 network 请求
  const logs: string[] = [];
  page.on('response', async (res) => {
    if (res.url().includes('localhost:8080')) {
      logs.push(`Response: ${res.url()} status=${res.status()}`);
    }
  });
  page.on('requestfailed', (req) => {
    if (req.url().includes('localhost:8080')) {
      logs.push(`Failed: ${req.url()} ${req.failure()?.errorText}`);
    }
  });

  // 重新加载以触发请求
  await page.reload();
  await page.waitForTimeout(3000);
  console.log('Logs:', logs);
  console.log('Final URL:', page.url());

  await browser.close();
})();
