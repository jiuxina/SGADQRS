# AGENT.md — 赛友 TeamUp（SCMS）项目 AI 代理指南

> 本文件为 AI 编码代理提供项目上下文、架构约定和操作规范。

## 项目概述

赛友 TeamUp（内部代号 SCMS）是一个面向高校的学生竞赛信息管理与组队社区系统，前后端分离。三角色：管理员（竞赛/用户/队伍审核/公告/统计）、教师（发布竞赛、只读指导与成绩录入）、学生（报名组队、招募/求组社区、成绩与通知）。核心链路：竞赛发布（发布即生效）→ 学生建队/入队（成员流动：退队/移除/转让队长，库层强制一人一赛一队）→ 管理员审核 → 成绩录入与发布 → 站内通知与成绩单导出。数据库为 8 表结构（详见「数据库结构」）。

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
│   │   │   ├── modules/     # 按功能分组 (auth, community, competition, export, notification, recruit, registration, result, system, user)
│   │   │   ├── request.ts   # Axios 实例 + JWT 拦截器
│   │   │   └── types.ts     # 接口类型定义
│   │   ├── components/      # 通用组件 (34 个, 含 GlassModal, EmptyState, PageSkeleton, ListMeta, TutorialOverlay, DesktopLayout 等; 弹窗另有配套 *DialogUtils.ts)
│   │   ├── config/          # 环境变量与教程文案
│   │   │   ├── env.ts       # VITE_* 环境变量读取
│   │   │   ├── constants.ts # 常量定义
│   │   │   └── tutorials.ts # 全端页面使用教程分步文案
│   │   ├── hooks/           # 自定义 Hooks (useFetch, usePagination 等)
│   │   ├── motion/          # 动画配置
│   │   ├── pages/           # 页面组件 (26 个, 文件名以 Admin/Teacher/Student 前缀分组, 含三端共用 TeamDetail/UserProfilePage)
│   │   ├── store/           # Zustand 状态 (authStore, notificationStore)
│   │   ├── types/           # 类型声明
│   │   └── utils/           # 工具函数
│   │       ├── format.ts        # formatDate/formatDateTime, resolveCoverUrl, formatFileSize 等
│   │       ├── statusBadge.ts   # getStatusBadge (竞赛/队伍状态映射)
│   │       ├── notification.ts  # 通知 refType → 页面跳转映射
│   │       └── export.ts        # 文件下载工具
│   ├── e2e/teamup.spec.ts   # Playwright 用例 (baseURL 写死 3000)
│   ├── scripts/             # 一次性调试/截图/审计脚本
│   ├── vite.config.ts       # Vite 配置 + /api 代理
│   └── package.json
├── backend/                 # 后端项目
│   ├── src/main/java/com/scms/
│   │   ├── common/          # 通用类 (Result, PageResult, GlobalExceptionHandler)
│   │   ├── config/          # 配置 (MyBatis, WebMvc)
│   │   ├── controller/      # REST 控制器 (13 个)
│   │   ├── dto/             # 数据传输对象
│   │   ├── entity/          # 数据库实体
│   │   ├── export/          # Excel 导出模型 (EasyExcel)
│   │   ├── mapper/          # MyBatis Mapper 接口
│   │   ├── security/        # JWT + Spring Security
│   │   ├── service/         # 业务逻辑
│   │   └── util/            # 工具类 (ExcelUtil)
│   ├── src/main/resources/
│   │   └── application.yml  # 应用配置
│   ├── public/              # 种子海报 (/public/** 静态服务, 启动目录敏感)
│   ├── sql/                 # init.sql + 增量脚本 (upgrade-teamup/lean/lean2/teamup2).sql + demo-data.sql
│   ├── smoke_full.py        # 全链路冒烟回归
│   ├── boundary_full.py     # 边界与容错回归
│   ├── smoke_member_flow.py # 成员流动专项回归
│   ├── gen_demo_data.py     # 演示数据生成器 (生成/导入 demo-data.sql)
│   └── pom.xml
├── docs/                    # ER 图、UI 规范、课程设计报告、测试报告 (full-link-test-report/ 等)、答辩 PPT (defense-ppt/)
├── start.bat / stop.bat / start-all.bat / stop-all.bat   # Windows 一键启停
└── AGENT.md                 # 本文件
```

## 服务端口

| 服务 | 端口 | 说明 |
|------|------|------|
| 前端 Dev Server | 3000 | Vite 固定端口（`vite.config.ts`），占用时自动 +1——e2e 会连不上，需先释放 3000 |
| 后端 API | 8080 | Spring Boot (context-path: /api) |
| MySQL | 3306 | 数据库 (Docker 容器 `mysql-scms`) |

## 前端路由规范

路由定义在 `frontend/src/App.tsx`，格式为 `/{role}/{page}`，受 `AuthGuard` 按角色保护：

### 管理员 (admin)
| 路由 | 页面 | 说明 |
|------|------|------|
| `/admin/dashboard` | AdminDashboard | 仪表盘 |
| `/admin/users` | AdminUsers | 用户管理 |
| `/admin/competitions` | AdminCompetitions | 竞赛管理（内层 tab 含队伍/成绩） |
| `/admin/competitions/:id` | AdminCompetitionDetail | 竞赛详情 |
| `/admin/competitions/:id/edit` | TeacherCompetitionCreate | 编辑竞赛（复用教师表单） |
| `/admin/competitions/team/:id` | TeamDetail | 队伍详情（三端共用组件） |
| `/admin/stats` | AdminStats | 数据统计 |
| `/admin/notices` | AdminNotices | 公告管理 |
| `/admin/teams`、`/admin/grades` | — | 旧路由，`Navigate` 重定向到 `/admin/competitions?tab=teams|grades` |

### 教师 (teacher)
| 路由 | 页面 | 说明 |
|------|------|------|
| `/teacher/dashboard` | TeacherDashboard | 仪表盘 |
| `/teacher/competitions` | TeacherCompetitions | 我的竞赛 |
| `/teacher/competitions/create` | TeacherCompetitionCreate | 发布竞赛（创建即发布 status=2，发布即报名） |
| `/teacher/competitions/:id` | TeacherCompetitionDetail | 竞赛详情 |
| `/teacher/competitions/:id/edit` | TeacherCompetitionCreate | 编辑竞赛 |
| `/teacher/teams` | TeacherTeams | 指导队伍列表 |
| `/teacher/teams/detail/:id` | TeamDetail | 队伍详情 |
| `/teacher/grades` | TeacherGrades | 成绩录入 |

### 学生 (student)
| 路由 | 页面 | 说明 |
|------|------|------|
| `/student/dashboard` | StudentDashboard | 仪表盘 |
| `/student/competitions` | StudentCompetitions | 竞赛列表 |
| `/student/competitions/:id` | StudentCompetitionDetail | 竞赛详情 |
| `/student/teams` | StudentTeams | 组队中心（内层 tab：我的队伍/招募广场/收到的申请·邀请/发出的请求） |
| `/student/teams/detail/:id` | TeamDetail | 队伍详情 |
| `/student/recruit` | — | 旧路由，重定向到 `/student/teams?tab=recruit`（页面组件 StudentRecruitSquare 为其内层 tab） |
| `/student/history` | StudentHistory | 参赛历史（内层 tab 含成绩单） |
| `/student/grades` | — | 旧路由，重定向到 `/student/history?tab=transcript` |
| `/student/notifications` | NotificationCenter | 消息中心 |
| `/student/u/:id` | UserProfilePage | 社区公开主页（student/teacher/admin 三角色均可访问） |

### 通用
| 路由 | 页面 | 说明 |
|------|------|------|
| `/profile` | ProfilePage | 个人中心（三端共用） |
| `/login` | LoginPage | 登录页 |
| `*` | — | 兜底重定向 `/login` |

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

> **本系统的数据库结构已经过严格审查和优化，从 15 表精简至 8 表。2026-09-05「赛友 TeamUp」与「Lean 精简」两批、2026-09-09「组队 2.0」批变更均经用户确认（详见下文三节变更记录），现为 8 表结构。此后禁止任何未经用户确认的新增表、新增字段、删除表、删除字段或修改字段类型。**

### 命名约定

- 表名: 下划线命名 (如 `competition_result`)
- 字段名: 下划线命名 (如 `create_time`)
- 实体类: 驼峰命名 (如 `createTime`)
- MyBatis-Plus 自动映射: `map-underscore-to-camel-case: true`

### 表结构总览（共 8 表，与 `backend/sql/init.sql` 一致）

#### 1. sys_user — 用户表

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | BIGINT | PK, AUTO_INCREMENT | 主键 |
| username | VARCHAR(50) | NOT NULL, UNIQUE | 登录账号 |
| password | VARCHAR(100) | NOT NULL | 密码(BCrypt)，实体上 `@JsonProperty(WRITE_ONLY)` 防外发 |
| real_name | VARCHAR(50) | NOT NULL | 真实姓名 |
| nickname | VARCHAR(50) | NULL | 社区昵称（展示名优先昵称，无昵称用真实姓名，不再打码） |
| avatar | VARCHAR(255) | NULL | 头像URL |
| gender | TINYINT | DEFAULT 0 | 性别：0-未知 1-男 2-女 |
| user_type | TINYINT | NOT NULL | 用户类型：1-学生 2-教师 3-管理员（角色唯一来源） |
| dept_name | VARCHAR(50) | NULL | 所属学院（直接存储，无外键） |
| major_name | VARCHAR(50) | NULL | 专业（直接存储，无外键） |
| class_name | VARCHAR(50) | NULL | 班级（直接存储，无外键） |
| bio | VARCHAR(500) | NULL | 个人简介 |
| skills | VARCHAR(255) | NULL | 技能标签(逗号分隔) |
| status | TINYINT | NOT NULL DEFAULT 1 | 状态：1-启用 0-禁用 |
| create_time | DATETIME | NOT NULL DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| update_time | DATETIME | NOT NULL, ON UPDATE | 更新时间 |

索引: `uk_username`(username), `idx_user_type`(user_type)。手机号/邮箱/role/last_login_time 等字段已删除（隐私不入库、角色由 user_type 推导）。

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
| registration_start | DATETIME | NOT NULL | 报名开始时间（建队/入队/申请/邀请均校验，空值放行） |
| registration_end | DATETIME | NOT NULL | 报名截止时间（同上） |
| competition_start | DATETIME | NOT NULL | 竞赛开始时间 |
| competition_end | DATETIME | NOT NULL | 竞赛结束时间 |
| location | VARCHAR(200) | NULL | 竞赛地点 |
| max_members | INT | NOT NULL DEFAULT 1 | 每队最大人数（1=个人赛） |
| awards | JSON | NULL | 自定义奖项列表 `[{"name":"一等奖","level":1}]` |
| attachments | JSON | NULL | 附件列表 `[{"fileName":"x","fileUrl":"y","fileSize":100,"fileType":"pdf"}]` |
| status | TINYINT | NOT NULL DEFAULT 2 | 0-草稿 2-已发布 3-进行中 4-已结束（发布即生效，无审核态） |
| create_time | DATETIME | NOT NULL DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| update_time | DATETIME | NOT NULL, ON UPDATE | 更新时间 |

索引: `idx_comp_status`(status), `idx_comp_publisher`(publisher_id)。种子演示数据中已发布竞赛的报名/开赛窗口用 `NOW() ± INTERVAL` 相对时间，保证新初始化的库始终"可组队"。

#### 3. competition_team — 参赛队伍表（报名与队伍合一，单人赛=1人队）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | BIGINT | PK, AUTO_INCREMENT | 主键 |
| competition_id | BIGINT | NOT NULL | 竞赛ID → competition.id |
| team_name | VARCHAR(50) | NOT NULL | 团队名称 |
| leader_id | BIGINT | NOT NULL | 队长ID → sys_user.id |
| teacher_id | BIGINT | NULL | 指导老师ID → sys_user.id（队长指定，老师只读） |
| team_slogan | VARCHAR(200) | NULL | 团队口号 |
| status | TINYINT | NOT NULL DEFAULT 0 | 0-组建中 1-已提交 2-已通过 3-已拒绝 |
| create_time | DATETIME | NOT NULL DEFAULT CURRENT_TIMESTAMP | 创建时间 |

索引: `idx_team_comp`(competition_id), `idx_team_teacher`(teacher_id)。状态机：建队(0)→提交(1)→管理员审核(2/3)，驳回(3)可修改后重提；**提交审核后名单冻结**；仅 2 不可解散/转让队长；状态变更方法统一 `selectByIdForUpdate` 行锁串行化。

#### 4. competition_team_member — 团队成员表

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | BIGINT | PK, AUTO_INCREMENT | 主键 |
| team_id | BIGINT | NOT NULL | 团队ID → competition_team.id |
| competition_id | BIGINT | NOT NULL DEFAULT 0 | 冗余竞赛ID（组队 2.0 新增，供唯一约束使用，写入时由服务端回填） |
| student_id | BIGINT | NOT NULL | 学生ID → sys_user.id |
| join_time | DATETIME | NOT NULL DEFAULT CURRENT_TIMESTAMP | 加入时间 |

索引: `uk_tm_team_student`(team_id, student_id), **`uk_tm_comp_student`(competition_id, student_id)**（库层兜底"一人一赛一队"）, `idx_tm_team`(team_id)。成员流动：入队即时生效；退队/队长移除仅 0/3 状态可用（队长须先转让或解散）；转让队长 0/1/3 可用。

#### 5. competition_result — 成绩表（一人一行，证书按人发）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | BIGINT | PK, AUTO_INCREMENT | 主键 |
| competition_id | BIGINT | NOT NULL | 竞赛ID → competition.id |
| student_id | BIGINT | NULL | 学生ID → sys_user.id |
| team_id | BIGINT | NULL | 团队ID → competition_team.id（队伍上下文） |
| score | DECIMAL(10,2) | NULL | 分数 |
| ranking | INT | NULL | 排名 |
| award_level | TINYINT | NULL | 奖项等级（对应 competition.awards 中的 level） |
| award_name | VARCHAR(50) | NULL | 奖项名称（对应 competition.awards 中的 name） |
| remark | VARCHAR(500) | NULL | 评语 |
| is_published | TINYINT | NOT NULL DEFAULT 0 | 是否发布：0-否 1-是 |
| publish_time | DATETIME | NULL | 发布时间 |
| create_time | DATETIME | NOT NULL DEFAULT CURRENT_TIMESTAMP | 创建时间 |

索引: `idx_result_comp`(competition_id), `idx_result_student`(student_id), `idx_result_publish`(is_published)。registration_id 已随报名表一并删除。

#### 6. recruit_post — 组队招募/求组帖

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | BIGINT | PK, AUTO_INCREMENT | 主键 |
| competition_id | BIGINT | NOT NULL | 竞赛ID |
| user_id | BIGINT | NOT NULL | 发布者用户ID |
| type | TINYINT | NOT NULL DEFAULT 1 | 1-组队招募 2-求组 |
| title | VARCHAR(100) | NOT NULL | 标题 |
| content | TEXT | NULL | 说明 |
| team_id | BIGINT | NULL | 关联队伍（type=1 必填：必须是发布者本人担任队长的队伍，**不会自动建队**） |
| tags | VARCHAR(255) | NULL | 方向标签(逗号分隔) |
| contact | VARCHAR(100) | NULL | 联系方式（微信/QQ/邮箱等，选填，组队 2.0 新增） |
| deadline | DATETIME | NULL | 组队截止时间 |
| status | TINYINT | NOT NULL DEFAULT 1 | 1-招募中 0-已关闭（队伍满员/提交审核/审核通过/解散时自动关闭） |
| create_time / update_time | DATETIME | NOT NULL | 时间戳 |

索引: `idx_rp_comp`(competition_id), `idx_rp_user`(user_id), `idx_rp_status`(status)。还需人数 = max_members − 现有成员，实时计算不落库。

#### 7. community_request — 社区请求表（入队申请/邀请）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | BIGINT | PK, AUTO_INCREMENT | 主键 |
| type | TINYINT | NOT NULL | 2-入队申请 3-入队邀请（1-资料互看已废弃，存量仅作历史，接口不再暴露/受理） |
| post_id | BIGINT | NOT NULL* | 关联招募帖（type=2/3 必填，均基于帖子发起） |
| team_id | BIGINT | NULL | 关联队伍 |
| from_user_id | BIGINT | NOT NULL | 发起人 |
| to_user_id | BIGINT | NOT NULL | 接收人（处理人） |
| message | VARCHAR(500) | NULL | 备注（常写联系方式，便于快速沟通） |
| status | TINYINT | NOT NULL DEFAULT 0 | 0-待处理 1-已同意 2-已拒绝 |
| create_time | DATETIME | NOT NULL DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| handle_time | DATETIME | NULL | 处理时间 |

索引: `idx_cr_to`(to_user_id, status), `idx_cr_from`(from_user_id), `idx_cr_pair`(from_user_id, to_user_id, type)。流程（组队 2.0）：发申请/邀请前经 `precheckJoinable` 快失败预校验（报名窗口/满员/已在同竞赛其他队），同意后由 `RegistrationService.addMemberToTeam` 完成入队（最终闸门：行锁 + FOR UPDATE count + 双唯一键），队伍满员自动关闭其招募帖。

#### 8. sys_notification — 站内通知表（含全员公告）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | BIGINT | PK, AUTO_INCREMENT | 主键 |
| user_id | BIGINT | NOT NULL DEFAULT 0 | 接收者用户ID，**0 表示全员公告** |
| type | VARCHAR(20) | NOT NULL DEFAULT 'system' | announcement-公告 / interaction-互动 / system-系统 |
| title | VARCHAR(100) | NOT NULL | 标题 |
| content | VARCHAR(500) | NULL | 内容(公告可为HTML) |
| ref_type | VARCHAR(20) | NULL | 关联对象类型：request-社区请求 / recruit-招募帖 / team-队伍（审核结果、解散、退队、移除、转让）/ user-成绩发布 / notice-公告 |
| ref_id | BIGINT | NULL | 关联对象ID |
| is_read | TINYINT | NOT NULL DEFAULT 0 | 已读标记（公告不跟踪已读） |
| is_top | TINYINT | NOT NULL DEFAULT 0 | 公告置顶 |
| create_time | DATETIME | NOT NULL DEFAULT CURRENT_TIMESTAMP | 创建时间 |

索引: `idx_noti_user`(user_id, is_read), `idx_noti_ref`(ref_type, ref_id)。旧 `sys_notice` 的管理接口 (/notice) 已迁移到本表 (user_id=0 行)，API 返回形状保持兼容。前端跳转映射见 `src/utils/notification.ts`。

### 表间关系

```
sys_user (1) ──< (N) competition              [publisher_id]
sys_user (1) ──< (N) competition_team         [leader_id]
sys_user (1) ──< (N) competition_team         [teacher_id]  (指导老师)
sys_user (1) ──< (N) competition_team_member  [student_id]
sys_user (1) ──< (N) competition_result       [student_id]
sys_user (1) ──< (N) recruit_post             [user_id]
sys_user (1) ──< (N) community_request        [from_user_id / to_user_id]
sys_user (1) ──< (N) sys_notification         [user_id]

