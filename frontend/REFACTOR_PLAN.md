## 消除前端 AI 模板感 — 11 项重构计划

### 总览

本计划针对学生竞赛管理系统前端（React + Motion + CSS Variables）中 11 处 AI 生成模板感较强的设计模式，按依赖关系分 4 个阶段执行。预计涉及约 30 个文件，核心改动集中在 CSS 层和共享组件层，页面文件以删除重复代码为主。

---

### 阶段一：CSS 基础层（无组件逻辑变动，纯样式调整）

#### 问题 4：同一个 cubic-bezier 曲线用于所有交互元素

**现状**：`cubic-bezier(0.34, 1.56, 0.64, 1)` 在 7 处使用，涵盖侧边栏、卡片、按钮、chip、tooltip。

**方案**：在 `:root` 中定义 3 个命名缓动变量，按语义分配：

```css
:root {
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);   /* 装饰性弹性元素（卡片悬浮） */
  --ease-snap:   cubic-bezier(0.25, 0.1, 0.25, 1);     /* 快速反馈（按钮、chip） */
  --ease-smooth: cubic-bezier(0.4, 0, 0.2, 1);         /* 空间过渡（侧边栏、tooltip） */
}
```

**改动文件**：

- `index.css` — 在 `:root` 中新增 3 个变量
- `index.css` — 将 7 处 `cubic-bezier(0.34, 1.56, 0.64, 1)` 按上下文替换：
  - `.sidebar-item`（line 194）→ `var(--ease-smooth)`
  - `.sidebar-user`（line 310）→ `var(--ease-smooth)`
  - `.sidebar-tooltip`（line 280）→ `var(--ease-smooth)`
  - `.glass-card`（line 466）→ `var(--ease-spring)`（保留弹性）
  - `.metric-card`（line 644）→ `var(--ease-spring)`（保留弹性）
  - `.chip`（line 1073）→ `var(--ease-snap)`
  - `.btn`（line 1225）→ `var(--ease-snap)`

---

#### 问题 6：Glass 伪元素块在 CSS 中复制了 5 次

**现状**：`.glass-card`、`.metric-card`、`.detail-panel`、`.glass-tile`、`.login-form-card` 各自有几乎相同的 `::before` 折射渐变 + `::after` 高光块（~20 行 × 5 = ~100 行重复）。

**方案**：提取为一个可复用的 CSS 选择器组，用逗号合并：

```css
/* 一次性定义所有 glass surface 的光学效果 */
.glass-card::before,
.metric-card::before,
.detail-panel::before,
.glass-tile::before,
.login-form-card::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(168deg,
    rgba(255,255,255,0.42) 0%,
    rgba(255,255,255,0.12) 18%,
    rgba(255,255,255,0.01) 38%,
    transparent 55%,
    rgba(0,0,0,0.008) 100%);
  pointer-events: none;
  z-index: 0;
}

.glass-card::after,
.metric-card::after,
.detail-panel::after,
.glass-tile::after,
.login-form-card::after {
  content: '';
  position: absolute;
  top: 0; left: 8%; right: 8%;
  height: 36%;
  border-radius: 0 0 50% 50% / 0 0 100% 100%;
  background: linear-gradient(180deg,
    rgba(255,255,255,0.22) 0%,
    rgba(255,255,255,0.06) 55%,
    transparent 100%);
  pointer-events: none;
  z-index: 0;
}
```

**改动文件**：`index.css` — 删除 5 处重复的 `::before`/`::after` 块（约 100 行），在合适位置写入上述合并版。

---

#### 问题 7：毛玻璃无差别铺在所有表面，缺少视觉层级

**现状**：16+ 种元素全部使用 `backdrop-filter: blur() saturate()`，没有任何实体表面做对比。

**方案**：保留玻璃效果给"装饰性表面"（侧边栏、模态框、移动端 tab bar），将"内容性表面"（卡片、表格、表单区域）改为实体白底 + 轻量阴影。

| 元素 | 当前 | 改为 |
|------|------|------|
| `.glass-card` | glass | solid（`background: rgba(255,255,255,0.85)` + 轻阴影，去掉 backdrop-filter） |
| `.metric-card` | glass | 保留 glass（属于装饰性概览卡片） |
| `.bento-card` | glass | 保留 glass（同上） |
| `.detail-panel` | glass | solid（内容密集区，可读性优先） |
| `.glass-search` | glass | 保留 glass |
| `.chip` | glass | solid 轻量 |
| `.btn.primary` | glass | solid 轻量 |
| `.timeline-card` | glass | solid |
| `.login-form-card` | glass | 保留 glass（登录页视觉焦点） |
| `.glass-tile` | glass | 保留 glass |
| 侧边栏 | glass | 保留 glass |
| 移动端 tab bar | glass | 保留 glass |

