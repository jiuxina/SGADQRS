# AGENT.md — SCMS 项目 AI 代理指南

> 本文件为 AI 编码代理提供项目上下文、架构约定和操作规范。

## 项目概述

SCMS（Student Competition Information Management System）是一个学生竞赛信息管理系统，采用前后端分离架构。

## 技术栈

| 层级 | 技术 | 版本 |
|------|------|------|
| 前端 | React + TypeScript + Vite | React 19, Vite 8 |
| UI | Tailwind CSS + Motion | Tailwind 4 |
| 状态管理 | Zustand | 5.x |
| 路由 | React Router DOM | 7.x |
| 后端 | Spring Boot | 3.2.5 |
| ORM | MyBatis-Plus | 3.5.6 |
| 数据库 | MySQL | 8.x |
| 认证 | JWT (jjwt) | 0.12.5 |
| WebSocket | STOMP + SockJS | - |

## 目录结构

```
SGADQRS/
├── frontend/                # 前端项目
│   ├── src/
│   │   ├── api/             # API 请求模块
│   │   │   ├── modules/     # 按功能分组 (auth, competition, result...)
│   │   │   ├── request.ts   # Axios 实例 + 拦截器
│   │   │   └── types.ts     # 接口类型定义
│   │   ├── components/      # 通用组件
│   │   ├── config/          # 配置常量
│   │   ├── hooks/           # 自定义 Hooks
│   │   ├── motion/          # 动画配置
│   │   ├── pages/           # 页面组件
│   │   ├── store/           # Zustand 状态
│   │   └── utils/           # 工具函数
│   ├── vite.config.ts       # Vite 配置 + 代理
│   └── package.json
├── backend/                 # 后端项目
│   ├── src/main/java/com/scms/
│   │   ├── common/          # 通用类 (Result, GlobalExceptionHandler)
│   │   ├── config/          # 配置 (WebSocket, MyBatis, WebMvc)
│   │   ├── controller/      # REST 控制器
│   │   ├── dto/             # 数据传输对象
│   │   ├── entity/          # 数据库实体
│   │   ├── mapper/          # MyBatis Mapper 接口
│   │   ├── security/        # JWT + Spring Security
│   │   └── service/         # 业务逻辑
│   ├── src/main/resources/
│   │   └── application.yml  # 应用配置
│   └── pom.xml
├── docs/                    # 文档
└── AGENT.md                 # 本文件
```

## 服务端口

| 服务 | 端口 | 说明 |
|------|------|------|
| 前端 Dev Server | 3000 | Vite 开发服务器 |
| 后端 API | 8080 | Spring Boot (context-path: /api) |
| MySQL | 3306 | 数据库 |

## 前端路由规范

路由定义在 `frontend/src/App.tsx`，格式为 `/{role}/{page}`：

### 管理员 (admin)
| 路由 | 页面 | 说明 |
|------|------|------|
| `/admin/dashboard` | AdminDashboard | 仪表盘 |
| `/admin/users` | AdminUsers | 用户管理 |
| `/admin/competitions` | AdminCompetitions | 竞赛管理 |
| `/admin/org-tree` | AdminOrgTree | 组织架构 |
| `/admin/registrations` | AdminRegistrations | 报名监管 |
| `/admin/grades` | AdminGrades | 成绩管理 |
| `/admin/stats` | AdminStats | 数据统计 |
| `/admin/notices` | AdminNotices | 公告管理 |
| `/admin/logs` | AdminLogs | 系统日志 |
| `/admin/settings` | AdminSettings | 系统设置 |

### 教师 (teacher)
| 路由 | 页面 | 说明 |
|------|------|------|
| `/teacher/dashboard` | TeacherDashboard | 仪表盘 |
| `/teacher/competitions` | TeacherCompetitions | 我的竞赛 |
| `/teacher/competitions/create` | TeacherCompetitionCreate | 创建竞赛 |
| `/teacher/teams` | TeacherTeams | 团队管理 |
| `/teacher/grades` | TeacherGrades | 成绩管理 |
| `/teacher/messages` | TeacherMessages | 消息中心 |

### 学生 (student)
| 路由 | 页面 | 说明 |
|------|------|------|
| `/student/dashboard` | StudentDashboard | 仪表盘 |
| `/student/competitions` | StudentCompetitions | 竞赛列表 |
| `/student/registration` | StudentRegistration | 我的报名 |
| `/student/grades` | StudentGrades | 我的成绩 |
| `/student/messages` | StudentMessages | 消息中心 |
| `/student/teams` | StudentTeams | 我的团队 |
| `/student/audit` | StudentAudit | 审核状态 |
| `/student/history` | StudentHistory | 参赛历史 |

