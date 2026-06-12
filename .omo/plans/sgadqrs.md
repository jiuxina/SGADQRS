# 学生毕业及学位资格审查系统 — 工作计划

## TL;DR

> **快速摘要**: 构建一个辅助教务处、院系负责人快速发现问题学生的毕业资格审核系统，采用 React + Express + MySQL 技术栈，适配高校 4 核 8G 低资源环境。
> 
> **交付物**:
> - 前端：React 18 + TypeScript + Vite + shadcn/ui
> - 后端：Express.js + TypeScript + Prisma ORM
> - 数据库：MySQL 8.0（7 张核心表）
> - 功能：数据导入、培养方案管理、试审核/正式审核、多级审核流程、人工标记、报表导出
> 
> **预估工作量**: Large（约 22 天）
> **并行执行**: YES - 4 个 Wave
> **关键路径**: Task 1 → Task 4 → Task 8 → Task 12 → Task 16 → F1-F4

---

## Context

### 原始需求
基于 `plan-final.md` 的完整需求规格，构建一个"毕业资格审核辅助决策系统"：
- 辅助教务处、院系负责人、教师快速发现问题学生
- 减少人工计算错误
- 最终审核决策仍由人工完成
- 适配高校低资源服务器环境（4 核 8G）

### 关键技术决策
1. **Express 替代 NestJS**: 减少装饰器、依赖注入，代码更直观，高校 IT 人员易维护
2. **MySQL 替代 PostgreSQL**: 与高校现有技术栈一致
3. **无 Redis/BullMQ**: 初期用 MySQL 任务表实现异步
4. **Excel 导入优先**: 提供标准模板，支持批量导入
5. **规则配置用 JSON 文件**: 初期通过修改配置文件 + 发版实现
6. **试审核/正式审核双模式**: `trial`（预览不保存）+ `official`（锁定记录）
7. **多级审核状态机**: `draft` → `initial` → `dept` → `committee` → `approved`/`rejected`
8. **人工标记表**: 单独 `manual_overrides` 表记录人工调整

### 核心原则
| 原则 | 说明 |
|------|------|
| 简单优先 | 能用 Excel 解决的，不上系统 |
| 人工兜底 | 所有自动审核结果必须支持人工调整 |
| 渐进上线 | 先上一届试运行，逐步推广 |
| 降低预期 | 明确告知用户这是"辅助工具" |
| 留好退路 | 系统出问题，能快速导出数据回到手工模式 |

---

## Work Objectives

### 核心目标
在 22 天内完成毕业资格审核辅助决策系统的开发、测试和部署，支持 P0 必须上线功能和 P1 重要功能。

### 具体交付物
- 完整的前后端代码（单仓库结构）
- 数据库迁移脚本和种子数据
- API 接口文档
- 部署文档和操作手册
- Excel 导入模板（学生/课程/成绩）

### 完成标准
- [ ] 所有 P0 功能可正常使用
- [ ] 核心 P1 功能可正常使用
- [ ] 单学生审核 < 3 秒
- [ ] 批量审核支持 100 人/批次
- [ ] 并发支持 200+ 用户
- [ ] 单元测试覆盖率 ≥ 60%
- [ ] 在 4 核 8G 环境稳定运行

### Must Have
- 数据导入（Excel 模板：学生、课程、成绩）
- 培养方案管理（各专业毕业要求配置）
- 学生毕业条件预警（提前一学期告知"还差什么"）
- 教务处审核辅助看板（快速筛选问题学生）
- 审核报表导出（学位委员会需要的表格）
- 试审核模式（预览不保存）+ 正式审核模式（锁定记录）
- 多级审核流程（初核→复核→审议→批准）
- 人工标记（特殊情况手动调整并记录原因）
- 成绩录入状态（区分"未录入"和"不合格"）

### Must NOT Have (防护栏)
- 不做可视化规则编辑器（初期用 JSON 配置文件）
- 不做学生端查询页面（可先由辅导员转发）
- 不做消息通知（站内信/邮件）
- 不使用 Redis 或 BullMQ（初期用 MySQL 任务表）
- 不使用 Docker 部署（用 PM2 + Nginx）
- 不做过度抽象的架构（保持简单直观）

---

## Design Specifications (HarmonyOS 6)

> 本系统采用 HarmonyOS 6 (HDS) 设计规范，确保界面与鸿蒙生态保持一致的视觉体验。
> 参考文档：https://developer.huawei.com/consumer/cn/doc/design-guides/

### 设计原则

| 原则 | 说明 | 实践 |
|------|------|------|
| **一致性** | 与 HarmonyOS 系统应用保持统一视觉风格 | 使用标准设计 Token，参考系统应用（设置、相机、画廊） |
| **易用性** | 界面简洁直观，降低学习成本 | 三步操作原则，清晰的状态反馈 |
| **效率** | 快速完成任务，减少等待 | 批量操作、快捷键、进度提示 |
| **美感** | 高端精致的视觉品质 | 恰当的留白、层次感、动效 |

### 设计 Token 系统

#### 间距系统（4vp 基础单位）

```css
/* Tailwind CSS 自定义间距 */
--spacing-xs: 0.25rem;    /* 4px */
--spacing-sm: 0.5rem;     /* 8px */
--spacing-md: 1rem;       /* 16px */
--spacing-lg: 1.5rem;     /* 24px */
--spacing-xl: 2rem;       /* 32px */
--spacing-2xl: 3rem;      /* 48px */
--spacing-3xl: 4rem;      /* 64px */
```

**使用规则**：
- 元素紧密相关：4px / 8px
- 同区块内：12px / 16px
- 区块之间：24px / 32px
- 大区域分隔：48px / 64px

#### 字号阶梯（fp → rem）

| 层级 | fp | rem | Tailwind | 用途 |
|------|-----|------|----------|------|
| caption | 11 | 0.6875 | text-xs | 辅助说明、时间戳 |
| body3 | 12 | 0.75 | text-sm | 次要正文 |
| body2 | 14 | 0.875 | text-base | 正文（默认） |
| body1 | 16 | 1 | text-lg | 重要正文 |
| subtitle3 | 18 | 1.125 | text-xl | 小标题 |
| subtitle2 | 20 | 1.25 | text-2xl | 副标题 |
| subtitle1 | 24 | 1.5 | text-3xl | 标题 |
| headline | 28 | 1.75 | text-4xl | 大标题 |
| display | 36+ | 2.25+ | text-5xl+ | 展示标题 |

#### 圆角阶梯（vp → px）

| 层级 | vp | px | Tailwind | 用途 |
|------|-----|------|----------|------|
| sm | 4 | 4 | rounded | 标签、小元素 |
| md | 8 | 8 | rounded-md | 按钮、输入框 |
| lg | 12 | 12 | rounded-lg | 卡片 |
| xl | 16 | 16 | rounded-xl | 大卡片、弹窗 |
| full | 24 | 9999 | rounded-full | 胶囊、头像 |

#### 颜色语义层

```css
/* 品牌色 */
--brand-primary: #0A59F7;      /* 主色 */
--brand-secondary: #6B7280;    /* 辅色 */

/* 文字色 */
--text-primary: #1A1A1A;       /* 主要文字 */
--text-secondary: #6B7280;     /* 次要文字 */
--text-tertiary: #9CA3AF;      /* 弱化文字 */
--text-inverse: #FFFFFF;       /* 反色文字（深底白字） */

/* 背景色 */
--bg-primary: #F7F8FA;         /* 主背景（非纯白，护眼） */
--bg-secondary: #FFFFFF;       /* 次级背景 */
--bg-tertiary: #F3F4F6;        /* 卡片背景 */
--bg-emphasize: #EFF6FF;       /* 强调背景 */

/* 边框色 */
--border-default: #E5E7EB;     /* 默认边框 */
--border-emphasize: #D1D5DB;   /* 强调边框 */

/* 状态色 */
--success: #10B981;            /* 成功 */
--warning: #F59E0B;            /* 警告 */
--danger: #EF4444;             /* 危险 */
--info: #3B82F6;               /* 信息 */
```

### 组件规范

#### 按钮

| 类型 | 高度 | 样式 | 用途 |
|------|------|------|------|
| 主操作（Filled） | 48px | 实心 + brand_primary | 提交、确认、主操作 |
| 次操作（Outline） | 40px | 描边 + border_default | 取消、返回 |
| 辅助（Text） | 40px | 透明背景 + brand_primary | 链接、了解更多 |
| 危险（Filled） | 48px | 实心 + danger | 删除、废弃 |

```tsx
// 主操作按钮
<Button className="h-12 bg-[var(--brand-primary)] text-white rounded-md">
  确认提交
</Button>

// 次操作按钮
<Button className="h-10 border border-[var(--border-default)] rounded-md">
  取消
</Button>

// 文字按钮
<Button className="h-10 bg-transparent text-[var(--brand-primary)]">
  了解更多
</Button>
```

#### 卡片

```tsx
// 标准卡片
<Card className="p-4 bg-[var(--bg-tertiary)] rounded-lg">
  <h3 className="text-lg font-medium text-[var(--text-primary)]">卡片标题</h3>
  <p className="text-base text-[var(--text-secondary)] mt-1">描述文本</p>
</Card>

// 统计卡片（看板）
<Card className="p-6 bg-white rounded-xl shadow-sm">
  <span className="text-sm text-[var(--text-secondary)]">待审核</span>
  <span className="text-4xl font-bold text-[var(--text-primary)]">1,234</span>
</Card>
```

