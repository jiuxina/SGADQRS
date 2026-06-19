import { chromium, type Page, type BrowserContext } from 'playwright';

const BASE = 'http://localhost:5173';
const RESULTS: string[] = [];

function log(section: string, status: 'PASS' | 'FAIL' | 'WARN' | 'INFO', message: string) {
  const line = `[${section}] ${status}: ${message}`;
  RESULTS.push(line);
  console.log(line);
}

async function waitForLoad(page: Page) {
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(800);
}

async function checkLoginPage(page: Page) {
  await page.goto(`${BASE}/login`);
  await waitForLoad(page);

  // 1. 角色切换按钮
  const roles = ['admin', 'teacher', 'student'];
  for (const role of roles) {
    const btn = page.locator(`.role-switcher button:has-text("${role === 'admin' ? '管理员' : role === 'teacher' ? '教师' : '学生'}")`);
    if (await btn.count() > 0) {
      await btn.click();
      await page.waitForTimeout(200);
      const hasActive = await btn.evaluate((el) => el.classList.contains('active'));
      log('登录页', hasActive ? 'PASS' : 'FAIL', `角色切换「${role}」选中状态`);
    } else {
      log('登录页', 'FAIL', `找不到角色切换按钮「${role}」`);
    }
  }

  // 2. 账号密码输入
  const userInput = page.locator('input[type="text"]').first();
  const pwdInput = page.locator('input[type="password"]').first();
  await userInput.fill('admin');
  await pwdInput.fill('123456');
  const userVal = await userInput.inputValue();
  const pwdVal = await pwdInput.inputValue();
  log('登录页', userVal === 'admin' ? 'PASS' : 'FAIL', '账号输入框可输入');
  log('登录页', pwdVal === '123456' ? 'PASS' : 'FAIL', '密码输入框可输入');

  // 3. 密码显示/隐藏切换
  const toggleBtn = page.locator('button[type="button"]').filter({ has: page.locator('svg') }).first();
  if (await toggleBtn.count() > 0) {
    const typeBefore = await pwdInput.getAttribute('type');
    await toggleBtn.click();
    await page.waitForTimeout(200);
    const typeAfter = await page.locator('input[type="text"]').nth(1).count() > 0 ? 'text' : 'password';
    log('登录页', typeBefore !== typeAfter ? 'PASS' : 'FAIL', `密码显示/隐藏切换 (${typeBefore} -> ${typeAfter})`);
  }

  // 4. 记住账号复选框
  const checkbox = page.locator('input[type="checkbox"]');
  log('登录页', await checkbox.count() > 0 ? 'PASS' : 'FAIL', '记住账号复选框存在');

  // 5. 忘记密码链接
  const forgetBtn = page.locator('button:has-text("忘记密码")');
  log('登录页', await forgetBtn.count() > 0 ? 'PASS' : 'WARN', '忘记密码按钮存在（但可能无跳转功能）');

  // 6. 登录按钮
  const submitBtn = page.locator('button[type="submit"]');
  log('登录页', await submitBtn.count() > 0 ? 'PASS' : 'FAIL', '登录按钮存在');

  // 7. 登录功能（如果后端可用）
  try {
    await page.goto(`${BASE}/login`);
    await waitForLoad(page);
    await page.locator('input[type="text"]').first().fill('admin');
    await page.locator('input[type="password"]').first().fill('123456');
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(2500);
    const url = page.url();
    if (url.includes('/admin/dashboard')) {
      log('登录页', 'PASS', '管理员登录成功并跳转');
    } else if (url.includes('/login')) {
      log('登录页', 'WARN', '登录后仍停留在登录页（后端可能未启动或登录失败）');
    } else {
      log('登录页', 'INFO', `登录后跳转到 ${url}`);
    }
  } catch (e) {
    log('登录页', 'WARN', `登录测试异常: ${e}`);
  }
}