**改动文件**：`index.css` — 调整约 6 个选择器的 `background`、`backdrop-filter`、`box-shadow` 属性。

---

### 阶段二：布局与共享基础设施

#### 问题 1：每个页面结尾的 `<div style={{ paddingBottom: '40px' }} />` 占位

**现状**：20 个页面各自在末尾写了相同的 spacer。

**方案**：将 `padding-bottom` 加到布局层的滚动容器上，然后删除所有页面的 spacer。

- `.desktop-content`（line 430）当前 `padding: 24px 28px 32px`，将 `32px` 改为 `64px`
- `.mobile-content`（line 1954）当前 `padding: 16px`，`padding-bottom` 改为 `calc(56px + env(safe-area-inset-bottom, 0px))`

**改动文件**：

- `index.css` — 修改 `.desktop-content` 和 `.mobile-content` 的 padding-bottom
- 20 个页面文件 — 删除末尾的 `<div style={{ paddingBottom: '40px' }} />`：
  - `AdminDashboard.tsx`、`StudentDashboard.tsx`、`TeacherDashboard.tsx`
  - `AdminUsers.tsx`、`AdminCompetitions.tsx`、`AdminLogs.tsx`
  - `AdminNotices.tsx`、`AdminOrgTree.tsx`、`AdminSettings.tsx`、`AdminStats.tsx`
  - `StudentCompetitions.tsx`、`StudentAudit.tsx`、`StudentGrades.tsx`
  - `StudentMessages.tsx`、`StudentRegistration.tsx`
  - `TeacherCompetitionCreate.tsx`、`TeacherCompetitions.tsx`
  - `TeacherGrades.tsx`、`TeacherMessages.tsx`、`TeacherTeams.tsx`

---

#### 问题 2：19 个页面用完全一样的 "加载中..." 文字

**现状**：所有页面用同一个 `<div style={{ padding: '60px', ... }}>加载中...</div>`。项目中已有 `Skeleton.tsx`（含 `SkeletonLine`、`SkeletonCircle`、`SkeletonList`、`SkeletonCard`）但未被任何页面使用。

**方案**：基于已有 `Skeleton.tsx`，新建 3 种预设骨架组件：

```
src/components/PageSkeleton.tsx
├── DashboardSkeleton()  — 4 个 SkeletonCard 网格
├── ListSkeleton()       — SkeletonList（5 行）
└── TableSkeleton()      — 5 行表格骨架
```

各页面按内容类型替换：

| 页面类型 | 使用的骨架 | 页面 |
|----------|-----------|------|
| 仪表盘 | `DashboardSkeleton` | AdminDashboard, StudentDashboard, TeacherDashboard |
| 列表页 | `ListSkeleton` | AdminCompetitions, StudentCompetitions, AdminNotices, StudentMessages, TeacherMessages, TeacherTeams, TeacherCompetitions |
| 表格页 | `TableSkeleton` | AdminUsers, AdminLogs, TeacherGrades, StudentGrades |
| 设置/组织树 | `ListSkeleton` | AdminSettings, AdminOrgTree, AdminStats |
| 其他 | `ListSkeleton` | StudentRegistration, StudentAudit, TeacherCompetitionCreate |

**改动文件**：

- 新建 `src/components/PageSkeleton.tsx`
- 19 个页面文件 — 替换 loading 判断逻辑

---

#### 问题 5：6 处内联模态框代码完全一样

**现状**：每个模态框都手写了 fixed overlay + backdrop blur + AnimatePresence + 关闭按钮（~30 行 × 6 处 = ~180 行重复）。

**方案**：新建 `GlassModal` 组件：

```tsx
// src/components/GlassModal.tsx
interface GlassModalProps {
  open: boolean
  onClose: () => void
  title?: string
  maxWidth?: string
  children: ReactNode
}
```

内部封装 overlay 动画、backdrop 样式、关闭按钮和标题栏。

**改动文件**：

