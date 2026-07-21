# SCMS 学生竞赛信息管理系统 — 前端

Student Competition Information Management System

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
| WebSocket | STOMP + SockJS | - |

## 目录结构

```
frontend/src/
├── api/           # API 请求层
│   ├── modules/   # 按功能分组的 API 模块
│   │   ├── auth.ts          # 认证
│   │   ├── competition.ts   # 竞赛
│   │   ├── registration.ts  # 报名
│   │   ├── result.ts        # 成绩
│   │   ├── export.ts        # 导出
│   │   ├── system.ts        # 系统
│   │   └── user.ts          # 用户
│   ├── request.ts  # Axios 实例 + JWT 拦截器
│   └── types.ts    # 接口类型定义
├── components/     # 通用组件
│   ├── GlassModal.tsx       # 玻璃态模态框
│   ├── EmptyState.tsx       # 空状态占位
│   ├── ListMeta.tsx         # 列表计数
│   ├── PageSkeleton.tsx     # 页面加载骨架
│   ├── QuickActions.tsx     # 快捷操作面板
│   ├── UpcomingReminders.tsx # 待办提醒
│   ├── Pagination.tsx       # 分页
│   ├── ConfirmDialog.tsx    # 确认对话框
│   ├── Toast.tsx            # 轻提示
│   ├── AuthGuard.tsx        # 路由守卫
│   └── ... (共 32 个组件)
├── config/         # 环境变量封装
│   └── env.ts      # 读取 VITE_* 环境变量
├── hooks/          # 自定义 Hooks
├── motion/         # 动画配置
├── pages/          # 页面组件 (按角色分)
│   ├── admin/      # 管理员页面
│   ├── teacher/    # 教师页面
│   └── student/    # 学生页面
├── store/          # Zustand 状态
│   └── authStore.ts  # 认证状态
├── types/          # 类型声明
├── utils/          # 工具函数
│   ├── format.ts        # formatDate, resolveCoverUrl, formatFileSize
│   └── statusBadge.ts   # getStatusBadge (竞赛/报名状态)
├── App.tsx         # 路由定义
├── main.tsx        # 入口
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

日期格式化、封面图片 URL 解析、文件大小格式化统一使用 `src/utils/format.ts`。状态徽章映射（竞赛状态、报名状态）统一使用 `src/utils/statusBadge.ts`。不要在页面文件中重复定义这些函数。

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