competition (1) ──< (N) competition_team          [competition_id]
competition (1) ──< (N) competition_team_member   [competition_id]（冗余列，uk 一人一赛一队）
competition (1) ──< (N) competition_result        [competition_id]
competition (1) ──< (N) recruit_post              [competition_id]

competition_team (1) ──< (N) competition_team_member  [team_id]
competition_team (1) ──< (N) competition_result       [team_id]
competition_team (1) ──< (N) recruit_post             [team_id]
recruit_post (1) ──< (N) community_request            [post_id]
```

注意: 所有外键关系均为逻辑外键，数据库层面不建 FK 约束，由应用层保证一致性；例外是成员表的两个**唯一约束**（组队 2.0 经用户确认引入，用于库层兜底"一人一赛一队"与防重复入队）。

### JSON 字段说明

- `competition.awards`: 教师创建竞赛时自定义的奖项列表，格式 `[{"name":"一等奖","level":1}, ...]`。成绩的 `award_level` 和 `award_name` 直接引用此 JSON 中的值。
- `competition.attachments`: 竞赛附件列表，格式 `[{"fileName":"x.pdf","fileUrl":"/uploads/x.pdf","fileSize":1024,"fileType":"pdf"}, ...]`。前端上传文件后将结果追加到此数组，保存竞赛时整体 JSON 提交。

### 设计决策备忘

- **dept_name / major_name / class_name** 直接存储在 sys_user 表中作为普通 VARCHAR 字段，不使用独立的组织机构表。这是因为本系统不需要组织结构的层级管理和级联操作。
- **角色不设列**：认证与鉴权一律由 `user_type`（1/2/3）推导，原 `role` 字段已删除。
- **报名与队伍合一**：不设独立报名表，参赛单位=队伍（单人赛=1人队），成员即报名。
- **awards 和 attachments** 使用 JSON 字段存储在 competition 表中，不拆为独立子表。这两类数据量小、结构简单、总是跟随竞赛一起读写，不需要独立查询。
- **隐私策略**：手机号/邮箱等隐私字段不入库；需要私下沟通时由用户在招募帖 `contact` 或请求备注中自行填写。
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

### 组队 2.0 变更记录（2026-09-09，经用户明确确认）

- **成员流动**: 新增端点 `PUT /registration/team/{id}/leave`（成员退队）、`DELETE /registration/team/{id}/member/{studentId}`（队长移除）、`PUT /registration/team/{id}/leader/{studentId}`（转让队长）；名单提交审核后冻结，驳回后可调整；解散队伍补发全员通知。
- **新增字段**: `competition_team_member.competition_id`（冗余竞赛ID）+ 双唯一键 `uk_tm_team_student`/`uk_tm_comp_student`，库层强制"一人一赛一队"；`recruit_post.contact`（联系方式，选填 ≤100 字）。
- **删除机制（非表结构）**: 资料互看(type=1) 下线——`createRequest` 仅受理 type=2/3，received/sent 过滤存量 type=1；`/user/public/{id}` 完整资料对所有登录用户开放；CardService 不再有脱敏/解锁逻辑。
- **规则收紧**: 建队/入队/发申请邀请均校验竞赛报名窗口（`checkRegistrationWindow`，空值放行）；队伍提交审核/审核通过/解散自动下架关联招募帖。
- **升级脚本**: `backend/sql/upgrade-teamup2.sql`（在 upgrade-lean2.sql 之后执行；含加列→回填→脏数据检查→加唯一键）。

### 禁止修改数据库结构

**这仍是一条硬性规定。任何 AI 代理在未经人工明确授权的情况下，不得执行以下操作:**

1. **禁止新增表** — 不得 CREATE TABLE 或建议新增表。如果需要存储新类型的数据，优先考虑是否能用现有表的 JSON 字段承载。
2. **禁止新增字段** — 不得 ALTER TABLE ADD COLUMN 或建议给任何表加字段。如果现有字段无法满足需求，先讨论是否可以通过应用层逻辑解决。
3. **禁止删除表或字段** — 不得 DROP TABLE 或 ALTER TABLE DROP COLUMN。
4. **禁止修改字段类型** — 不得 ALTER TABLE MODIFY COLUMN 更改已有字段的类型、长度或约束。
5. **禁止添加外键约束** — 所有表间关系保持逻辑外键，不在数据库层面添加 FK 约束（组队 2.0 的唯一约束 `uk_tm_*` 为经用户确认的例外，属完整性约束而非 FK）。
6. **禁止编写迁移脚本** — 不得在 `backend/sql/` 下创建新的迁移 SQL 文件（`upgrade-teamup.sql`、`upgrade-lean.sql`、`upgrade-lean2.sql`、`upgrade-teamup2.sql` 为历次经用户确认的例外）。

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
2. **CORS**: 后端 WebMvcConfig 已配置 `allowedOriginPatterns("*")`（开发态放开），生产应收敛为实际域名
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

### 2026-09-10 全量文档同步（本文件主体 + README + DEVELOPMENT + ER 图 + 课程设计报告 + frontend/README）

- **本文件（AGENT.md）主体大修**：数据库结构一节此前仍是 TeamUp 之前描述（列有已删除的 competition_registration 表、sys_user 的 phone/email/role 字段、成员表 status 列、recruit_post 的 need_count/view_count、两步制互看流程），已按 init.sql 重写为当前 8 表并新增「组队 2.0 变更记录」；前端路由表按 App.tsx 重写（删除 /admin/registrations、/student/registration 等已不存在路由，补齐三 tab/四 tab 合并页、重定向与 TeamDetail/UserProfilePage）；服务端口修正（前端固定 3000，5174/3001 动画演示为不存在的历史遗留）；目录结构/控制器数量（13）/API 模块（10）/组件（34）/页面（26）对齐实际；CORS 修正为 `allowedOriginPatterns("*")`；「禁止修改数据库结构」例外清单更新。
- **README.md**：文档索引补课程设计报告与全链路测试报告；升级路径补 `upgrade-teamup2.sql` 并给出"是否最新结构"的列级判据；§4.2 表清单与社区请求语义按组队 2.0 更新；新增演示数据（gen_demo_data.py）与成员流动回归（smoke_member_flow.py）入口，boundary 断言数 233→227；标注 WebSocket 已下线（vite `/api/ws` 与 nginx upgrade 头为历史遗留）；start.bat 自动升级只含 upgrade-teamup.sql 的局限如实说明；项目结构补全回归/演示脚本。
- **docs/ER-DIAGRAM.md**：补齐 competition_team.teacher_id、成员表 competition_id + 双唯一键、recruit_post.contact；删除成员表不存在的 status 列；community_request type=1 标废弃；sys_notification ref_type 补 team；页脚隐私说明由"互看解锁"改写为组队 2.0 的资料全开放 + 队伍规则要点。
- **DEVELOPMENT.md**：整册此前基于 TeamUp 之前的旧 7 表模型（报名表/sys_notice/member.status/报名审核链/`/registration/{id}/audit` 等），已全量重写：8 表 DDL 与虚拟字段、13 控制器完整 API 参考（含成员流动、社区、通知、导出实际签名）、路由树、双 store、全局弹窗 exit 动画说明、并发一致性约定（§4.8）、页面/组件目录按实际 26/34 更新、踩坑记录刷新（并发超员、docker exec 中文编码、种子时间窗漂移、live 库 ID 映射差异等）、状态码速查重写（竞赛 1/5 与成员 status 标废弃）。
- **docs/课程设计报告.md**：需求分析与角色职责、E-R 框图（修正重复/错标实体）、实体与索引说明（补双唯一键与冗余竞赛ID）、三端功能导航树、原型模块 4/6/7/8/9/10（发布即生效、EntryModal 建队、社区请求入队链、队伍审核取代竞赛审核、通知接口路径修正）全部按组队 2.0 实况同步；技术性总结补数据库设计亮点。
- **frontend/README.md**：目录结构（10 API 模块/34 组件/26 页面平铺/双 store/utils 五件）、共享函数约定更新，补 2026-09 演进摘要。
- **顺带修复（init.sql 种子缺陷）**：实测发现全新库导入 init.sql 在队伍种子第 5 行报 `ERROR 1048: Column 'leader_id' cannot be null`（'刘洋'个人赛队 leader_id 误为 NULL，成员行 `(6,5,6,8)` 表明本意即学生 8 任队长）——已改为 8，一次性临时库全流程导入复测通过（5 队/6 成员，无报错）。
- 遗留提示（代码侧，未改动）：`UserController#/public` 的 @Operation 仍写"未解锁仅脱敏卡"、`init.sql` 的 `ref_type` 列注释缺 `team`，均为旧语义注释；`Notice` 实体/`NoticeMapper` 为无表死代码，待用户确认后可清理。