#### 列表

```tsx
// 标准列表项
<ListItem className="px-4 py-3 border-b border-[var(--border-default)]">
  <div className="flex items-center justify-between">
    <div>
      <span className="text-base text-[var(--text-primary)]">张三</span>
      <span className="text-sm text-[var(--text-secondary)] ml-2">2021001001</span>
    </div>
    <StatusBadge status="passed" />
  </div>
</ListItem>
```

#### 状态标签

| 状态 | 颜色 | 文字 |
|------|------|------|
| passed | bg-emphasize + success | 已通过 |
| failed | bg-red-50 + danger | 未通过 |
| warning | bg-yellow-50 + warning | 预警 |
| pending | bg-gray-50 + text-secondary | 待审核 |
| pending_score | bg-blue-50 + info | 待录入 |

### 阴影层级

```css
/* 浅阴影（卡片悬浮） */
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);

/* 中阴影（弹出菜单） */
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);

/* 深阴影（模态弹窗） */
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
```

### 响应式断点

```css
/* 移动端：< 640px */
/* 平板端：640px - 1024px */
/* 桌面端：> 1024px */

/* Tailwind 断点 */
sm: 640px
md: 768px
lg: 1024px
xl: 1280px
2xl: 1536px
```

### HarmonyOS 6 新特性适配

#### 悬浮页签（Floating Tabs）

```tsx
// 侧边栏导航采用悬浮样式
<Sidebar className="fixed left-0 top-0 h-full w-64 bg-white/80 backdrop-blur-md shadow-lg">
  <NavItem>首页</NavItem>
  <NavItem>审核</NavItem>
  <NavItem>导入</NavItem>
</Sidebar>
```

#### 沉浸光感（Immersive Light Effects）

```tsx
// 标题栏使用动态模糊效果
<header className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-[var(--border-default)]">
  <h1>审核管理看板</h1>
</header>
```

### 设计检查清单

在实现前端任务时，必须验证：

- [ ] 所有颜色使用 CSS 变量（`var(--xxx)`）
- [ ] 所有间距使用 4px 倍数
- [ ] 字号在标准阶梯内（11/12/14/16/18/20/24/28/36）
- [ ] 圆角在标准阶梯内（4/8/12/16/9999）
- [ ] 主按钮高度 48px
- [ ] 次按钮高度 40px
- [ ] 输入框高度 48px
- [ ] 背景色使用 `#F7F8FA`（非纯白）
- [ ] 文字主色使用 `#1A1A1A`（非纯黑）
- [ ] 同时支持 light 模式（dark 模式可选）

### 参考资源

- HarmonyOS Design 总览：https://developer.huawei.com/consumer/cn/doc/design-guides/
- 设计原则：https://developer.huawei.com/consumer/cn/doc/design-guides/design-principles-0000001949859741
- 视觉规范：https://developer.huawei.com/consumer/cn/doc/design-guides/visual-style-0000001949859745
- 控件规范：https://developer.huawei.com/consumer/cn/doc/design-guides/components-overview-0000001761501937

---

## Verification Strategy

> **零人工干预** — 所有验证均由 Agent 执行，无例外。

### 测试决策
- **基础设施**: YES（Jest 已配置）
- **自动化测试**: Tests-after（实现后补充测试）
- **框架**: Jest + Supertest
- **覆盖率**: 核心审核逻辑 ≥ 60%

### QA 策略
每个任务必须包含 Agent 执行的 QA 场景：
- **前端/UI**: 使用 Playwright — 导航、交互、断言 DOM、截图
- **API/后端**: 使用 Bash (curl) — 发送请求、断言状态码和响应字段
- **数据库**: 使用 Bash (mysql) — 执行查询、验证数据

证据保存到 `.omo/evidence/task-{N}-{scenario-slug}.{ext}`。

---

## Execution Strategy

### 并行执行 Wave

```
Wave 1 (立即开始 — 基础设施):
├── Task 1: 项目初始化 + 脚手架 [quick]
├── Task 2: 数据库 Schema 设计 [quick]
├── Task 3: Prisma 模型 + 迁移 [quick]
├── Task 4: 认证授权模块 [unspecified-high]
├── Task 5: 前端路由 + 布局框架 [visual-engineering]
└── Task 6: 通用组件库 [visual-engineering]

Wave 2 (Wave 1 完成后 — 核心模块):
├── Task 7: Excel 导入模块 [unspecified-high]
├── Task 8: 培养方案管理 [unspecified-high]
├── Task 9: 审核规则引擎核心 [deep]
├── Task 10: 学生预警计算 [deep]
├── Task 11: 前端数据导入页面 [visual-engineering]
└── Task 12: 前端培养方案页面 [visual-engineering]

Wave 3 (Wave 2 完成后 — 工作流 + UI):
├── Task 13: 试审核/正式审核模式 [unspecified-high]
├── Task 14: 多级审核流程 [unspecified-high]
├── Task 15: 人工标记模块 [unspecified-high]
├── Task 16: 教务处审核看板 [visual-engineering]
├── Task 17: 学生审核结果页 [visual-engineering]
├── Task 18: 教师预警看板 [visual-engineering]
└── Task 19: 审核流程管理页 [visual-engineering]

Wave 4 (Wave 3 完成后 — 报表 + 部署):
├── Task 20: 报表导出模块 [unspecified-high]
├── Task 21: 统计图表组件 [visual-engineering]
├── Task 22: 单元测试补充 [unspecified-high]
├── Task 23: 部署配置 [quick]
└── Task 24: 文档编写 [writing]

Wave FINAL (所有任务完成后 — 4 个并行审查):
├── Task F1: 计划合规审计 [oracle]
├── Task F2: 代码质量审查 [unspecified-high]
├── Task F3: 真实 QA 执行 [unspecified-high]
└── Task F4: 范围保真检查 [deep]
-> 展示结果 -> 获取用户明确确认

关键路径: Task 1 → Task 4 → Task 9 → Task 13 → Task 16 → F1-F4
并行加速: 约 60% 快于顺序执行
最大并发: 7 (Wave 1 & Wave 3)
```

### 依赖矩阵

| Task | 依赖 | 阻塞 |
|------|------|------|
| 1 | - | 2, 3, 4, 5, 6 |
| 2 | 1 | 3 |
| 3 | 1, 2 | 7, 8, 9, 10 |
| 4 | 1 | 7, 8, 13, 14, 15 |
| 5 | 1 | 6, 11, 12, 16, 17, 18, 19 |
| 6 | 5 | 11, 12, 16, 17, 18, 19 |
| 7 | 3, 4 | 11 |
| 8 | 3, 4 | 12 |
| 9 | 3 | 10, 13 |
| 10 | 3, 9 | 13, 17, 18 |
| 11 | 5, 6, 7 | - |
| 12 | 5, 6, 8 | - |
| 13 | 4, 9, 10 | 16, 19 |
| 14 | 4 | 19 |
| 15 | 4 | 16, 19 |
| 16 | 5, 6, 13, 15 | 20, 21 |
| 17 | 5, 6, 10 | - |
| 18 | 5, 6, 10 | - |
| 19 | 5, 6, 13, 14, 15 | - |
| 20 | 16 | 24 |
| 21 | 16 | 24 |
| 22 | ALL | 23 |
| 23 | 22 | F1-F4 |
| 24 | 20, 21 | F1-F4 |

### Agent 调度汇总

- **Wave 1**: 6 任务 — T1-T3 → `quick`, T4 → `unspecified-high`, T5-T6 → `visual-engineering`
- **Wave 2**: 6 任务 — T7-T8 → `unspecified-high`, T9-T10 → `deep`, T11-T12 → `visual-engineering`
- **Wave 3**: 7 任务 — T13-T15 → `unspecified-high`, T16-T19 → `visual-engineering`
- **Wave 4**: 5 任务 — T20-T22 → `unspecified-high`, T23 → `quick`, T24 → `writing`
- **FINAL**: 4 任务 — F1 → `oracle`, F2 → `unspecified-high`, F3 → `unspecified-high`, F4 → `deep`

---

## TODOs

- [ ] 1. 项目初始化 + 脚手架

  **What to do**:
  - 创建单仓库结构：`frontend/` + `backend/` + `shared/`
  - 初始化 backend：Express.js + TypeScript + Prisma
  - 初始化 frontend：React 18 + Vite + TypeScript + Tailwind CSS + shadcn/ui
  - 配置 ESLint + Prettier
  - 配置 TypeScript 严格模式
  - 创建 `.env.example` 和环境变量管理
  - 配置 Git hooks (husky + lint-staged)

  **Must NOT do**:
  - 不使用 Docker
  - 不使用 NestJS
  - 不过度配置（保持最小可用）

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 标准项目初始化，使用官方 CLI 工具
  - **Skills**: []
    - 无需特殊技能，使用标准工具链

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 1 (首先执行)
  - **Blocks**: Tasks 2, 3, 4, 5, 6
  - **Blocked By**: None

  **References**:
  - `plan-final.md:70-82` — 技术栈选型
  - `plan-final.md:103` — 单仓库结构决策

  **Acceptance Criteria**:
  - [ ] `backend/package.json` 存在且包含 express, prisma, typescript
  - [ ] `frontend/package.json` 存在且包含 react, vite, typescript
  - [ ] `npm install` 在两个目录均成功
  - [ ] `npx tsc --noEmit` 无错误
  - [ ] `.eslintrc.js` 和 `.prettierrc` 配置存在

  **QA Scenarios**:
  ```
  Scenario: 后端项目启动
    Tool: Bash
    Preconditions: Node.js 18+ 已安装
    Steps:
      1. cd backend && npm install
      2. npm run dev
      3. curl http://localhost:3000/health
    Expected Result: 返回 200 状态码
    Evidence: .omo/evidence/task-1-backend-start.txt

  Scenario: 前端项目启动
    Tool: Bash
    Preconditions: Node.js 18+ 已安装
    Steps:
      1. cd frontend && npm install
      2. npm run dev
      3. curl http://localhost:5173
    Expected Result: 返回 HTML 内容
    Evidence: .omo/evidence/task-1-frontend-start.txt
  ```

  **Commit**: YES
  - Message: `feat(init): project scaffolding with Express + React + Prisma`
  - Files: `frontend/*`, `backend/*`, `.eslintrc.js`, `.prettierrc`, `.gitignore`
  - Pre-commit: `npx tsc --noEmit`

