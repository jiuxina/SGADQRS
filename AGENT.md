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
| 数据库 | MySQL (Docker) | 8.x |
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
│   │   ├── components/      # 通用组件 (29 个, 含 GlassModal, EmptyState, PageSkeleton, ListMeta 等)
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
| 前端 Dev Server | 5174 | Vite 开发服务器（使用 start.bat 启动时） |
| 前端 Dev Server（备用） | 3000 | Vite 开发服务器（手动启动时） |
| 后端 API | 8080 | Spring Boot (context-path: /api) |
| MySQL | 3306 | 数据库 (Docker 容器运行) |
| 动画演示 | 3001 | 前端动画演示（使用 start.bat 启动时自动启动） |

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

> **本系统的数据库结构已经过严格审查和优化，从 15 表精简至 7 表。2026-09-05「赛友 TeamUp」及「Lean 精简」两批变更均经用户确认（详见下文「TeamUp 变更记录」），现为 8 表结构。此后禁止任何未经用户确认的新增表、新增字段、删除表、删除字段或修改字段类型。**

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
| teacher_id | BIGINT | NULL | 指导老师ID → sys_user.id |
| team_slogan | VARCHAR(200) | NULL | 团队口号 |
| status | TINYINT | NOT NULL DEFAULT 0 | 0-组建中 1-已提交 2-已通过 3-已拒绝 |
| create_time | DATETIME | NOT NULL DEFAULT CURRENT_TIMESTAMP | 创建时间 |

索引: `idx_team_comp`(competition_id), `idx_team_teacher`(teacher_id)

#### 5. competition_team_member — 团队成员表

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | BIGINT | PK, AUTO_INCREMENT | 主键 |
| team_id | BIGINT | NOT NULL | 团队ID → competition_team.id |
| student_id | BIGINT | NOT NULL | 学生ID → sys_user.id |
| join_time | DATETIME | NOT NULL DEFAULT CURRENT_TIMESTAMP | 加入时间 |
| status | TINYINT | NOT NULL DEFAULT 1 | 0-已退出 1-正常 2-待审核 3-已拒绝 |

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

#### 7. sys_notification — 站内通知表（含全员公告）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | BIGINT | PK, AUTO_INCREMENT | 主键 |
| user_id | BIGINT | NOT NULL DEFAULT 0 | 接收者用户ID，**0 表示全员公告** |
| type | VARCHAR(20) | NOT NULL DEFAULT 'system' | announcement-公告 / interaction-互动 / system-系统 |
| title | VARCHAR(100) | NOT NULL | 标题 |
| content | VARCHAR(500) | NULL | 内容(公告可为HTML) |
| ref_type | VARCHAR(20) | NULL | 关联对象类型：request/recruit/user/notice |
| ref_id | BIGINT | NULL | 关联对象ID |
| is_read | TINYINT | NOT NULL DEFAULT 0 | 已读标记（公告不跟踪已读） |
| is_top | TINYINT | NOT NULL DEFAULT 0 | 公告置顶 |
| create_time | DATETIME | NOT NULL DEFAULT CURRENT_TIMESTAMP | 创建时间 |

索引: `idx_noti_user`(user_id, is_read), `idx_noti_ref`(ref_type, ref_id)

旧 `sys_notice` 的管理接口 (/notice) 已迁移到本表 (user_id=0 行)，API 返回形状保持兼容。

#### 8. recruit_post — 组队招募/求组帖

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | BIGINT | PK, AUTO_INCREMENT | 主键 |
| competition_id | BIGINT | NOT NULL | 竞赛ID |
| user_id | BIGINT | NOT NULL | 发布者用户ID |
| type | TINYINT | NOT NULL DEFAULT 1 | 1-组队招募 2-求组 |
| title | VARCHAR(100) | NOT NULL | 标题 |
| content | TEXT | NULL | 说明 |
| team_id | BIGINT | NULL | 关联队伍（招募帖；type=1 发帖未带队伍时自动建队） |
| need_count | INT | NOT NULL DEFAULT 1 | 还需人数 |
| tags | VARCHAR(255) | NULL | 方向标签(逗号分隔) |
| deadline | DATETIME | NULL | 组队截止时间 |
| status | TINYINT | NOT NULL DEFAULT 1 | 1-招募中 0-已关闭（队伍满员自动关闭） |
| view_count | INT | NOT NULL DEFAULT 0 | 浏览量 |
| create_time / update_time | DATETIME | NOT NULL | 时间戳 |