### 2026-09-09（第三批）演示数据生成器 + 回归脚本健壮性修复

- **新增 `backend/gen_demo_data.py`**：生成 `backend/sql/demo-data.sql`（先清后插、可重复执行）并灌入 docker mysql-scms，结束跑 19 项强校验（队长在队/不超员/一人一赛一队/各表引用完整性/本轮精确行数），不通过即非零退出。规模：**46 用户**（42 学生 D2025001-042 + 4 教师 TD2025001-04，密码均 123456）、**6 场演示竞赛**（已发布×3 / 进行中 / 已结束×2，队名/个人赛混合）、**43 支队伍 96 成员**、**15 条招募/求组帖（11 条带联系方式）**、**17 条社区请求**（待处理申请/邀请 + 历史已处理）、**36 条成绩**（已结束赛已发布 23 条、进行中赛未发布 13 条）、**28 条通知公告**。清理标记：用户名前缀 `D2025`/`TD2025`、竞赛名前缀 `演示·`。
- **两个编码/引用坑（已修）**：① Windows 下 `docker exec ... mysql -e "中文"` 会破坏中文参数，导致清理条件失效 → 所有脚本的 SQL 改走 **stdin + `--default-character-set=utf8mb4`**；② 生成器的"老生池"查询必须排除演示学生（`username not like 'D2025%'`），否则会把上一轮**即将被删除**的演示学生当成老生编入新队伍，产生孤儿成员/成绩；另演示竞赛需排除在 solo/team 竞赛探测之外（否则生成的队伍会指向已被清理的竞赛）。清理段另加**孤儿兜底删除**（成员/成绩/帖子/请求/通知/队伍引用缺失即删）。
- **`smoke_full.py` 健壮性修复**：清理阈值由硬编码 `team_id > 5` 改为开跑快照 `snap_team`（原实现会把演示数据一并删掉）；数据读取统一经 stdin UTF-8。
- **回归实跑**：生成/幂等（连续两轮 43 队 96 成员、孤儿 0）、smoke 66/66、boundary 227/227、member_flow 31/31，**回归后演示数据完好**（43 队 / 42 学生 / 6 竞赛）。

