import { chromium } from 'playwright';

const BASE = 'http://localhost:5174';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  const errors: string[] = [];
  page.on('pageerror', err => errors.push(`PAGE ERROR: ${err.message}`));
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(`CONSOLE ERROR: ${msg.text()}`);
  });

  await page.route('http://localhost:8080/api/**', async (route) => {
    const url = route.request().url();
    if (url.includes('/auth/login')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 200, data: { token: 'mock_token', user: { id: 1, username: 'admin', realName: '管理员', role: 'admin', phone: '138' } }, message: 'success' }) });
    }
    if (url.includes('/auth/info')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 200, data: { id: 1, username: 'admin', realName: '管理员', role: 'admin', phone: '138' }, message: 'success' }) });
    }
    if (url.includes('/competition/page')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 200, data: { records: [{ id:1, competitionName:'数学建模大赛', status:2, categoryName:'学科竞赛', organizer:'教务处', description:'测试', registrationStart:'2024-01-01', registrationEnd:'2024-02-01', competitionStart:'2024-03-01', competitionEnd:'2024-04-01', location:'线上', maxTeams:10, maxMembers:3, registrationCount:5, hasRegistered:false }], total: 1 }, message: 'success' }) });
    }
    if (url.includes('/competition/category/list')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 200, data: [{ id: 1, categoryName: '学科竞赛' }, { id: 2, categoryName: '创新创业' }], message: 'success' }) });
    }
    if (url.includes('/log/page')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 200, data: { records: [{id:1,username:'admin',operation:'登录',status:1,createTime:'2024-01-01 10:00:00',method:'POST',spendTime:50}], total: 1 }, message: 'success' }) });
    }
    if (url.includes('/stats/admin')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 200, data: { totalUsers: 120, totalStudents: 100, totalRegistrations: 45 }, message: 'success' }) });
    }
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 200, data: {}, message: 'success' }) });
  });

  await page.goto(`${BASE}/admin/dashboard`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  console.log('URL:', page.url());
  console.log('Errors:', errors);
  console.log('Body innerHTML length:', (await page.locator('body').innerHTML()).length);

  // 尝试直接设置 localStorage 再刷新
  await page.evaluate(() => {
    localStorage.setItem('scms_token', 'mock_token');
    localStorage.setItem('scms_user', JSON.stringify({ id: 1, username: 'admin', realName: '管理员', role: 'admin', phone: '138' }));
  });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  console.log('After reload URL:', page.url());
  console.log('After reload Errors:', errors);
  console.log('After reload Body innerHTML length:', (await page.locator('body').innerHTML()).length);
  console.log('After reload sidebar-item count:', await page.locator('.sidebar-item').count());

  await browser.close();
})();
