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

## 目录结构

```
SGADQRS/
├── frontend/                # 前端项目
│   ├── src/
│   │   ├── api/             # API 请求模块
│   │   │   ├── modules/     # 按功能分组 (auth, competition, registration, result, export, system, user)
│   │   │   ├── request.ts   # Axios 实例 + JWT 拦截器
│   │   │   └── types.ts     # 接口类型定义
│   │   ├── components/      # 通用组件 (32 个, 含 GlassModal, EmptyState, PageSkeleton, ListMeta 等)
│   │   ├── config/          # 环境变量封装
│   │   │   ├── env.ts       # VITE_* 环境变量读取
│   │   │   └── constants.ts # 常量定义
│   │   ├── hooks/           # 自定义 Hooks (useFetch, usePagination 等)
│   │   ├── motion/          # 动画配置
│   │   ├── pages/           # 页面组件 (按 admin/teacher/student 分组)
│   │   ├── store/           # Zustand 状态
│   │   │   └── authStore.ts
│   │   ├── types/           # 类型声明
│   │   └── utils/           # 工具函数
│   │       ├── format.ts        # formatDate, resolveCoverUrl, formatFileSize
│   │       ├── statusBadge.ts   # getStatusBadge (竞赛/报名状态映射)
│   │       └── export.ts        # 文件下载工具
│   ├── vite.config.ts       # Vite 配置 + 代理
│   └── package.json
├── backend/                 # 后端项目
│   ├── src/main/java/com/scms/
│   │   ├── common/          # 通用类 (Result, PageResult, GlobalExceptionHandler)
│   │   ├── config/          # 配置 (MyBatis, WebMvc)
│   │   ├── controller/      # REST 控制器 (9 个)
│   │   ├── dto/             # 数据传输对象
│   │   ├── entity/          # 数据库实体
│   │   ├── export/          # Excel 导出模型 (EasyExcel)
│   │   ├── mapper/          # MyBatis Mapper 接口
│   │   ├── security/        # JWT + Spring Security
│   │   ├── service/         # 业务逻辑
│   │   └── util/            # 工具类 (ExcelUtil)
│   ├── src/main/resources/
│   │   └── application.yml  # 应用配置
│   ├── sql/                 # 数据库脚本 (init.sql)
│   └── pom.xml
├── docs/                    # 文档 (ER 图)
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
| `/admin/registrations` | AdminRegistrations | 报名监管 |
| `/admin/grades` | AdminGrades | 成绩管理 |
| `/admin/stats` | AdminStats | 数据统计 |
| `/admin/notices` | AdminNotices | 公告管理 |
| `/admin/competitions/:id/edit` | TeacherCompetitionCreate | 编辑竞赛（管理员） |

### 教师 (teacher)
| 路由 | 页面 | 说明 |
|------|------|------|
| `/teacher/dashboard` | TeacherDashboard | 仪表盘 |
| `/teacher/competitions` | TeacherCompetitions | 我的竞赛 |
| `/teacher/competitions/create` | TeacherCompetitionCreate | 创建竞赛 |
| `/teacher/competitions/:id/edit` | TeacherCompetitionCreate | 编辑竞赛 |
| `/teacher/teams` | TeacherTeams | 团队管理 |
| `/teacher/grades` | TeacherGrades | 成绩管理 |

### 学生 (student)
| 路由 | 页面 | 说明 |
|------|------|------|
| `/student/dashboard` | StudentDashboard | 仪表盘 |
| `/student/competitions` | StudentCompetitions | 竞赛列表 |
| `/student/competitions/:id` | StudentCompetitionDetail | 竞赛详情 |
| `/student/registration` | StudentRegistration | 我的报名 |
| `/student/grades` | StudentGrades | 我的成绩 |
| `/student/teams` | StudentTeams | 我的团队 |
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

## 数据库结构

> **本系统的数据库结构已经过严格审查和优化，从 15 表精简至 7 表。当前结构是最终定稿，禁止任何形式的新增表、新增字段、删除表、删除字段或修改字段类型。**

### 命名约定

- 表名: 下划线命名 (如 `competition_result`)
- 字段名: 下划线命名 (如 `create_time`)
- 实体类: 驼峰命名 (如 `createTime`)
- MyBatis-Plus 自动映射: `map-underscore-to-camel-case: true`

### 表结构总览（共 7 表）

#### 1. sys_user — 用户表

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | BIGINT | PK, AUTO_INCREMENT | 主键 |
| username | VARCHAR(50) | NOT NULL, UNIQUE | 登录账号 |
| password | VARCHAR(100) | NOT NULL | 密码(BCrypt) |
| real_name | VARCHAR(50) | NOT NULL | 真实姓名 |
| avatar | VARCHAR(255) | NULL | 头像URL |
| phone | VARCHAR(20) | NULL | 手机号 |
| email | VARCHAR(100) | NULL | 邮箱 |
| gender | TINYINT | DEFAULT 0 | 性别：0-未知 1-男 2-女 |
| user_type | TINYINT | NOT NULL | 用户类型：1-学生 2-教师 3-管理员 |
| role | VARCHAR(50) | NULL | 角色编码(admin/teacher/student) |
| dept_name | VARCHAR(50) | NULL | 所属学院（直接存储，无外键） |
| major_name | VARCHAR(50) | NULL | 专业（直接存储，无外键） |
| class_name | VARCHAR(50) | NULL | 班级（直接存储，无外键） |
| status | TINYINT | NOT NULL DEFAULT 1 | 状态：1-启用 0-禁用 |
| create_time | DATETIME | NOT NULL DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| update_time | DATETIME | NOT NULL, ON UPDATE | 更新时间 |
| last_login_time | DATETIME | NULL | 最后登录时间 |

索引: `uk_username`(username), `idx_user_type`(user_type)

#### 2. competition — 竞赛信息表

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | BIGINT | PK, AUTO_INCREMENT | 主键 |
| competition_name | VARCHAR(100) | NOT NULL | 竞赛名称 |
| organizer | VARCHAR(100) | NOT NULL | 主办单位 |
| publisher_id | BIGINT | NOT NULL | 发布人ID → sys_user.id |
| cover_image | VARCHAR(255) | NULL | 封面图URL |
| description | TEXT | NULL | 竞赛详细描述 |
| rules | TEXT | NULL | 竞赛规则 |
| registration_start | DATETIME | NOT NULL | 报名开始时间 |
| registration_end | DATETIME | NOT NULL | 报名截止时间 |
| competition_start | DATETIME | NOT NULL | 竞赛开始时间 |
| competition_end | DATETIME | NOT NULL | 竞赛结束时间 |
| location | VARCHAR(200) | NULL | 竞赛地点 |
| category | VARCHAR(50) | NULL | 竞赛分类 |
| eligibility | VARCHAR(200) | NULL | 参赛资格 |
| contact_info | VARCHAR(100) | NULL | 联系方式 |
| max_members | INT | NOT NULL DEFAULT 1 | 每队最大人数 |
| max_teams | INT | NULL | 最大队伍数 |
| awards | JSON | NULL | 自定义奖项列表 `[{"name":"一等奖","level":1}]` |
| attachments | JSON | NULL | 附件列表 `[{"fileName":"x","fileUrl":"y","fileSize":100,"fileType":"pdf"}]` |
| status | TINYINT | NOT NULL DEFAULT 0 | 0-草稿 1-待审核 2-已发布 3-进行中 4-已结束 5-已驳回 |
| create_time | DATETIME | NOT NULL DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| update_time | DATETIME | NOT NULL, ON UPDATE | 更新时间 |

索引: `idx_comp_status`(status), `idx_comp_publisher`(publisher_id)

#### 3. competition_registration — 报名表

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | BIGINT | PK, AUTO_INCREMENT | 主键 |
| competition_id | BIGINT | NOT NULL | 竞赛ID → competition.id |
| team_id | BIGINT | NULL | 团队ID → competition_team.id |
| student_id | BIGINT | NOT NULL | 学生ID → sys_user.id |
| is_team_leader | TINYINT | NOT NULL DEFAULT 0 | 是否队长 |
| contact_phone | VARCHAR(20) | NULL | 联系电话 |
| remark | VARCHAR(500) | NULL | 备注 |
| attachment_url | VARCHAR(255) | NULL | 报名附件URL |
| status | TINYINT | NOT NULL DEFAULT 0 | 0-待审核 1-已通过 2-已拒绝 |
| audit_remark | VARCHAR(500) | NULL | 审核备注 |
| audit_time | DATETIME | NULL | 审核时间 |
| create_time | DATETIME | NOT NULL DEFAULT CURRENT_TIMESTAMP | 报名时间 |

索引: `idx_reg_comp`(competition_id), `idx_reg_student`(student_id), `idx_reg_status`(status)

#### 4. competition_team — 团队信息表

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | BIGINT | PK, AUTO_INCREMENT | 主键 |
| competition_id | BIGINT | NOT NULL | 竞赛ID → competition.id |
| team_name | VARCHAR(50) | NOT NULL | 团队名称 |
| leader_id | BIGINT | NOT NULL | 队长ID → sys_user.id |
| team_slogan | VARCHAR(200) | NULL | 团队口号 |
| status | TINYINT | NOT NULL DEFAULT 0 | 0-组建中 1-已提交 2-已通过 3-已拒绝 |
| audit_remark | VARCHAR(500) | NULL | 审核备注 |
| create_time | DATETIME | NOT NULL DEFAULT CURRENT_TIMESTAMP | 创建时间 |

索引: `idx_team_comp`(competition_id)

#### 5. competition_team_member — 团队成员表

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | BIGINT | PK, AUTO_INCREMENT | 主键 |
| team_id | BIGINT | NOT NULL | 团队ID → competition_team.id |
| student_id | BIGINT | NOT NULL | 学生ID → sys_user.id |
| join_time | DATETIME | NOT NULL DEFAULT CURRENT_TIMESTAMP | 加入时间 |
| status | TINYINT | NOT NULL DEFAULT 1 | 0-已退出 1-正常 |

索引: `idx_tm_team`(team_id)

#### 6. competition_result — 成绩表

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | BIGINT | PK, AUTO_INCREMENT | 主键 |
| competition_id | BIGINT | NOT NULL | 竞赛ID → competition.id |
| registration_id | BIGINT | NOT NULL | 报名ID → competition_registration.id |
| student_id | BIGINT | NULL | 学生ID → sys_user.id |
| team_id | BIGINT | NULL | 团队ID → competition_team.id |
| score | DECIMAL(10,2) | NULL | 分数 |
| ranking | INT | NULL | 排名 |
| award_level | TINYINT | NULL | 奖项等级（对应 competition.awards 中的 level） |
| award_name | VARCHAR(50) | NULL | 奖项名称（对应 competition.awards 中的 name） |
| remark | VARCHAR(500) | NULL | 评语 |
| is_published | TINYINT | NOT NULL DEFAULT 0 | 是否发布：0-否 1-是 |
| publish_time | DATETIME | NULL | 发布时间 |
| create_time | DATETIME | NOT NULL DEFAULT CURRENT_TIMESTAMP | 创建时间 |

索引: `idx_result_comp`(competition_id), `idx_result_student`(student_id), `idx_result_publish`(is_published)

#### 7. sys_notice — 系统公告表

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | BIGINT | PK, AUTO_INCREMENT | 主键 |
| notice_title | VARCHAR(100) | NOT NULL | 公告标题 |
| notice_content | TEXT | NOT NULL | 公告内容(HTML) |
| notice_type | TINYINT | NOT NULL DEFAULT 1 | 1-通知 2-公告 |
| is_top | TINYINT | NOT NULL DEFAULT 0 | 是否置顶 |
| status | TINYINT | NOT NULL DEFAULT 1 | 状态 |
| publish_time | DATETIME | NULL | 发布时间 |
| create_time | DATETIME | NOT NULL DEFAULT CURRENT_TIMESTAMP | 创建时间 |

### 表间关系

```
sys_user (1) ──< (N) competition          [publisher_id]
sys_user (1) ──< (N) competition_registration  [student_id]
sys_user (1) ──< (N) competition_team      [leader_id]
sys_user (1) ──< (N) competition_team_member   [student_id]
sys_user (1) ──< (N) competition_result    [student_id]