### 2026-09-09（第二批）组队逻辑优化：成员流动 + 报名时间窗 + 互看下线/联系方式直连

**A. 成员流动 + DB 兜底 + 解散通知**
1. 新增成员级操作（原只有"入队/解散"两个极端）：`PUT /registration/team/{id}/leave`（成员退队，队长不可退须先转让/解散）、`DELETE /registration/team/{id}/member/{studentId}`（队长移除）、`PUT /registration/team/{id}/leader/{studentId}`（转让队长）。**名单冻结规则**：仅组建中(0)/已拒绝(3)可退队/移除（提交审核后名单锁定）；转让队长 0/1/3 可用，已通过(2)需联系管理员。前端 TeamDetail 成员行内联按钮（stopPropagation 防触发行跳转）。
2. `competition_team_member` 冗余 `competition_id` 列 + `uk_tm_team_student`/`uk_tm_comp_student` 双唯一键，数据库层强制"一人一赛一队"（原仅应用层子查询）；查重改走冗余列。迁移见 `upgrade-teamup2.sql`（含加列→回填→加唯一键，附脏数据检查 SQL）；init.sql 已同步，成员表演示数据改显式列名插入。
3. 解散队伍补发全体成员通知（原静默消失）；状态变更方法（submit/changeTeacher/audit/disband）统一 `selectByIdForUpdate` 与退队/审核串行化；抽 `closeOpenPostsForTeam` 复用关帖逻辑。