索引: `idx_rp_comp`(competition_id), `idx_rp_user`(user_id), `idx_rp_status`(status)

#### 9. community_request — 社区请求表（互看/申请/邀请）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | BIGINT | PK, AUTO_INCREMENT | 主键 |
| type | TINYINT | NOT NULL | 1-资料互看 2-入队申请 3-入队邀请 |
| post_id | BIGINT | NULL | 关联招募帖（type=2/3 必填） |
| team_id | BIGINT | NULL | 关联队伍 |
| from_user_id | BIGINT | NOT NULL | 发起人 |
| to_user_id | BIGINT | NOT NULL | 接收人（处理人） |
| message | VARCHAR(500) | NULL | 附言 |
| status | TINYINT | NOT NULL DEFAULT 0 | 0-待处理 1-已同意 2-已拒绝 |
| create_time | DATETIME | NOT NULL DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| handle_time | DATETIME | NULL | 处理时间 |

索引: `idx_cr_to`(to_user_id, status), `idx_cr_from`(from_user_id), `idx_cr_pair`(from_user_id, to_user_id, type)

两步制流程：互看(type=1)同意后双方解锁完整资料与获奖记录；入队申请(type=2)/邀请(type=3)须先互看解锁，同意后由 `RegistrationService.addMemberToTeam` 完成入队（容量校验 + 补建报名记录），队伍满员自动关闭其招募帖。
| create_time | DATETIME | NOT NULL DEFAULT CURRENT_TIMESTAMP | 创建时间 |

### 表间关系