- [ ] 2. 数据库 Schema 设计

  **What to do**:
  - 创建 Prisma Schema 文件
  - 定义核心表：users, students, majors, departments, courses, grades, programs
  - 定义审核相关表：audit_results, audit_flows, manual_overrides
  - 添加适当的关系和索引
  - 创建种子数据脚本

  **Must NOT do**:
  - 不使用 PostgreSQL 特有功能
  - 不过度规范化（保持简单）

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 数据库设计基于已有 Schema 定义，直接翻译
  - **Skills**: []
    - 无需特殊技能

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 1 (Task 1 之后)
  - **Blocks**: Task 3
  - **Blocked By**: Task 1

  **References**:
  - `plan-final.md:157-287` — 完整表结构定义
  - `plan-final.md:289-312` — 索引设计

  **Acceptance Criteria**:
  - [ ] `backend/prisma/schema.prisma` 包含所有核心表
  - [ ] `npx prisma validate` 通过
  - [ ] `backend/prisma/seed.ts` 种子数据脚本存在
  - [ ] 所有表有正确的外键关系

  **QA Scenarios**:
  ```
  Scenario: Schema 验证
    Tool: Bash
    Preconditions: Task 1 完成
    Steps:
      1. cd backend
      2. npx prisma validate
      3. npx prisma format
    Expected Result: Schema is valid ✓
    Evidence: .omo/evidence/task-2-schema-validate.txt

  Scenario: 种子数据生成
    Tool: Bash
    Preconditions: MySQL 数据库可用
    Steps:
      1. npx prisma db push
      2. npx prisma db seed
      3. mysql -u root -e "SELECT COUNT(*) FROM sgadqrs.users"
    Expected Result: 返回用户数量 > 0
    Evidence: .omo/evidence/task-2-seed-data.txt
  ```

  **Commit**: YES (groups with Task 3)
  - Message: `feat(db): database schema design with Prisma`
  - Files: `backend/prisma/*`
  - Pre-commit: `npx prisma validate`

- [ ] 3. Prisma 模型 + 迁移

  **What to do**:
  - 配置 MySQL 数据库连接
  - 生成 Prisma Client
  - 创建初始迁移脚本
  - 实现数据库连接池配置
  - 添加数据库健康检查端点

  **Must NOT do**:
  - 不使用 Redis 缓存
  - 不添加过多数据库配置

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 标准 Prisma 配置和迁移
  - **Skills**: []
    - 无需特殊技能

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 1 (Task 2 之后)
  - **Blocks**: Tasks 7, 8, 9, 10
  - **Blocked By**: Tasks 1, 2

  **References**:
  - `plan-final.md:98` — MySQL 8.0 选型
  - Prisma 官方文档：连接池配置

  **Acceptance Criteria**:
  - [ ] `backend/.env` 包含有效的 DATABASE_URL
  - [ ] `npx prisma migrate dev` 成功执行
  - [ ] `npx prisma generate` 生成 Client
  - [ ] `/health` 端点返回数据库连接状态

  **QA Scenarios**:
  ```
  Scenario: 数据库连接测试
    Tool: Bash
    Preconditions: MySQL 8.0 运行中
    Steps:
      1. cd backend
      2. npx prisma migrate dev --name init
      3. curl http://localhost:3000/health
    Expected Result: 返回 {"status": "ok", "database": "connected"}
    Evidence: .omo/evidence/task-3-db-connection.txt

  Scenario: 迁移回滚测试
    Tool: Bash
    Preconditions: 迁移已执行
    Steps:
      1. npx prisma migrate reset --force
      2. npx prisma migrate dev
    Expected Result: 迁移成功重建
    Evidence: .omo/evidence/task-3-migration-rollback.txt
  ```

  **Commit**: YES (groups with Task 2)
  - Message: `feat(db): Prisma client generation and migration setup`
  - Files: `backend/prisma/migrations/*`, `backend/src/lib/prisma.ts`
  - Pre-commit: `npx prisma validate`

- [ ] 4. 认证授权模块

  **What to do**:
  - 实现 JWT 认证（登录、登出、Token 刷新）
  - 实现基于角色的访问控制（RBAC）
  - 创建用户角色：student, teacher, dept_admin, school_admin
  - 实现密码加密（bcrypt）
  - 创建认证中间件
  - 实现登录失败锁定机制
  - 添加隐私政策页面路由

  **Must NOT do**:
  - 不对接 CAS/LDAP（初期使用本地数据库认证）
  - 不实现复杂的权限继承

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: 认证模块涉及安全逻辑，需要仔细处理
  - **Skills**: []
    - 无需特殊技能，使用标准 JWT 库

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (与 Tasks 5, 6 并行)
  - **Blocks**: Tasks 7, 8, 13, 14, 15
  - **Blocked By**: Task 1

  **References**:
  - `plan-final.md:337-342` — 认证模块 API
  - `plan-final.md:160-173` — users 表结构
  - JWT 官方文档：Token 生成和验证

  **Acceptance Criteria**:
  - [ ] `POST /api/v1/auth/login` 返回 JWT Token
  - [ ] `POST /api/v1/auth/logout` 使 Token 失效
  - [ ] `GET /api/v1/auth/profile` 返回当前用户信息
  - [ ] 密码使用 bcrypt 加密存储
  - [ ] 不同角色访问受限端点返回 403

  **QA Scenarios**:
  ```
  Scenario: 用户登录成功
    Tool: Bash (curl)
    Preconditions: 种子数据中有测试用户
    Steps:
      1. curl -X POST http://localhost:3000/api/v1/auth/login \
           -H "Content-Type: application/json" \
           -d '{"username":"admin","password":"admin123"}'
      2. 检查响应包含 token 字段
    Expected Result: 返回 {"code":200, "data":{"token":"eyJ..."}}
    Evidence: .omo/evidence/task-4-login-success.txt

  Scenario: 角色权限控制
    Tool: Bash (curl)
    Preconditions: 学生 Token 和管理员 Token
    Steps:
      1. 使用学生 Token 访问 GET /api/v1/students
      2. 检查返回 403
      3. 使用管理员 Token 访问同一端点
      4. 检查返回 200
    Expected Result: 学生被拒绝，管理员通过
    Evidence: .omo/evidence/task-4-role-access.txt

  Scenario: 登录失败锁定
    Tool: Bash (curl)
    Preconditions: 测试用户存在
    Steps:
      1. 连续 5 次使用错误密码登录
      2. 第 6 次使用正确密码登录
    Expected Result: 前 5 次返回 401，第 6 次返回 423 (Locked)
    Evidence: .omo/evidence/task-4-login-lockout.txt
  ```

  **Commit**: YES
  - Message: `feat(auth): JWT authentication with role-based access control`
  - Files: `backend/src/modules/auth/*`, `backend/src/middleware/*`
  - Pre-commit: `npm test -- --testPathPattern=auth`

