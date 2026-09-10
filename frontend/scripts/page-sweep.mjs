// 逐页面 UI 完整性/容错遍历（真实全栈；一次性审计脚本，node scripts/page-sweep.mjs）
import { chromium } from 'playwright'
import fs from 'fs'

const BASE = 'http://localhost:3000'
const API = 'http://localhost:8080/api'
const OUT = 'test-results/sweep'
fs.mkdirSync(OUT, { recursive: true })

async function login(username, password) {
  const r = await fetch(API + '/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) })
  const j = await r.json()
  if (j.code !== 200) throw new Error('login failed: ' + j.message)
  return j.data
}

const results = []
function log(section, status, message) {
  const line = `[${section}] ${status}: ${message}`
  results.push(line)
  console.log(line)
}

async function newCtx(browser, auth) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await ctx.newPage()
  const errs = []
  page.on('pageerror', e => errs.push('PAGEERROR ' + String(e.message).slice(0, 120)))
  page.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text().slice(0, 120)) })
  page.on('response', r => {
    const u = r.url()
    if (u.includes('/api/') && r.status() >= 400) errs.push(`HTTP${r.status()} ${u.replace(BASE, '').replace(API, '')}`)
  })
  if (auth) {
    await page.addInitScript(a => {
      localStorage.setItem('scms_token', a.token)
      localStorage.setItem('scms_user', JSON.stringify(a.user))
    }, auth)
  }
  return { ctx, page, errs }
}

async function visit(page, errs, label, path) {
  const before = errs.length
  await page.goto(BASE + path, { waitUntil: 'domcontentloaded', timeout: 25000 })
  await page.waitForTimeout(2600)
  await page.keyboard.press('Escape').catch(() => {})
  await page.waitForTimeout(400)
  const text = await page.evaluate(() => document.body.innerText).catch(() => '')
  const shot = OUT + '/' + label.replace(/[^\w.-]/g, '_') + '.png'
  await page.screenshot({ path: shot }).catch(() => {})
  const newErrs = errs.slice(before)
  const crashed = text.includes('页面出现了意外错误')
  const blank = text.replace(/\s/g, '').length < 30
  log(label, newErrs.length === 0 && !crashed && !blank ? 'PASS' : (crashed || blank ? 'FAIL' : 'WARN'),
    `url=${page.url().replace(BASE, '')} textLen=${text.length}` + (newErrs.length ? ' issues: ' + newErrs.join(' | ') : ''))
  return { url: page.url().replace(BASE, ''), text, errs: newErrs }
}

const browser = await chromium.launch({ headless: true })

const ROLES = {
  admin: { cred: ['admin', '123456'], routes: [
    ['admin_dashboard', '/admin/dashboard'], ['admin_competitions', '/admin/competitions'],
    ['admin_comp_detail', '/admin/competitions/1'], ['admin_comp_edit', '/admin/competitions/1/edit'],
    ['admin_team_detail', '/admin/competitions/team/1'], ['admin_teams_redirect', '/admin/teams'],
    ['admin_grades_redirect', '/admin/grades'], ['admin_users', '/admin/users'],
    ['admin_stats', '/admin/stats'], ['admin_notices', '/admin/notices'], ['admin_profile', '/profile'],
  ] },
  teacher: { cred: ['T2024001', '123456'], routes: [
    ['teacher_dashboard', '/teacher/dashboard'], ['teacher_competitions', '/teacher/competitions'],
    ['teacher_create', '/teacher/competitions/create'], ['teacher_comp_detail', '/teacher/competitions/1'],
    ['teacher_comp_edit', '/teacher/competitions/1/edit'], ['teacher_teams', '/teacher/teams'],
    ['teacher_team_detail', '/teacher/teams/detail/1'], ['teacher_profile', '/profile'],
  ] },
  student: { cred: ['S20210001', '123456'], routes: [
    ['student_dashboard', '/student/dashboard'], ['student_competitions', '/student/competitions'],
    ['student_comp_detail', '/student/competitions/6'], ['student_comp_detail_noreg', '/student/competitions/1'],
    ['student_teams', '/student/teams'], ['student_recruit_tab', '/student/teams?tab=recruit'],
    ['student_recruit_redirect', '/student/recruit'], ['student_grades_redirect', '/student/grades'],
    ['student_history', '/student/history'], ['student_notifications', '/student/notifications'],
    ['student_public_profile', '/student/u/2'], ['student_profile', '/profile'],
    ['student_team_detail_notmember', '/student/teams/detail/999999'],
    ['student_comp_detail_notfound', '/student/competitions/999999'],
  ] },
}

