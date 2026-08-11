import { chromium } from 'playwright';

const browser = await chromium.launch();
const context = await browser.newContext();
const page = await context.newPage();

const consoleErrors = [];
page.on('console', msg => {
  if (msg.type() === 'error') consoleErrors.push(msg.text());
});

// Track visited states to avoid loops
const visitedStates = new Set();
const interactionLog = [];
let interactionCount = 0;
const MAX_INTERACTIONS = 100;

// Dangerous actions to skip
const DANGEROUS_KEYWORDS = ['删除', '移除', '禁用', '退出', '注销', '清空', '重置密码', 'Delete', 'Remove'];

function isDangerous(text) {
  return DANGEROUS_KEYWORDS.some(kw => text.includes(kw));
}

function getStateKey() {
  return page.url() + '|' + Array.from(document.querySelectorAll('button, a, input, select')).length;
}

async function getInteractiveElements() {
  return await page.evaluate(() => {
    const elements = [];
    
    // Buttons
    document.querySelectorAll('button:not([disabled])').forEach((el, i) => {
      const text = el.textContent?.trim() || '';
      const isVisible = el.offsetParent !== null;
      if (isVisible && text && text.length < 50) {
        elements.push({ type: 'button', index: i, text, selector: `button:nth-of-type(${i + 1})` });
      }
    });
    
    // Links
    document.querySelectorAll('a[href]:not([href="#"])').forEach((el, i) => {
      const text = el.textContent?.trim() || '';
      const href = el.getAttribute('href');
      const isVisible = el.offsetParent !== null;
      if (isVisible && href) {
        elements.push({ type: 'link', index: i, text: text || href, href, selector: `a:nth-of-type(${i + 1})` });
      }
    });
    
    // Inputs (search, text)
    document.querySelectorAll('input[type="text"], input[type="search"], input[placeholder]').forEach((el, i) => {
      const placeholder = el.getAttribute('placeholder') || '';
      const isVisible = el.offsetParent !== null;
      if (isVisible) {
        elements.push({ type: 'input', index: i, text: placeholder, selector: `input:nth-of-type(${i + 1})` });
      }
    });
    
    // Selects
    document.querySelectorAll('select, [role="combobox"]').forEach((el, i) => {
      const isVisible = el.offsetParent !== null;
      if (isVisible) {
        elements.push({ type: 'select', index: i, text: 'dropdown', selector: `select:nth-of-type(${i + 1})` });
      }
    });
    
    // Clickable divs/cards
    document.querySelectorAll('[class*="card"], [class*="clickable"], [role="button"]').forEach((el, i) => {
      const text = el.textContent?.trim()?.substring(0, 30) || '';
      const isVisible = el.offsetParent !== null;
      if (isVisible && text) {
        elements.push({ type: 'card', index: i, text, selector: `[class*="card"]:nth-of-type(${i + 1})` });
      }
    });
    
    return elements;
  });
}

async function interact(element) {
  const startTime = Date.now();
  consoleErrors.length = 0;
  
  try {
    switch (element.type) {
      case 'button':
        await page.click(`button:has-text("${element.text}")`, { timeout: 3000 });
        break;
      case 'link':
        await page.click(`a[href="${element.href}"]`, { timeout: 3000 });
        break;
      case 'input':
        await page.fill(element.selector, 'test', { timeout: 3000 });
        await page.waitForTimeout(500);
        await page.fill(element.selector, '', { timeout: 3000 });
        break;
      case 'select':
        await page.click(element.selector, { timeout: 3000 });
        await page.keyboard.press('Escape');
        break;
      case 'card':
        await page.click(element.selector, { timeout: 3000 });
        break;
    }
    
    await page.waitForTimeout(1000);
    
    return {
      success: true,
      errors: consoleErrors.length,
      errorMessages: [...consoleErrors],
      duration: Date.now() - startTime
    };
  } catch (e) {
    return {
      success: false,
      errors: consoleErrors.length,
      errorMessages: [...consoleErrors],
      error: e.message.substring(0, 100),
      duration: Date.now() - startTime
    };
  }
}

async function closeModals() {
  try {
    const closeBtn = await page.$('button:has-text("取消"), button:has-text("关闭"), button:has-text("Cancel"), [aria-label="Close"], button:has-text("×")');
    if (closeBtn && await closeBtn.isVisible()) {
      await closeBtn.click();
      await page.waitForTimeout(500);
    }
  } catch (e) {}
}