competition (1) ──< (N) competition_registration  [competition_id]
competition (1) ──< (N) competition_team          [competition_id]
competition (1) ──< (N) competition_result        [competition_id]

competition_team (1) ──< (N) competition_team_member  [team_id]
competition_team (1) ──< (N) competition_registration [team_id]
competition_team (1) ──< (N) competition_result       [team_id]

competition_registration (1) ──< (N) competition_result [registration_id]
```

注意: 所有外键关系均为逻辑外键，数据库层面不建 FK 约束，由应用层保证一致性。

### JSON 字段说明

- `competition.awards`: 教师创建竞赛时自定义的奖项列表，格式 `[{"name":"一等奖","level":1}, ...]`。成绩的 `award_level` 和 `award_name` 直接引用此 JSON 中的值。
- `competition.attachments`: 竞赛附件列表，格式 `[{"fileName":"x.pdf","fileUrl":"/uploads/x.pdf","fileSize":1024,"fileType":"pdf"}, ...]`。前端上传文件后将结果追加到此数组，保存竞赛时整体 JSON 提交。

### 设计决策备忘

- **dept_name / major_name / class_name** 直接存储在 sys_user 表中作为普通 VARCHAR 字段，不使用独立的组织机构表。这是因为本系统不需要组织结构的层级管理和级联操作。
- **role** 字段存储在 sys_user 表中，同时 user_type 也保存角色信息。认证时以 user_type 为准做 switch 映射，role 字段为辅助冗余。
- **awards 和 attachments** 使用 JSON 字段存储在 competition 表中，不拆为独立子表。这两类数据量小、结构简单、总是跟随竞赛一起读写，不需要独立查询。
- **无逻辑删除字段**: 本系统不使用 `deleted` 软删除，删除操作为物理删除。

### 禁止修改数据库结构

**这是一条硬性规定。任何 AI 代理在未经人工明确授权的情况下，不得执行以下操作:**

1. **禁止新增表** — 不得 CREATE TABLE 或建议新增表。如果需要存储新类型的数据，优先考虑是否能用现有表的 JSON 字段承载。
2. **禁止新增字段** — 不得 ALTER TABLE ADD COLUMN 或建议给任何表加字段。如果现有字段无法满足需求，先讨论是否可以通过应用层逻辑解决。
3. **禁止删除表或字段** — 不得 DROP TABLE 或 ALTER TABLE DROP COLUMN。
4. **禁止修改字段类型** — 不得 ALTER TABLE MODIFY COLUMN 更改已有字段的类型、长度或约束。
5. **禁止添加外键约束** — 所有表间关系保持逻辑外键，不在数据库层面添加 FK 约束。
6. **禁止编写迁移脚本** — 不得在 `backend/sql/` 下创建新的迁移 SQL 文件。

如果用户要求的功能确实需要变更数据库结构，AI 代理应当:
- 明确告知用户当前规定并说明原因
- 列出需要变更的具体内容
- 等待用户明确确认后，再执行变更
- 变更后必须同步更新本文件中的表结构文档

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

## 编码约定

### 前端
- 组件: PascalCase (`AdminDashboard.tsx`)
- 工具函数: camelCase (`formatDate.ts`)
- 类型定义: `frontend/src/api/types.ts`
- 样式: Tailwind CSS + CSS 变量
- 动画: Motion (Framer Motion)
- **共享工具函数**: 日期格式化 (`formatDate`)、封面 URL 解析 (`resolveCoverUrl`)、文件大小格式化 (`formatFileSize`) 统一在 `src/utils/format.ts` 中定义; 状态徽章映射 (`getStatusBadge`) 在 `src/utils/statusBadge.ts` 中定义。页面中不要重复定义这些函数
- **错误处理**: 所有 catch 块必须同时包含 `toast.error(...)` (用户提示) 和 `console.error(...)` (调试日志), 不能有空 catch 块
- **加载与空状态**: 加载中统一使用 `<PageSkeleton />`, 空数据统一使用 `<EmptyState />`, 列表计数统一使用 `<ListMeta />`
- **图标按钮**: 使用 `.icon-btn` CSS 类 (透明背景、无边框、仅图标), 不要手写内联样式

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

## 注意事项

1. **端口冲突**: 8080 端口可能被 Docker/WSL 占用，检查后再启动
2. **CORS**: 后端 WebMvcConfig 已配置允许 `localhost:3000`
3. **文件上传**: 最大 10MB，存储路径 `./uploads/`
4. **JWT 过期**: 24 小时，过期后自动跳转登录页

## 系统约束

### 严禁修改环境变量

**这是一条硬性规定。任何 AI 代理在未经人工明确授权的情况下，不得执行以下操作:**

1. **禁止修改系统环境变量** — 不得使用 `[Environment]::SetEnvironmentVariable`、`setx`、`set` 或任何其他命令修改系统或用户环境变量
2. **禁止修改 PATH 变量** — 不得向 PATH 环境变量添加或删除任何路径
3. **禁止修改 Java/Maven/Node 等工具的环境配置** — 不得修改 `JAVA_HOME`、`M2_HOME`、`NODE_PATH` 等环境变量
4. **禁止创建或修改环境变量配置文件** — 不得修改 `.bashrc`、`.zshrc`、`.profile`、`environment` 等文件

如果需要使用特定工具（如 Maven），应当:
- 使用完整路径调用工具（例如：`& "C:\tools\maven\apache-maven-3.9.16\bin\mvn.cmd"`）
- 在当前会话中临时设置变量（不会永久修改环境变量）
- 明确告知用户需要手动配置环境变量

## UI 设计规范

### 卡片布局
- 学生端页面卡片在桌面端使用 4 列布局 (`repeat(4, 1fr)`)
- 移动端使用单列布局 (`1fr`)

### 悬停效果
- 卡片悬停时应变得更不透明（alpha 值增加），而非更透明
- `.glass-card:hover` 背景色: `rgba(255, 255, 255, 0.92)`
- `.glass-card-static:hover` 背景色: `rgba(255, 255, 255, 0.92)`

### 错误处理
- 关键页面（如竞赛详情页）应使用 Error Boundary 捕获渲染错误
- API 调用失败时应提供友好的错误提示，而非白屏

## 更新日志

### 2024-12-15 UI 优化

1. **卡片布局优化**：学生端各页面卡片从 2 列调整为 4 列
2. **竞赛详情页错误处理**：添加 Error Boundary 防止白屏
3. **悬停效果修正**：卡片悬停时变得更不透明
4. **封面图比例统一**：赛事封面图统一为 16:9 比例显示

### 奖项系统说明
- 竞赛的奖项是自定义的，由教师在创建竞赛时定义
- 奖项存储在 `competition.awards` 字段（JSON 格式）
- 成绩的 `award_level` 对应奖项的 `level`，`award_name` 对应奖项的 `name`
- 前端显示奖项时直接使用 `awardName`，不再使用固定的奖项映射表
- 数据库结构变更规定详见上方「禁止修改数据库结构」章节