- [ ] 5. 前端路由 + 布局框架

  **What to do**:
  - 配置 React Router 路由
  - 创建主布局组件（侧边栏 + 顶部栏）
  - **遵循 HarmonyOS 6 设计规范**：
    - 侧边栏采用悬浮样式（`backdrop-blur-md`）
    - 标题栏使用动态模糊效果
    - 间距使用 4px 倍数系统
    - 字号使用标准阶梯（11/12/14/16/18/20/24/28/36）
  - 实现路由守卫（认证检查）
  - 创建角色对应的路由配置
  - 实现页面懒加载
  - 创建 404 和错误页面

  **Must NOT do**:
  - 不使用复杂的路由库（保持 React Router 标准用法）
  - 不过度设计布局系统
  - 不使用非标准间距和字号

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: 前端布局和路由是 UI 相关工作
  - **Skills**: []
    - 无需特殊技能

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (与 Tasks 4, 6 并行)
  - **Blocks**: Task 6, Tasks 11, 12, 16, 17, 18, 19
  - **Blocked By**: Task 1

  **References**:
  - `plan-final.md:394-406` — 页面清单
  - shadcn/ui 官方文档：布局组件
  - **HarmonyOS 6 设计规范**：`.omo/plans/sgadqrs.md#design-specifications-harmonyos-6`

  **Acceptance Criteria**:
  - [ ] `/login` 页面可访问
  - [ ] 登录后跳转到 `/admin/dashboard`
  - [ ] 侧边栏菜单根据角色动态显示
  - [ ] 路由守卫阻止未认证访问
  - [ ] 页面懒加载生效
  - [ ] **侧边栏使用悬浮样式（`backdrop-blur-md`）**
  - [ ] **标题栏使用动态模糊效果**
  - [ ] **所有间距使用 4px 倍数**

  **QA Scenarios**:
  ```
  Scenario: 路由导航测试
    Tool: Playwright
    Preconditions: 前端开发服务器运行中
    Steps:
      1. 打开 http://localhost:5173/login
      2. 输入用户名密码登录
      3. 验证跳转到 /admin/dashboard
      4. 点击侧边栏"审核管理"
      5. 验证 URL 变为 /admin/audit
    Expected Result: 路由正常切换，页面内容更新
    Evidence: .omo/evidence/task-5-navigation.png

  Scenario: HarmonyOS 6 设计规范验证
    Tool: Playwright
    Preconditions: 前端开发服务器运行中
    Steps:
      1. 打开任意页面
      2. 检查侧边栏是否有 `backdrop-blur-md` 样式
      3. 检查标题栏是否有动态模糊效果
      4. 检查间距是否为 4px 倍数
      5. 检查字号是否在标准阶梯内
    Expected Result: 所有设计规范符合 HarmonyOS 6 标准
    Evidence: .omo/evidence/task-5-harmonyos-design.png

  Scenario: 未认证访问保护
    Tool: Playwright
    Preconditions: 未登录状态
    Steps:
      1. 直接访问 http://localhost:5173/admin/dashboard
      2. 验证重定向到 /login
    Expected Result: 自动跳转到登录页
    Evidence: .omo/evidence/task-5-auth-guard.png
  ```

  **Commit**: YES
  - Message: `feat(ui): React Router setup with HarmonyOS 6 design`
  - Files: `frontend/src/router/*`, `frontend/src/layouts/*`
  - Pre-commit: `npm run build`

- [ ] 6. 通用组件库

  **What to do**:
  - 初始化 shadcn/ui 组件
  - **配置 HarmonyOS 6 设计 Token**：
    - 创建 CSS 变量文件（颜色、间距、字号、圆角）
    - 配置 Tailwind CSS 自定义主题
    - 实现设计 Token 系统
  - 创建通用表格组件（支持排序、筛选、分页）
  - 创建通用表单组件
  - 创建统计卡片组件
  - 创建状态标签组件（passed/failed/warning/pending）
  - 创建确认对话框组件
  - 创建 Loading 和空状态组件

  **Must NOT do**:
  - 不创建过多自定义组件（优先使用 shadcn/ui）
  - 不过度设计组件 API
  - 不使用硬编码颜色值（必须使用 CSS 变量）

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: UI 组件开发
  - **Skills**: []
    - 无需特殊技能

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (与 Tasks 4, 5 并行)
  - **Blocks**: Tasks 11, 12, 16, 17, 18, 19
  - **Blocked By**: Task 5

  **References**:
  - shadcn/ui 官方文档：组件列表
  - `plan-final.md:462-491` — 教务处看板原型
  - **HarmonyOS 6 设计规范**：`.omo/plans/sgadqrs.md#design-specifications-harmonyos-6`

  **Acceptance Criteria**:
  - [ ] `frontend/src/styles/variables.css` 包含所有设计 Token
  - [ ] `tailwind.config.js` 配置自定义主题
  - [ ] DataTable 组件支持排序、筛选、分页
  - [ ] StatusBadge 组件正确显示不同状态颜色
  - [ ] 所有组件有 TypeScript 类型定义
  - [ ] **所有颜色使用 CSS 变量（`var(--xxx)`）**
  - [ ] **所有间距使用 4px 倍数**
  - [ ] **字号在标准阶梯内（11/12/14/16/18/20/24/28/36）**
  - [ ] **圆角在标准阶梯内（4/8/12/16/9999）**

  **QA Scenarios**:
  ```
  Scenario: 表格组件功能
    Tool: Playwright
    Preconditions: 组件已渲染
    Steps:
      1. 渲染带数据的 DataTable
      2. 点击列标题排序
      3. 输入筛选条件
      4. 点击分页按钮
    Expected Result: 数据正确排序、筛选、分页
    Evidence: .omo/evidence/task-6-table-component.png

  Scenario: 状态标签显示
    Tool: Playwright
    Preconditions: 组件已渲染
    Steps:
      1. 渲染 StatusBadge status="passed"
      2. 验证显示绿色"已通过"
      3. 渲染 StatusBadge status="failed"
      4. 验证显示红色"未通过"
    Expected Result: 状态颜色和文字正确
    Evidence: .omo/evidence/task-6-status-badge.png

  Scenario: HarmonyOS 6 设计 Token 验证
    Tool: Playwright
    Preconditions: 组件库已初始化
    Steps:
      1. 检查 CSS 变量文件是否存在
      2. 检查 Tailwind 配置是否包含自定义主题
      3. 渲染组件，验证使用 CSS 变量而非硬编码值
      4. 检查间距是否为 4px 倍数
      5. 检查字号是否在标准阶梯内
    Expected Result: 所有设计 Token 正确配置和使用
    Evidence: .omo/evidence/task-6-design-tokens.png
  ```

  **Commit**: YES
  - Message: `feat(ui): shared component library with HarmonyOS 6 design tokens`
  - Files: `frontend/src/components/*`, `frontend/src/styles/*`
  - Pre-commit: `npm run build`

- [ ] 7. Excel 导入模块

  **What to do**:
  - 创建 Excel 模板下载端点（学生、课程、成绩）
  - 实现 xlsx.js 文件解析
  - 实现数据校验（格式、必填项、外键存在性）
  - 实现批量插入数据库
  - 实现导入状态跟踪（成功/失败/跳过数量）
  - 实现错误报告下载

  **Must NOT do**:
  - 不实现复杂的 ETL 流程
  - 不支持多种文件格式（仅 xlsx）

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: 涉及文件处理、数据校验、批量操作
  - **Skills**: []
    - 无需特殊技能

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (与 Tasks 8, 9, 10, 11, 12 并行)
  - **Blocks**: Task 11
  - **Blocked By**: Tasks 3, 4

  **References**:
  - `plan-final.md:374-380` — 数据导入 API
  - `plan-final.md:39-40` — P0 数据导入需求
  - xlsx.js 官方文档：文件解析

  **Acceptance Criteria**:
  - [ ] `GET /api/v1/import/template/:type` 返回 Excel 文件
  - [ ] `POST /api/v1/import/students` 成功导入学生数据
  - [ ] `POST /api/v1/import/courses` 成功导入课程数据
  - [ ] `POST /api/v1/import/grades` 成功导入成绩数据
  - [ ] 无效数据返回详细错误信息

  **QA Scenarios**:
  ```
  Scenario: 学生数据导入成功
    Tool: Bash (curl)
    Preconditions: 测试 Excel 文件存在
    Steps:
      1. curl -X POST http://localhost:3000/api/v1/import/students \
           -H "Authorization: Bearer $TOKEN" \
           -F "file=@test-students.xlsx"
      2. 检查响应包含 success_count
      3. 查询数据库验证记录数
    Expected Result: 返回 {"success": 10, "failed": 0, "skipped": 0}
    Evidence: .omo/evidence/task-7-import-success.txt

  Scenario: 无效数据导入失败
    Tool: Bash (curl)
    Preconditions: 包含无效数据的 Excel 文件
    Steps:
      1. curl -X POST http://localhost:3000/api/v1/import/students \
           -H "Authorization: Bearer $TOKEN" \
           -F "file=@invalid-students.xlsx"
      2. 检查响应包含 error_details
    Expected Result: 返回部分成功，包含详细错误信息
    Evidence: .omo/evidence/task-7-import-errors.txt
  ```

  **Commit**: YES
  - Message: `feat(import): Excel import for students, courses, grades`
  - Files: `backend/src/modules/import/*`
  - Pre-commit: `npm test -- --testPathPattern=import`

- [ ] 8. 培养方案管理

  **What to do**:
  - 实现培养方案 CRUD API
  - 实现按专业/学位类型配置
  - 实现必修课列表管理
  - 实现选修课学分要求配置
  - 实现实践环节和毕业论文要求配置
  - 实现最低 GPA 和学位课程 GPA 配置
  - 实现培养方案版本管理

  **Must NOT do**:
  - 不实现可视化规则编辑器
  - 不实现复杂的规则继承

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: 业务逻辑相对复杂，涉及多表关联
  - **Skills**: []
    - 无需特殊技能

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (与 Tasks 7, 9, 10, 11, 12 并行)
  - **Blocks**: Task 12
  - **Blocked By**: Tasks 3, 4

  **References**:
  - `plan-final.md:268-287` — programs 表结构
  - `plan-final.md:39` — P0 培养方案管理需求

  **Acceptance Criteria**:
  - [ ] `POST /api/v1/programs` 创建培养方案成功
  - [ ] `GET /api/v1/programs` 返回培养方案列表
  - [ ] `PUT /api/v1/programs/:id` 更新培养方案成功
  - [ ] 培养方案包含所有必要配置项

  **QA Scenarios**:
  ```
  Scenario: 创建培养方案
    Tool: Bash (curl)
    Preconditions: 管理员 Token
    Steps:
      1. curl -X POST http://localhost:3000/api/v1/programs \
           -H "Authorization: Bearer $TOKEN" \
           -H "Content-Type: application/json" \
           -d '{"major_id":"...", "degree_type":"bachelor", "total_credits":160, ...}'
      2. 查询数据库验证记录
    Expected Result: 返回 201，数据库有对应记录
    Evidence: .omo/evidence/task-8-create-program.txt

  Scenario: 培养方案配置完整性
    Tool: Bash (curl)
    Preconditions: 已创建培养方案
    Steps:
      1. GET /api/v1/programs/:id
      2. 验证返回所有配置字段
    Expected Result: 包含 total_credits, required_courses, elective_credits, min_gpa 等
    Evidence: .omo/evidence/task-8-program-fields.txt
  ```

  **Commit**: YES
  - Message: `feat(programs): program management with credit requirements`
  - Files: `backend/src/modules/programs/*`
  - Pre-commit: `npm test -- --testPathPattern=programs`