async function dfsExplore(depth = 0, maxDepth = 3) {
  if (depth > maxDepth || interactionCount >= MAX_INTERACTIONS) return;
  
  const stateKey = page.url();
  if (visitedStates.has(stateKey)) return;
  visitedStates.add(stateKey);
  
  const elements = await getInteractiveElements();
  
  for (const element of elements) {
    if (interactionCount >= MAX_INTERACTIONS) break;
    if (isDangerous(element.text)) continue;
    
    interactionCount++;
    console.log(`[${interactionCount}] ${element.type}: "${element.text}"`);
    
    const result = await interact(element);
    interactionLog.push({
      page: page.url(),
      element: element.text,
      type: element.type,
      ...result
    });
    
    // Close any modals that appeared
    await closeModals();
    
    // If we navigated to a new page, explore it recursively
    if (page.url() !== stateKey) {
      await dfsExplore(depth + 1, maxDepth);
      await page.goBack();
      await page.waitForTimeout(1000);
    }
  }
}

// ==================== Main Test Flow ====================

console.log('=== DFS Blind Test Starting ===\n');

// Login as admin
console.log('Logging in as admin...');
await page.goto('http://localhost:3000/login');
await page.fill('input[placeholder*="用户名"], input[type="text"]', 'admin');
await page.fill('input[type="password"]', '123456');
await page.click('button[type="submit"]');
await page.waitForURL('**/admin/**', { timeout: 10000 });
console.log('✅ Admin logged in\n');

// Explore admin pages
const adminPages = [
  '/admin/dashboard',
  '/admin/users',
  '/admin/competitions',
  '/admin/registrations',
  '/admin/grades',
  '/admin/stats',
  '/admin/notices'
];

for (const pagePath of adminPages) {
  console.log(`\n--- Exploring ${pagePath} ---`);
  await page.goto(`http://localhost:3000${pagePath}`);
  await page.waitForTimeout(2000);
  await dfsExplore(0, 2);
}

// Login as teacher
console.log('\n\nLogging in as teacher...');
await page.goto('http://localhost:3000/login');
await page.fill('input[placeholder*="用户名"], input[type="text"]', 'T2024001');
await page.fill('input[type="password"]', '123456');
await page.click('button[type="submit"]');
await page.waitForURL('**/teacher/**', { timeout: 10000 });
console.log('✅ Teacher logged in\n');

const teacherPages = [
  '/teacher/dashboard',
  '/teacher/competitions',
  '/teacher/teams',
  '/teacher/grades'
];

for (const pagePath of teacherPages) {
  console.log(`\n--- Exploring ${pagePath} ---`);
  await page.goto(`http://localhost:3000${pagePath}`);
  await page.waitForTimeout(2000);
  await dfsExplore(0, 2);
}

// Login as student
console.log('\n\nLogging in as student...');
await page.goto('http://localhost:3000/login');
await page.fill('input[placeholder*="用户名"], input[type="text"]', 'S20210001');
await page.fill('input[type="password"]', '123456');
await page.click('button[type="submit"]');
await page.waitForURL('**/student/**', { timeout: 10000 });
console.log('✅ Student logged in\n');

const studentPages = [
  '/student/dashboard',
  '/student/competitions',
  '/student/registration',
  '/student/teams',
  '/student/grades',
  '/student/history'
];

for (const pagePath of studentPages) {
  console.log(`\n--- Exploring ${pagePath} ---`);
  await page.goto(`http://localhost:3000${pagePath}`);
  await page.waitForTimeout(2000);
  await dfsExplore(0, 2);
}

await browser.close();

// ==================== Results Summary ====================

console.log('\n' + '='.repeat(80));
console.log('DFS BLIND TEST RESULTS');
console.log('='.repeat(80));

console.log(`\nTotal interactions: ${interactionCount}`);
console.log(`Pages explored: ${visitedStates.size}`);

const successful = interactionLog.filter(r => r.success && r.errors === 0);
const withErrors = interactionLog.filter(r => r.success && r.errors > 0);
const failed = interactionLog.filter(r => !r.success);

console.log(`\n✅ Successful (no errors): ${successful.length}`);
console.log(`⚠️ Successful (with errors): ${withErrors.length}`);
console.log(`❌ Failed: ${failed.length}`);

if (withErrors.length > 0) {
  console.log('\n--- Interactions with Console Errors ---');
  withErrors.forEach(r => {
    console.log(`  ⚠️ [${r.type}] "${r.element}" on ${r.page}`);
    r.errorMessages.forEach(e => console.log(`     ${e.substring(0, 120)}`));
  });
}

if (failed.length > 0) {
  console.log('\n--- Failed Interactions ---');
  failed.forEach(r => {
    console.log(`  ❌ [${r.type}] "${r.element}" on ${r.page}`);
    console.log(`     Error: ${r.error}`);
  });
}

console.log('\n' + '='.repeat(80));
