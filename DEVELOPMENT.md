# 赛友 TeamUp（SCMS）完整开发文档

> 学生竞赛信息管理与组队社区系统 (Student Competition Management System / TeamUp)
> 面向零基础接手者的项目全景指南

---

## 一、项目概述

赛友 TeamUp（内部代号 SCMS）是一个面向高校的学生竞赛信息管理与组队社区平台，采用前后端分离架构。系统支持三种角色：管理员、教师、学生，覆盖竞赛发布、组队报名、社区招募、队伍审核、成绩录入、通知与导出等完整业务流程。

数据库从初始 15 表精简至 8 表：2026-09-05「赛友 TeamUp」社区化改造（经用户确认）新增 recruit_post/community_request 两表、sys_notice 并入 sys_notification；同日「Lean 精简」删除 competition_registration（报名与队伍合一）及多处死字段；2026-09-09「组队 2.0」为成员表加冗余竞赛ID + 双唯一键、招募帖加联系方式、资料互看机制下线（详见 AGENT.md 三节变更记录）。前端以 iOS 26 Liquid Glass 玻璃态设计语言为核心视觉风格。

### 1.1 系统角色与核心能力

管理员拥有系统最高权限：管理所有用户（增删改查、启用/禁用、批量操作、重置密码）、管理全部竞赛、审核参赛队伍（提交→通过/拒绝）、录入与发布成绩、管理系统公告（富文本编辑、置顶、草稿）、查看全局统计数据（用户分布、竞赛热度、报名趋势、奖项分布）并导出 Excel/CSV。

教师是竞赛的创建者：发布竞赛（创建即发布、发布即报名，无审核环节）、编辑自己发布的竞赛、查看自己竞赛的队伍与参赛者名单（只读，不参与审批）、录入和发布成绩（单条/批量/CSV 导入）、导出自己竞赛的数据。

学生是竞赛的参与者与社区主体：浏览已发布竞赛、创建队伍（单人赛=1人队，创建即提交）、组队中心内成员流动（退队、队长移除成员、转让队长，提交审核后名单冻结）、招募广场发布招募/求组帖（可留联系方式）、通过入队申请/入队邀请社区请求加入队伍、查看已发布成绩与成绩单、浏览他人社区主页（完整资料对所有登录用户开放）、接收站内通知。

### 1.2 技术栈总览

前端技术栈：React 19（函数组件 + Hooks）、TypeScript（严格模式）、Vite 8（构建工具 + 开发服务器）、Tailwind CSS 4（CSS-first 模式，无 tailwind.config）、Zustand 5（状态管理）、React Router DOM 7（路由）、Motion 12（Framer Motion 的继任者，动画引擎）、Axios（HTTP 客户端）、Lucide React（SVG 图标库）、TipTap 3（富文本编辑器，用于公告编辑）、@fontsource-variable Inter + Noto Sans SC（打包字体，对标 iOS 观感）、jsPDF（PDF 生成预留）、Playwright（E2E 测试框架，用例 `frontend/e2e/teamup.spec.ts`）。

后端技术栈：Spring Boot 3.2.5（Java 17）、Spring Security（认证与授权）、MyBatis-Plus 3.5.6（ORM 框架）、MySQL 8（数据库，Docker 容器运行）、JWT / jjwt 0.12.5（令牌认证）、SpringDoc OpenAPI 2.5.0（Swagger API 文档）、EasyExcel 3.3.4（Excel 导出）、Lombok（代码简化）、Hutool 5.8.27（工具包，当前未大量使用）。

回归/测试基建：Python 无依赖脚本三件套（`smoke_full.py` 全链路冒烟、`boundary_full.py` 边界与容错回归 263 断言、`smoke_member_flow.py` 成员流动专项），`gen_demo_data.py` 演示数据生成器（幂等 + 19 项自校验），全部依赖 docker 容器 `mysql-scms` 与 8080 后端。

基础设施：MySQL 运行在 Docker 容器 `mysql-scms` 中（端口 3306）、Maven 路径为 `C:\apache-maven\apache-maven-3.9.16\bin\mvn.cmd`（若不在 PATH 中需完整路径调用）。

---

## 二、开发环境搭建

### 2.1 必需软件

在 Windows 系统上开发，需要安装以下软件：

JDK 17 或更高版本（推荐 Oracle JDK 或 Eclipse Temurin），安装后确认 `java -version` 输出正确。

Node.js 18 或更高版本（推荐 LTS 版本），安装后确认 `node -v` 和 `npm -v` 输出正确。

Maven 3.8 或更高版本，本项目使用 `C:\apache-maven\apache-maven-3.9.16`，调用时确认 `mvn` 可用或使用完整路径。

Docker Desktop（用于运行 MySQL），安装后确认 `docker --version` 正常。MySQL 容器名为 `mysql-scms`，端口映射 3306:3306，root 密码为 `root`。

Python 3.x（仅运行回归/演示脚本需要，标准库实现无需 pip 安装）。

### 2.2 克隆与安装

```bash
# 克隆项目
git clone <repository-url> SGADQRS
cd SGADQRS

# 安装前端依赖
cd frontend
npm install
```

后端依赖由 Maven 自动管理，首次运行 `mvn spring-boot:run` 时会自动下载。

### 2.3 数据库初始化

确保 Docker 已启动且 `mysql-scms` 容器正在运行：

```bash
# 检查容器状态
docker ps | findstr mysql-scms

# 如果容器未运行，启动它
docker start mysql-scms

# 执行初始化脚本（创建数据库 + 建表 + 种子数据）
docker exec -i mysql-scms mysql -u root -proot < backend/sql/init.sql
```

init.sql 脚本包含：建库语句（utf8mb4 字符集）、8 张表的 DDL、种子数据——8 个用户（1 管理员 + 2 教师 + 5 学生，密码统一 123456 的 BCrypt 哈希，学生含昵称/简介/技能标签）、7 个竞赛（含完整描述、规则、奖项 JSON；**其中已发布竞赛的报名/开赛窗口使用 `NOW() ± INTERVAL` 相对时间**，保证新初始化的库始终处于"可组队"状态）、5 支队伍、6 条成员关系（含冗余 competition_id）、3 条成绩、3 条招募/求组帖、3 条社区请求（含 2 条资料互看类型的历史数据，接口已不再展示）、7 条通知（3 条全员公告 + 4 条互动消息，其中 3 条为已下线的资料互看历史文案）。脚本使用 `CREATE TABLE IF NOT EXISTS` 对表结构幂等，但种子 INSERT 不幂等（重复执行会主键冲突），重置须先 DROP DATABASE。

**升级路径**：旧库依次执行 `upgrade-teamup.sql` → `upgrade-lean.sql` → `upgrade-lean2.sql` → `upgrade-teamup2.sql`。**演示数据**：答辩/测试演示可运行 `python backend/gen_demo_data.py` 生成并导入 `backend/sql/demo-data.sql`（先清后插、可重复执行，规模约 46 用户/6 竞赛/43 队伍，清理标记为用户名前缀 `D2025`/`TD2025`、竞赛名前缀「演示·」）。

### 2.4 启动项目

**方式一：一键启动（JAR 模式）**

```bash
start.bat
```

该脚本会自动检查 Java/Node/MySQL 环境，创建数据库（如果不存在，旧库仅自动补跑 `upgrade-teamup.sql`，更旧的库建议按 README §3 手动部署），**使用预构建的 JAR**（`backend/target/scms-backend-1.0.0.jar`）在 8080 启动后端、`npm run dev` 在 3000 启动前端，并自动打开浏览器。因此需要先执行 `mvn clean package -DskipTests` 构建 JAR；修改后端代码后必须重新打包再启动。

**方式二：开发模式启动（推荐日常开发）**

```bash
start-all.bat
```

该脚本使用 `mvn spring-boot:run` 启动后端（各开一个 cmd 窗口），`npm run dev` 启动前端。与 start.bat 的区别在于后端通过 Maven 插件直接运行而非 JAR，修改 Java 代码后重启进程即可生效，无需手动重新打包。

**方式三：手动启动（推荐调试时使用）**

打开两个终端窗口：

```bash
# 终端 1 - 启动后端（端口 8080，工作目录必须是 backend/）
cd backend
C:\apache-maven\apache-maven-3.9.16\bin\mvn.cmd spring-boot:run

# 终端 2 - 启动前端（端口 3000）
cd frontend
npm run dev
```

**重要：后端重建注意事项**

后端以 JAR 方式运行时（`java -jar`），Windows 会锁定 JAR 文件。在重新构建前必须先杀掉 Java 进程，否则 `mvn clean` 会因文件锁而静默失败：

```bash
# 查找 Java 进程
tasklist | findstr java

# 杀掉进程
taskkill /PID <进程ID> /F

# 然后才能重新构建
C:\apache-maven\apache-maven-3.9.16\bin\mvn.cmd clean package -DskipTests
```

### 2.5 验证启动成功

后端启动成功后，访问 http://localhost:8080/api/swagger-ui/index.html 应能看到 Swagger API 文档页面。

前端启动成功后，访问 http://localhost:3000 应能看到登录页面。

使用默认账号登录测试：admin / 123456（管理员）、T2024001 / 123456（教师）、S20210001 / 123456（学生）。

可选的全链路自检：`python backend/smoke_full.py`（应全部 PASS 且自动清理写入的数据）。

### 2.6 服务端口一览

| 服务 | 端口 | 说明 |
|------|------|------|
| 后端 API | 8080 | Spring Boot，context-path 为 `/api` |
| 前端 Dev Server | 3000 | Vite 固定端口（占用时自动 +1，会破坏 e2e 的写死 baseURL） |
| MySQL | 3306 | Docker 容器 `mysql-scms` |

---

## 三、数据库设计

### 3.1 设计原则

本系统遵循以下数据库设计原则：所有表间关系为逻辑外键，不在数据库层面建立 FK 约束（由应用层保证一致性；唯一例外是成员表的两个唯一约束，用于库层兜底"一人一赛一队"与防重复入队）；不使用软删除（无 `deleted` 字段），删除操作为物理删除；组织信息（学院/专业/班级）直接存储在用户表中作为 VARCHAR 字段，不使用独立的组织机构表；奖项和附件以 JSON 格式存储在竞赛表中，不拆分为独立子表；报名与队伍合一，参赛单位=队伍（单人赛=1人队）。

### 3.2 命名约定

数据库表名使用下划线命名法（如 `competition_result`），字段名同样使用下划线命名法（如 `create_time`）。Java 实体类使用驼峰命名法（如 `createTime`），MyBatis-Plus 通过 `map-underscore-to-camel-case: true` 配置自动映射。

### 3.3 完整表结构（8 表，与 backend/sql/init.sql 一致）

#### 表 1: sys_user（用户表）