- [ ] 9. 审核规则引擎核心

  **What to do**:
  - 实现规则配置文件解析（JSON 格式）
  - 实现规则条件评估器
  - 实现学分计算逻辑
  - 实现 GPA 计算逻辑
  - 实现必修课通过检查
  - 实现选修课学分检查
  - 实现实践环节检查
  - 实现毕业论文检查
  - 实现规则版本管理

  **Must NOT do**:
  - 不实现可视化规则编辑器
  - 不使用复杂的规则引擎库

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: 核心业务逻辑，需要深入理解审核规则
  - **Skills**: []
    - 无需特殊技能

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (与 Tasks 7, 8, 10, 11, 12 并行)
  - **Blocks**: Tasks 10, 13
  - **Blocked By**: Task 3

  **References**:
  - `plan-final.md:114` — 规则配置用 JSON 文件
  - `plan-final.md:214-234` — audit_results 表结构
  - `plan-final.md:41-44` — P0 审核需求

  **Acceptance Criteria**:
  - [ ] 规则配置文件可正确解析
  - [ ] 学分计算逻辑正确
  - [ ] GPA 计算逻辑正确
  - [ ] 必修课检查逻辑正确
  - [ ] 规则版本可管理

  **QA Scenarios**:
  ```
  Scenario: 学分计算正确性
    Tool: Bash (Node.js)
    Preconditions: 测试数据和规则配置
    Steps:
      1. 创建测试学生，已修 150 学分
      2. 运行审核规则，要求 160 学分
      3. 检查结果为 "failed"，缺少 10 学分
    Expected Result: 计算结果准确
    Evidence: .omo/evidence/task-9-credit-calculation.txt

  Scenario: GPA 计算正确性
    Tool: Bash (Node.js)
    Preconditions: 测试成绩数据
    Steps:
      1. 创建测试学生，GPA 为 3.5
      2. 运行审核规则，要求 GPA >= 2.0
      3. 检查结果为 "passed"
    Expected Result: GPA 计算和比较正确
    Evidence: .omo/evidence/task-9-gpa-calculation.txt
  ```

  **Commit**: YES
  - Message: `feat(audit): core audit rule engine with JSON config`
  - Files: `backend/src/modules/audit/engine/*`
  - Pre-commit: `npm test -- --testPathPattern=audit`

- [ ] 10. 学生预警计算

  **What to do**:
  - 实现单学生审核计算
  - 实现"还差什么"逻辑
  - 实现待录入状态处理
  - 实现审核结果存储
  - 实现审核日志记录
  - 实现批量审核（100 人/批次）

  **Must NOT do**:
  - 不实现异步队列（初期同步处理）
  - 不实现缓存

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: 核心业务逻辑，需要处理多种边界情况
  - **Skills**: []
    - 无需特殊技能

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (与 Tasks 7, 8, 9, 11, 12 并行)
  - **Blocks**: Tasks 13, 17, 18
  - **Blocked By**: Tasks 3, 9

  **References**:
  - `plan-final.md:214-234` — audit_results 表结构
  - `plan-final.md:41` — P0 学生预警需求
  - `plan-final.md:50` — 成绩录入状态设计

  **Acceptance Criteria**:
  - [ ] 单学生审核返回完整结果
  - [ ] "还差什么"逻辑正确
  - [ ] 待录入状态正确处理
  - [ ] 批量审核支持 100 人/批次
  - [ ] 审核日志完整记录

  **QA Scenarios**:
  ```
  Scenario: 单学生审核
    Tool: Bash (curl)
    Preconditions: 测试学生数据
    Steps:
      1. POST /api/v1/audit/single {"student_id": "..."}
      2. 检查返回审核结果
      3. 验证 "missing_items" 包含缺少的条件
    Expected Result: 返回完整审核结果，包含状态和缺少项
    Evidence: .omo/evidence/task-10-single-audit.txt

  Scenario: 批量审核
    Tool: Bash (curl)
    Preconditions: 100 个测试学生
    Steps:
      1. POST /api/v1/audit/batch {"student_ids": [...]}
      2. 检查返回批量结果
      3. 验证每个学生都有审核结果
    Expected Result: 100 个学生全部审核完成
    Evidence: .omo/evidence/task-10-batch-audit.txt
  ```

  **Commit**: YES
  - Message: `feat(audit): student warning calculation with batch support`
  - Files: `backend/src/modules/audit/service/*`
  - Pre-commit: `npm test -- --testPathPattern=audit`

- [ ] 11. 前端数据导入页面

  **What to do**:
  - 创建数据导入页面（三步导入流程）
  - 实现文件上传组件
  - 实现导入进度显示
  - 实现导入结果展示
  - 实现错误详情查看
  - 实现模板下载按钮

  **Must NOT do**:
  - 不实现复杂的上传组件
  - 不实现拖拽上传

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: 前端页面开发
  - **Skills**: []
    - 无需特殊技能

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (与 Tasks 7, 8, 9, 10, 12 并行)
  - **Blocks**: None
  - **Blocked By**: Tasks 5, 6, 7

  **References**:
  - `plan-final.md:405` — 数据导入页面路径
  - shadcn/ui 组件库

  **Acceptance Criteria**:
  - [ ] `/admin/import` 页面可访问
  - [ ] 文件上传功能正常
  - [ ] 导入进度正确显示
  - [ ] 导入结果正确展示
  - [ ] 模板下载功能正常

  **QA Scenarios**:
  ```
  Scenario: 文件导入流程
    Tool: Playwright
    Preconditions: 管理员已登录
    Steps:
      1. 导航到 /admin/import
      2. 点击"下载模板"
      3. 上传填充好的 Excel 文件
      4. 等待导入完成
      5. 查看导入结果
    Expected Result: 导入成功，显示成功数量
    Evidence: .omo/evidence/task-11-import-page.png

  Scenario: 导入错误处理
    Tool: Playwright
    Preconditions: 包含错误数据的 Excel
    Steps:
      1. 上传包含错误的 Excel 文件
      2. 查看错误详情
      3. 下载错误报告
    Expected Result: 显示详细错误信息，可下载报告
    Evidence: .omo/evidence/task-11-import-errors.png
  ```

  **Commit**: YES
  - Message: `feat(ui): data import page with three-step flow`
  - Files: `frontend/src/pages/admin/import/*`
  - Pre-commit: `npm run build`

- [ ] 12. 前端培养方案页面

  **What to do**:
  - 创建培养方案列表页面
  - 创建培养方案编辑表单
  - 实现必修课列表管理
  - 实现学分要求配置
  - 实现 GPA 要求配置
  - 实现版本切换功能

  **Must NOT do**:
  - 不实现可视化规则编辑器
  - 不实现拖拽排序

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: 前端页面开发
  - **Skills**: []
    - 无需特殊技能

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (与 Tasks 7, 8, 9, 10, 11 并行)
  - **Blocks**: None
  - **Blocked By**: Tasks 5, 6, 8

  **References**:
  - `plan-final.md:404` — 培养方案管理页面路径
  - shadcn/ui 组件库

  **Acceptance Criteria**:
  - [ ] `/admin/programs` 页面可访问
  - [ ] 培养方案列表正确显示
  - [ ] 编辑表单功能正常
  - [ ] 必修课列表可管理
  - [ ] 版本切换功能正常

  **QA Scenarios**:
  ```
  Scenario: 培养方案编辑
    Tool: Playwright
    Preconditions: 管理员已登录
    Steps:
      1. 导航到 /admin/programs
      2. 点击"新建培养方案"
      3. 填写表单（总学分、必修课、GPA 要求等）
      4. 保存
      5. 验证列表中显示新方案
    Expected Result: 培养方案创建成功
    Evidence: .omo/evidence/task-12-program-edit.png

  Scenario: 必修课管理
    Tool: Playwright
    Preconditions: 已有培养方案
    Steps:
      1. 编辑培养方案
      2. 添加必修课
      3. 删除必修课
      4. 保存
    Expected Result: 必修课列表正确更新
    Evidence: .omo/evidence/task-12-required-courses.png
  ```

  **Commit**: YES
  - Message: `feat(ui): program management page with credit configuration`
  - Files: `frontend/src/pages/admin/programs/*`
  - Pre-commit: `npm run build`

