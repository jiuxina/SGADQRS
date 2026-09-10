# 赛友 TeamUp — 前端

学生竞赛信息管理与组队社区系统（原 SCMS）的 React SPA。

## 技术栈

| 类别 | 技术 | 版本 |
|------|------|------|
| 框架 | React + TypeScript | React 19, TypeScript 6 |
| 构建 | Vite | 8.x |
| UI 样式 | Tailwind CSS | 4.x |
| 动画 | Motion (Framer Motion) | 12.x |
| 状态管理 | Zustand | 5.x |
| 路由 | React Router DOM | 7.x |
| HTTP | Axios | 1.x |
| 图标 | Lucide React | 1.x |
| 富文本 | TipTap | 3.x |

## 目录结构

```
frontend/src/
├── api/           # API 请求层
│   ├── modules/   # 按功能分组的 API 模块（10 个）
│   │   ├── auth.ts          # 认证
│   │   ├── community.ts     # 社区请求（入队申请/邀请）
│   │   ├── competition.ts   # 竞赛
│   │   ├── export.ts        # 导出
│   │   ├── notification.ts  # 站内通知
│   │   ├── recruit.ts       # 招募/求组帖
│   │   ├── registration.ts  # 参赛队伍（建队/提交/成员流动）
│   │   ├── result.ts        # 成绩
│   │   ├── system.ts        # 公告+统计+文件上传
│   │   └── user.ts          # 用户 + 社区公开资料
│   ├── request.ts  # Axios 实例 + JWT 拦截器
│   └── types.ts    # 接口类型定义
├── components/     # 通用组件（34 个 + 4 个弹窗配套 utils）
│   ├── GlassModal.tsx       # 玻璃态模态框
│   ├── DesktopLayout.tsx    # 主布局（侧边栏悬浮展开/移动壳/顶栏/标题与 favicon 角标）
│   ├── TutorialOverlay.tsx  # 页面使用教程遮罩（config/tutorials.ts 驱动）
│   ├── EntryModal.tsx       # 创建/加入队伍弹窗
│   ├── RecruitPostModal.tsx / RecruitDetailModal.tsx # 发帖/帖子详情（含联系方式）
│   ├── UserCardMini.tsx     # 嵌入式用户资料卡
│   ├── NotificationBell.tsx / UnreadFavicon.tsx # 未读铃铛 / favicon 角标
│   ├── PageErrorBoundary.tsx # 页面级错误边界
│   ├── EmptyState.tsx / ListMeta.tsx / PageSkeleton.tsx / Pagination.tsx
│   ├── Toast.tsx / ConfirmDialog.tsx / PromptDialog.tsx / EditGradeDialog.tsx # 全局弹窗
│   ├── AuthGuard.tsx        # 路由守卫
│   ├── RejectReasonModal.tsx  # 拒绝原因弹窗
│   └── ... (动画类：ConfettiEffect, CountdownTimer, SuccessCheck, FailureEffect, DigitRoller, AnimatedCounter 等)
├── config/         # 环境、常量与教程文案
│   ├── env.ts      # 读取 VITE_* 环境变量
│   ├── constants.ts # 存储 key、分页、动画常量
│   └── tutorials.ts # 全端页面使用教程分步文案
├── hooks/          # 自定义 Hooks (useFetch, usePagination, useDebounce, useIsMobile 等)
├── motion/         # 动画配置
├── pages/          # 26 个页面组件（文件名以 Admin/Teacher/Student 前缀分组，TeamDetail/UserProfilePage 三端共用）
├── store/          # Zustand 状态
│   ├── authStore.ts          # 认证状态
│   └── notificationStore.ts  # 未读数轮询（铃铛/标题/favicon 角标）
├── types/          # 类型声明
├── utils/          # 工具函数
│   ├── format.ts        # formatDate/formatDateTime, resolveCoverUrl, formatFileSize
│   ├── statusBadge.ts   # getStatusBadge (竞赛/学生视角/队伍状态)
│   ├── notification.ts  # 通知 refType → 页面跳转映射
│   ├── date.ts / export.ts
├── e2e/            # Playwright 用例 (teamup.spec.ts, baseURL 3000)
├── App.tsx         # 路由定义 + 全局弹窗容器 + 错误边界
├── main.tsx        # 入口 + 打包字体引入
└── index.css       # 全局样式 + 设计系统
```

## 设计系统

基于 iOS 26 Liquid Glass 风格，定义在 `index.css` 的 CSS 变量中：

- `--accent`, `--success`, `--warning`, `--danger` — 语义色
- `--glass-bg`, `--glass-border`, `--glass-blur` — 玻璃态参数
- `.glass-card` — 玻璃态卡片
- `.glass-modal` — 模态框
- `.glass-search` — 搜索框
- `.btn`, `.btn.primary`, `.btn.ghost`, `.btn.filled-primary` — 按钮
- `.icon-btn` — 透明无边框的图标按钮

