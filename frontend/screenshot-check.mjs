import { chromium } from 'playwright';

const BASE = 'http://localhost:3001';
const OUT = 'C:\\Users\\jiuxi\\.qoderworkcn\\workspace\\mqdd2jlmgexuo2sv\\screenshots';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();

  // 1. Login as admin
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${OUT}/01-login.png`, fullPage: false });

  // Fill login form and submit
  const usernameInput = page.locator('input[type="text"], input[placeholder*="用户名"], input[placeholder*="账号"]').first();
  const passwordInput = page.locator('input[type="password"]').first();
  
  if (usernameInput && passwordInput) {
    await usernameInput.fill('admin');
    await passwordInput.fill('123456');
    await page.waitForTimeout(200);
    
    const loginBtn = page.locator('button:has-text("登录"), button:has-text("登 录")').first();
    if (loginBtn) await loginBtn.click();
    await page.waitForTimeout(1500);
  }

  // 2. Admin Dashboard
  await page.goto(`${BASE}/admin/dashboard`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${OUT}/02-admin-dashboard.png`, fullPage: false });

  // 3. Admin Org Tree (Image 1 equivalent)
  await page.goto(`${BASE}/admin/org-tree`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${OUT}/03-admin-org-tree.png`, fullPage: false });

  // 4. Admin Settings (Image 2 equivalent)
  await page.goto(`${BASE}/admin/settings`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${OUT}/04-admin-settings.png`, fullPage: false });

  // 5. Admin Users (table page)
  await page.goto(`${BASE}/admin/users`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${OUT}/05-admin-users.png`, fullPage: false });

  // 6. Login as student
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  
  // Switch to student role if possible
  const studentTab = page.locator('button:has-text("学生"), [data-role="student"]').first();
  try { await studentTab.click(); } catch {}
  await page.waitForTimeout(300);

  const uInput2 = page.locator('input[type="text"], input[placeholder*="用户名"], input[placeholder*="账号"]').first();
  const pInput2 = page.locator('input[type="password"]').first();
  if (uInput2 && pInput2) {
    await uInput2.fill('student1');
    await pInput2.fill('123456');
    await page.waitForTimeout(200);
    const loginBtn2 = page.locator('button:has-text("登录"), button:has-text("登 录")').first();
    if (loginBtn2) await loginBtn2.click();
    await page.waitForTimeout(1500);
  }

  // 7. Student Grades (Image 4 equivalent)
  await page.goto(`${BASE}/student/grades`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${OUT}/06-student-grades.png`, fullPage: false });

  // 8. Profile Page (Image 3 equivalent)
  await page.goto(`${BASE}/profile`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${OUT}/07-profile.png`, fullPage: false });

  // 9. Student Competitions
  await page.goto(`${BASE}/student/competitions`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${OUT}/08-student-competitions.png`, fullPage: false });

  await browser.close();
  console.log('All screenshots saved to', OUT);
}

main().catch(console.error);