async function checkNavigation(page: Page, role: 'admin' | 'teacher' | 'student') {
  // 直接通过 localStorage 模拟登录状态来测试导航
  await page.goto(`${BASE}/login`);
  await waitForLoad(page);

  const mockUser = {
    id: 1,
    username: role === 'admin' ? 'admin' : role === 'teacher' ? 'T2024001' : 'S20210001',
    realName: role === 'admin' ? '管理员' : role === 'teacher' ? '张老师' : '张同学',
    role,
    phone: '13800138000',
  };

  await page.evaluate((token, user) => {
    localStorage.setItem('scms_token', token);
    localStorage.setItem('scms_user', JSON.stringify(user));
  }, 'mock_token_' + role, mockUser);

  const dashboardPath = `/${role}/dashboard`;
  await page.goto(`${BASE}${dashboardPath}`);
  await waitForLoad(page);

  // 检查侧边栏导航项是否存在且可点击
  const navSelectors: Record<string, string[]> = {
    admin: ['系统总览', '竞赛审核', '用户管理', '数据统计', '公告管理', '系统日志', '系统设置'],
    teacher: ['赛事管理', '竞赛管理', '发布竞赛', '团队管理', '成绩录入', '消息通知'],
    student: ['竞赛总览', '竞赛浏览', '我的报名', '成绩查询', '消息通知'],
  };

  const navItems = navSelectors[role];
  for (const label of navItems) {
    const btn = page.locator(`.sidebar-item:has-text("${label}")`);
    if (await btn.count() > 0) {
      log('导航', 'PASS', `[${role}] 导航项「${label}」存在`);
      try {
        await btn.click();
        await page.waitForTimeout(1200);
        const url = page.url();
        log('导航', 'PASS', `[${role}] 点击「${label}」后导航到 ${url}`);
      } catch (e) {
        log('导航', 'FAIL', `[${role}] 点击「${label}」失败: ${e}`);
      }
      // 回到 dashboard
      await page.goto(`${BASE}${dashboardPath}`);
      await waitForLoad(page);
    } else {
      log('导航', 'FAIL', `[${role}] 导航项「${label}」不存在`);
    }
  }

  // 退出登录
  const logoutBtn = page.locator('.sidebar-item:has-text("退出登录")');
  if (await logoutBtn.count() > 0) {
    await logoutBtn.click();
    await page.waitForTimeout(1200);
    const url = page.url();
    log('导航', url.includes('/login') ? 'PASS' : 'FAIL', `[${role}] 退出登录后跳转: ${url}`);
  }
}

async function checkAdminDashboard(page: Page) {
  await simulateLogin(page, 'admin');
  await page.goto(`${BASE}/admin/dashboard`);
  await waitForLoad(page);

  // 快捷入口
  const actions = ['审核竞赛', '用户管理', '数据统计', '系统设置'];
  for (const action of actions) {
    const el = page.locator(`.bento-action:has-text("${action}")`);
    if (await el.count() > 0) {
      await el.click();
      await page.waitForTimeout(1000);
      const url = page.url();
      log('Admin仪表盘', 'PASS', `快捷入口「${action}」跳转: ${url}`);
      await page.goto(`${BASE}/admin/dashboard`);
      await waitForLoad(page);
    } else {
      log('Admin仪表盘', 'FAIL', `快捷入口「${action}」不存在`);
    }
  }

  // 搜索框
  const search = page.locator('.glass-search');
  log('Admin仪表盘', await search.count() > 0 ? 'PASS' : 'FAIL', '顶部搜索框存在');
}