**B. 报名时间窗校验（规则收紧）**
4. `createTeam`/`addMemberToTeam` 校验 `registrationStart/End`（"报名尚未开始/已截止"，空值跳过兼容旧数据）→ 竞赛进行中且报名截止后不能再加入队伍。`CommunityService.precheckJoinable` 复用 `checkRegistrationWindow`。前端建队下拉/EntryModal 同步过滤+提示。
5. **演示数据适配**：init.sql 中 status=2 竞赛的报名窗口改相对时间（`NOW() ± INTERVAL`），否则全新初始化的库因种子日期过期而无法组队；`smoke_full.py` 增加 step0 SQL 刷新存量库窗口、`boundary_full.py` 竞赛时间参数动态化。

**C. 社区预校验 + 自动关帖**
6. 发申请/邀请前快失败预校验（时间窗/满员/已在其他队，最终闸门仍在 addMemberToTeam）；队伍提交审核、审核通过时自动关闭关联招募帖。

**D. 资料互看机制下线，改为备注/联系方式直连**
7. `createRequest` 仅收 type=2/3（type=1 →"请求类型无效"），删除互看前置校验与 handle 互看分支；received/sent 过滤存量 type=1。CardService 删 `unlocked/hasPendingUnlock/maskName`（displayName 不再打码、卡无 unlocked 字段）；`/user/public` 完整资料（realName/bio/awards/stats）对所有登录用户开放。前端移除互看 tab（StudentTeams）、帖子弹窗与个人主页全部门控（RecruitDetailModal/UserProfilePage）、锁标（UserCardMini）、通知跳转分支（notification.ts）、教程与文案（tutorials/ProfilePage）。
8. 招募帖新增 `contact` 联系方式字段（≤100 字，upgrade-teamup2.sql + 实体/DTO/RecruitService + RecruitPostModal 表单 + 详情弹窗绿色展示行）；申请/邀请备注（message）文案引导留联系方式，请求卡片加"备注："前缀。顺手修复：RecruitPostModal 移除"自动为我创建一支新队伍"死选项（后端早已拒绝隐式建队）并补前端 teamId 必选校验。
9. 回归脚本同步新规则：smoke 互看段改"资料全开放"断言 + type=1 拒绝；boundary 社区段重写（handle 守卫改用将被拒绝的申请、C/D 并发入队免互看、公开资料 realName 全开放断言）。**新增 `backend/smoke_member_flow.py`**（成员流动专项回归：退队/移除/转让/联系方式/报名截止拦截，开头自清理残留、可重复执行；注意 live 库用户映射 S20220002=7、S20230001=8，与 init.sql 种子序号不同）。实跑：迁移 upgrade-teamup2.sql 已执行（competition_id 回填、双唯一键、contact 列就位），后端重启新代码后 smoke 66/66、boundary 227/227、member_flow 33/34 全绿。