// ---------- 1. 正向页面遍历 ----------
for (const [role, cfg] of Object.entries(ROLES)) {
  const auth = await login(...cfg.cred)
  const { ctx, page, errs } = await newCtx(browser, auth)
  for (const [label, path] of cfg.routes) await visit(page, errs, label, path)
  // ---------- 2. 路由守卫负例 ----------
  if (role === 'student') {
    const v = await visit(page, errs, 'guard_student_to_admin', '/admin/users')
    log('guard_student_to_admin_expect', v.url.startsWith('/student/dashboard') ? 'PASS' : 'FAIL', 'final=' + v.url)
  }
  if (role === 'teacher') {
    const v = await visit(page, errs, 'guard_teacher_to_admin', '/admin/stats')
    log('guard_teacher_to_admin_expect', v.url.startsWith('/teacher/dashboard') ? 'PASS' : 'FAIL', 'final=' + v.url)
    const v2 = await visit(page, errs, 'guard_teacher_to_student', '/student/teams')
    log('guard_teacher_to_student_expect', v2.url.startsWith('/teacher/dashboard') ? 'PASS' : 'FAIL', 'final=' + v2.url)
  }
  if (role === 'admin') {
    const v = await visit(page, errs, 'guard_admin_to_unknown', '/definitely-not-a-page')
    log('guard_unknown_path_behaviour', 'INFO', 'admin 访问未知路径最终落点=' + v.url)
  }
  // ---------- 3. 表单容错抽查 ----------
  if (role === 'admin') {
    // 用户导出按钮(静态审计断链 /export/users)
    await page.goto(BASE + '/admin/users', { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(2500); await page.keyboard.press('Escape'); await page.waitForTimeout(300)
    const before = errs.length
    await page.getByRole('button', { name: /导出/ }).first().click().catch(e => log('ui_export_click', 'WARN', '按钮未找到'))
    await page.waitForTimeout(2500)
    const t = await page.evaluate(() => document.body.innerText)
    log('ui_admin_export_users', errs.slice(before).some(e => e.includes('/export/users') && e.startsWith('HTTP4')) ? 'FAIL' : 'PASS',
      `导出点击后 toast含导出失败=${t.includes('导出失败')} 网络: ${errs.slice(before).join(' | ') || '无'}`)
    // 用户搜索无结果空态
    await page.goto(BASE + '/admin/users', { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(2200)
    const inp = page.locator('input[placeholder*="搜索"], input[placeholder*="用户名"], input[placeholder*="姓名"], input[placeholder*="关键"]').first()
    if (await inp.count()) { await inp.fill('zzz不存在的关键字999'); await page.waitForTimeout(2000)
      const t2 = await page.evaluate(() => document.body.innerText)
      log('ui_admin_users_search_nomatch', t2.replace(/\s/g, '').length > 30 ? 'PASS' : 'FAIL', '空态或结果区正常渲染')
    } else log('ui_admin_users_search_nomatch', 'WARN', '未定位到搜索框')
  }
  if (role === 'teacher') {
    // 发布竞赛空表单提交 → 逐字段校验提示
    await page.goto(BASE + '/teacher/competitions/create', { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(2500); await page.keyboard.press('Escape'); await page.waitForTimeout(300)
    await page.getByRole('button', { name: /发布竞赛/ }).click().catch(() => {})
    await page.waitForTimeout(1200)
    const t = await page.evaluate(() => document.body.innerText)
    const hints = ['请输入竞赛名称', '请输入主办单位', '请选择报名开始时间'].filter(x => t.includes(x))
    log('ui_teacher_create_empty_submit', hints.length >= 2 ? 'PASS' : 'WARN', `字段校验提示命中: ${hints.join(',')}`)
    // 时间顺序校验
    const inputs = page.locator('input[type="datetime-local"]')
    const n = await inputs.count()
    if (n >= 2) {
      await inputs.nth(0).fill('2026-12-10T00:00')
      await inputs.nth(1).fill('2026-12-01T00:00')
      await page.getByRole('button', { name: /发布竞赛/ }).click().catch(() => {})
      await page.waitForTimeout(1000)
      const t2 = await page.evaluate(() => document.body.innerText)
      log('ui_teacher_create_time_order', t2.includes('报名截止时间必须晚于报名开始时间') ? 'PASS' : 'WARN',
        '前端时间顺序校验提示=' + t2.includes('报名截止时间必须晚于报名开始时间'))
    } else log('ui_teacher_create_time_order', 'WARN', '未找到 datetime-local 输入 ' + n)
  }
  await ctx.close()
}

// ---------- 4. 匿名守卫 + 登录页容错 ----------
{
  const { ctx, page, errs } = await newCtx(browser, null)
  for (const [label, path] of [['anon_admin_dash', '/admin/dashboard'], ['anon_student_teams', '/student/teams'], ['anon_profile', '/profile']]) {
    const v = await visit(page, errs, label, path)
    log(label + '_redirect', v.url.includes('/login') ? 'PASS' : 'FAIL', 'final=' + v.url)
  }
  // 空表单提交
  await page.goto(BASE + '/login', { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(2000)
  await page.getByRole('button', { name: /登录/ }).click().catch(() => {})
  await page.waitForTimeout(1000)
  let t = await page.evaluate(() => document.body.innerText)
  log('ui_login_empty_submit', !page.url().includes('/student') && !page.url().includes('/admin') ? 'PASS' : 'FAIL',
    `停留在登录页; 提示文案含必填=${/请输入|不能为空|请填写/.test(t)}`)
  // 错误密码
  await page.getByRole('button', { name: '学生' }).click().catch(() => {})
  await page.getByPlaceholder('请输入学号或工号').fill('S20210001')
  await page.getByPlaceholder('请输入密码').fill('wrongpass')
  await page.getByRole('button', { name: /登录/ }).click()
  await page.waitForTimeout(1800)
  t = await page.evaluate(() => document.body.innerText)
  log('ui_login_wrong_password', t.includes('账号或密码错误') ? 'PASS' : 'WARN', 'toast=' + (t.match(/账号或密码错误/) || '未见')[0])
  // 角色不匹配(选学生但输管理员)
  await page.getByPlaceholder('请输入密码').fill('123456')
  await page.getByPlaceholder('请输入学号或工号').fill('admin')
  await page.getByRole('button', { name: /登录/ }).click()
  await page.waitForTimeout(1800)
  t = await page.evaluate(() => document.body.innerText)
  log('ui_login_role_mismatch', t.includes('账号或密码错误') && page.url().includes('/login') ? 'PASS' : 'WARN',
    `不泄露角色差异; url=${page.url().replace(BASE, '')}`)
  await ctx.close()
}

await browser.close()
const fails = results.filter(r => r.includes(': FAIL'))
console.log(`\n===== sweep 完成: ${results.length} 项, FAIL=${fails.length} =====`)
for (const f of fails) console.log(f)