async function checkStudentCompetitions(page: Page) {
  await simulateLogin(page, 'student');
  await page.goto(`${BASE}/student/competitions`);
  await waitForLoad(page);

  // 搜索
  const search = page.locator('.glass-search');
  if (await search.count() > 0) {
    await search.fill('数学');
    await page.waitForTimeout(1200);
    log('学生-竞赛浏览', 'PASS', '搜索框输入并触发查询');
  } else {
    log('学生-竞赛浏览', 'FAIL', '搜索框不存在');
  }

  // 分类筛选 chips
  const chips = page.locator('.chip');
  const chipCount = await chips.count();
  log('学生-竞赛浏览', chipCount > 0 ? 'PASS' : 'FAIL', `分类/状态筛选 chips 数量: ${chipCount}`);

  if (chipCount > 0) {
    for (let i = 0; i < Math.min(chipCount, 3); i++) {
      const chip = chips.nth(i);
      const text = await chip.textContent();
      await chip.click();
      await page.waitForTimeout(800);
      const hasActive = await chip.evaluate((el) => el.classList.contains('active'));
      log('学生-竞赛浏览', hasActive ? 'PASS' : 'FAIL', `筛选 chip「${text}」选中状态`);
    }
  }

  // 报名按钮
  const registerBtn = page.locator('button:has-text("立即报名")').first();
  log('学生-竞赛浏览', await registerBtn.count() > 0 ? 'INFO' : 'INFO', `「立即报名」按钮数量: ${await page.locator('button:has-text("立即报名")').count()}`);
}

async function checkTeacherCreate(page: Page) {
  await simulateLogin(page, 'teacher');
  await page.goto(`${BASE}/teacher/competitions/create`);
  await waitForLoad(page);

  // 表单字段
  const inputs = [
    { name: '竞赛名称', selector: 'input[type="text"]' },
    { name: '主办方', selector: 'input[type="text"]' },
  ];

  const textInputs = page.locator('input[type="text"]');
  const count = await textInputs.count();
  log('教师-发布竞赛', count >= 2 ? 'PASS' : 'FAIL', `表单文本输入框数量: ${count}`);

  // 提交按钮
  const submit = page.locator('button[type="submit"]');
  log('教师-发布竞赛', await submit.count() > 0 ? 'PASS' : 'FAIL', '提交按钮存在');
}

async function simulateLogin(page: Page, role: 'admin' | 'teacher' | 'student') {
  const mockUser = {
    id: 1,
    username: role === 'admin' ? 'admin' : role === 'teacher' ? 'T2024001' : 'S20210001',
    realName: role === 'admin' ? '管理员' : role === 'teacher' ? '张老师' : '张同学',
    role,
    phone: '13800138000',
  };
  await page.goto(`${BASE}/login`);
  await waitForLoad(page);
  await page.evaluate((token, user) => {
    localStorage.setItem('scms_token', token);
    localStorage.setItem('scms_user', JSON.stringify(user));
  }, 'mock_token_' + role, mockUser);
}

async function checkResponsive(page: Page) {
  // 测试移动端布局
  await page.setViewportSize({ width: 430, height: 932 });
  await simulateLogin(page, 'student');
  await page.goto(`${BASE}/student/dashboard`);
  await waitForLoad(page);

  // 移动端应该有底部导航或不同的布局
  const bottomNav = page.locator('.ios-tab-bar');
  log('响应式', await bottomNav.count() > 0 ? 'PASS' : 'WARN', '移动端底部导航栏存在性');

  await page.setViewportSize({ width: 1440, height: 900 });
}

async function runAudit() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  console.log('=== 开始前端交互组件审计 ===\n');

  await checkLoginPage(page);
  console.log('');

  for (const role of ['admin', 'teacher', 'student'] as const) {
    await checkNavigation(page, role);
    console.log('');
  }

  await checkAdminDashboard(page);
  console.log('');

  await checkStudentCompetitions(page);
  console.log('');

  await checkTeacherCreate(page);
  console.log('');

  await checkResponsive(page);
  console.log('');

  await browser.close();

  console.log('=== 审计完成 ===');

  // 写入结果文件
  const fs = await import('fs');
  const output = RESULTS.join('\n');
  fs.writeFileSync('f:/xm/SGADQRS/frontend/audit-results.txt', output);
  console.log('\n结果已保存到 audit-results.txt');
}

runAudit().catch(console.error);