### 2026-09-09 全功能全链路测试（API 303 断言 + UI 66 用例 + 交叉故事线）+ 同日全部缺陷修复，报告见 docs/full-link-test-report/

- **API 回归**：`smoke_full.py` 70/70、`boundary_full.py` 233/233 全绿（0 FAIL 0 ⚠），种子完整性守卫通过；**修复后再跑仍全绿**。
- **UI 端到端**（浏览器实测 5199，三角色 18 路由）：63/66 用例通过，全程 console 0 报错；交叉故事线「教师建赛→学生互看/申请组队→管理员审队→教师录成绩发布→学生收通知→成绩单导出」全链路闭环。
- **发现并已修复 P1 缺陷 3 个（全部前端改动）**：
  1. 用户批量禁用不可用 → `user.ts` `batchDisable` 补 `status` 参数；`AdminUsers` 新增「批量启用」按钮（status=1）。
  2. 用户批量删除不可用 → `user.ts` `batchDelete` 改发裸数组（后端 `@RequestBody List<Long>`）。
  3. 教师提交的竞赛 status=1 状态机死角 → `TeacherCompetitionCreate` 创建即 status=2（发布即报名），编辑按原状态治愈 0/1→2、保持 3/4 不回退；顺带修掉「编辑已发布竞赛会被打回审核中」的隐藏降级缺陷；文案「提交审核」改「发布竞赛/保存并发布/保存修改」。