- 新建 `src/components/GlassModal.tsx`
- 替换 6 处模态框代码：
  - `AdminCompetitions.tsx`（审核详情弹窗）
  - `AdminUsers.tsx`（编辑用户弹窗）
  - `StudentCompetitions.tsx`（详情弹窗 × 2）
  - `StudentRegistration.tsx`（报名详情弹窗）
  - `TeacherCompetitions.tsx`（报名详情弹窗）

---

### 阶段三：动画差异化

#### 问题 3：stagger 动画一把梭用于所有页面

**现状**：`staggerContainer` + `staggerItem`（spring 300/24/0.8）被 83 次引用，表格、表单、列表、仪表盘全部用同一套弹性入场动画。

**方案**：在 `variants.ts` 中增加 2 个新变体，按内容类型区分：

```typescript
// 轻量淡入 — 用于表格行、密集列表（无弹性、无延迟）
export const fadeInList: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.25, ease: [0.25, 0.1, 0.25, 1] },
  },
}

// 即时出现 — 用于表单、设置页（无动画）
export const instant: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.15 } },
}
```

按页面类型分配动画策略：

| 页面类型 | 动画方案 | 页面 |
|----------|---------|------|
| 仪表盘概览 | 保留 `staggerContainer`（4 张卡片依次入场，有装饰性） | *Dashboard.tsx |
| 卡片网格 | 保留 `staggerContainer`（竞赛卡片列表） | StudentCompetitions, TeacherCompetitions |
| 数据表格 | 改用 `fadeInList`（整表淡入，行不逐个动画） | AdminUsers, AdminLogs, TeacherGrades |
| 表单/设置 | 改用 `instant`（快速出现） | AdminSettings, AdminOrgTree, ProfilePage, TeacherCompetitionCreate |
| 消息/通知列表 | 改用 `fadeInList` | StudentMessages, TeacherMessages, AdminNotices |
| 成绩/报名列表 | 改用 `fadeInList` | StudentGrades, StudentRegistration, StudentAudit |

**改动文件**：

- `src/motion/variants.ts` — 新增 `fadeInList` 和 `instant`
- 约 15 个页面文件 — 将 `staggerContainer`/`staggerItem` 替换为对应的变体

---

### 阶段四：组件提取与代码清理

#### 问题 9：工具函数在多个文件中重复定义

**现状**：`formatDate` 有 5 份、`resolveCoverUrl` 有 4 份、`formatFileSize` 有 2 份几乎一样的实现。

**方案**：新建 `src/utils/format.ts`，集中所有工具函数：

```typescript
// src/utils/format.ts

export function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function resolveCoverUrl(url: string | null | undefined): string {
  if (!url) return '/default-cover.jpg'
  if (url.startsWith('/uploads')) return `http://localhost:8080${url}`
  return url
}
```

**改动文件**：

- 新建 `src/utils/format.ts`
- 删除以下文件中的本地定义，改为 import：
  - `AdminCompetitions.tsx` — 删除 formatDate, resolveCoverUrl, formatFileSize
  - `StudentCompetitions.tsx` — 删除 formatDate, resolveCoverUrl, formatFileSize
  - `TeacherCompetitions.tsx` — 删除 formatDate, resolveCoverUrl
  - `TeacherCompetitionCreate.tsx` — 删除 resolveCoverUrl
  - `AdminUsers.tsx` — 删除 formatDate
  - `StudentRegistration.tsx` — 删除 formatDate
  - `StudentGrades.tsx` — 删除 formatDate
  - `AdminOrgTree.tsx` 等其他包含 formatDate 的文件

---

#### 问题 8：三个 Dashboard 的"快捷入口"代码块完全一样

**现状**：`AdminDashboard.tsx`、`StudentDashboard.tsx`、`TeacherDashboard.tsx` 中渲染"快捷入口"的 JSX 逐字符相同（只有数据数组不同）。

**方案**：新建共享组件：

```tsx
// src/components/QuickActions.tsx
interface QuickAction { label: string; icon: LucideIcon; path: string }
interface QuickActionsProps { items: QuickAction[] }
```

**改动文件**：

- 新建 `src/components/QuickActions.tsx`
- `AdminDashboard.tsx` — 替换快捷入口渲染块为 `<QuickActions items={quickActions} />`
- `StudentDashboard.tsx` — 同上
- `TeacherDashboard.tsx` — 同上

---

#### 问题 10："共 X 条" 计数和 "暂无XXX" 空状态没有抽组件

**现状**：7 个列表页用同样的 "共 X 条" 计数，13 处用同样的 "暂无XXX" 纯文本空状态。

**方案**：新建 2 个轻量组件：

```tsx
// src/components/ListMeta.tsx — 列表头部计数
interface ListMetaProps { count: number; unit?: string; prefix?: string }

