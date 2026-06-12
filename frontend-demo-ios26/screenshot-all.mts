import { chromium } from 'playwright'

const BASE = 'http://localhost:3006'
const OUT = 'F:/xm/SGADQRS/.omo/evidence'

async function main() {
  const browser = await chromium.launch()
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 })

  const shots: [string, string][] = [
    // Login
    ['desktop_login', '/login'],
    // Admin pages
    ['admin_dashboard', '/admin/dashboard'],
    ['admin_competitions', '/admin/competitions'],
    ['admin_users', '/admin/users'],
    ['admin_stats', '/admin/stats'],
    ['admin_notices', '/admin/notices'],
    ['admin_logs', '/admin/logs'],
    ['admin_settings', '/admin/settings'],
    // Teacher pages
    ['teacher_dashboard', '/teacher/dashboard'],
    ['teacher_competitions', '/teacher/competitions'],
    ['teacher_create', '/teacher/competitions/create'],
    ['teacher_teams', '/teacher/teams'],
    ['teacher_grades', '/teacher/grades'],
    ['teacher_messages', '/teacher/messages'],
    // Student pages
    ['student_dashboard', '/student/dashboard'],
    ['student_competitions', '/student/competitions'],
    ['student_registration', '/student/registration'],
    ['student_grades', '/student/grades'],
    ['student_messages', '/student/messages'],
  ]

  for (const [name, path] of shots) {
    const page = await ctx.newPage()
    await page.goto(`${BASE}${path}`)
    await page.waitForTimeout(800)
    await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: false })
    console.log(`✓ ${name}.png`)
    await page.close()
  }

  await browser.close()
}

main().catch(console.error)