- **P2×2 已修复**：`DesktopLayout` 顶栏标题去掉 `AnimatePresence mode="wait"` 退出依赖，改为即时切换；`ConfirmDialog/PromptDialog/GlassModal/EditGradeDialog` 四个全局弹层移除 exit 动画（关闭即卸载），彻底消除残留弹窗堆叠/双表单串扰（复测 3 次开合零残留、确认单击即生效）。
- **P3**：公告时间列改 `formatDateTime`（新增 utils/format.ts）；「用户搜索需回车」经复核为测试观察误差（防抖代码本就正确），已在报告撤销。
- **测试基建备注**：IAB 环境截图偶发白屏假象（DOM 完好，重绘恢复）、动画页 Playwright 点击 actionability 挂起（需 JS click 绕过）——均为测试环境现象，非系统缺陷；文件上传 UI 链路由 boundary_full.py 覆盖。
- 清理：全部 TST-/tst_ 临时数据（含修复验证赛 id=66）已移除；恢复过历史丢失的种子行 `community_request` id=2；7 条种子通知逐一核对健在。

### 2026-09-09 体验优化 9 项（标题/回跳/回顶/错误边界/自动教程/骨架屏/草稿/搜索/favicon 角标）

1. **标签页标题**：`DesktopLayout` 按当前页面名 + 未读数实时更新 `document.title`（如 `概览 (1) · 赛友 TeamUp`）。
2. **登录回跳**：`LoginPage` 读取 AuthGuard 传入的 `state.from`（此前被忽略），仅当来源属于当前登录端路由时回跳原页（含 search 参数）；顺带修复装饰性的「记住账号」复选框——现真正预填/保存用户名（`STORAGE_KEYS.REMEMBER_USER`）。
3. **路由切换回顶部**：`PageTransition` 监听 pathname，对 `.desktop-content/.mobile-content` 两个独立滚动容器 `scrollTo(0)`。
4. **页面级错误边界**：新增 `PageErrorBoundary`（重试 + 返回概览），在 `App.tsx` 的 DashboardLayout 内以 `key={pathname}` 包住 `<Outlet/>`——单页崩溃不再白屏，侧边栏/顶栏保留。
5. **首次自动教程**：每个页面（按教程标题去重）首次访问自动弹一次使用教程遮罩，`STORAGE_KEYS.TUTORIAL_SEEN_PREFIX` 记录已看；右上角 ? 按钮仍可随时打开。
6. **仪表盘骨架屏**：学生/教师概览页新增 loading 态，加载中渲染 `DashboardSkeleton + ListSkeleton`（实测加载期可见、到达后消失）。
7. **发布竞赛表单草稿**：创建模式自动把表单/奖项/封面/附件暂存 localStorage（`STORAGE_KEYS.COMPETITION_DRAFT`），刷新恢复并提示，提交或存草稿后清除。**同时移除「竞赛分类/参赛资格/联系方式」三个字段**——后端 DTO/实体从无这三列，用户填写后被静默丢弃（比回填缺失更严重的误导），故直接删除而非回填。
8. **搜索扩展**：后端 `RegistrationController/Service.listTeams` 新增可选 `keyword`（teamName 模糊）；前端教师/管理员队伍页新增队名搜索框；管理员/教师竞赛页消费顶栏搜索跳转的 `?search=` 参数（此前是无人读取的孤儿参数），教师竞赛页补页内搜索框 + keyword 传参。
9. **favicon 未读角标**：新增 `store/notificationStore.ts`（未读数全局态）+ `UnreadFavicon`（全角色 30s 轮询，canvas 重绘 🤝 底 + 红色数字角标，99+ 封顶）；`NotificationBell` 改为消费 store（去重轮询），点击已读后即时刷新。

验证：`tsc` + `vite build` 通过；后端 `mvn package` 并重启（新 keyword 接口 curl 实测 `keyword=ACM` 精确命中）；内置浏览器实测——标题随路由/未读变化、登录过期后回跳原页、记住账号预填、滚动回顶、每 tab 首次自动教程、仪表盘骨架屏、草稿保存/恢复、教师队名搜索与两处 `?search=` 消费、插入临时未读通知后 favicon 变 PNG + 铃铛角标 1 + 标题带 (1)，删除后恢复（测试数据已清理）。