```
sys_user (1) ──< (N) competition          [publisher_id]
sys_user (1) ──< (N) competition_registration  [student_id]
sys_user (1) ──< (N) competition_team      [leader_id]
sys_user (1) ──< (N) competition_team      [teacher_id]  (指导老师)
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

### TeamUp 变更记录（2026-09-05，经用户明确确认）

- **新增表**: `recruit_post`、`community_request`；`sys_notice` 并入 `sys_notification` 后删除。
- **新增字段**: `sys_user.nickname/bio/skills`。
- **删除字段**: `sys_user.role`（角色统一由 user_type 推导）、`competition_registration.is_team_leader`（由 competition_team.leader_id 推导）、`competition_registration.contact_phone`（隐私字段不入报名表）。
- **升级脚本**: `backend/sql/upgrade-teamup.sql`（旧库一次性执行；start.bat 检测到旧库缺 recruit_post 表时自动执行）。

### Lean 精简变更记录（2026-09-05 第二批，经用户明确确认）

- **删除表**: `competition_registration` —— 报名与队伍合一，参赛单位=队伍（单人赛=1人队，创建即提交审核）。
- **删除字段**: `sys_user.phone/email/last_login_time`（无消费方，隐私不入库）、`competition.max_teams`（从未强制校验）、`recruit_post.view_count/need_count`（还需人数=每队上限-现有成员，实时计算）、`competition_result.registration_id`（成绩=一人一行，队伍由 team_id 承载）。
- **竞赛状态收敛**: 0草稿/2已发布/3进行中/4已结束（1待审核→2、5已驳回→0），发布即生效，删除竞赛审核端点。
- **指导老师**: 队长指定（新增 `PUT /registration/team/{id}/teacher`），老师只读不审批；删除 acceptAdvisor/rejectAdvisor/auditJoinRequest/listPendingJoinRequests/joinTeam 端点；队伍审核归管理员（audit 端点改为 ADMIN-only），成员入队一律直接生效。
- **新增端点**: `GET /registration/participants`（成绩录入名单）、`PUT /registration/team/{id}/submit`、`PUT /registration/team/{id}/teacher`。
- **升级脚本**: `backend/sql/upgrade-lean.sql`（在 upgrade-teamup.sql 之后执行）。

### 禁止修改数据库结构

**这仍是一条硬性规定。任何 AI 代理在未经人工明确授权的情况下，不得执行以下操作:**

1. **禁止新增表** — 不得 CREATE TABLE 或建议新增表。如果需要存储新类型的数据，优先考虑是否能用现有表的 JSON 字段承载。
2. **禁止新增字段** — 不得 ALTER TABLE ADD COLUMN 或建议给任何表加字段。如果现有字段无法满足需求，先讨论是否可以通过应用层逻辑解决。
3. **禁止删除表或字段** — 不得 DROP TABLE 或 ALTER TABLE DROP COLUMN。
4. **禁止修改字段类型** — 不得 ALTER TABLE MODIFY COLUMN 更改已有字段的类型、长度或约束。
5. **禁止添加外键约束** — 所有表间关系保持逻辑外键，不在数据库层面添加 FK 约束。
6. **禁止编写迁移脚本** — 不得在 `backend/sql/` 下创建新的迁移 SQL 文件（TeamUp 的 upgrade-teamup.sql 为经用户确认的例外）。

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
- 工具函数: camelCase (`format.ts`)
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
# 方式1: 一键启动全栈（推荐）
start.bat

# 方式2: 使用启动所有服务脚本
start-all.bat

# 方式3: 手动启动
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
5. **后端修改后需重新构建**: 修改后端 Java 文件或配置文件后，需执行 `mvn clean package -DskipTests` 重新打包，再重启服务

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

### 2026-09-09 全面边界与容错测试（新增 `backend/boundary_full.py`，233 断言 0 失败）

覆盖：匿名/篡改 token/禁用后旧 token、角色越权矩阵、分页钳制(1/200)、日期与人数边界、队伍状态机全链、招募/社区申请/邀请全守卫、成绩范围与存在性、上传白名单与路径穿越、XSS 原文存取（前端 React 转义兜底）、种子完整性快照校验。发现并修复：

1. **用户接口泄露密码哈希（P1 安全）**：`GET /user/{id}`、`POST /user` 等返回实体时含 bcrypt `password` → `User` 实体字段加 `@JsonProperty(Access.WRITE_ONLY)`（全局无 `@RequestBody User`，安全）。
2. **并发同意入队超员（P1 数据完整性）**：3 人队剩 1 席并发处理两申请均成功（4/3）。修复两步：`CompetitionTeamMapper.selectByIdForUpdate` 对队伍行加锁 + **成员数 count 也必须 `FOR UPDATE` 当前读**——只加行锁不够，REPEATABLE READ 下事务旧快照看不见并发已提交的插入（本轮第一次修复即因此未生效，套件抓出）。
3. **4xx 语义缺失（容错）**：残缺 JSON、缺必填参数、类型不匹配、方法不支持、上传缺 part/超 10MB 全部走兜底 500 → `GlobalExceptionHandler` 增补 `HttpMessageNotReadable/MissingServletRequestParameter/MethodArgumentTypeMismatch/405/413` 处理器（统一 Result 信封）。
4. **服务层校验补全**：`validateResult` 补学生/队伍存在性（防孤儿成绩+发布时向不存在用户发通知）；`publishResults` 补竞赛存在性；`createTeam` 补 teacherId 合法性与队名/口号长度（与 `changeTeacher` 对齐）；`register` 补密码≥6 位与用户名长度；`createUser` 补 userType 合法值/长度/密码强度（防 DB 约束 500）；`deleteUser` 补存在性；`toggleUserStatus` 补 status 判空（防拆箱 NPE）；`validateCompetition` 补名称/主办方/地点长度。
5. **`backend/boundary_test.sh` 标记废弃**：直接运行会污染演示数据（B2c 把竞赛3 上限重置为 1——即数据漂移来源；B13 真实发布种子成绩）。边界测试一律用 `boundary_full.py`。
6. 教训：清理 SQL 走 `docker exec mysql -e` 必须带数据库名（`mysql -N scms -e ...` 或全限定表名），否则 "No database selected" 静默失败、测试残留数据。

回归：边界套件 233/233、冒烟 70/70、e2e 1/1、管理员用户管理页浏览器抽查正常。

### 2026-09-09 全功能验证与三处修复（冒烟 70/70 + e2e + 浏览器三角色实测通过）

启动服务全链路验证（后端冒烟 + Playwright e2e + 浏览器逐项操作），发现并修复：

1. **竞赛演示数据漂移（数据层）**：全部 8 项竞赛 `max_members` 被历史操作重置为 1（疑似第 2 条 bug 所致），多队竞赛无法走"建队→提交→入队"全链 → 恢复 数学建模/ACM-ICPC/电子设计/CCPC=3、创新大赛=5，个人赛保持 1。**教训：数据变更须以业务语义为准，勿凭默认值批量覆盖。**
2. **`CompetitionDTO` 字段默认值静默重置（后端）**：`maxMembers = 1` / `status = 2` 是字段初始值，PUT 省略字段时 Jackson 仍反序列化出 1/2，`updateCompetition` 按 `!= null` 判断会覆盖库值。去掉 DTO 默认值，创建路径在 Service 补默认（max=1、status=2）。
3. **驳回队死状态（后端+前端）**：被驳回(3)的队既不能重提（`submitTeam` 仅收 0）也不能解散（`disbandTeam` 挡 `>=2`）。改为：0/3 可提交、仅 2 不可解散；StudentTeams/TeamDetail 按钮同步显示「重新提交审核」。
4. **StudentTeams 老师下拉空列表（前端）**：创建团队弹窗渲染 `teacherOptions`，但数据加载写的是 `teachers`（两个弹窗 state 用反）→ 统一为 `teachers`，删除多余 state。

另清理 3 条指向已删队伍的陈旧审核消息（`ref_type='team'` 且 ref 不存在）。回归：冒烟 70/70、e2e 1/1、API 专项（部分 PUT 不重置 / 驳回→重提→解散 / 已通过队仍拒解散）、浏览器实测创建弹窗老师下拉与驳回队按钮均通过。

### 2026-09-05 TeamUp Lean 全面测试与修复（冒烟 67/67 通过）

启动前后端开发服务器进行全链路测试（API 冒烟 67 项断言 + 浏览器 UI 抽查），发现并修复：

1. **`RecruitService.detail` 残留 view_count 自增**：Lean 已删 `view_count` 列，帖子详情接口必 500 → 删除自增块（同时删 `CompetitionExcel.maxTeams` 导出残留列）。
2. **学生可见草稿竞赛**：`CompetitionService.listCompetitions` 注释写了"学生只能看到已发布"但从未过滤 → 学生排除 `status=0`；`getCompetitionById` 对草稿校验仅发布者/管理员可见。
3. **StudentTeams 状态映射错位**：内置映射仍是旧报名语义（0待审核/1已通过/2已拒绝），导致学生端队伍徽标与管理端相反 → 改为 Lean 队伍链（0组建中/1待审核/2已通过/3已拒绝）。
4. **AdminDashboard 遗留"待审核竞赛"死卡**：竞赛审核已砍 → 改为「待审核队伍」卡（数据源 `teamList?status=1`，跳转 /admin/teams）；导航/快捷入口「竞赛审核/审核竞赛」统一改「竞赛管理」。
5. **StudentDashboard 快捷入口指向已删路由**：`/student/registration` → 改「我的队伍」`/student/teams`。
6. **种子数据乱码修复**：`sys_user`（bio/skills/nickname 等，用户 4/6/7/8）与 `recruit_post`（帖 1/3）存在双重编码乱码，按"不含 CJK 且双向转换可变"判定做 `CONVERT(BINARY CONVERT(col USING latin1) USING utf8mb4)` 修复（注意 mysql 默认排序规则下 `LIKE '%æ%'` 会误伤正常中文，需二进制匹配）。
7. 清理历史测试残留：teams 13-15（testteam999/Playwright 队）、竞赛 9「冒烟临时竞赛」。

新增回归脚本 `backend/smoke_full.py`（urllib 无依赖，67 断言，自动清理测试数据）。

### 2026-09-05 列级精简第二批（upgrade-lean2.sql）

1. **删除 `competition_team_member.status`**（死列）：Lean 后成员入队即生效，列恒为 1。涉及实体 + RegistrationService/CommunityService/CompetitionService/ExportService/RecruitService 共 11 处条件与写入 + 2 处原生 SQL 的 `AND status = 1` + 前端 TeamMember 类型与 StudentTeams 成员状态渲染。冒烟回归 67/67 通过。
2. **`sys_notification.is_top` 保留**：复核发现它支撑完整的「公告置顶」功能（`SystemService.toggleNoticeTop` → PUT /notice/{id}/top，AdminNotices 置顶按钮，NotificationCenter 置顶徽标与优先排序），并非死列——此前评估因 grep 大小写漏判。若要删需连功能一起删。

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