// src/components/EmptyState.tsx — 空状态
interface EmptyStateProps { icon?: LucideIcon; text: string; action?: { label: string; onClick: () => void } }
```

`EmptyState` 带一个简单的插画 SVG（几何线条风格，与 glass 主题搭配），比纯文本有温度得多。

**改动文件**：

- 新建 `src/components/ListMeta.tsx` 和 `src/components/EmptyState.tsx`
- 7 个列表页替换 "共 X 条" 部分为 `<ListMeta>`
- 13 处空状态替换为 `<EmptyState>`

---

#### 问题 11：803 个内联 style + 3 个组件从未被导入

**现状**：

- `GlassCard.tsx`、`GlassButton.tsx`、`StatusBadge.tsx` 创建了但 0 次导入
- 803 个内联 style 属性绕过了 CSS 变量体系，同样的 `{ fontSize: '12px', color: 'var(--text-tertiary)' }` 重复了几百次

**方案**：分两步走。

**步骤 A — 清理死代码**：删除 `GlassCard.tsx`、`GlassButton.tsx`、`StatusBadge.tsx`（它们与 CSS class 体系冲突，且无人使用）。`Skeleton.tsx` 保留并在阶段二中使用。

**步骤 B — 提取高频内联模式为 CSS 工具类**：

```css
/* 在 index.css 末尾新增工具类 */
.text-meta   { font-size: 12px; color: var(--text-tertiary); }
.text-label  { font-size: 13px; font-weight: 600; color: var(--text-secondary); }
.text-value  { font-size: 13px; font-weight: 500; color: var(--text-primary); }
.text-mono   { font-family: monospace; }
.flex-center { display: flex; align-items: center; }
.gap-sm      { gap: 6px; }
.gap-md      { gap: 12px; }
```

将页面中出现频率最高的 3-4 种内联模式替换为 class，其余保留内联（不做全量迁移，风险过大）。

**改动文件**：

- 删除 `src/components/GlassCard.tsx`、`GlassButton.tsx`、`StatusBadge.tsx`
- `index.css` — 新增 ~10 个工具类
- 各页面文件 — 将最高频的内联模式（`text-meta`、`text-label` 等）替换为 className（约覆盖 200-300 处）

---

### 执行顺序与依赖关系

```
阶段一（CSS 基础层）── 无前置依赖，可最先执行
  ├─ 问题 4（缓动变量）
  ├─ 问题 6（glass 伪元素合并）
  └─ 问题 7（毛玻璃层级化）  ← 依赖问题 6 完成

阶段二（布局与共享基础设施）── 依赖阶段一完成
  ├─ 问题 1（底部间距）  ← 独立，可并行
  ├─ 问题 2（加载骨架）  ← 独立，可并行
  └─ 问题 5（Modal 组件） ← 独立，可并行

阶段三（动画差异化）── 依赖阶段一（问题 4 缓动变量）完成
  └─ 问题 3（stagger 差异化）

阶段四（组件提取与清理）── 依赖阶段二完成（避免改同一文件时冲突）
  ├─ 问题 9（工具函数提取） ← 独立，可并行
  ├─ 问题 8（QuickActions） ← 独立，可并行
  ├─ 问题 10（ListMeta / EmptyState） ← 独立，可并行
  └─ 问题 11（死代码 + 内联样式） ← 最后执行，在其他组件提取完毕后清理
```

### 预估工作量

| 阶段 | 涉及文件数 | 新增文件 | 删除行数（估） | 新增行数（估） |
|------|-----------|---------|---------------|---------------|
| 阶段一 | 1 (index.css) | 0 | ~120 行 | ~50 行 |
| 阶段二 | ~25 | 2 | ~230 行 | ~120 行 |
| 阶段三 | ~16 | 0 | ~40 行 | ~30 行 |
| 阶段四 | ~15 | 4 | ~200 行 | ~150 行 |
| **合计** | **~40（去重）** | **6** | **~590 行** | **~350 行** |

净减少约 240 行代码，同时新增 6 个有明确职责的共享文件。