## 关键约定

### 数据来自真实 API

所有页面数据均通过 `src/api/modules/` 中的接口从后端获取。没有模拟数据，没有 `useMock` 开关。

### 共享工具函数

日期格式化（formatDate/formatDateTime）、封面图片 URL 解析、文件大小格式化统一使用 `src/utils/format.ts`。状态徽章映射（竞赛状态、学生视角竞赛状态、队伍状态）统一使用 `src/utils/statusBadge.ts`。通知点击跳转映射统一使用 `src/utils/notification.ts`。不要在页面文件中重复定义这些函数。

### 错误处理

所有 catch 块必须同时包含：
- `toast.error(...)` — 用户可见的错误提示
- `console.error(...)` — 开发调试日志

### 加载与空状态

- 加载中统一使用 `PageSkeleton` 组件
- 空数据统一使用 `EmptyState` 组件
- 列表计数统一使用 `ListMeta` 组件

## 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `VITE_API_BASE_URL` | API 基础地址 | `http://localhost:8080/api` |
| `VITE_API_TIMEOUT` | 超时时间 (ms) | `15000` |
| `VITE_APP_TITLE` | 应用标题 | 学生竞赛信息管理系统 |
| `VITE_APP_VERSION` | 应用版本 | `1.0.0` |

## 快速开始

```bash
cd frontend
npm install
npm run dev      # 开发服务器 → http://localhost:3000
npm run build    # 生产构建 → dist/
npm run preview  # 预览构建产物
```

## 更新日志

### 2026-09 社区化与体验重构（摘要，完整记录见根目录 AGENT.md 更新日志）

1. **TeamUp 社区化 + Lean**：报名与队伍合一；新增组队中心（StudentTeams 内层四 tab：我的队伍/招募广场/收到的申请/邀请）、招募广场（StudentRecruitSquare + RecruitPostModal/RecruitDetailModal）、社区请求、消息中心（NotificationCenter）、社区公开主页（UserProfilePage）；`/student/registration`、`RegistrationModal` 等旧报名概念随之后端删表而移除，旧路由改为重定向。
2. **桌面端体验**：侧边栏图标胶囊悬浮横向展开（68→208px）、页面级错误边界（PageErrorBoundary）、路由切换回顶、标签页标题+未读数、favicon 未读角标（notificationStore/UnreadFavicon）、登录回跳与记住账号。
3. **页面使用教程**：config/tutorials.ts + TutorialOverlay 全端分步教程，每页首次访问自动弹出。
4. **全站字体对标 iOS**：打包 Inter Variable + Noto Sans SC（unicode-range 分片按需加载）。
5. **组队 2.0**：队伍详情成员行内联退队/移除/转让操作；发帖表单新增联系方式；资料互看机制下线——帖子弹窗/个人主页移除解锁门控与脱敏展示。
6. **全链路测试修复**：批量禁用/删除 API 参数、教师建赛状态机死角、全局弹层 exit 动画残留等（详见 docs/full-link-test-report/）。

### 2026-06-16 全面优化

1. **搜索防抖**：新增 `useDebounce` hook，所有搜索输入统一 300ms 防抖
2. **共享组件**：提取 `RegistrationModal`（报名弹窗）和 `RejectReasonModal`（拒绝原因弹窗）
3. **批量操作**：管理员用户列表支持批量删除/禁用，报名列表支持批量审核
4. **成绩批量录入**：教师端支持 CSV 导入和手动批量编辑
5. **加载进度条**：新增 `LoadingBar` 组件，筛选/翻页时显示滑动进度条
6. **确认对话框统一**：AdminUsers 从原生 confirm 迁移到 confirmDialog
7. **服务端搜索**：AdminGrades、AdminRegistrations 搜索改为服务端 keyword 参数
8. **统计数据修复**：AdminUsers、AdminDashboard 统计卡片改为从 stats API 获取全量数据
9. **死链接修复**：移除 4 个不存在的路由引用
10. **默认角色**：登录页默认角色从 admin 改为 student

### 2024-12-15 UI 优化

1. **卡片布局优化**：学生端各页面（竞赛浏览、成绩查询、团队管理、报名管理、参赛历史）的卡片布局从 2 列调整为 4 列，提升信息密度
2. **竞赛详情页错误处理**：添加错误边界（Error Boundary），防止页面白屏，并提供友好的错误提示
3. **悬停效果修正**：修复卡片悬停时变得更透明的问题，现在悬停时卡片会变得更不透明，符合直觉交互
4. **封面图比例统一**：赛事封面图统一为 16:9 比例显示