- [ ] 13. 试审核/正式审核模式

  **What to do**:
  - 实现试审核模式（预览不保存）
  - 实现正式审核模式（锁定记录）
  - 实现审核结果状态管理（passed/failed/warning/pending_score）
  - 实现审核日志记录
  - 实现计算明细存储
  - 实现规则版本关联

  **Must NOT do**:
  - 不实现异步审核队列
  - 不实现审核结果缓存

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: 核心业务逻辑，需要处理两种审核模式
  - **Skills**: []
    - 无需特殊技能

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (与 Tasks 14, 15, 16, 17, 18, 19 并行)
  - **Blocks**: Tasks 16, 19
  - **Blocked By**: Tasks 4, 9, 10

  **References**:
  - `plan-final.md:110` — 审核结果双模式设计
  - `plan-final.md:214-234` — audit_results 表结构
  - `plan-final.md:352-356` — 审核模块 API

  **Acceptance Criteria**:
  - [ ] `POST /api/v1/audit/trial` 返回预览结果，不保存到数据库
  - [ ] `POST /api/v1/audit/official` 保存结果并锁定记录
  - [ ] 正式审核后记录不可修改
  - [ ] 审核日志完整记录

  **QA Scenarios**:
  ```
  Scenario: 试审核模式
    Tool: Bash (curl)
    Preconditions: 测试学生数据
    Steps:
      1. POST /api/v1/audit/trial {"student_id": "..."}
      2. 检查返回审核结果
      3. 查询数据库，确认无新记录
    Expected Result: 返回预览结果，数据库无变化
    Evidence: .omo/evidence/task-13-trial-audit.txt

  Scenario: 正式审核模式
    Tool: Bash (curl)
    Preconditions: 测试学生数据
    Steps:
      1. POST /api/v1/audit/official {"student_id": "..."}
      2. 检查返回审核结果
      3. 查询数据库，确认有新记录且 is_locked=true
    Expected Result: 返回结果，数据库有锁定记录
    Evidence: .omo/evidence/task-13-official-audit.txt
  ```

  **Commit**: YES
  - Message: `feat(audit): trial and official audit modes with locking`
  - Files: `backend/src/modules/audit/service/*`
  - Pre-commit: `npm test -- --testPathPattern=audit`

- [ ] 14. 多级审核流程

  **What to do**:
  - 实现审核流程状态机（draft → initial → dept → committee → approved/rejected）
  - 实现提交到下一级功能
  - 实现批准/驳回功能
  - 实现退回上一级功能
  - 实现流转记录存储
  - 实现流程状态查询

  **Must NOT do**:
  - 不实现复杂的并行审批
  - 不实现流程可视化

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: 状态机逻辑，需要处理多种状态转换
  - **Skills**: []
    - 无需特殊技能

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (与 Tasks 13, 15, 16, 17, 18, 19 并行)
  - **Blocks**: Task 19
  - **Blocked By**: Task 4

  **References**:
  - `plan-final.md:111` — 多级审核状态机设计
  - `plan-final.md:237-249` — audit_flows 表结构
  - `plan-final.md:358-364` — 审核流程 API

  **Acceptance Criteria**:
  - [ ] `POST /api/v1/audit-flow/:id/submit` 提交到下一级成功
  - [ ] `POST /api/v1/audit-flow/:id/approve` 批准成功
  - [ ] `POST /api/v1/audit-flow/:id/reject` 驳回成功
  - [ ] `POST /api/v1/audit-flow/:id/return` 退回成功
  - [ ] 流转记录完整保存

  **QA Scenarios**:
  ```
  Scenario: 审核流程流转
    Tool: Bash (curl)
    Preconditions: 审核结果已创建
    Steps:
      1. POST /api/v1/audit-flow/:id/submit (initial → dept)
      2. POST /api/v1/audit-flow/:id/approve (dept 批准)
      3. POST /api/v1/audit-flow/:id/submit (dept → committee)
      4. POST /api/v1/audit-flow/:id/approve (committee 批准)
    Expected Result: 状态从 initial 流转到 approved
    Evidence: .omo/evidence/task-14-flow-approve.txt

  Scenario: 审核流程驳回
    Tool: Bash (curl)
    Preconditions: 审核流程在 dept 阶段
    Steps:
      1. POST /api/v1/audit-flow/:id/reject
      2. 查询状态
    Expected Result: 状态变为 rejected
    Evidence: .omo/evidence/task-14-flow-reject.txt
  ```

  **Commit**: YES
  - Message: `feat(workflow): multi-level audit flow with state machine`
  - Files: `backend/src/modules/audit-flow/*`
  - Pre-commit: `npm test -- --testPathPattern=audit-flow`

- [ ] 15. 人工标记模块

  **What to do**:
  - 实现人工标记 CRUD API
  - 实现标记类型（pass/fail/exempt）
  - 实现调整原因记录（必填）
  - 实现佐证材料存储
  - 实现标记与审核结果关联
  - 实现标记撤销功能

  **Must NOT do**:
  - 不实现复杂的审批流程
  - 不实现文件上传

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: 业务逻辑相对简单，但需要处理关联关系
  - **Skills**: []
    - 无需特殊技能

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (与 Tasks 13, 14, 16, 17, 18, 19 并行)
  - **Blocks**: Tasks 16, 19
  - **Blocked By**: Task 4

  **References**:
  - `plan-final.md:112` — 人工标记表设计
  - `plan-final.md:252-265` — manual_overrides 表结构
  - `plan-final.md:367-371` — 人工标记 API

  **Acceptance Criteria**:
  - [ ] `POST /api/v1/manual-overrides` 创建标记成功
  - [ ] `GET /api/v1/manual-overrides` 返回标记列表
  - [ ] `DELETE /api/v1/manual-overrides/:id` 撤销标记成功
  - [ ] 调整原因必填验证
  - [ ] 标记与审核结果正确关联

  **QA Scenarios**:
  ```
  Scenario: 创建人工标记
    Tool: Bash (curl)
    Preconditions: 管理员 Token，审核结果存在
    Steps:
      1. POST /api/v1/manual-overrides {
           "student_id": "...",
           "audit_type": "graduation",
           "override_type": "pass",
           "reason": "特殊情况处理"
         }
      2. 查询数据库验证记录
    Expected Result: 返回 201，数据库有对应记录
    Evidence: .omo/evidence/task-15-create-override.txt

  Scenario: 撤销人工标记
    Tool: Bash (curl)
    Preconditions: 已有人工标记
    Steps:
      1. DELETE /api/v1/manual-overrides/:id
      2. 查询数据库验证记录已删除
    Expected Result: 返回 200，数据库记录已删除
    Evidence: .omo/evidence/task-15-delete-override.txt
  ```

  **Commit**: YES
  - Message: `feat(overrides): manual override with reason tracking`
  - Files: `backend/src/modules/manual-overrides/*`
  - Pre-commit: `npm test -- --testPathPattern=manual-overrides`

- [ ] 16. 教务处审核看板

  **What to do**:
  - 创建审核看板页面
  - 实现全校统计卡片（待审核、已通过、未通过、待录入）
  - 实现审核结果列表（搜索、筛选、分页）
  - 实现试审核/正式审核按钮
  - 实现审核明细查看
  - 实现导出功能入口

  **Must NOT do**:
  - 不实现复杂的图表（初期使用简单统计）
  - 不实现实时更新

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: 前端看板页面，需要良好的数据展示
  - **Skills**: []
    - 无需特殊技能

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (与 Tasks 13, 14, 15, 17, 18, 19 并行)
  - **Blocks**: Tasks 20, 21
  - **Blocked By**: Tasks 5, 6, 13, 15

  **References**:
  - `plan-final.md:462-491` — 教务处审核看板原型
  - `plan-final.md:399` — 教务处审核看板页面路径

  **Acceptance Criteria**:
  - [ ] `/admin/dashboard` 页面可访问
  - [ ] 统计卡片正确显示数字
  - [ ] 审核结果列表可搜索、筛选、分页
  - [ ] 试审核/正式审核按钮功能正常
  - [ ] 审核明细可查看

  **QA Scenarios**:
  ```
  Scenario: 审核看板功能
    Tool: Playwright
    Preconditions: 管理员已登录，有审核数据
    Steps:
      1. 导航到 /admin/dashboard
      2. 验证统计卡片显示数字
      3. 点击"试审核"按钮
      4. 查看审核结果列表
      5. 点击"详情"查看审核明细
    Expected Result: 看板功能完整，数据正确显示
    Evidence: .omo/evidence/task-16-dashboard.png

  Scenario: 审核结果筛选
    Tool: Playwright
    Preconditions: 有不同状态的审核结果
    Steps:
      1. 在搜索框输入学号
      2. 选择状态筛选"未通过"
      3. 验证列表只显示未通过的学生
    Expected Result: 筛选功能正常
    Evidence: .omo/evidence/task-16-filter.png
  ```

  **Commit**: YES
  - Message: `feat(ui): admin audit dashboard with statistics`
  - Files: `frontend/src/pages/admin/dashboard/*`
  - Pre-commit: `npm run build`

