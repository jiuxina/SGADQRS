import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'

const BASE = 'http://localhost:3000'
const OUT = 'shots-sidebar'
mkdirSync(OUT, { recursive: true })

const roles = [
  { name: 'admin', label: '管理员', account: 'admin', password: '123456' },
  { name: 'teacher', label: '教师', account: 'T2024001', password: '123456' },
  { name: 'student', label: '学生', account: 'S20210001', password: '123456' },
]

const pagesByRole = {
  admin: [
    ['admin-dashboard', '/admin/dashboard'],
    ['admin-comp-list', '/admin/competitions'],
    ['admin-comp-teams', '/admin/competitions?tab=teams'],
    ['admin-comp-grades', '/admin/competitions?tab=grades'],
    ['admin-redirect-teams', '/admin/teams'],
    ['admin-redirect-grades', '/admin/grades'],
  ],
  teacher: [
    ['teacher-dashboard', '/teacher/dashboard'],
    ['teacher-competitions', '/teacher/competitions'],
  ],
  student: [
    ['student-dashboard', '/student/dashboard'],
    ['student-teams', '/student/teams'],
    ['student-teams-recruit', '/student/teams?tab=recruit'],
    ['student-history', '/student/history'],
    ['student-history-transcript', '/student/history?tab=transcript'],
    ['student-redirect-grades', '/student/grades'],
    ['student-mobile-dashboard', { path: '/student/dashboard', mobile: true }],
    ['student-mobile-teams', { path: '/student/teams', mobile: true }],
  ],
}

const browser = await chromium.launch()
const results = []

for (const role of roles) {
  const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await desktop.newPage()
  await page.goto(BASE + '/login')
  await page.getByRole('button', { name: role.label }).click()
  await page.getByPlaceholder('请输入学号或工号').fill(role.account)
  await page.getByPlaceholder('请输入密码').fill(role.password)
  await page.getByRole('button', { name: /登录/ }).click()
  try {
    await page.waitForURL('**/dashboard', { timeout: 15000 })
  } catch {
    results.push(`${role.name}: LOGIN FAILED url=${page.url()}`)
    await page.screenshot({ path: `${OUT}/${role.name}-login-fail.png` })
    await desktop.close()
    continue
  }
  results.push(`${role.name}: logged in -> ${page.url()}`)

  for (const [name, target] of pagesByRole[role.name]) {
    const path = typeof target === 'string' ? target : target.path
    const mobile = typeof target === 'object' && target.mobile
    if (mobile) {
      const mp = await (await browser.newContext({ viewport: { width: 390, height: 844 } })).newPage()
      await mp.goto(BASE + '/login')
      await mp.getByRole('button', { name: role.label }).click()
      await mp.getByPlaceholder('请输入学号或工号').fill(role.account)
      await mp.getByPlaceholder('请输入密码').fill(role.password)
      await mp.getByRole('button', { name: /登录/ }).click()
      await mp.waitForURL('**/dashboard', { timeout: 15000 })
      await mp.goto(BASE + path)
      await mp.waitForTimeout(1800)
      await mp.screenshot({ path: `${OUT}/${name}.png` })
      await mp.context().close()
    } else {
      await page.goto(BASE + path)
      await page.waitForTimeout(1800)
      await page.screenshot({ path: `${OUT}/${name}.png` })
      results.push(`  ${name}: ${page.url()}`)
    }
  }
  await desktop.close()
}

await browser.close()
console.log(results.join('\n'))
