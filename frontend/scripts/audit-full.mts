import { chromium } from 'playwright';

const BASE = 'http://localhost:5174';
const results: string[] = [];

function log(section: string, status: 'PASS' | 'FAIL' | 'WARN' | 'INFO', message: string) {
  const line = `[${section}] ${status}: ${message}`;
  results.push(line);
  console.log(line);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  // Mock 所有 API 请求，防止后端未启动导致问题
  await page.route('http://localhost:8080/api/**', async (route) => {
    const url = route.request().url();
    if (url.includes('/auth/login')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 200, data: { token: 'mock_token', user: { id: 1, username: 'admin', realName: '管理员', role: 'admin', phone: '138' } }, message: 'success' }) });
    }
    if (url.includes('/auth/info')) {
      const role = (await page.evaluate(() => JSON.parse(localStorage.getItem('scms_user') || '{}')).role) || 'admin';
      const user = { id: 1, username: 'admin', realName: role === 'admin' ? '管理员' : role === 'teacher' ? '张老师' : '张同学', role, phone: '13800138000' };
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 200, data: user, message: 'success' }) });
    }
    if (url.includes('/competition/page')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 200, data: { records: [], total: 0 }, message: 'success' }) });
    }
    if (url.includes('/competition/category/list')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 200, data: [{ id: 1, categoryName: '学科竞赛' }, { id: 2, categoryName: '创新创业' }], message: 'success' }) });
    }
    if (url.includes('/log/page')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 200, data: { records: [], total: 0 }, message: 'success' }) });
    }
    if (url.includes('/stats/admin')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 200, data: { totalUsers: 120, totalStudents: 100, totalRegistrations: 45 }, message: 'success' }) });
    }
    if (url.includes('/user/page')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 200, data: { records: [], total: 0 }, message: 'success' }) });
    }
    if (url.includes('/notice/page')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 200, data: { records: [], total: 0 }, message: 'success' }) });
    }
    if (url.includes('/registration/page')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 200, data: { records: [], total: 0 }, message: 'success' }) });
    }
    if (url.includes('/result/page')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 200, data: { records: [], total: 0 }, message: 'success' }) });
    }
    if (url.includes('/message/page')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 200, data: { records: [], total: 0 }, message: 'success' }) });
    }
    if (url.includes('/config')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 200, data: {}, message: 'success' }) });
    }
    // 默认空数据
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 200, data: {}, message: 'success' }) });
  });

  // ========== 1. 登录页 ==========
  console.log('=== 1. 登录页 ===');
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);

  for (const [role, label] of [['admin', '管理员'], ['teacher', '教师'], ['student', '学生']] as const) {
    const btn = page.locator(`.role-switcher button:has-text("${label}")`);
    if (await btn.count()) {
      await btn.click();
      await page.waitForTimeout(100);
      const active = await btn.evaluate(el => el.classList.contains('active'));
      log('登录页', active ? 'PASS' : 'FAIL', `角色「${label}」切换`);
    } else {
      log('登录页', 'FAIL', `角色「${label}」按钮不存在`);
    }
  }

  await page.locator('input[type="text"]').first().fill('admin');
  await page.locator('input[type="password"]').first().fill('123456');
  log('登录页', 'PASS', '账号/密码输入框可输入');

  const eyeBtn = page.locator('.login-right button[type="button"]').filter({ has: page.locator('svg') }).first();
  if (await eyeBtn.count()) {
    await eyeBtn.click();
    log('登录页', 'PASS', '密码显示/隐藏切换可用');
  }

  log('登录页', await page.locator('input[type="checkbox"]').count() ? 'PASS' : 'FAIL', '记住账号复选框');
  log('登录页', await page.locator('button:has-text("忘记密码")').count() ? 'PASS' : 'WARN', '忘记密码链接');
  log('登录页', await page.locator('button[type="submit"]').count() ? 'PASS' : 'FAIL', '登录按钮');

  // 真实登录测试（通过 Mock）
  await page.locator('button[type="submit"]').click();
  await page.waitForTimeout(2000);
  const url1 = page.url();
  log('登录页', url1.includes('/admin/dashboard') ? 'PASS' : 'FAIL', `登录后跳转: ${url1}`);

  // ========== 2. 导航检查 ==========
  console.log('\n=== 2. 导航检查 ===');
  for (const role of ['admin', 'teacher', 'student'] as const) {
    // 重新设置用户角色
    await page.evaluate((r) => {
      const user = { id: 1, username: r === 'admin' ? 'admin' : r === 'teacher' ? 'T2024001' : 'S20210001', realName: r === 'admin' ? '管理员' : r === 'teacher' ? '张老师' : '张同学', role: r, phone: '13800138000' };
      localStorage.setItem('scms_user', JSON.stringify(user));
    }, role);

    const dash = `/${role}/dashboard`;
    await page.goto(`${BASE}${dash}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(800);

    const navItems: Record<string, string[]> = {
      admin: ['系统总览', '竞赛审核', '用户管理', '数据统计', '公告管理', '系统日志', '系统设置'],
      teacher: ['赛事管理', '竞赛管理', '发布竞赛', '团队管理', '成绩录入', '消息通知'],
      student: ['竞赛总览', '竞赛浏览', '我的报名', '成绩查询', '消息通知'],
    };

    for (const label of navItems[role]) {
      const btn = page.locator(`.sidebar-item:has-text("${label}")`);
      if (await btn.count()) {
        await btn.click();
        await page.waitForTimeout(1000);
        log('导航', 'PASS', `[${role}]「${label}」-> ${page.url()}`);
        await page.goto(`${BASE}${dash}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(300);
      } else {
        log('导航', 'FAIL', `[${role}]「${label}」不存在`);
      }
    }

    const logout = page.locator('.sidebar-item:has-text("退出登录")');
    if (await logout.count()) {
      await logout.click();
      await page.waitForTimeout(1200);
      log('导航', page.url().includes('/login') ? 'PASS' : 'FAIL', `[${role}]退出登录 -> ${page.url()}`);
    }
  }

  // ========== 3. Admin 仪表盘 ==========
  console.log('\n=== 3. Admin 仪表盘 ===');
  await page.evaluate(() => {
    localStorage.setItem('scms_user', JSON.stringify({ id: 1, username: 'admin', realName: '管理员', role: 'admin', phone: '138' }));
  });
  await page.goto(`${BASE}/admin/dashboard`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);

  for (const a of ['审核竞赛', '用户管理', '数据统计', '系统设置']) {
    const el = page.locator(`.bento-action:has-text("${a}")`);
    if (await el.count()) {
      await el.click();
      await page.waitForTimeout(800);
      log('Admin仪表盘', 'PASS', `快捷入口「${a}」-> ${page.url()}`);
      await page.goto(`${BASE}/admin/dashboard`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(300);
    } else {
      log('Admin仪表盘', 'FAIL', `快捷入口「${a}」不存在`);
    }
  }
  log('Admin仪表盘', await page.locator('.glass-search').count() ? 'PASS' : 'FAIL', '顶部搜索框');

  // 检查数据展示
  log('Admin仪表盘', await page.locator('.bento-value').count() > 0 ? 'PASS' : 'FAIL', '数据卡片有值显示');

  // ========== 4. 学生竞赛浏览 ==========
  console.log('\n=== 4. 学生竞赛浏览 ===');
  await page.evaluate(() => {
    localStorage.setItem('scms_user', JSON.stringify({ id: 1, username: 'S20210001', realName: '张同学', role: 'student', phone: '138' }));
  });
  await page.goto(`${BASE}/student/competitions`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);

  const search = page.locator('.glass-search');
  if (await search.count()) {
    await search.fill('数学');
    await page.waitForTimeout(800);
    log('学生-竞赛', 'PASS', '搜索框可用');
  } else {
    log('学生-竞赛', 'FAIL', '搜索框不存在');
  }

  const chips = page.locator('.chip');
  const chipCount = await chips.count();
  log('学生-竞赛', chipCount > 0 ? 'PASS' : 'FAIL', `筛选chips数量:${chipCount}`);
  for (let i = 0; i < Math.min(chipCount, 3); i++) {
    const c = chips.nth(i);
    const t = await c.textContent();
    await c.click();
    await page.waitForTimeout(500);
    const a = await c.evaluate(el => el.classList.contains('active'));
    log('学生-竞赛', a ? 'PASS' : 'FAIL', `chip「${t}」选中状态`);
  }
  const regCount = await page.locator('button:has-text("立即报名")').count();
  log('学生-竞赛', 'INFO', `立即报名按钮数:${regCount}`);

  // ========== 5. 教师发布竞赛 ==========
  console.log('\n=== 5. 教师发布竞赛 ===');
  await page.evaluate(() => {
    localStorage.setItem('scms_user', JSON.stringify({ id: 1, username: 'T2024001', realName: '张老师', role: 'teacher', phone: '138' }));
  });
  await page.goto(`${BASE}/teacher/competitions/create`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);

  const inputs = await page.locator('input[type="text"]').count();
  log('教师-发布', inputs >= 2 ? 'PASS' : 'FAIL', `文本输入框数:${inputs}`);
  log('教师-发布', await page.locator('button[type="submit"]').count() ? 'PASS' : 'FAIL', '提交按钮');

  // 检查 textarea
  log('教师-发布', await page.locator('textarea').count() ? 'PASS' : 'WARN', '文本域(描述)');

  // ========== 6. 响应式 / 移动端 ==========
  console.log('\n=== 6. 响应式 ===');
  await page.setViewportSize({ width: 430, height: 932 });
  await page.goto(`${BASE}/student/dashboard`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  log('响应式', await page.locator('.ios-tab-bar').count() ? 'PASS' : 'WARN', '移动端底部导航栏');
  log('响应式', await page.locator('.desktop-sidebar').count() === 0 ? 'PASS' : 'INFO', '移动端隐藏桌面侧边栏');

  await browser.close();

  // 保存结果
  const fs = await import('fs');
  fs.writeFileSync('f:/xm/SGADQRS/frontend/audit-results.txt', results.join('\n'));
  console.log('\nDone. Saved to audit-results.txt');
})().catch(e => {
  console.error(e);
  process.exit(1);
});