### 通用
| 路由 | 页面 | 说明 |
|------|------|------|
| `/profile` | ProfilePage | 个人中心 |
| `/login` | LoginPage | 登录页 |

## API 规范

- Base URL: `http://localhost:8080/api`
- 认证: JWT Bearer Token（请求头 `Authorization: Bearer <token>`）
- 响应格式: `{ code: number, message: string, data: T }`
- 分页响应: `{ records: T[], total: number, current: number, size: number, pages: number }`

### 前端请求拦截器

`frontend/src/api/request.ts` 中的拦截器逻辑：
- **请求拦截**: 自动附加 JWT Token
- **响应拦截**: 
  - `code !== 200` → reject
  - 非登录接口返回 401 → 清除 token + 跳转登录页（带防抖）

## 数据库约定

- 表名: 下划线命名 (如 `competition_result`)
- 字段名: 下划线命名 (如 `create_time`)
- 实体类: 驼峰命名 (如 `createTime`)
- MyBatis-Plus 自动映射: `map-underscore-to-camel-case: true`
- 逻辑删除: `deleted` 字段 (0=正常, 1=已删除)

## 认证体系

| 角色 | roleCode | userType |
|------|----------|----------|
| 管理员 | admin | 3 |
| 教师 | teacher | 2 |
| 学生 | student | 1 |

### 默认账号

| 角色 | 账号 | 密码 |
|------|------|------|
| 管理员 | admin | 123456 |
| 教师 | T2024001 | 123456 |
| 学生 | S20210001 | 123456 |

## WebSocket

- 端点: `/api/ws` (SockJS + STOMP)
- 订阅: `/user/queue/notifications` (用户私有通知)
- 认证: STOMP CONNECT 帧携带 JWT Token
- Vite 代理: `/api/ws` → `http://localhost:8080` (ws: true)

## 编码约定

### 前端
- 组件: PascalCase (`AdminDashboard.tsx`)
- 工具函数: camelCase (`formatDate.ts`)
- 类型定义: `frontend/src/api/types.ts`
- 样式: Tailwind CSS + CSS 变量
- 动画: Motion (Framer Motion)

### 后端
- 控制器: `@RestController` + `@RequestMapping`
- 服务层: `@Service` + 构造器注入
- 实体: `@Data` + `@TableName`
- 安全: `@PreAuthorize("hasRole('ADMIN')")` 

## 常见操作

### 启动项目
```bash
# 方式1: 使用脚本
start-all.bat

# 方式2: 手动启动
# 终端1: 后端
cd backend && mvn spring-boot:run

# 终端2: 前端
cd frontend && npm run dev
```

### 构建部署
```bash
# 后端打包
cd backend && mvn clean package -DskipTests

# 前端构建
cd frontend && npm run build
```

### 数据库迁移
```bash
# 连接 MySQL
mysql -u root -proot scms

# 执行 SQL 文件
source backend/sql/init.sql
```

## 注意事项

1. **端口冲突**: 8080 端口可能被 Docker/WSL 占用，检查后再启动
2. **CORS**: 后端 WebMvcConfig 已配置允许 `localhost:3000`
3. **文件上传**: 最大 10MB，存储路径 `./uploads/`
4. **JWT 过期**: 24 小时，过期后自动跳转登录页
5. **WebSocket**: 开发环境通过 Vite proxy 转发，注意 URL 为 `/api/ws` 而非 `/ws`

## 数据库清理规则

删除数据库表或字段时，必须同步清理所有相关代码引用：

### 删除表时
- 删除对应的实体类（entity/*.java）
- 删除对应的 Mapper 接口（mapper/*.java）
- 删除对应的 Controller（controller/*.java）
- 删除 Service 中对该表的所有引用
- 删除前端 API 模块中的相关接口
- 删除前端类型定义中的相关接口

### 删除字段时
- 删除实体类中的对应属性
- 删除 DTO 中的对应属性
- 删除前端类型定义中的对应字段
- 删除前端页面中使用该字段的 UI 元素
- 不得在代码中保留对已删除表/字段的引用

### 奖项系统说明
- 竞赛的奖项是自定义的，由教师在创建竞赛时定义
- 奖项存储在 `competition.awards` 字段（JSON 格式）
- 成绩的 `award_level` 对应奖项的 `level`，`award_name` 对应奖项的 `name`
- 前端显示奖项时直接使用 `awardName`，不再使用固定的奖项映射表
