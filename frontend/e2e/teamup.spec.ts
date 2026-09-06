import { test, expect } from '@playwright/test'

/**
 * TeamUp 基础冒烟：登录学生账号 → 招募广场 → 组队中心 → 竞赛列表。
 * 需要后端(8080)与前端 dev server(3000) 已启动。
 */
test.describe('TeamUp 冒烟', () => {
  test('学生登录后可访问社区核心页面', async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('button', { name: '学生' }).click()
    await page.getByPlaceholder('请输入学号或工号').fill('S20210001')
    await page.getByPlaceholder('请输入密码').fill('123456')
    await page.getByRole('button', { name: /登录/ }).click()
    await page.waitForURL('**/student/dashboard', { timeout: 10000 })

    // 招募广场（组队中心的子标签）
    await page.goto('/student/teams?tab=recruit')
    await expect(page.getByText('招募广场').first()).toBeVisible({ timeout: 10000 })

    // 组队中心
    await page.goto('/student/teams')
    await expect(page.getByText('我的队伍').first()).toBeVisible({ timeout: 10000 })

    // 竞赛列表
    await page.goto('/student/competitions')
    await expect(page.getByText('竞赛').first()).toBeVisible({ timeout: 10000 })
  })
})