- [ ] 17. 学生审核结果页

  **What to do**:
  - 创建学生个人审核结果页面
  - 实现毕业资格审核结果展示
  - 实现学位资格审核结果展示
  - 实现"还差什么"提示
  - 实现待录入状态提示
  - 实现详细成绩单查看
  - 实现审核报告下载

  **Must NOT do**:
  - 不实现申诉功能（P2 延后）
  - 不实现复杂的图表

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: 前端页面开发，面向学生用户
  - **Skills**: []
    - 无需特殊技能

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (与 Tasks 13, 14, 15, 16, 18, 19 并行)
  - **Blocks**: None
  - **Blocked By**: Tasks 5, 6, 10

  **References**:
  - `plan-final.md:432-459` — 学生审核结果页原型
  - `plan-final.md:397` — 学生审核结果页面路径

  **Acceptance Criteria**:
  - [ ] `/student/audit` 页面可访问
  - [ ] 毕业资格审核结果正确显示
  - [ ] 学位资格审核结果正确显示
  - [ ] "还差什么"提示正确
  - [ ] 待录入状态正确提示

  **QA Scenarios**:
  ```
  Scenario: 学生审核结果展示
    Tool: Playwright
    Preconditions: 学生已登录，有审核结果
    Steps:
      1. 导航到 /student/audit
      2. 验证显示毕业资格审核结果
      3. 验证显示学位资格审核结果
      4. 查看"还差什么"提示
    Expected Result: 审核结果完整展示
    Evidence: .omo/evidence/task-17-student-result.png

  Scenario: 待录入状态提示
    Tool: Playwright
    Preconditions: 学生有待录入成绩
    Steps:
      1. 导航到 /student/audit
      2. 查看待录入状态提示
      3. 验证显示"成绩尚未录入，非审核不通过"
    Expected Result: 待录入状态正确提示
    Evidence: .omo/evidence/task-17-pending-score.png
  ```

  **Commit**: YES
  - Message: `feat(ui): student audit result page with status display`
  - Files: `frontend/src/pages/student/audit/*`
  - Pre-commit: `npm run build`

- [ ] 18. 教师预警看板

  **What to do**:
  - 创建教师预警看板页面
  - 实现班级学生列表
  - 实现预警学生筛选
  - 实现学生详情查看
  - 实现班级统计信息

  **Must NOT do**:
  - 不实现消息通知功能
  - 不实现复杂的图表

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: 前端页面开发，面向教师用户
  - **Skills**: []
    - 无需特殊技能

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (与 Tasks 13, 14, 15, 16, 17, 19 并行)
  - **Blocks**: None
  - **Blocked By**: Tasks 5, 6, 10

  **References**:
  - `plan-final.md:398` — 教师预警看板页面路径
  - `plan-final.md:30` — 教师角色需求

  **Acceptance Criteria**:
  - [ ] `/teacher/dashboard` 页面可访问
  - [ ] 班级学生列表正确显示
  - [ ] 预警学生筛选功能正常
  - [ ] 学生详情可查看
  - [ ] 班级统计信息正确

  **QA Scenarios**:
  ```
  Scenario: 教师预警看板
    Tool: Playwright
    Preconditions: 教师已登录，有班级学生数据
    Steps:
      1. 导航到 /teacher/dashboard
      2. 查看班级学生列表
      3. 筛选预警学生
      4. 点击学生查看详情
    Expected Result: 预警看板功能完整
    Evidence: .omo/evidence/task-18-teacher-dashboard.png

  Scenario: 班级统计信息
    Tool: Playwright
    Preconditions: 有班级审核数据
    Steps:
      1. 查看班级统计卡片
      2. 验证通过率、未通过率等统计正确
    Expected Result: 统计信息准确
    Evidence: .omo/evidence/task-18-class-stats.png
  ```

  **Commit**: YES
  - Message: `feat(ui): teacher alert dashboard with class statistics`
  - Files: `frontend/src/pages/teacher/dashboard/*`
  - Pre-commit: `npm run build`

- [ ] 19. 审核流程管理页

  **What to do**:
  - 创建审核流程管理页面
  - 实现流程列表（按阶段筛选）
  - 实现流程详情查看
  - 实现提交/批准/驳回/退回操作
  - 实现流转记录查看

  **Must NOT do**:
  - 不实现流程可视化
  - 不实现并行审批

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: 前端页面开发，需要处理状态流转
  - **Skills**: []
    - 无需特殊技能

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (与 Tasks 13, 14, 15, 16, 17, 18 并行)
  - **Blocks**: None
  - **Blocked By**: Tasks 5, 6, 13, 14, 15

  **References**:
  - `plan-final.md:402` — 审核流程管理页面路径
  - `plan-final.md:358-364` — 审核流程 API

  **Acceptance Criteria**:
  - [ ] `/admin/audit-flow` 页面可访问
  - [ ] 流程列表可按阶段筛选
  - [ ] 流程详情可查看
  - [ ] 提交/批准/驳回/退回操作功能正常
  - [ ] 流转记录可查看

  **QA Scenarios**:
  ```
  Scenario: 审核流程操作
    Tool: Playwright
    Preconditions: 管理员已登录，有审核流程数据
    Steps:
      1. 导航到 /admin/audit-flow
      2. 选择一个流程
      3. 点击"提交到下一级"
      4. 查看流转记录
    Expected Result: 流程状态正确更新
    Evidence: .omo/evidence/task-19-flow-operation.png

  Scenario: 流程筛选功能
    Tool: Playwright
    Preconditions: 有不同阶段的流程
    Steps:
      1. 筛选"待初核"阶段
      2. 验证列表只显示该阶段的流程
      3. 切换到"待复核"阶段
      4. 验证列表更新
    Expected Result: 筛选功能正常
    Evidence: .omo/evidence/task-19-flow-filter.png
  ```

  **Commit**: YES
  - Message: `feat(ui): audit flow management page with operations`
  - Files: `frontend/src/pages/admin/audit-flow/*`
  - Pre-commit: `npm run build`

- [ ] 20. 报表导出模块

  **What to do**:
  - 实现审核统计 API（全校/院系/专业维度）
  - 实现名单导出功能（Excel/CSV）
  - 实现审核明细导出
  - 实现 Word 文档生成（学位授予决定书等）
  - 实现导出任务管理

  **Must NOT do**:
  - 不实现复杂的报表设计器
  - 不实现实时导出（使用异步生成）

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: 涉及文件生成和数据统计
  - **Skills**: []
    - 无需特殊技能

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4 (与 Tasks 21, 22, 23, 24 并行)
  - **Blocks**: Task 24
  - **Blocked By**: Task 16

  **References**:
  - `plan-final.md:382-386` — 报表模块 API
  - `plan-final.md:79-80` — Excel/Word 生成库选型
  - docx.js 官方文档：Word 文档生成

  **Acceptance Criteria**:
  - [ ] `GET /api/v1/reports/statistics` 返回统计数据
  - [ ] `GET /api/v1/reports/export` 返回 Excel/CSV 文件
  - [ ] `GET /api/v1/reports/audit-detail` 返回审核明细文件
  - [ ] Word 文档生成功能正常

  **QA Scenarios**:
  ```
  Scenario: 统计报表生成
    Tool: Bash (curl)
    Preconditions: 有审核数据
    Steps:
      1. GET /api/v1/reports/statistics
      2. 检查返回统计数据
      3. 验证包含全校/院系/专业维度
    Expected Result: 返回完整统计数据
    Evidence: .omo/evidence/task-20-statistics.txt

  Scenario: 名单导出
    Tool: Bash (curl)
    Preconditions: 有审核结果
    Steps:
      1. GET /api/v1/reports/export?type=passed
      2. 检查返回 Excel 文件
      3. 验证文件包含通过学生名单
    Expected Result: 返回有效的 Excel 文件
    Evidence: .omo/evidence/task-20-export.xlsx
  ```

  **Commit**: YES
  - Message: `feat(reports): statistics and export functionality`
  - Files: `backend/src/modules/reports/*`
  - Pre-commit: `npm test -- --testPathPattern=reports`

- [ ] 21. 统计图表组件

  **What to do**:
  - 创建统计图表组件（柱状图、饼图、折线图）
  - 实现审核通过率图表
  - 实现院系对比图表
  - 实现趋势分析图表
  - 实现图表数据接口

  **Must NOT do**:
  - 不使用复杂的图表库（使用简单的 SVG 或轻量库）
  - 不实现实时更新

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: 前端图表组件开发
  - **Skills**: []
    - 无需特殊技能

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4 (与 Tasks 20, 22, 23, 24 并行)
  - **Blocks**: Task 24
  - **Blocked By**: Task 16

  **References**:
  - `plan-final.md:462-491` — 教务处看板原型
  - 轻量图表库文档

  **Acceptance Criteria**:
  - [ ] 柱状图组件可正确渲染
  - [ ] 饼图组件可正确渲染
  - [ ] 折线图组件可正确渲染
  - [ ] 图表数据接口正常

  **QA Scenarios**:
  ```
  Scenario: 图表渲染测试
    Tool: Playwright
    Preconditions: 有统计数据
    Steps:
      1. 渲染柱状图组件
      2. 验证图表正确显示
      3. 切换数据源
      4. 验证图表更新
    Expected Result: 图表正确渲染和更新
    Evidence: .omo/evidence/task-21-charts.png

  Scenario: 图表交互测试
    Tool: Playwright
    Preconditions: 图表已渲染
    Steps:
      1. 点击柱状图某一项
      2. 验证显示详细数据
      3. 悬停在饼图上
      4. 验证显示百分比
    Expected Result: 图表交互正常
    Evidence: .omo/evidence/task-21-chart-interaction.png
  ```

  **Commit**: YES
  - Message: `feat(ui): statistics chart components`
  - Files: `frontend/src/components/charts/*`
  - Pre-commit: `npm run build`

