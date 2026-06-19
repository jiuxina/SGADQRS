import { chromium } from 'playwright';

const BASE = 'http://localhost:5174';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

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

  // 登录
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
  await page.locator('input[type="text"]').first().fill('admin');
  await page.locator('input[type="password"]').first().fill('123456');
  await page.locator('button[type="submit"]').click();
  await page.waitForTimeout(2500);
  console.log('After login URL:', page.url());
  await page.screenshot({ path: 'f:/xm/SGADQRS/frontend/audit-shot-login.png' });

  // Admin dashboard
  await page.goto(`${BASE}/admin/dashboard`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  console.log('Admin URL:', page.url());
  console.log('sidebar-item count:', await page.locator('.sidebar-item').count());
  console.log('desktop-sidebar count:', await page.locator('.desktop-sidebar').count());
  console.log('bento-grid count:', await page.locator('.bento-grid').count());
  console.log('glass-search count:', await page.locator('.glass-search').count());
  const bodyText = await page.locator('body').textContent();
  console.log('Body text snippet:', bodyText?.slice(0, 300));
  await page.screenshot({ path: 'f:/xm/SGADQRS/frontend/audit-shot-admin.png', fullPage: true });

  // Student competitions
  await page.evaluate(() => {
    localStorage.setItem('scms_user', JSON.stringify({ id: 1, username: 'S20210001', realName: '张同学', role: 'student', phone: '138' }));
  });
  await page.goto(`${BASE}/student/competitions`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  console.log('Student comp URL:', page.url());
  console.log('chip count:', await page.locator('.chip').count());
  console.log('glass-search count:', await page.locator('.glass-search').count());
  await page.screenshot({ path: 'f:/xm/SGADQRS/frontend/audit-shot-student.png', fullPage: true });

  // Teacher create
  await page.evaluate(() => {
    localStorage.setItem('scms_user', JSON.stringify({ id: 1, username: 'T2024001', realName: '张老师', role: 'teacher', phone: '138' }));
  });
  await page.goto(`${BASE}/teacher/competitions/create`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  console.log('Teacher create URL:', page.url());
  console.log('input text count:', await page.locator('input[type="text"]').count());
  await page.screenshot({ path: 'f:/xm/SGADQRS/frontend/audit-shot-teacher.png', fullPage: true });

  await browser.close();
  console.log('Screenshots saved');
})();