```sql
CREATE TABLE `sys_user` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `username` VARCHAR(50) NOT NULL COMMENT '登录账号',
    `password` VARCHAR(100) NOT NULL COMMENT '密码(BCrypt)',
    `real_name` VARCHAR(50) NOT NULL COMMENT '真实姓名',
    `nickname` VARCHAR(50) DEFAULT NULL COMMENT '社区昵称',
    `avatar` VARCHAR(255) DEFAULT NULL COMMENT '头像URL',
    `gender` TINYINT DEFAULT 0 COMMENT '性别：0-未知 1-男 2-女',
    `user_type` TINYINT NOT NULL COMMENT '用户类型：1-学生 2-教师 3-管理员',
    `dept_name` VARCHAR(50) DEFAULT NULL COMMENT '所属学院',
    `major_name` VARCHAR(50) DEFAULT NULL COMMENT '专业',
    `class_name` VARCHAR(50) DEFAULT NULL COMMENT '班级',
    `bio` VARCHAR(500) DEFAULT NULL COMMENT '个人简介',
    `skills` VARCHAR(255) DEFAULT NULL COMMENT '技能标签(逗号分隔)',
    `status` TINYINT NOT NULL DEFAULT 1 COMMENT '状态：1-启用 0-禁用',
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_username` (`username`),
    KEY `idx_user_type` (`user_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='用户表';
```

设计说明：`user_type` 是角色的唯一权威字段（`role` 冗余列已删除），认证/授权时以它推导角色编码（roleCode）。手机号/邮箱/last_login_time 等字段已删除——隐私不入库，需要联系方式时由用户在招募帖/请求备注中自行填写。`password` 字段标注 `@JsonProperty(access = WRITE_ONLY)`，任何查询接口不回显密码哈希。`dept_name`/`major_name`/`class_name` 存储纯文本而非外键引用。

#### 表 2: competition（竞赛信息表）

```sql
CREATE TABLE `competition` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `competition_name` VARCHAR(100) NOT NULL COMMENT '竞赛名称',
    `organizer` VARCHAR(100) NOT NULL COMMENT '主办单位',
    `publisher_id` BIGINT NOT NULL COMMENT '发布人ID',
    `cover_image` VARCHAR(255) DEFAULT NULL,
    `description` TEXT DEFAULT NULL COMMENT '竞赛详细描述',
    `rules` TEXT DEFAULT NULL COMMENT '竞赛规则',
    `registration_start` DATETIME NOT NULL COMMENT '报名开始时间',
    `registration_end` DATETIME NOT NULL COMMENT '报名截止时间',
    `competition_start` DATETIME NOT NULL COMMENT '竞赛开始时间',
    `competition_end` DATETIME NOT NULL COMMENT '竞赛结束时间',
    `location` VARCHAR(200) DEFAULT NULL COMMENT '地点',
    `max_members` INT NOT NULL DEFAULT 1 COMMENT '每队最大人数',
    `awards` JSON DEFAULT NULL COMMENT '自定义奖项列表',
    `attachments` JSON DEFAULT NULL COMMENT '竞赛附件列表',
    `status` TINYINT NOT NULL DEFAULT 2 COMMENT '0-草稿 2-已发布 3-进行中 4-已结束',
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_comp_status` (`status`),
    KEY `idx_comp_publisher` (`publisher_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='竞赛信息表';
```

`max_teams` 字段已删除（从未强制校验）。报名窗口（registration_start/end）被 `RegistrationService.checkRegistrationWindow` 用于建队/入队/社区申请邀请的准入校验（空值放行兼容旧数据）。

JSON 字段格式说明：

`awards` 格式为 `[{"name":"一等奖","level":1},{"name":"二等奖","level":2},...]`，教师在创建竞赛时自定义。成绩表的 `award_level` 对应此处的 `level`，`award_name` 对应此处的 `name`。

`attachments` 格式为 `[{"fileName":"文件.pdf","fileUrl":"/uploads/xxx.pdf","fileSize":1024,"fileType":"pdf"},...]`，前端上传文件后将返回的结果追加到此数组，保存竞赛时整体以 JSON 提交。

后端通过 `@JsonIgnore` 标注原始 String 字段，并用 `@JsonProperty` + 自定义 getter 返回解析后的 List，确保前端接收到的是数组而非 JSON 字符串。

#### 表 3: competition_team（参赛队伍表）

```sql
CREATE TABLE `competition_team` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `competition_id` BIGINT NOT NULL,
    `team_name` VARCHAR(50) NOT NULL,
    `leader_id` BIGINT NOT NULL,
    `teacher_id` BIGINT DEFAULT NULL COMMENT '指导老师ID（队长指定，老师只读）',
    `team_slogan` VARCHAR(200) DEFAULT NULL,
    `status` TINYINT NOT NULL DEFAULT 0 COMMENT '0-组建中 1-已提交 2-已通过 3-已拒绝',
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_team_comp` (`competition_id`),
    KEY `idx_team_teacher` (`teacher_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='参赛队伍表';
```

状态机：队长建队(0)→提交审核(1)→管理员审核(2 通过/3 拒绝)，被驳回(3)可修改后重新提交(1)。单人赛 max_members=1，创建即自动提交。**提交审核后名单冻结**（不可退队/移除成员），驳回后可调整；仅已通过(2)不可解散/转让队长（需联系管理员）。

#### 表 4: competition_team_member（团队成员表）

```sql
CREATE TABLE `competition_team_member` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `team_id` BIGINT NOT NULL,
    `competition_id` BIGINT NOT NULL DEFAULT 0 COMMENT '冗余竞赛ID（一人一赛一队唯一约束）',
    `student_id` BIGINT NOT NULL,
    `join_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_tm_team_student` (`team_id`, `student_id`),
    UNIQUE KEY `uk_tm_comp_student` (`competition_id`, `student_id`),
    KEY `idx_tm_team` (`team_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='团队成员表';
```

设计说明：原 `status` 列（0已退出/1正常/2待审核/3已拒绝）已在 Lean 第二批删除——入队即生效、退队即物理删行，无需状态位。`competition_id` 为组队 2.0 引入的冗余列（写入时由服务端回填），配合双唯一键在数据库层强制"一人一赛一队"与防重复入队；应用层查重也走该冗余列（命中 `uk_tm_comp_student` 索引），不再依赖子查询。

#### 表 5: competition_result（成绩表）

```sql
CREATE TABLE `competition_result` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `competition_id` BIGINT NOT NULL,
    `student_id` BIGINT DEFAULT NULL,
    `team_id` BIGINT DEFAULT NULL,
    `score` DECIMAL(10,2) DEFAULT NULL,
    `ranking` INT DEFAULT NULL,
    `award_level` TINYINT DEFAULT NULL COMMENT '1-特等奖 2-一等奖 3-二等奖 4-三等奖 5-优秀奖',
    `award_name` VARCHAR(50) DEFAULT NULL,
    `remark` VARCHAR(500) DEFAULT NULL,
    `is_published` TINYINT NOT NULL DEFAULT 0 COMMENT '0-否 1-是',
    `publish_time` DATETIME DEFAULT NULL,
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_result_comp` (`competition_id`),
    KEY `idx_result_student` (`student_id`),
    KEY `idx_result_publish` (`is_published`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='竞赛成绩表';
```

成绩=一人一行（证书按人发），队伍上下文由 `team_id` 承载；原 `registration_id` 已随报名表一并删除。

#### 表 6: recruit_post（组队招募/求组帖）

```sql
CREATE TABLE `recruit_post` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `competition_id` BIGINT NOT NULL COMMENT '竞赛ID',
    `user_id` BIGINT NOT NULL COMMENT '发布者用户ID',
    `type` TINYINT NOT NULL DEFAULT 1 COMMENT '1-组队招募 2-求组',
    `title` VARCHAR(100) NOT NULL COMMENT '标题',
    `content` TEXT DEFAULT NULL COMMENT '说明',
    `team_id` BIGINT DEFAULT NULL COMMENT '关联队伍(招募帖)',
    `tags` VARCHAR(255) DEFAULT NULL COMMENT '方向标签(逗号分隔)',
    `contact` VARCHAR(100) DEFAULT NULL COMMENT '联系方式（微信/QQ/邮箱等，选填）',
    `deadline` DATETIME DEFAULT NULL COMMENT '组队截止时间',
    `status` TINYINT NOT NULL DEFAULT 1 COMMENT '1-招募中 0-已关闭',
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_rp_comp` (`competition_id`),
    KEY `idx_rp_user` (`user_id`),
    KEY `idx_rp_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='组队招募/求组帖';
```

设计说明：type=1 招募帖必须关联发布者本人担任队长的队伍（**不会自动建队**）；type=2 求组帖 team_id 为空。还需人数 = competition.max_members − 现有成员数，实时计算不落库（原 need_count/view_count 列已删）。`contact` 为组队 2.0 新增（≤100 字，服务端校验长度）。队伍满员/提交审核/审核通过/解散时自动关闭（status→0）其关联帖子。

#### 表 7: community_request（社区请求表）

```sql
CREATE TABLE `community_request` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `type` TINYINT NOT NULL COMMENT '2-入队申请 3-入队邀请（1-资料互看已废弃）',
    `post_id` BIGINT DEFAULT NULL COMMENT '关联招募帖',
    `team_id` BIGINT DEFAULT NULL COMMENT '关联队伍',
    `from_user_id` BIGINT NOT NULL COMMENT '发起人',
    `to_user_id` BIGINT NOT NULL COMMENT '接收人',
    `message` VARCHAR(500) DEFAULT NULL,
    `status` TINYINT NOT NULL DEFAULT 0 COMMENT '0-待处理 1-已同意 2-已拒绝',
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `handle_time` DATETIME DEFAULT NULL,
    PRIMARY KEY (`id`),
    KEY `idx_cr_to` (`to_user_id`, `status`),
    KEY `idx_cr_from` (`from_user_id`),
    KEY `idx_cr_pair` (`from_user_id`, `to_user_id`, `type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='社区请求表';
```

流程（组队 2.0）：入队申请(type=2，帖子作者=队长，基于招募帖)/入队邀请(type=3，求组帖作者加入其竞赛某队)均可附备注 message（常写联系方式）。发起前经 `CommunityService.precheckJoinable` 快失败预校验（报名窗口/满员/已在同竞赛其他队）；同意后由 `RegistrationService.addMemberToTeam` 完成入队（最终闸门：队伍行锁 + 成员数 FOR UPDATE 当前读 + 双唯一键）。原 type=1 资料互看已废弃，存量数据仅作历史，`received`/`sent` 列表已过滤、`createRequest` 拒绝受理。

#### 表 8: sys_notification（站内通知表，含全员公告）

```sql
CREATE TABLE `sys_notification` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT NOT NULL DEFAULT 0 COMMENT '接收者用户ID，0-全员公告',
    `type` VARCHAR(20) NOT NULL DEFAULT 'system' COMMENT '类型：announcement-公告 interaction-互动 system-系统',
    `title` VARCHAR(100) NOT NULL,
    `content` VARCHAR(500) DEFAULT NULL,
    `ref_type` VARCHAR(20) DEFAULT NULL COMMENT '关联对象类型',
    `ref_id` BIGINT DEFAULT NULL COMMENT '关联对象ID',
    `is_read` TINYINT NOT NULL DEFAULT 0 COMMENT '0-未读 1-已读（公告不跟踪已读）',
    `is_top` TINYINT NOT NULL DEFAULT 0 COMMENT '公告置顶',
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_noti_user` (`user_id`, `is_read`),
    KEY `idx_noti_ref` (`ref_type`, `ref_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='站内通知表(含公告)';
```

`ref_type` 实际取值：request-社区请求 / recruit-招募帖 / team-队伍（审核结果、解散、退队、移除、转让）/ user-成绩发布 / notice-公告；前端跳转映射在 `src/utils/notification.ts`。旧 `sys_notice` 的管理接口（/notice）已迁移到本表（user_id=0 行），公告草稿复用 `is_read` 列存状态（1=草稿，0=已发布），API 返回形状保持兼容。

### 3.4 实体虚拟字段

所有实体类都包含若干 `@TableField(exist = false)` 标注的虚拟字段，这些字段不映射到数据库列，由 Service 层在查询后填充关联数据，方便前端直接使用而无需额外的 DTO 转换。

User 实体：`roleCode`（String，角色编码，由 userType 推导）。

Competition 实体：`publisherName`（发布人姓名）、`registrationCount`（报名人数/队伍数）、`hasRegistered`（当前学生是否已参赛）；原始 `awards`/`attachments` 字段为 String 类型（JSON 字符串），通过 `@JsonIgnore` 隐藏并用 `@JsonProperty` + 自定义 getter 返回解析后的 `List<Map>`，前端直接接收数组。

CompetitionTeam 实体：`leaderName`（队长姓名）、`teacherName`（指导老师姓名）、`competitionName`（竞赛名称）、`members`（成员列表 `List<CompetitionTeamMember>`）。

CompetitionTeamMember 实体：`studentName`（学生姓名）、`studentUsername`（学生学号）。

CompetitionResult 实体：`competitionName`（竞赛名称）、`studentName`（学生姓名）、`teamName`（团队名称）。

RecruitPost 实体：`competitionName`、`author`（Map，CardService 资料卡）、`team`（Map，关联队伍概要）。

CommunityRequest 实体：`fromUser`/`toUser`（Map，双方资料卡）、`postTitle`、`teamName`、`competitionName`。

Notice/NoticeMapper：旧 sys_notice 的实体与 Mapper，已无对应表，属死代码遗留（公告实际读写走 NotificationMapper）。

### 3.5 表间关系

```
sys_user (1) ─── (N) competition              [publisher_id]      用户发布的竞赛
sys_user (1) ─── (N) competition_team         [leader_id]         作为队长的队伍
sys_user (1) ─── (N) competition_team         [teacher_id]        作为指导老师的队伍
sys_user (1) ─── (N) competition_team_member  [student_id]        作为成员的记录
sys_user (1) ─── (N) competition_result       [student_id]        学生的成绩
sys_user (1) ─── (N) recruit_post             [user_id]           发布的招募/求组帖
sys_user (1) ─── (N) community_request        [from_user_id/to_user_id] 发起/接收的请求
sys_user (1) ─── (N) sys_notification         [user_id]           接收的通知

competition (1) ─── (N) competition_team          [competition_id]
competition (1) ─── (N) competition_team_member   [competition_id]（冗余列 + uk 一人一赛一队）
competition (1) ─── (N) competition_result        [competition_id]
competition (1) ─── (N) recruit_post              [competition_id]

competition_team (1) ─── (N) competition_team_member  [team_id]
competition_team (1) ─── (N) competition_result       [team_id]
competition_team (1) ─── (N) recruit_post             [team_id]
recruit_post (1) ─── (N) community_request            [post_id]
```

所有关系均为逻辑外键（无 FK 约束），删除竞赛时由 Service 级联清理队伍/招募帖/成绩。

### 3.6 数据库操作

由于 MySQL 运行在 Docker 容器中，所有数据库操作需通过 `docker exec` 执行：

```bash
# 查询数据
docker exec mysql-scms mysql -u root -proot scms -e "SELECT * FROM sys_user;"

# 统计各表数据量
docker exec mysql-scms mysql -u root -proot scms -e "
  SELECT 'sys_user' AS t, COUNT(*) AS c FROM sys_user
  UNION SELECT 'competition', COUNT(*) FROM competition
  UNION SELECT 'competition_team', COUNT(*) FROM competition_team
  UNION SELECT 'competition_team_member', COUNT(*) FROM competition_team_member
  UNION SELECT 'competition_result', COUNT(*) FROM competition_result
  UNION SELECT 'recruit_post', COUNT(*) FROM recruit_post
  UNION SELECT 'community_request', COUNT(*) FROM community_request
  UNION SELECT 'sys_notification', COUNT(*) FROM sys_notification;
"

# 重置数据库（删除后重新导入）
docker exec mysql-scms mysql -u root -proot -e "DROP DATABASE IF EXISTS scms;"
docker exec -i mysql-scms mysql -u root -proot < backend/sql/init.sql
```

**Windows 注意**：`docker exec ... mysql -e "中文SQL"` 会因 GBK 编码破坏中文参数（清理条件静默失效），涉及中文的 SQL 一律走 stdin：`printf '%s' "$SQL" | docker exec -i mysql-scms mysql -uroot -proot --default-character-set=utf8mb4 scms`。回归/演示脚本内部均已采用此方式。

### 3.7 数据库修改硬性约束

这是一条绝对规定，任何情况下不得违反：禁止新增表、禁止新增字段、禁止删除表或字段、禁止修改字段类型或长度、禁止添加外键约束、禁止创建新的迁移脚本。历次经用户确认的例外（upgrade-teamup/lean/lean2/teamup2.sql、成员表双唯一约束）已记录在 AGENT.md。如果业务确实需要变更数据库结构，必须经过用户明确确认，并同步更新 `init.sql`、新增 `upgrade-*.sql` 增量脚本、AGENT.md 表结构文档、`docs/ER-DIAGRAM.md` 与本文档。

---

## 四、后端架构详解

### 4.1 分层结构

后端采用经典的 Spring Boot 分层架构，包路径为 `com.scms`：

```
com.scms/
├── ScmsApplication.java          -- Spring Boot 启动类
├── common/                       -- 通用组件（4 个）
│   ├── Result.java               -- 统一响应封装 {code, message, data}
│   ├── PageResult.java           -- 分页响应封装
│   ├── Pages.java                -- 分页钳制工具（页码/每页上限）
│   └── GlobalExceptionHandler.java -- 全局异常处理
├── config/                       -- 配置类（4 个）
│   ├── MybatisPlusConfig.java    -- MyBatis-Plus 分页插件
│   ├── MyMetaObjectHandler.java  -- 自动填充 createTime/updateTime/joinTime
│   ├── JacksonConfig.java        -- 序列化配置
│   └── WebMvcConfig.java         -- CORS 配置 + 静态资源映射
├── security/                     -- 安全模块（5 个）
│   ├── SecurityConfig.java       -- Spring Security 配置
│   ├── JwtTokenUtil.java         -- JWT 工具类
│   ├── JwtAuthenticationFilter.java -- JWT 过滤器
│   ├── LoginUser.java            -- 自定义 UserDetails
│   └── UserDetailsServiceImpl.java -- UserDetailsService 实现
├── controller/                   -- REST 控制器（13 个）
├── service/                      -- 业务逻辑层（12 个，含 CardService 社区资料卡）
├── mapper/                       -- MyBatis Mapper 接口（9 个，NoticeMapper 为死代码遗留）
├── entity/                       -- 数据库实体（9 个，Notice 为死代码遗留）
├── dto/                          -- 数据传输对象（13 个）
├── export/                       -- Excel 导出模型（4 个：Competition/Team/Result/User）
└── util/
    └── ExcelUtil.java            -- 通用 EasyExcel 工具类
```

控制器清单：Auth、User、Competition、Registration、Recruit、Community、Result、Notice、Notification、Stats、Export、File、StaticFile。

### 4.2 安全认证体系

认证流程：用户提交 username + password（role 可选，传了则校验与账号实际角色一致，不符返回统一凭证错误）到 `POST /api/auth/login`，后端通过 BCrypt 验证密码，成功后生成 JWT 令牌返回。令牌有效期 24 小时（86400000 毫秒）。注册 `POST /api/auth/register` 仅受理 student/teacher，带密码强度与用户名长度校验。

JWT 令牌结构：payload 中包含 `userId`（Long）、`username`（String）、`role`（String，即 "student"/"teacher"/"admin"），使用 HMAC-SHA 签名。

请求认证流程：`JwtAuthenticationFilter`（继承 `OncePerRequestFilter`）从请求头 `Authorization: Bearer <token>` 中提取令牌，验证有效性，加载 UserDetails，创建 `UsernamePasswordAuthenticationToken` 并设置到 `SecurityContextHolder`。被禁用（status=0）的用户旧 token 拒绝生效。

权限控制：使用 `@EnableMethodSecurity` 启用方法级权限，控制器方法通过 `@PreAuthorize("hasRole('ADMIN')")` 等注解控制访问；数据范围在服务层收紧（如教师列表接口强制 publisherId=本人、学生成绩强制 isPublished=1）。

公开访问路径（无需认证）：`/auth/login`、`/auth/register`、`/uploads/**`、`/public/**`、Swagger 文档路径（`/swagger-ui/**`、`/v3/api-docs/**`、`/doc.html`、`/webjars/**`）。

401 响应返回 JSON `Result.error(401, "未登录或登录已过期")`，403 响应返回 `Result.error(403, "没有访问权限")`。

### 4.3 统一响应格式

所有 API 返回统一格式的 JSON：

```json
{
  "code": 200,        // 200=成功，400=客户端错误，401=未认证，403=无权限，500=服务器错误
  "message": "success",
  "data": { ... }     // 具体数据
}
```

分页响应格式：

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "records": [...],  // 数据列表
    "total": 100,      // 总记录数
    "current": 1,      // 当前页码
    "size": 10,        // 每页条数
    "pages": 10        // 总页数
  }
}
```

分页参数经 `Pages.of` 钳制（size 上限 200），防止超大 size 拖垮数据库。

### 4.4 全局异常处理

`GlobalExceptionHandler` 使用 `@RestControllerAdvice` 捕获所有异常，并标注了对应的 HTTP 状态码（统一 Result 信封）：

| 异常 | HTTP | 语义 |
|------|------|------|
| MethodArgumentNotValidException | 400 | 参数校验失败 |
| IllegalArgumentException | 400 | 业务逻辑异常 |
| NoResourceFound/NoHandlerFound | 404 | 路径不存在 |
| AccessDeniedException | 403 | 权限不足 |
| HttpMessageNotReadableException | 400 | 请求体残缺/JSON 非法 |
| MissingServletRequestParameterException | 400 | 缺必填查询参数 |
| MethodArgumentTypeMismatchException | 400 | 参数类型不匹配 |
| HttpRequestMethodNotSupportedException | 405 | 方法不支持 |
| MissingServletRequestPartException | 400 | 上传缺 part |
| MaxUploadSizeExceededException | 413 | 上传超限 |
| Exception | 500 | 未预期异常兜底 |

### 4.5 MyBatis-Plus 配置

`MybatisPlusConfig` 注册了分页拦截器 `MybatisPlusInterceptor` + `PaginationInnerInterceptor(DbType.MYSQL)`。

`MyMetaObjectHandler` 实现了 `MetaObjectHandler` 接口，在 INSERT 时自动填充 `createTime`、`updateTime`、`joinTime` 字段（`LocalDateTime.now()`）。这个处理器必须填充所有标注了 `@TableField(fill = FieldFill.INSERT)` 的字段，否则 MyBatis-Plus 会强制将 null 写入 NOT NULL 列导致 `SQLIntegrityConstraintViolation`。

`WebMvcConfig` 配置 CORS `allowedOriginPatterns("*")`（开发态放开，生产应收敛为实际域名），并注册了 `/uploads/**` 的静态资源映射到 `file:./uploads/` 目录。

### 4.6 文件上传与静态资源

文件上传通过 `POST /api/file/upload` 接口，接收 `MultipartFile`，存储到 `{uploadPath}/yyyy/MM/dd/{UUID}.{ext}` 路径下（uploadPath 配置为 `./uploads/`，相对后端启动目录），返回 `{url, fileName, fileSize, fileType}`。最大文件大小 10MB，请求体最大 20MB。扩展名白名单：图片（png/jpg/jpeg/gif/webp/ico 等，**不含可携带脚本的 svg**）+ 常用文档/压缩包，拒绝无扩展名与白名单外文件，防止存储型 XSS。

静态资源访问有两个入口：`/uploads/**` 由 `WebMvcConfig` 的 `ResourceHandler` 处理（Spring Boot 默认机制）；`/public/**` 由自定义 `StaticFileController` 处理——这是因为 Spring Boot 内置的 `ResourceHttpRequestHandler` 在 Windows 上处理中文文件名时会抛 500 异常，所以用 `@RestController` + `URLDecoder` 替代。`StaticFileController` 解析 JAR/开发模式下的应用根目录查找 `public/` 目录（种子海报位于 `backend/public/`），支持 PNG/JPG/GIF/WebP/SVG/ICO 格式，并包含路径穿越防护（拒绝文件名中包含 `..`、`/`、`\`）。

### 4.7 自动状态转换

`CompetitionService.listCompetitions()` 在每次查询竞赛列表时自动调用 `autoUpdateStatus()`：如果当前时间超过 `competitionStart`，状态从 2（已发布）自动转为 3（进行中）；如果当前时间超过 `competitionEnd`，状态从 3 自动转为 4（已结束）。

### 4.8 并发与一致性约定

队伍相关的所有状态变更（提交审核、换指导老师、审核、解散、退队、移除、转让队长、入队）必须先 `CompetitionTeamMapper.selectByIdForUpdate` 对队伍行加锁；成员容量校验的 count 查询也必须 `FOR UPDATE` 当前读——REPEATABLE READ 隔离级别下事务旧快照看不见并发已提交的插入（此坑由 boundary_full.py 并发用例抓出）。业务层的查重/兜底最终依赖成员表双唯一键，插入冲突即拒绝。

---

## 五、完整 API 接口参考

所有接口基础路径为 `http://localhost:8080/api`，需认证的接口在请求头中携带 `Authorization: Bearer <token>`。

### 5.1 认证接口（公开）

| 方法 | 路径 | 参数 | 说明 |
|------|------|------|------|
| POST | `/auth/login` | Body: `{username, password, role?}` | 用户登录，返回 `{token, user}`；role 传了则校验身份一致 |
| POST | `/auth/register` | Body: `{username, password, role}` | 用户注册（仅 student/teacher，密码强度校验） |
| GET | `/auth/info` | 无（从 Token 获取） | 获取当前登录用户信息 |

### 5.2 用户管理接口

| 方法 | 路径 | 参数 | 权限 | 说明 |
|------|------|------|------|------|
| GET | `/user/list` | Query: current, size, keyword?, userType? | 认证用户 | 分页用户列表 |
| GET | `/user/stats` | 无 | ADMIN | 用户统计（总数/学生/教师/管理员） |
| GET | `/user/{id}` | Path: id | 认证用户 | 单个用户详情（不回显 password） |
| GET | `/user/public/{id}` | Path: id | 认证用户 | 社区公开资料：资料卡 + 真实姓名/完整简介/已发布获奖记录/参赛统计（组队 2.0 起对所有登录用户开放，互看机制已下线） |
| PUT | `/user/profile` | Body: ProfileDTO | 认证用户 | 本人更新社区资料（昵称/头像/性别/学院/专业/班级/简介/技能） |
| PUT | `/user/password` | Body: `{oldPassword, newPassword}` | 认证用户 | 本人修改密码 |
| POST | `/user` | Body: UserDTO | ADMIN | 创建用户（默认密码 123456） |
| PUT | `/user` | Body: UserDTO | ADMIN | 更新用户（部分更新） |
| DELETE | `/user/{id}` | Path: id | ADMIN | 删除用户（存在性检查） |
| POST | `/user/batch-delete` | Body: `[id1, id2, ...]`（裸数组） | ADMIN | 批量删除用户 |
| PUT | `/user/disable/{id}` | Path: id, Body: `{status}` | ADMIN | 启用/禁用用户 |
| POST | `/user/batch-disable` | Body: `{ids, status}` | ADMIN | 批量启用/禁用 |
| PUT | `/user/reset-password/{id}` | Path: id | ADMIN | 重置密码为 123456 |

### 5.3 竞赛管理接口

| 方法 | 路径 | 参数 | 权限 | 说明 |
|------|------|------|------|------|
| GET | `/competition/list` | Query: current, size, keyword?, status?, publisherId? | 认证用户 | 分页竞赛列表（自动附加发布人名、已参赛数、当前学生是否已参赛；学生不可见草稿） |
| GET | `/competition/{id}` | Path: id | 认证用户 | 竞赛详情（草稿仅发布者/管理员可见） |
| POST | `/competition` | Body: CompetitionDTO | TEACHER/ADMIN | 创建竞赛（DTO 无默认值，Service 补默认 status=2；教师创建即发布） |
| PUT | `/competition` | Body: CompetitionDTO（含 id） | TEACHER/ADMIN | 更新竞赛（教师仅限本人发布的；省略字段不重置库值） |
| DELETE | `/competition/{id}` | Path: id | TEACHER/ADMIN | 删除竞赛（级联清理队伍/成员/招募帖/成绩） |
| GET | `/competition/dashboard` | 无 | 认证用户 | 仪表盘统计（按角色返回不同数据） |

### 5.4 参赛队伍接口（报名与队伍合一）

| 方法 | 路径 | 参数 | 权限 | 说明 |
|------|------|------|------|------|
| GET | `/registration/teams` | Query: current, size, competitionId?, status?, teacherId?, keyword? | 认证用户 | 队伍列表：学生=我所在队伍；教师=我指导的（传 teacherId）或我发布竞赛的；管理员=全部；keyword 为队名模糊 |
| GET | `/registration/participants` | Query: competitionId | TEACHER/ADMIN | 竞赛参赛者名单（已通过队伍的全部成员，供成绩录入） |
| GET | `/registration/team/{id}` | Path: id | 队伍成员/指导老师/发布教师/管理员 | 队伍详情（含成员、竞赛、状态） |
| POST | `/registration/team` | Body: TeamDTO（competitionId, teamName, teamSlogan?, teacherId?） | STUDENT | 创建队伍（校验报名窗口与竞赛状态 2/3；单人赛=1人队创建即提交；同一竞赛仅允许一支） |
| PUT | `/registration/team/{id}/submit` | Path: id | 队长 | 提交审核（0/3→1；名单冻结，关联招募帖自动下架） |
| PUT | `/registration/team/{id}/teacher` | Path: id, Body: `{teacherId}`（null=取消） | 队长 | 更换指导老师 |
| DELETE | `/registration/team/{id}` | Path: id | 队长 | 解散队伍（0/1/3 可解散；通知全体成员；下架关联招募帖；删成员行） |
| PUT | `/registration/team/{id}/leave` | Path: id | 成员本人 | 退队（仅 0/3；队长须先转让或解散；通知队长） |
| DELETE | `/registration/team/{id}/member/{studentId}` | Path: id+studentId | 队长 | 移除成员（仅 0/3；通知被移除者） |
| PUT | `/registration/team/{id}/leader/{studentId}` | Path: id+studentId | 队长 | 转让队长（新队长须在队；状态 2 不可转让；通知新队长） |
| PUT | `/registration/team/{id}/audit` | Path: id, Query: status(2/3), auditRemark? | ADMIN | 审核队伍（仅 1 可审；结果通知全体成员；通过时下架关联招募帖） |

### 5.5 招募/社区接口

| 方法 | 路径 | 参数 | 权限 | 说明 |
|------|------|------|------|------|
| POST | `/recruit` | Body: RecruitPostDTO（type, competitionId, title, content?, teamId?, tags?, contact?, deadline?） | STUDENT/ADMIN | 发帖（type=1 必须关联本人任队长的队伍，contact ≤100 字） |
| GET | `/recruit/list` | Query: current, size, competitionId?, type?, status?, keyword? | 认证用户 | 招募广场列表（附作者资料卡；已满员/截止的帖子标记） |
| GET | `/recruit/mine` | 无 | STUDENT/ADMIN | 我的帖子 |
| GET | `/recruit/{id}` | Path: id | 认证用户 | 帖子详情（作者资料卡 + 关联队伍概要） |
| PUT | `/recruit/{id}` | Path: id + Body | 作者/ADMIN | 编辑帖子 |
| DELETE | `/recruit/{id}` | Path: id | 作者/ADMIN | 关闭帖子（作者关闭 status→0；管理员删除） |
| POST | `/community/request` | Body: CommunityRequestDTO（type 2/3, postId, teamId?, message?） | STUDENT/ADMIN | 发起入队申请(type=2，学生向招募帖队长申请入队)/入队邀请(type=3，队长向求组帖作者发出入队邀请)；发前经报名窗口/满员/一人一赛一队预校验 |
| PUT | `/community/request/{id}/handle` | Path: id, Body: `{status}`(1同意/2拒绝) | 接收人 | 处理请求（同意即入队，走容量与唯一性最终闸门） |
| GET | `/community/request/received` | Query: current, size, type?, status? | STUDENT/ADMIN | 收到的请求（待处理优先；过滤存量 type=1） |
| GET | `/community/request/sent` | Query: current, size, type?, status? | STUDENT/ADMIN | 我发出的请求（过滤存量 type=1） |

### 5.6 成绩管理接口

| 方法 | 路径 | 参数 | 权限 | 说明 |
|------|------|------|------|------|
| GET | `/result/list` | Query: current, size, competitionId?, studentId?, awardLevel?, isPublished?, keyword? | 认证用户 | 成绩列表（教师限本人发布的竞赛；学生强制只看已发布） |
| POST | `/result` | Body: ResultDTO | TEACHER/ADMIN | 录入单条成绩（校验学生/队伍/竞赛存在性） |
| POST | `/result/batch` | Body: BatchResultDTO（competitionId, results[]） | TEACHER/ADMIN | 批量录入成绩 |
| PUT | `/result` | Body: ResultDTO | TEACHER/ADMIN | 更新成绩 |
| POST | `/result/publish/{competitionId}` | Path: competitionId | TEACHER/ADMIN | 发布某竞赛所有成绩（逐人发送站内通知 + 更新获奖记录展示） |
| GET | `/result/student/stats` | 无 | STUDENT | 学生成绩统计 |
| GET | `/result/stats` | Query: competitionId | TEACHER/ADMIN | 竞赛成绩统计（均分/最高/最低） |

### 5.7 公告接口（user_id=0 的通知行）

| 方法 | 路径 | 参数 | 权限 | 说明 |
|------|------|------|------|------|
| GET | `/notice/list` | Query: current, size, noticeType?(1通知/2公告), status?(0草稿/1已发布) | 认证用户 | 分页公告列表（置顶优先，兼容旧 sys_notice 返回形状） |
| POST | `/notice` | Body: NoticeDTO | ADMIN | 发布公告（草稿落库 is_read=1） |
| PUT | `/notice` | Body: NoticeDTO（含 id） | ADMIN | 更新公告 |
| DELETE | `/notice/{id}` | Path: id | ADMIN | 删除公告 |
| PUT | `/notice/{id}/top` | Path: id | ADMIN | 置顶/取消置顶 |

### 5.8 站内通知接口

| 方法 | 路径 | 参数 | 权限 | 说明 |
|------|------|------|------|------|
| GET | `/notification/list` | Query: current, size, unreadOnly? | 认证用户 | 我的通知列表 |
| GET | `/notification/announcements` | Query: current, size | 认证用户 | 全员公告列表（置顶优先） |
| GET | `/notification/unread-count` | 无 | 认证用户 | 未读数（前端 30s 轮询驱动铃铛与 favicon 角标） |
| PUT | `/notification/read/{id}` | Path: id | 认证用户 | 标记已读 |
| PUT | `/notification/read-all` | 无 | 认证用户 | 全部已读 |

### 5.9 统计接口

| 方法 | 路径 | 参数 | 权限 | 说明 |
|------|------|------|------|------|
| GET | `/stats/admin` | 无 | ADMIN | 管理员综合统计（用户/竞赛/队伍/奖项分布） |
| GET | `/stats/enrollment-trends` | 无 | ADMIN | 近 6 个月报名（队伍）趋势 |
| GET | `/stats/competition-rankings` | 无 | ADMIN | 竞赛热度 Top 10 |
| GET | `/stats/upcoming` | 无 | 认证用户 | 7 天内即将截止/开始的竞赛提醒 |

### 5.10 文件与导出接口

| 方法 | 路径 | 参数 | 权限 | 说明 |
|------|------|------|------|------|
| POST | `/file/upload` | FormData: file | 认证用户 | 上传文件（最大 10MB，扩展名白名单） |
| GET | `/public/{filename}` | Path: filename | 公开 | 访问 `backend/public/` 静态资源（中文文件名安全） |
| GET | `/export/competitions` | Query: status?, keyword? | TEACHER/ADMIN | 导出竞赛 Excel（教师仅限本人发布的） |
| GET | `/export/teams` | Query: competitionId?, status? | TEACHER/ADMIN | 导出参赛队伍 Excel |
| GET | `/export/results` | Query: competitionId?, awardLevel?, isPublished? | TEACHER/ADMIN | 导出成绩 Excel |
| GET | `/export/student-transcript` | 无 | 认证用户 | 导出个人成绩单 Excel |

---

## 六、前端架构详解

### 6.1 项目结构

```
frontend/src/
├── main.tsx                       -- 入口：StrictMode + BrowserRouter + 打包字体引入
├── App.tsx                        -- 路由定义 + GlobalErrorBoundary + 全局弹窗容器
├── index.css                      -- 全局样式（~2900 行，玻璃态设计系统）
├── api/
│   ├── request.ts                 -- Axios 实例 + JWT 拦截器
│   ├── types.ts                   -- 所有 TypeScript 接口定义
│   ├── index.ts                   -- 统一导出
│   └── modules/                   -- 10 个模块：
│       ├── auth.ts                -- 认证 API
│       ├── user.ts                -- 用户 + 社区资料 API
│       ├── competition.ts         -- 竞赛 API
│       ├── registration.ts        -- 参赛队伍 API（建队/提交/审核/成员流动）
│       ├── recruit.ts             -- 招募/求组帖 API
│       ├── community.ts           -- 社区请求（申请/邀请）API
│       ├── result.ts              -- 成绩 API
│       ├── notification.ts        -- 站内通知 API
│       ├── system.ts              -- 公告+统计+文件上传 API
│       └── export.ts              -- 导出 API
├── config/
│   ├── env.ts                     -- 环境变量封装
│   ├── constants.ts               -- 常量（存储 key、分页大小、动画配置等）
│   └── tutorials.ts               -- 全端页面使用教程分步文案
├── store/
│   ├── authStore.ts               -- Zustand 认证状态管理
│   └── notificationStore.ts       -- 未读数全局态（30s 轮询，驱动铃铛+favicon 角标+标题）
├── hooks/
│   ├── usePagination.ts           -- 分页状态管理
│   ├── useDebounce.ts             -- 值防抖（默认 300ms）
│   ├── useIsMobile.ts             -- 响应式断点检测（768px）
│   ├── useShake.ts                -- 抖动动画触发器
│   ├── useFetch.ts                -- 通用异步数据获取
│   └── useAnimations.ts           -- 玻璃态光效鼠标跟随
├── motion/
│   └── variants.ts                -- Motion 动画变体定义
├── utils/
│   ├── format.ts                  -- formatDate/formatDateTime, resolveCoverUrl, formatFileSize 等
│   ├── date.ts                    -- countdownText（倒计时文本）
│   ├── export.ts                  -- downloadFile（Axios blob 下载）
│   ├── notification.ts            -- 通知 refType → 页面跳转映射
│   └── statusBadge.ts             -- 状态码到徽章样式映射
├── components/                    -- 34 个通用组件（+4 个弹窗配套 utils）
└── pages/                         -- 26 个页面组件
```

### 6.2 路由与权限控制

路由定义在 `App.tsx`，采用嵌套路由结构。所有需要认证的页面包裹在 `<AuthGuard>` 中，布局由 `<DesktopLayout>` 提供。页面级崩溃由 `PageErrorBoundary`（`key={pathname}` 包住 Outlet）兜底，单页错误不再白屏。

```
/login                              -- 登录页（公开，登录成功后回跳来源页）
├── AuthGuard                       -- 认证守卫
│   └── DashboardLayout (DesktopLayout + PageErrorBoundary + Outlet)
│       ├── /profile                -- 个人中心（所有角色）
│       ├── /admin/*                -- 管理员路由（allowedRoles={['admin']}）
│       │   ├── /admin/dashboard
│       │   ├── /admin/competitions           -- 竞赛管理（内层 tab：竞赛|队伍|成绩）
│       │   ├── /admin/competitions/:id       -- 竞赛详情（AdminCompetitionDetail）
│       │   ├── /admin/competitions/:id/edit  -- 编辑竞赛（复用 TeacherCompetitionCreate）
│       │   ├── /admin/competitions/team/:id  -- 队伍详情（TeamDetail，三端共用）
│       │   ├── /admin/users
│       │   ├── /admin/stats
│       │   ├── /admin/notices
│       │   ├── /admin/teams /admin/grades    -- 旧路由 → 重定向到 /admin/competitions?tab=…
│       ├── /teacher/*              -- 教师路由（allowedRoles={['teacher']}）
│       │   ├── /teacher/dashboard
│       │   ├── /teacher/competitions
│       │   ├── /teacher/competitions/create | :id | :id/edit
│       │   ├── /teacher/teams  /teacher/teams/detail/:id
│       │   └── /teacher/grades
│       ├── /student/*              -- 学生路由（allowedRoles={['student']}，/student/u/:id 三角色可用）
│       │   ├── /student/dashboard
│       │   ├── /student/competitions  |  :id
│       │   ├── /student/teams               -- 组队中心（内层 tab：我的队伍|招募广场|收到的申请/邀请|发出的请求）
│       │   ├── /student/teams/detail/:id
│       │   ├── /student/recruit             -- 旧路由 → /student/teams?tab=recruit
│       │   ├── /student/history             -- 参赛历史（内层 tab 含成绩单；/student/grades 旧路由重定向至此）
│       │   ├── /student/notifications       -- 消息中心
│       │   └── /student/u/:id               -- 社区公开主页（UserProfilePage）
│       └── * → 重定向到 /login
```

`AuthGuard` 组件的工作流程：首先检查 `isAuthenticated`，未登录则重定向到 `/login`（携带 `state.from` 供登录回跳）；然后检查 `allowedRoles`，如果用户角色不在允许列表中，则重定向到用户角色对应的仪表盘页面（如 admin → `/admin/dashboard`）。

### 6.3 状态管理

项目使用 Zustand 5 管理两个全局 store：

`authStore`：`token`、`user`、`isAuthenticated`；`login(username, password, role)` 调用后端 API 获取令牌并持久化到 localStorage（key 为 `scms_token` 和 `scms_user`）；`logout()` 清除状态；`loadUser()` 从服务器刷新；`setUser()` 直接设置。

`notificationStore`：未读数全局态，全角色 30s 轮询 `/notification/unread-count`，驱动 `NotificationBell` 角标、`UnreadFavicon`（canvas 重绘 favicon + 红色数字角标，99+ 封顶）与标签页标题 `页面名 (n) · 赛友 TeamUp`；点击已读后即时刷新。

其他页面级状态（列表数据、分页、筛选条件、表单草稿）由各页面组件内部管理。

### 6.4 HTTP 请求层

`request.ts` 创建了 Axios 实例，baseURL 取自环境变量 `VITE_API_BASE_URL`（默认 `http://localhost:8080/api`），超时时间 `VITE_API_TIMEOUT`（默认 15000ms）。

请求拦截器：从 localStorage 读取 `scms_token`，自动附加到请求头 `Authorization: Bearer <token>`。

响应拦截器：检查响应体 `data.code`，等于 200 则返回 `data.data`（解包），否则 reject 整个 data。对于非登录接口返回 HTTP 401 的情况，清除 localStorage 并重定向到 `/login`，使用 `isRedirecting` 标志防止并发重复重定向。

Vite 开发服务器配置了代理：`/api` → `http://localhost:8080`（`/api/ws` 条目为 WebSocket 方案下线后的历史遗留配置，无害；站内消息为 REST 轮询）。

### 6.5 全局弹窗系统

项目实现了 4 个全局弹窗组件，均挂载在 `App.tsx` 根级别，通过 `window.__showXxx` 全局函数引用实现无 props 调用。它们均**移除了 exit 动画（关闭即卸载）**——此前保留动画的退出依赖在快速开合时产生残留弹窗堆叠/双表单串扰（全链路测试 P2 缺陷）：

**Toast（提示通知）**：`toast.success("操作成功")` / `toast.error(...)` / `toast.warning(...)` / `toast.info(...)`。从右侧滑入，自动消失，4 种类型不同颜色。

**ConfirmDialog（确认对话框）**：`const ok = await confirmDialog({ message, variant: "danger", confirmText })`。返回 `Promise<boolean>`。支持 danger/warning/info 三种变体。

**PromptDialog（输入对话框）**：`const value = await promptDialog({ message, defaultValue, placeholder })`。返回 `Promise<string | null>`。Enter 确认，Escape 取消。

**EditGradeDialog（成绩编辑对话框）**：`const result = await editGradeDialog({ competitionId, currentScore, ... })`。返回 `Promise<EditGradeResult | null>`。包含分数（0-100）、排名、奖项等级、评语。Ctrl+Enter 快速确认。

页面级弹窗（GlassModal 容器 + EntryModal 创建/加入队伍、RecruitPostModal 发帖、RecruitDetailModal 帖详情、RejectReasonModal 拒绝原因等）不挂载根级，随页面组件使用。四个全局弹窗的调用函数分别定义在 `components/` 下的 `toastUtils/confirmDialogUtils/promptDialogUtils/editGradeDialogUtils.ts`。

### 6.6 分页模式

自定义 `usePagination` Hook 管理分页状态：

```typescript
const pagination = usePagination()
// pagination.current, pagination.pageSize, pagination.total, pagination.totalPages
// pagination.setCurrent(n), pagination.setPageSize(n)
// pagination.goToPrev(), pagination.goToNext()
// pagination.hasPrev, pagination.hasNext
// pagination.resetPage()  -- 回到第 1 页
```

典型使用流程：页面定义 `fetchData` 函数调用 API 获取数据，传入 `current` 和 `pageSize`；使用 `useEffect` 监听 `current` 和 `pageSize` 变化触发 `fetchData`；切换筛选条件时调用 `pagination.resetPage()` 回到第一页。

**注意：** `usePagination` 的 `defaultPageSize` 默认为 10，而 `constants.ts` 中 `PAGE_SIZE.DEFAULT` 定义为 20。两者并不关联——Hook 内部硬编码了默认值 10，如需改变需在调用时显式传入 `usePagination({ defaultPageSize: 20 })`。

### 6.7 文件上传流程

前端通过 `fileApi.upload(file)` 上传文件到 `POST /api/file/upload`（multipart/form-data），后端返回 `{url, fileName, fileSize, fileType}`。前端将返回的 `url` 存入表单字段（如竞赛的 `coverImage`），或使用 `resolveCoverUrl()` 解析为完整 URL 用于显示。

`resolveCoverUrl(url)` 的处理逻辑：如果 url 已经是完整 URL（以 `http` 开头），直接返回；如果是相对路径（如 `/uploads/xxx.jpg`），拼接 `env.apiBaseUrl`（注意保留 `/api` 前缀，因为 Spring Boot 的 context-path 是 `/api`）作为完整 URL。

### 6.8 数据获取模式

页面组件通常遵循以下模式：

```typescript
// 1. 定义状态
const [data, setData] = useState([])
const [loading, setLoading] = useState(true)
const pagination = usePagination()

// 2. 定义获取数据函数
const fetchData = useCallback(async () => {
  setLoading(true)
  try {
    const res = await someApi.list({
      current: pagination.current,
      size: pagination.pageSize,
      // 其他筛选参数
    })
    setData(res.records)
    pagination.setTotal(res.total)
  } catch (err) {
    toast.error("获取数据失败")
    console.error(err)
  } finally {
    setLoading(false)
  }
}, [pagination.current, pagination.pageSize])

// 3. 监听分页变化
useEffect(() => { fetchData() }, [pagination.current, pagination.pageSize])

// 4. 操作后刷新
const handleDelete = async (id: number) => {
  await someApi.delete(id)
  toast.success("删除成功")
  fetchData()  // 刷新列表
}
```

### 6.9 状态徽章与工具函数

`src/utils/statusBadge.ts` 提供 4 套状态徽章映射，每套返回 `{cls, label}` 对象：

`competitionStatusBadge`（管理员/教师视角）：竞赛状态 0/2/3/4 → 草稿/已发布/进行中/已结束（1、5 仅存量历史数据）。

`studentCompetitionStatusBadge`（学生视角）：同样的竞赛状态值，标签不同——status=2 显示"报名中"而非"已发布"，status=4 降权显示。

`teamStatusBadge`（参赛队伍）：0/1/2/3 → 组建中/待审核/已通过/已拒绝。

`registrationStatusBadge`：旧报名状态映射（0-2），报名表已删除，仅兜底保留。

`getStatusBadge(status, type)` 函数根据 type 参数（`'competition'` | `'student-competition'` | `'registration'` | `'team'`）选择对应的映射表。

其他工具函数：`src/utils/format.ts` 包含 `formatDate`、`formatDateTime`、`resolveCoverUrl`（保留 /api 前缀）、`formatFileSize`；`src/utils/date.ts` 的 `countdownText`（倒计时文本）；`src/utils/export.ts` 的 `downloadFile`（Axios blob 下载）；`src/utils/notification.ts` 的 `notificationTarget(n)`（按 refType + 标题关键词映射通知的落地路由，全部指向学生端页面）。

### 6.10 错误边界与页面体验

`GlobalErrorBoundary`（App.tsx）：顶层错误边界，捕获所有渲染异常（如 `.map()` 对非数组调用），显示错误页面和刷新按钮，防止白屏。

`PageErrorBoundary`（components/，App.tsx 内以 `key={pathname}` 包住 Outlet）：单页崩溃只显示该页错误卡片（重试 + 返回概览），侧边栏/顶栏保留。

`CompetitionDetailErrorBoundary`（StudentCompetitionDetail.tsx 内）：竞赛详情页的页内边界。

其他全局体验：`PageTransition` 路由转场并在切换后对滚动容器回顶；每页首次访问自动弹出 `TutorialOverlay` 使用教程（localStorage 记录已看），右上角 ? 可随时重开；加载中统一 `<PageSkeleton />`、空态 `<EmptyState />`、计数 `<ListMeta />`。

---

## 七、前端页面详解

### 7.1 登录页 (LoginPage)

分屏布局。左侧面板：全屏奖杯图片 + 鼠标视差效果（mouse-move CSS var tracking）、暗色渐变叠加、装饰性对角线、斜切标题文字（per-character clip-path）。右侧面板：玻璃态表单卡片 + 角色切换器（admin/teacher/student 三选一，登录时传 role 校验）+ 用户名密码输入框 + 密码显示切换 + 记住账号（真正预填用户名）+ 登录按钮（loading 状态）+ 错误时抖动动画。登录成功后优先回跳 AuthGuard 记录的来源页（含查询参数），否则跳转对应仪表盘。

### 7.2 管理员页面

**AdminDashboard（仪表盘）**：Bento 网格布局，含竞赛状态分布柱状图、待审核队伍列表（status=1）、用户统计卡片、队伍数量、即将到期提醒、快捷操作入口。

**AdminCompetitions（竞赛管理）**：内层三 tab——竞赛列表（状态筛选 chips + 防抖搜索 + 分页表 + 通过/驳回入口 + 编辑/详情/删除 + 导出）、队伍（嵌入 AdminTeams 组件，队名搜索 + 审核弹窗）、成绩（嵌入 AdminGrades 组件）。

**AdminCompetitionDetail / TeacherCompetitionCreate（编辑复用）/ TeamDetail**：竞赛详情子页与队伍详情子页（TeamDetail 三端共用，含成员管理内联按钮、审核/驳回意见展示）。

**AdminUsers（用户管理）**：指标卡片（总数/学生/教师）+ DigitRoller 数字动画 + 角色筛选 + 防抖搜索 + 批量操作（全选、批量删除、批量禁用/启用）+ 数据表 + 创建/编辑用户弹窗（含头像上传）+ 切换状态 + 重置密码 + 导出 Excel。

**AdminGrades（成绩管理，管理员 tab 内）**：竞赛选择下拉框 + 数据表 + 编辑成绩（EditGradeDialog）+ 发布所有成绩 + 批量选择 + 导出 Excel。

**AdminNotices（公告管理）**：TipTap 富文本编辑器 + 筛选（全部/通知/公告/已发布/草稿）+ 数据表（置顶指示器、标题、类型徽章、状态、发布时间 formatDateTime）+ 操作（编辑、置顶/取消、发布/撤回、删除）。

**AdminStats（数据统计）**：日期范围筛选（默认近 6 个月）+ 指标卡片 + 报名趋势图（柱状 + 点可视化，无图表库纯 SVG）+ 竞赛排行（进度条）+ 奖项分布柱状图 + CSV 导出（客户端生成，带 BOM 处理中文编码）。

### 7.3 教师页面

**TeacherDashboard（仪表盘）**：Bento 网格，"赛事概览"（我的竞赛数量）、"最近竞赛"时间线、即将到期提醒、快捷操作。数据范围限定自己发布的竞赛（`publisherId: user.id`）。

**TeacherCompetitions（我的竞赛）**：状态筛选 + 消费顶栏搜索的 `?search=` 参数 + 页内搜索框 + 分页数据表。操作：查看详情 / 编辑 / 删除；发布竞赛入口。

**TeacherCompetitionCreate（发布/编辑竞赛）**：双用途页面（`useParams().id` 判断新建或编辑，管理员编辑复用本页面）。表单字段：竞赛名称、封面图上传、主办单位、描述、规则、自定义奖项管理（动态添加/删除）、时间安排（4 个日期选择器，时间顺序校验）、地点、最大队员数。附件区域仅编辑模式可见。**创建即发布（status=2）**；编辑按原状态保存（0/1→治愈为 2，3/4 不回退），按钮文案「发布竞赛/保存并发布/保存修改」。创建模式支持表单草稿暂存 localStorage，刷新恢复。`beforeunload` 警告未保存更改。

**TeacherTeams（指导队伍）**：内层 tab「竞赛团队 | 指导团队」+ 竞赛筛选 + 队名搜索 + 分页表格，行点击进 TeamDetail 子页（只读视角）。

**TeacherGrades（成绩管理）**：竞赛选择器 + 统计卡片（均分/最高/最低）+ 成绩分布直方图（SVG）+ 成绩表（参赛者名单来自 `/registration/participants`）+ 编辑成绩（EditGradeDialog）+ 批量录入弹窗（支持 CSV 导入）+ 发布成绩。

### 7.4 学生页面

**StudentDashboard（仪表盘）**：Bento 网格，"竞赛总览"（可报名 vs 已参赛数量）、已发布竞赛列表、即将到期提醒、快捷操作。

**StudentCompetitions（竞赛浏览）**：防抖搜索 + 状态筛选 chips + 4 列卡片网格。每张卡片：封面图、名称、状态徽章、组织者、描述截断、元数据、CountdownTimer、"查看详情"。

**StudentCompetitionDetail（竞赛详情）**：封面 + 标题头、信息网格、简介、规则、奖项设置（金银铜色背景）、附件下载、我的参赛状态与队伍入口。

**StudentTeams（组队中心）**：内层四 tab——我的队伍（建队/提交/解散 + 队伍卡）、招募广场（嵌入 StudentRecruitSquare：招募/求组帖列表、发帖弹窗含联系方式、申请/邀请入口）、收到的申请、收到的邀请（另有发出的请求列表，URL `?tab=` 定位）；EntryModal 创建/加入队伍；行点击进 TeamDetail。

**TeamDetail（队伍详情，三端共用）**：队伍信息、成员列表（队长/老师行内联退队/移除/转让按钮，仅组建中/被驳回状态显示）、指导老师指定、提交审核入口、解散入口。

**StudentHistory（参赛历史）**：内层 tab「参赛历史 | 成绩单」。历史：指标卡片 + 报名/成绩合并时间线，按最近活动排序，生命周期阶段进度可视化。成绩单：已发布成绩卡 + 导出。

**NotificationCenter（消息中心）**：通知列表（未读优先样式）、全部已读、公告展示、点击按 `notificationTarget` 跳转对应页面。

**StudentGrades（我的成绩）**：作为 StudentHistory 成绩单 tab 的实现组件，仅显示已发布成绩（`isPublished: 1`）。

### 7.5 个人中心与其他共享页

**ProfilePage（个人中心）**：用户信息头部（头像上传覆盖层、真实姓名、角色标签、用户名）+ 编辑表单（昵称/性别/学院/专业/班级/简介/技能标签，走 `PUT /user/profile`）+ 密码修改（旧密码 + 新密码 ≥6 位 + 确认；成功后 2 秒跳转登录页）。

**UserProfilePage（社区公开主页）**：任何登录用户查看他人资料——资料卡（头像/昵称/院系/专业/班级/技能/简介）+ 完整信息 + 已发布获奖记录 + 参赛统计（组队 2.0 起资料互看下线，全部直接可见）。

---

## 八、组件库参考

### 8.1 布局组件

**DesktopLayout**：主布局壳，同时处理桌面端和移动端。桌面端：68px 图标胶囊侧边栏**悬浮横向展开至 208px** 显示各 tab 名称（圆角 34px、毛玻璃、specular 高光伪元素；展开事件在 aside 层，定时器用 ref 管理防闪烁；活动项高亮为按钮自身 CSS 背景而非 layoutId 共享元素）+ 顶部栏（页面标题即时切换、全局搜索、帮助按钮、通知铃铛、角色端徽章）+ 底部个人中心/退出登录。移动端：shell 结构（顶部菜单 + 标题 + 铃铛）、可滚动内容区、底部 Tab 栏（最多 5 项按角色配置）、滑入式抽屉，支持水平滑动切换 Tab（>50px、<600ms、触觉反馈）。角色导航配置在 `navItemsByRole` / `mobileTabItemsByRole`；document.title 随页面名与未读数更新。

**AuthGuard**：路由守卫，检查认证状态和角色权限，未认证时记录来源路径供登录回跳。

**PageTransition**：路由转场动画，基于 `location.pathname` 的 `AnimatePresence` + spring 动画，切换后对桌面/移动滚动容器回顶。

**PageTabs**：页面内层 tab 条组件（多 tab 页面共用）。

### 8.2 弹窗组件

**GlassModal**：可复用的玻璃态模态框容器。Props：open, onClose, title?, maxWidth?, children。spring 入场、关闭即卸载（无 exit 动画）。

**EntryModal**：学生创建/加入队伍弹窗（建队表单 + 可报名竞赛过滤 + 加入提示）。

**RecruitPostModal / RecruitDetailModal**：发帖弹窗（表单含联系方式 contact 字段、队伍必选）与帖子详情弹窗（资料卡、联系方式绿色展示行、申请/邀请按钮）。

**RejectReasonModal**：拒绝原因输入弹窗（Textarea + 红色确认按钮）。

**Toast / ConfirmDialog / PromptDialog / EditGradeDialog**：四个根级全局弹窗，见 §6.5。

### 8.3 显示组件

**Pagination**：分页控件，页码 + 省略号 + 上下页 + 每页条数选择（10/20/50）+ 总条数。

**EmptyState**：空数据占位，居中图标 + 文字。

**ListMeta**：列表计数显示"共 X 条"。

**Skeleton / PageSkeleton**：加载占位。SkeletonLine/Circle/Card/List 基础骨架，LoadingBar 顶部加载条，DashboardSkeleton 仪表盘骨架，TableSkeleton 表格骨架。

**NotificationBell**：顶栏铃铛 + 未读角标（消费 notificationStore，不自行轮询）。

**UnreadFavicon**：canvas 动态重绘 favicon（🤝 底 + 红色数字角标，99+ 封顶）。

**UserCardMini**：嵌入式用户资料小卡（招募帖作者、请求收发双方等场景）。

**CompetitionInfoPanel / QuickActions / UpcomingReminders / RoleHero / StatusBar / NavBar**：竞赛信息面板、快捷操作组、即将到期提醒卡、概览页角色标识卡（角色名按端着色 + 时段问候语的单行玻璃卡）、移动端状态栏与导航条辅助组件。

### 8.4 动画组件

**DigitRoller**：数字滚动动画，每位数字独立垂直滚动，交错延迟。

**AnimatedCounter**：平滑数字计数器，使用 Motion 的 useMotionValue。

**ConfettiEffect**：Canvas 粒子庆祝效果，150 粒子 + 15 色 + 重力物理。

**CountdownTimer**：实时倒计时，每秒更新，天/时/分/秒 TimeBlock，紧急模式（<24h 琥珀色）。

**SuccessCheck**：动画 SVG 对勾 + SuccessOverlay 全屏覆盖。

**FailureEffect**：抖动动画 + 错误卡片覆盖 + 自动消失倒计时进度条。

**TutorialOverlay**：暗色蒙层 + 毛玻璃分步教程卡片（步骤序号、进度点、上一步/下一步/知道了），支持 ESC、方向键、点蒙层关闭；文案数据源 `config/tutorials.ts`。

---

## 九、样式系统

### 9.1 设计语言

项目采用 iOS 26 Liquid Glass（液态玻璃）设计语言，核心视觉特征包括：半透明毛玻璃表面（`backdrop-filter: blur(24px) saturate(1.8)`）、多层阴影 + 内发光高光、鼠标跟随光效（shimmer）、精致的边框和圆角（18px 卡片圆角）。全站字体对标 iOS：Apple 设备走原生 SF/苹方，其他平台走打包的 Inter Variable + Noto Sans SC（按 unicode-range 分片按需加载）。

### 9.2 CSS 变量体系

所有样式通过 CSS 自定义属性（变量）管理，定义在 `index.css` 的 `:root` 中：

颜色系统：`--accent`（#007AFF 蓝色主色调）、`--success`（#34C759 绿色）、`--warning`（#FF9500 橙色）、`--danger`（#FF3B30 红色）、灰度系列、文字层级（`--text-primary`、`--text-secondary`、`--text-tertiary`）。

玻璃表面：`--glass-bg`（rgba(255,255,255,0.42)）、`--glass-border`、`--glass-highlight`、`--glass-blur`、多层 `--glass-shadow` 含 inset 高光。

布局：`--sidebar-width`、`--header-height`；桌面侧边栏本体 68px、悬浮展开 208px（`.desktop-sidebar.expanded`）。

缓动函数：`--ease-spring`、`--ease-snap`、`--ease-smooth`。

### 9.3 关键样式类

`.glass-card`：基础玻璃卡片，18px 圆角，白色 0.85 透明度背景，cursor-tracked shimmer 光效（通过 `--mouse-x`/`--mouse-y` CSS 变量 + `::before` 折射渐变 + `::after` 镜面反射伪元素）。

`.metric-card`：指标卡片，40px 模糊半径的毛玻璃效果。

`.bento-grid`：4 列不对称网格布局，含 `.bento-lg`、`.bento-wide`、`.bento-tall` 尺寸变体。

`.data-table`：数据表格，hover 行高亮，大写表头。

`.glass-badge`：徽章，纯文本样式无彩色背景。

`.btn`：按钮系列——primary、success、danger、warning、ghost、filled-primary 变体，hover translateY 微上浮，active scale 微缩小。

`.icon-btn`：图标按钮（透明背景、无边框、仅图标）。

`.chip`：筛选 chips，玻璃态药丸按钮，`.active` 使用深色玻璃（rgba(28,28,30,0.78)）。

`.glass-search`：搜索输入框，玻璃态 + 图标 + focus accent 边框。

### 9.4 响应式断点

1024px（平板）：侧边栏收缩，网格减少列数。768px（手机）：切换到移动布局（底部 Tab 栏 + 抽屉导航），卡片单列。374px（小屏手机）：进一步压缩间距。

### 9.5 Tailwind CSS 4 配置

项目使用 Tailwind CSS v4 的 CSS-first 模式，通过 `@import "tailwindcss"` 引入，没有 `tailwind.config.js` 文件。所有自定义设计令牌通过 CSS 变量定义，Tailwind 工具类与自定义 CSS 混合使用。

界面取舍原则（少即是多、状态降权、按钮一致性等）见 `docs/UI设计规范.md`。

---

## 十、常见开发任务

### 10.1 添加新页面

1. 在 `frontend/src/pages/` 创建页面组件文件（PascalCase 命名，如 `MyNewPage.tsx`）
2. 在 `frontend/src/App.tsx` 添加 import 和 `<Route>` 定义，注意放在对应角色的路由组中
3. 如果需要侧边栏导航入口，在 `frontend/src/components/DesktopLayout.tsx` 的 `navItemsByRole` 和 `mobileTabItemsByRole` 中添加配置
4. 如果需要新页面的使用教程，在 `frontend/src/config/tutorials.ts` 中添加分步文案
5. 如果页面需要新的 API 调用，在 `frontend/src/api/modules/` 创建或扩展 API 模块

### 10.2 添加新 API 端点

后端：在对应 Controller 类中添加方法（标注 `@GetMapping`/`@PostMapping` 等 + `@PreAuthorize` 权限注解 + `@Operation` Swagger 注解），在 Service 类中实现业务逻辑，如需新 DTO 则在 `dto/` 目录创建。

前端：在 `src/api/modules/` 对应模块文件中添加方法，在 `src/api/types.ts` 添加类型定义，在页面中调用。

### 10.3 添加新的全局弹窗

1. 创建弹窗组件（如 `MyDialog.tsx`）和工具文件（如 `myDialogUtils.ts`）
2. 组件内部管理状态，通过全局函数引用暴露调用接口
3. 在 `App.tsx` 挂载容器组件
4. 在工具文件中定义调用函数，设置/读取全局函数引用

### 10.4 修改数据库结构

这是受限操作（硬性规定见 AGENT.md）。如果确实需要变更，流程如下：

1. 明确列出需要变更的内容（新增表/字段、修改类型等）
2. 告知用户当前规定并说明原因
3. 等待用户明确确认
4. 执行变更：修改 `backend/sql/init.sql`（新库路径）+ 新增 `backend/sql/upgrade-teamupN.sql` 增量脚本（存量库路径，含数据回填与脏数据检查）
5. 同步更新 AGENT.md、docs/ER-DIAGRAM.md 与本文档的表结构章节
6. 对存量库执行增量脚本（`docker exec -i mysql-scms mysql -uroot -proot scms < backend/sql/upgrade-*.sql`）；或重建库（DROP DATABASE + 重新导入 init.sql，注意会丢运行数据）
7. 同步更新回归脚本（smoke/boundary/member_flow/gen_demo_data）与演示数据生成器

### 10.5 调试后端

后端启动时配置了 SQL 日志输出（`log-impl: org.apache.ibatis.logging.stdout.StdOutImpl`），所有 SQL 语句会打印到控制台。日志文件保存在 `backend/app.log`（按天滚动）。改 Java 代码后需重启 `mvn spring-boot:run` 进程（JAR 模式需重新打包）。

### 10.6 前端热更新

Vite 开发服务器支持 HMR（热模块替换），修改 `.tsx`/`.ts`/`.css` 文件后浏览器会自动刷新，无需手动重启。但如果修改了 `vite.config.ts` 或环境变量文件（`.env*`），需要重启开发服务器。

### 10.7 运行回归

后端与 mysql-scms 运行时：`python backend/smoke_full.py`（冒烟）、`python backend/boundary_full.py`（边界容错 263 断言）、`python backend/smoke_member_flow.py`（成员流动专项）；三者均自清理临时数据、校验种子完整性，可重复执行。演示数据：`python backend/gen_demo_data.py`。前端 e2e：`cd frontend && npx playwright test`（需 3000+8080 同时在跑）。

---

## 十一、编码规范

### 11.1 前端规范

组件文件使用 PascalCase 命名（如 `AdminDashboard.tsx`），工具函数使用 camelCase（如 `formatDate`）。

类型定义统一放在 `src/api/types.ts`。

样式使用 Tailwind CSS 工具类 + CSS 变量，不硬编码颜色值（使用 `var(--accent)` 等变量）。

所有 catch 块必须同时包含 `toast.error(...)` （用户提示）和 `console.error(...)` （调试日志），不允许空 catch 块。

加载中统一使用 `<PageSkeleton />`，空数据统一使用 `<EmptyState />`，列表计数统一使用 `<ListMeta />`。

图标按钮使用 `.icon-btn` CSS 类（透明背景、无边框、仅图标），不手写内联样式。

共享工具函数（`formatDate`/`formatDateTime`、`resolveCoverUrl`、`formatFileSize`）在 `src/utils/format.ts`，状态徽章映射在 `src/utils/statusBadge.ts`，通知跳转在 `src/utils/notification.ts`，不要在页面中重复定义。

### 11.2 后端规范

控制器使用 `@RestController` + `@RequestMapping("/路径")` + `@Operation`/`@Tag` Swagger 注解。

服务层使用 `@Service` + 构造器注入（`@RequiredArgsConstructor`，不用 `@Autowired` 字段注入）。

实体类使用 `@Data` + `@TableName`（Lombok）。

权限控制使用 `@PreAuthorize("hasRole('ADMIN')")` 或 `hasAnyRole('TEACHER', 'ADMIN')`；数据范围（教师限本人发布、学生只看已发布）在服务层二次收紧。

password 字段使用 `@JsonProperty(access = WRITE_ONLY)` 防止序列化外发（User 实体已应用）。

JSON 字符串字段（awards/attachments）使用 `@JsonIgnore` + `@JsonProperty` 自定义 getter 返回解析后的 List。

**DTO 不带字段初始值**：`maxMembers = 1`/`status = 2` 这类默认值会让 PUT 省略字段时被 Jackson 静默填回并覆盖库值（真实踩坑），默认值一律在 Service 创建路径补。

入参长度校验与库表列宽对齐（队名 ≤50、口号 ≤200、联系方式 ≤100 等），防止超长直接撞 DB 约束变 500。

枚举状态字段使用数字常量，含义在注释和常量类中定义。

### 11.3 命名规范

| 层级 | 规范 | 示例 |
|------|------|------|
| 数据库表名 | 下划线 | `competition_result` |
| 数据库字段 | 下划线 | `create_time` |
| Java 实体字段 | 驼峰 | `createTime` |
| Controller 类 | XxxController | `CompetitionController` |
| Service 类 | XxxService | `CompetitionService` |
| Mapper 接口 | XxxMapper | `CompetitionMapper` |
| DTO 类 | XxxDTO | `CompetitionDTO` |
| 前端组件 | PascalCase.tsx | `AdminDashboard.tsx` |
| 前端工具函数 | camelCase.ts | `format.ts` |
| API 模块 | camelCase.ts | `competition.ts` |
| 路由路径 | 全小写 + 斜杠 | `/admin/competitions` |

---

## 十二、构建与部署

### 12.1 后端打包

```bash
cd backend
C:\apache-maven\apache-maven-3.9.16\bin\mvn.cmd clean package -DskipTests
```

生成的 JAR 文件在 `backend/target/scms-backend-1.0.0.jar`。

启动：`java -jar target/scms-backend-1.0.0.jar`（**工作目录必须是 backend/**，否则 uploads/public/日志路径全部落错位置）。

### 12.2 前端打包

```bash
cd frontend
npm run build    # tsc -b && vite build
```

生成的静态文件在 `frontend/dist/` 目录。构建前必须把 `.env.production` 的 `VITE_API_BASE_URL` 从占位域名改为实际地址。

### 12.3 Nginx 部署

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 前端静态文件
    location / {
        root /path/to/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # 后端 API 反向代理
    location /api/ {
        proxy_pass http://localhost:8080/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # 上传文件访问
    location /uploads/ {
        alias /path/to/uploads/;
    }
}
```

### 12.4 生产环境注意事项

后端 `application.yml` 中数据库密码与 `jwt.secret` 为硬编码开发默认值，生产环境必须更换；SQL 日志（`log-impl: StdOutImpl`）生产应移除；文件上传路径 `./uploads/` 应改为绝对路径并配置持久化存储；CORS 的 `allowedOriginPatterns("*")` 应收敛为实际前端域名。

---

## 十三、已知问题与踩坑记录

### 13.1 Windows 中文文件名问题

Spring Boot 内置的 `ResourceHttpRequestHandler` 在 Windows 上处理含中文文件名的静态资源时会抛 500 异常。已通过自定义 `StaticFileController` 解决，该控制器使用 `URLDecoder` 解码文件名。

### 13.2 resolveCoverUrl 必须保留 /api 前缀

`resolveCoverUrl` 函数拼接 URL 时必须保留 `env.apiBaseUrl` 中的 `/api`（Spring Boot context-path），不能将其替换或剥掉，否则 `/uploads` 和 `/public` 静态资源会 404。

### 13.3 StaticFileController 的 APP_ROOT 解析

Spring Boot 打包为 nested JAR 后，URL 格式为 `jar:nested:/path/app.jar/!BOOT-INF/classes/`，需要手动 strip 前缀和末尾斜杠。JAR 位于 `target/` 目录而 `public/` 在项目根目录，需要从 JAR 父目录的父目录查找。

### 13.4 MyMetaObjectHandler 必须填充所有字段

如果 `@TableField(fill = FieldFill.INSERT)` 标注的字段（createTime/updateTime/joinTime）没有被 MetaObjectHandler 填充，MyBatis-Plus 会强制将 null 写入 NOT NULL 列，导致 `SQLIntegrityConstraintViolation`。

### 13.5 GlobalExceptionHandler 的 HTTP 状态码

原来所有异常都返回 HTTP 200，前端只能靠 body.code 判断。已两轮修复：先补 400/403/500，再补全残缺 JSON、缺参、类型不匹配、405、上传 400/413 等 4xx 语义（见 §4.4）。

### 13.6 DesktopLayout 角色检测

`/profile` 路径没有角色前缀，`getRoleFromPath` 会 fallback 到 student。已修复为使用 `useAuthStore` 的用户角色作为主要判断，URL 推断仅作兜底。

### 13.7 Competition 的 JSON 字段序列化

`awards` 和 `attachments` 是 JSON 字符串字段，如果后端没有正确处理，前端会收到字符串而非数组，调用 `.map()` 时会导致白屏崩溃。已通过 `@JsonIgnore` + `@JsonProperty` 自定义 getter 解决。竞赛详情页额外加了 fallback `JSON.parse` 作为安全兜底。

### 13.8 并发入队超员（行锁 + 当前读）

3 人队剩 1 席时并发同意两个申请曾双双成功（4/3 超员）。修复分两步：`selectByIdForUpdate` 对队伍行加锁 + 成员数 count 也 `FOR UPDATE` 当前读——只加行锁不够，REPEATABLE READ 下事务旧快照看不见并发已提交的插入。数据库层另有 `uk_tm_team_student`/`uk_tm_comp_student` 双唯一键兜底。

### 13.9 端口冲突

8080 端口可能被 Docker/WSL 占用；3000 被占时 Vite 自动 +1，但 e2e baseURL 写死 3000 会连不上。启动前先 `netstat -ano | findstr :8080` 检查。

### 13.10 密码哈希外发（已修复）

`GET /user/{id}`、`POST /user` 等曾把 BCrypt password 哈希序列化到响应。已修复：`User.password` 标注 `@JsonProperty(WRITE_ONLY)`，任何接口不回显。

### 13.11 回归脚本的数据安全约定

`boundary_test.sh` 为历史遗留脚本，直接运行会污染演示数据（把竞赛上限重置为 1、真实发布种子成绩），**已标记废弃**。边界测试一律用 `boundary_full.py`：临时数据带 `TST-`/`tst_` 前缀、开头/结尾自清理、跑完校验种子完整性。`smoke_full.py` 清理阈值用开跑时的 ID 快照（`snap_team`）而非硬编码 `team_id > 5`，否则会把演示数据一并删掉。

### 13.12 前端批量操作 API 参数（已修复）

曾存在两处前后端不一致：`batchDelete` 发 `{ids}` 而后端期望裸数组；`batchDisable` 漏传 `status`（`@NotNull` 校验 400）。2026-09-09 全链路测试发现并已修复——现为 `batchDelete(ids)` 直接发数组、`batchDisable(ids, status)`。教训：API 契约修改要同时检查两端。

### 13.13 Windows 下 docker exec 中文 SQL 编码

`docker exec ... mysql -e "含中文的 SQL"` 在 Windows 下参数会被 GBK 破坏，中文 WHERE 条件静默不匹配（清理失效、数据残留）。所有脚本改走 stdin + `--default-character-set=utf8mb4`（见 §3.6）。

### 13.14 种子/演示数据的时间窗漂移

竞赛报名窗口若写死日期，库放久了会导致"无法组队"（建队/入队均校验窗口）。init.sql 的已发布竞赛种子已改为 `NOW() ± INTERVAL` 相对时间；`smoke_full.py` step0 会刷新存量库窗口。演示数据用前缀标记（D2025/TD2025/演示·）保证可整体回收，生成器幂等。

### 13.15 live 库 ID 映射与 init.sql 种子不一致

运行中的库经过多轮增量，部分账号的用户 id 与 init.sql 种子序号不同（如 live 库 S20220002=7、种子为 8）。写依赖具体 ID 的脚本前必须先查库确认，`smoke_member_flow.py` 头部注释即为此备忘。

---

## 十四、项目文件索引

### 14.1 配置与脚本文件

| 文件 | 用途 |
|------|------|
| `backend/pom.xml` | Maven 依赖管理 |
| `backend/src/main/resources/application.yml` | Spring Boot 应用配置 |
| `backend/sql/init.sql` | 数据库建表 + 种子数据（新库唯一入口） |
| `backend/sql/upgrade-teamup.sql` | TeamUp 社区化增量升级（旧库路径） |
| `backend/sql/upgrade-lean.sql` / `upgrade-lean2.sql` | Lean 精简增量升级 |
| `backend/sql/upgrade-teamup2.sql` | 组队 2.0 增量升级（成员表冗余列+唯一键、招募帖联系方式） |
| `backend/sql/demo-data.sql` | 演示数据（由 gen_demo_data.py 生成，先清后插幂等） |
| `backend/smoke_full.py` / `boundary_full.py` / `smoke_member_flow.py` | API 回归脚本（全链路/边界容错/成员流动） |
| `backend/gen_demo_data.py` | 演示数据生成器（生成+导入+19 项校验） |
| `frontend/package.json` | npm 依赖管理 |
| `frontend/vite.config.ts` | Vite 构建 + 代理配置 |
| `frontend/tsconfig.json` | TypeScript 编译配置 |
| `frontend/playwright.config.ts` / `e2e/teamup.spec.ts` | Playwright E2E 配置与用例 |
| `frontend/.env` / `.env.development` / `.env.production` | 环境变量 |

### 14.2 启动脚本

| 文件 | 用途 |
|------|------|
| `start.bat` | 一键启动全栈（后端用 JAR，需先打包；仅自动补跑 upgrade-teamup.sql） |
| `stop.bat` | 停止 start.bat 启动的所有服务 |
| `start-all.bat` | 开发模式启动（后端 mvn spring-boot:run） |
| `stop-all.bat` | 停止 start-all.bat 启动的服务 |

### 14.3 文档文件

| 文件 | 用途 |
|------|------|
| `README.md` | 全栈部署与运行手册 |
| `AGENT.md` | AI 代理指南（架构/约定/表结构/变更记录/更新日志） |
| `DEVELOPMENT.md` | 本文件（完整开发文档） |
| `docs/ER-DIAGRAM.md` | Mermaid ER 图（含组队 2.0 变更） |
| `docs/UI设计规范.md` | 界面设计规范（取舍原则） |
| `docs/课程设计报告.md` | 数据库课程设计报告 |
| `docs/full-link-test-report/` | 全链路测试报告（API + UI + 缺陷修复） |
| `docs/frontend-test-plan/`、`docs/user-report/`、`docs/defense-ppt/` | 历史测试计划/用户报告/答辩 PPT |

---

## 十五、状态码速查表

### 竞赛状态 (competition.status)

| 值 | 含义 | 英文 | 备注 |
|----|------|------|------|
| 0 | 草稿 | DRAFT | 学生不可见 |
| 2 | 已发布 | PUBLISHED | 可建队/入队（报名窗口内） |
| 3 | 进行中 | ONGOING | 同上，自动转换 |
| 4 | 已结束 | ENDED | 自动转换 |

1（待审核）与 5（已驳回）已随"发布即生效"废弃，仅可能出现在历史数据。

### 参赛队伍状态 (competition_team.status)

| 值 | 含义 | 可执行的成员操作 |
|----|------|------|
| 0 | 组建中 | 入队/退队/移除/转让/提交/解散 |
| 1 | 已提交（待审核） | 名单冻结；仅解散/转让 |
| 2 | 已通过 | 仅管理员侧流转；不可解散/转让 |
| 3 | 已拒绝 | 同 0，可修改后重新提交 |

### 团队成员 (competition_team_member)

无状态列：入队=插行、退队/移除/解散=删行。"一人一赛一队"由 `uk_tm_comp_student` 库层强制。

### 招募帖 (recruit_post)

`type`: 1-组队招募（须关联本人队长队伍） 2-求组。`status`: 1-招募中 0-已关闭（满员/提交审核/审核通过/解散自动关闭）。

### 社区请求 (community_request)

`type`: 2-入队申请 3-入队邀请（1-资料互看已废弃，存量仅作历史）。`status`: 0-待处理 1-已同意 2-已拒绝。

### 站内通知 (sys_notification)

`type`: announcement-公告 interaction-互动 system-系统。`user_id`: 0=全员公告。`ref_type`: request / recruit / team / user / notice（跳转映射见 `src/utils/notification.ts`）。公告草稿态复用 `is_read`（1=草稿 0=已发布）。

### 用户类型 (sys_user.user_type)

| 值 | 含义 | roleCode |
|----|------|----------|
| 1 | 学生 | student |
| 2 | 教师 | teacher |
| 3 | 管理员 | admin |

`sys_user.status`: 1-启用 0-禁用（禁用后无法登录，旧 token 拒绝）。

### 性别 (sys_user.gender)

| 值 | 含义 |
|----|------|
| 0 | 未知 |
| 1 | 男 |
| 2 | 女 |