- [ ] 22. 单元测试补充

  **What to do**:
  - 为核心审核逻辑编写单元测试
  - 为 API 端点编写集成测试
  - 为工具函数编写单元测试
  - 实现测试覆盖率报告
  - 修复测试发现的问题

  **Must NOT do**:
  - 不追求 100% 覆盖率（目标 ≥ 60%）
  - 不编写过多的边界测试

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: 测试编写需要理解业务逻辑
  - **Skills**: []
    - 无需特殊技能

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4 (与 Tasks 20, 21, 23, 24 并行)
  - **Blocks**: Task 23
  - **Blocked By**: ALL previous tasks

  **References**:
  - `plan-final.md:528-534` — 测试策略
  - Jest 官方文档：测试编写

  **Acceptance Criteria**:
  - [ ] 核心审核逻辑测试覆盖率 ≥ 60%
  - [ ] 所有测试通过
  - [ ] 测试覆盖率报告生成

  **QA Scenarios**:
  ```
  Scenario: 测试执行
    Tool: Bash
    Preconditions: 测试代码已编写
    Steps:
      1. cd backend && npm test
      2. 检查测试结果
      3. 查看覆盖率报告
    Expected Result: 所有测试通过，覆盖率 ≥ 60%
    Evidence: .omo/evidence/task-22-test-results.txt

  Scenario: 覆盖率检查
    Tool: Bash
    Preconditions: 测试已执行
    Steps:
      1. 查看 coverage/lcov-report/index.html
      2. 验证核心模块覆盖率
    Expected Result: 核心模块覆盖率 ≥ 60%
    Evidence: .omo/evidence/task-22-coverage.txt
  ```

  **Commit**: YES
  - Message: `test: unit tests for core audit logic`
  - Files: `backend/src/**/*.test.ts`
  - Pre-commit: `npm test`

- [ ] 23. 部署配置

  **What to do**:
  - 创建 PM2 配置文件
  - 创建 Nginx 配置文件
  - 创建环境变量配置
  - 创建数据库备份脚本
  - 创建部署文档
  - 创建启动脚本

  **Must NOT do**:
  - 不使用 Docker
  - 不使用复杂的部署工具

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 配置文件编写，相对简单
  - **Skills**: []
    - 无需特殊技能

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4 (与 Tasks 20, 21, 22, 24 并行)
  - **Blocks**: F1-F4
  - **Blocked By**: Task 22

  **References**:
  - `plan-final.md:538-564` — 部署方案
  - PM2 官方文档：配置文件
  - Nginx 官方文档：反向代理配置

  **Acceptance Criteria**:
  - [ ] `ecosystem.config.js` PM2 配置存在
  - [ ] `nginx.conf` Nginx 配置存在
  - [ ] `.env.production` 环境变量配置存在
  - [ ] `backup.sh` 备份脚本存在
  - [ ] `docs/deploy.md` 部署文档存在

  **QA Scenarios**:
  ```
  Scenario: PM2 配置验证
    Tool: Bash
    Preconditions: PM2 已安装
    Steps:
      1. pm2 start ecosystem.config.js
      2. pm2 list
      3. pm2 stop all
    Expected Result: PM2 配置正确，服务可启动
    Evidence: .omo/evidence/task-23-pm2.txt

  Scenario: Nginx 配置验证
    Tool: Bash
    Preconditions: Nginx 已安装
    Steps:
      1. nginx -t -c nginx.conf
      2. 检查配置语法正确
    Expected Result: Nginx 配置语法正确
    Evidence: .omo/evidence/task-23-nginx.txt
  ```

  **Commit**: YES
  - Message: `feat(deploy): PM2 and Nginx deployment configuration`
  - Files: `ecosystem.config.js`, `nginx.conf`, `scripts/*`, `docs/deploy.md`
  - Pre-commit: `pm2 config test`

- [ ] 24. 文档编写

  **What to do**:
  - 编写 API 接口文档（含请求/响应示例）
  - 编写数据库结构说明
  - 编写操作手册（图文步骤，面向 50+ 岁用户）
  - 创建 Excel 导入模板
  - 编写审核规则配置文件说明

  **Must NOT do**:
  - 不编写过多的技术文档
  - 不编写开发者文档

  **Recommended Agent Profile**:
  - **Category**: `writing`
    - Reason: 文档编写工作
  - **Skills**: []
    - 无需特殊技能

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4 (与 Tasks 20, 21, 22, 23 并行)
  - **Blocks**: F1-F4
  - **Blocked By**: Tasks 20, 21

  **References**:
  - `plan-final.md:569-578` — 文档清单
  - 现有 API 代码

  **Acceptance Criteria**:
  - [ ] `docs/api.md` API 文档存在且完整
  - [ ] `docs/database.md` 数据库文档存在
  - [ ] `docs/operation-manual.md` 操作手册存在
  - [ ] `docs/excel-templates/` 模板文件存在
  - [ ] `docs/rules/audit-rules.json` 规则说明存在

  **QA Scenarios**:
  ```
  Scenario: API 文档完整性
    Tool: Bash
    Preconditions: API 代码已完成
    Steps:
      1. 读取 docs/api.md
      2. 验证包含所有 API 端点
      3. 验证包含请求/响应示例
    Expected Result: API 文档完整
    Evidence: .omo/evidence/task-24-api-doc.txt

  Scenario: 操作手册可读性
    Tool: Bash
    Preconditions: 操作手册已编写
    Steps:
      1. 读取 docs/operation-manual.md
      2. 验证包含图文步骤
      3. 验证语言通俗易懂
    Expected Result: 操作手册可读性好
    Evidence: .omo/evidence/task-24-manual.txt
  ```

  **Commit**: YES
  - Message: `docs: API documentation, database docs, operation manual`
  - Files: `docs/*`
  - Pre-commit: -

---

## Final Verification Wave

> 4 个审查 Agent 并行运行。全部通过后展示给用户，获取明确"okay"后完成。

- [ ] F1. **计划合规审计** — `oracle`
  读取计划端到端。对每个"Must Have": 验证实现存在（读文件、curl 端点、运行命令）。对每个"Must NOT Have": 搜索代码库中的禁止模式 — 如发现则拒绝并标注 file:line。检查 `.omo/evidence/` 中的证据文件。对比交付物与计划。
  输出: `Must Have [N/N] | Must NOT Have [N/N] | Tasks [N/N] | VERDICT: APPROVE/REJECT`

- [ ] F2. **代码质量审查** — `unspecified-high`
  运行 `tsc --noEmit` + linter + `jest`。审查所有变更文件：`as any`/`@ts-ignore`、空 catch、console.log、注释掉的代码、未使用的导入。检查 AI slop：过度注释、过度抽象、泛型命名（data/result/item/temp）。
  输出: `Build [PASS/FAIL] | Lint [PASS/FAIL] | Tests [N pass/N fail] | VERDICT`

- [ ] F3. **真实 QA 执行** — `unspecified-high` (+ `playwright` skill)
  从干净状态开始。执行每个任务的 QA 场景 — 遵循精确步骤，捕获证据。测试跨任务集成（功能协同工作，而非隔离）。测试边缘情况：空状态、无效输入、快速操作。保存到 `.omo/evidence/final-qa/`。
  输出: `Scenarios [N/N pass] | Integration [N/N] | Edge Cases [N tested] | VERDICT`

- [ ] F4. **范围保真检查** — `deep`
  对每个任务：读取"做什么"，读取实际 diff（git log/diff）。验证 1:1 — 规格中的所有内容都已构建（无遗漏），规格之外的内容未构建（无蔓延）。检查"Must NOT do"合规性。检测跨任务污染：Task N 触碰 Task M 的文件。标记未 accounted 的变更。
  输出: `Tasks [N/N compliant] | Contamination [CLEAN/N issues] | Unaccounted [CLEAN/N files] | VERDICT`

---

## Commit Strategy

| Wave | 提交信息 | 文件 | 预提交检查 |
|------|----------|------|------------|
| 1 | `feat(init): project scaffolding with Express + React + Prisma` | 全部初始化文件 | `npx prisma validate` |
| 1 | `feat(auth): JWT authentication with role-based access control` | auth 模块 | `npm test` |
| 2 | `feat(import): Excel import for students, courses, grades` | import 模块 | `npm test` |
| 2 | `feat(audit): core audit engine with trial/official modes` | audit 模块 | `npm test` |
| 3 | `feat(workflow): multi-level audit flow with manual overrides` | workflow 模块 | `npm test` |
| 3 | `feat(ui): admin dashboard, student view, teacher alerts` | 前端页面 | `npm run build` |
| 4 | `feat(reports): statistics and export functionality` | reports 模块 | `npm test` |
| 4 | `feat(deploy): PM2 + Nginx deployment configuration` | 部署配置 | - |

---

## Success Criteria

### 验证命令
```bash
# 后端启动
cd backend && npm run dev  # Expected: Server running on port 3000

# 前端启动
cd frontend && npm run dev  # Expected: Vite dev server on port 5173

# 数据库迁移
npx prisma migrate deploy  # Expected: Migration successful

# 运行测试
npm test  # Expected: Tests passed, coverage ≥ 60%

# 类型检查
npx tsc --noEmit  # Expected: No errors

# 构建
npm run build  # Expected: Build successful
```

### 最终检查清单
- [ ] 所有"Must Have"功能已实现
- [ ] 所有"Must NOT Have"功能未出现
- [ ] 所有测试通过
- [ ] 在 4 核 8G 环境稳定运行
- [ ] API 文档完整
- [ ] 部署文档完整
- [ ] 操作手册完整
