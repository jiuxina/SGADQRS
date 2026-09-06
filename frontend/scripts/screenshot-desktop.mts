import { chromium } from 'playwright'

const BASE = 'http://localhost:3006'
const OUT = 'F:/xm/SGADQRS/.omo/evidence'

async function main() {
  const browser = await chromium.launch()
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 })

  // 1. Login
  const loginPage = await ctx.newPage()
  await loginPage.goto(`${BASE}/login`)
  await loginPage.waitForTimeout(800)
  await loginPage.screenshot({ path: `${OUT}/desktop_login.png`, fullPage: false })
  console.log('✓ desktop_login.png')

  // 2. Admin Dashboard
  const dashPage = await ctx.newPage()
  await dashPage.goto(`${BASE}/admin/dashboard`)
  await dashPage.waitForTimeout(1000)
  await dashPage.screenshot({ path: `${OUT}/desktop_dashboard.png`, fullPage: false })
  console.log('✓ desktop_dashboard.png')

  // 3. Student Audit
  const auditPage = await ctx.newPage()
  await auditPage.goto(`${BASE}/student/audit`)
  await auditPage.waitForTimeout(800)
  await auditPage.screenshot({ path: `${OUT}/desktop_audit.png`, fullPage: false })
  console.log('✓ desktop_audit.png')

  // 4. Teacher Dashboard
  const teacherPage = await ctx.newPage()
  await teacherPage.goto(`${BASE}/teacher/dashboard`)
  await teacherPage.waitForTimeout(800)
  await teacherPage.screenshot({ path: `${OUT}/desktop_teacher.png`, fullPage: false })
  console.log('✓ desktop_teacher.png')

  // 5. Teacher Dashboard with selected student
  await teacherPage.click('tr.clickable-row >> nth=0')
  await teacherPage.waitForTimeout(600)
  await teacherPage.screenshot({ path: `${OUT}/desktop_teacher_detail.png`, fullPage: false })
  console.log('✓ desktop_teacher_detail.png')

  await browser.close()
}

main().catch(console.error)