### 2026-09-09 页面使用教程遮罩（全端全 tab）

1. **教程内容 `config/tutorials.ts`**：按路由编写三端全部主导航 tab 的分步教程（管理员 5 个、教师 4 个、学生 5 个）+ 内层 tab 变体（组队中心|招募广场、参赛历史|成绩单等 `路径|tab` 键）+ 公共页（个人中心）；详情页类路由（竞赛详情/队伍详情/发布竞赛/TA 主页）走正则兜底，未覆盖路由按 pageTitle 走通用兜底。
2. **`components/TutorialOverlay.tsx`**：暗色蒙层 + 毛玻璃分步卡片（步骤序号、描述、进度点、上一步/下一步/知道了），支持 ESC、方向键翻步、点蒙层关闭。
3. **入口**：`DesktopLayout` 右上角通知旁新增帮助按钮（桌面 `header-action-btn`，移动 `mobile-menu-btn`），按当前路由+tab 实时解析对应教程。
4. 验证：`tsc` + build 通过；内置浏览器实测——管理员端总览/用户管理/竞赛详情（正则兜底）、学生端组队中心内层 tab=招募广场、ESC/X/知道了三种关闭方式、移动端 390px 视口入口与卡片自适应，全部通过。

### 2026-09-09 全站字体对标 iOS（打包 Inter + 思源黑体）

原字体栈只声明系统字体（`-apple-system, BlinkMacSystemFont, 'SF Pro Display/Text', 'Inter', 'Helvetica Neue', sans-serif`），Windows 上英文/数字落到 Segoe UI、中文落到微软雅黑，无法对齐 iOS 观感。改动：

1. `npm i @fontsource-variable/inter @fontsource-variable/noto-sans-sc`（Inter = SF Pro 最佳开源替代，负责英文/数字；Noto Sans SC = 思源黑体，最接近苹方的开源中文字体），`main.tsx` 引入。
2. `html` 字体栈改为：`-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter Variable', 'Inter', 'PingFang SC', 'Noto Sans SC Variable', 'HarmonyOS Sans SC', 'MiSans', 'Microsoft YaHei', sans-serif`——Apple 设备走原生 SF/苹方，Windows/Linux 走打包的 Inter/思源黑体，中文显式回退链补齐。
3. 打包体积：Noto Sans SC 按 unicode-range 切成 ~100 个 woff2 分片（每个 7-10KB），浏览器只拉取页面实际用到的字形分片；Inter Variable 约 50KB×2。`document.fonts.check` 实测 Inter 与中文分片均按需加载成功。

### 2026-09-09 概览页角色标识卡片（RoleHero）

三端概览页（StudentDashboard/TeacherDashboard/AdminDashboard）顶部新增 `components/RoleHero.tsx` 角色标识卡片：**玻璃卡片单行**——角色名按端着色（学生=蓝、教师=橙、管理员=红，加粗）+ 灰色按时段问候语，无图标无日期，风格与其余玻璃卡一致，移动端缩小内边距。应用户多轮反馈迭代：初版"渐变大横幅+装饰光斑+职责简介"→ 去横幅改玻璃卡 → 去卡片纯文字 → **最终恢复卡片底、保留单行极简内容**。**同轮移除了页头标题旁的小号"XX端"徽章**（desktop header 与 mobile header 均删，`.role-badge/.role-*/.mobile-role-badge` CSS 一并清理）——角色标识统一由该卡片承担。验证：`tsc` + build 通过；内置浏览器实测管理员端渲染正常。

### 2026-09-09 桌面端体验优化与创建组队修复（Playwright 学生/教师双角色实测）

1. **侧边栏悬浮横向展开**：图标胶囊（68px）悬浮时平滑展开至 208px，显示每个 tab 名称（含底部个人中心/退出登录与品牌文字）；离开延迟 260ms 收起防误触闪烁。修复点：展开/收起事件从 `.sidebar-nav` 上提到 `aside`；用 ref 定时器替代裸 `setTimeout`（旧实现重进不取消会闪烁）。**活动项高亮从 motion `layoutId` 共享布局元素改为按钮自身 CSS 背景**——CSS 宽度过渡会让 framer-motion 的投影快照冻结在中间态，指示块缩成 44px 方块；同时 hover 高亮排除 active 项（`:hover:not(.active)`）。
2. **角色端标识修复**：desktop header 的角色徽章 `className` 此前是写坏的 JSX 字面量（引号内是三元表达式文本，`role-admin/teacher/student` 样式从未生效）→ 改为模板字符串，文案改「管理员端/教师端/学生端」；mobile header 增加同款小徽章。
3. **创建组队排查与修复**：API 端到端实测创建/解散正常（此前怀疑的中文请求体 400 是 Git Bash 终端 GBK 编码假象，浏览器 UTF-8 无此问题）。真实缺陷在 UI：创建弹窗的竞赛下拉会列出待审核/已结束竞赛，选中必然报「该竞赛当前不可参赛」→ 下拉只列可报名竞赛（status 2/3，与后端 `createTeam` 接受规则一致）、个人赛（maxMembers=1）标注「个人赛，创建即报名」、无可用竞赛给空态提示、`handleCreate` 对陈旧选择二次校验（弹窗开着期间竞赛状态变化）。

涉及：`frontend/src/components/DesktopLayout.tsx`、`frontend/src/index.css`、`frontend/src/pages/StudentTeams.tsx`。验证：`tsc` + `vite build` 通过；Playwright 实测学生/教师登录徽章与 class、侧边栏 68→208px 展开标签齐全、活动项高亮正常、弹窗下拉仅含 6 个可报名竞赛（正确排除 2 个已结束）、UI 点击创建队伍返回 200 并清理测试数据。

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
