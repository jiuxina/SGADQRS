import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'

const BASE = 'http://localhost:3000'
const OUT = 'shots-detail'
mkdirSync(OUT, { recursive: true })

const COMP_ID = 7 // 已发布状态的样例竞赛

const roles = [
  { name: 'teacher', label: '教师', account: 'T2024001', password: '123456' },
  { name: 'admin', label: '管理员', account: 'admin', password: '123456' },
]

const pagesByRole = {
  teacher: [
    ['teacher-comp-detail-info', `/teacher/competitions/${COMP_ID}`],
    ['teacher-comp-detail-teams', `/teacher/competitions/${COMP_ID}?tab=teams`],
    ['teacher-comp-detail-grades', `/teacher/competitions/${COMP_ID}?tab=grades`],
    ['teacher-comp-edit', `/teacher/competitions/${COMP_ID}/edit`],
  ],
  admin: [
    ['admin-comp-detail-info', `/admin/competitions/${COMP_ID}`],
    ['admin-comp-detail-teams', `/admin/competitions/${COMP_ID}?tab=teams`],
    ['admin-comp-detail-grades', `/admin/competitions/${COMP_ID}?tab=grades`],
    ['admin-notices', '/admin/notices'],
  ],
}

const browser = await chromium.launch()
const results = []

for (const role of roles) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await ctx.newPage()
  await page.goto(BASE + '/login')
  await page.getByRole('button', { name: role.label }).click()
  await page.getByPlaceholder('请输入学号或工号').fill(role.account)
  await page.getByPlaceholder('请输入密码').fill(role.password)
  await page.getByRole('button', { name: /登录/ }).click()
  await page.waitForURL('**/dashboard', { timeout: 15000 })
  results.push(`${role.name}: logged in`)

  for (const [name, path] of pagesByRole[role.name]) {
    await page.goto(BASE + path)
    await page.waitForTimeout(1800)
    await page.screenshot({ path: `${OUT}/${name}.png` })
    results.push(`  ${name}: ${page.url()}`)
  }
  await ctx.close()
}

await browser.close()
console.log(results.join('\n'))
