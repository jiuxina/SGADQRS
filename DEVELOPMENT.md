# SCMS 完整开发文档

> 学生竞赛信息管理系统 (Student Competition Information Management System)
> 面向零基础接手者的项目全景指南

---

## 一、项目概述

SCMS 是一个面向高校的学生竞赛信息管理平台，采用前后端分离架构。系统支持三种角色：管理员、教师、学生，覆盖竞赛发布、报名审核、团队组建、成绩录入、数据统计、Excel 导出等完整业务流程。

数据库从初始 15 表精简至 7 表；2026-09-05「赛友 TeamUp」社区化改造（经用户确认）新增 recruit_post/community_request 两表、sys_notice 并入 sys_notification；同日「Lean 精简」删除 competition_registration（报名与队伍合一）及多处死字段，现为 8 表。前端以 iOS 26 Liquid Glass 玻璃态设计语言为核心视觉风格。

### 1.1 系统角色与核心能力

管理员拥有系统最高权限：管理所有用户（增删改查、启用/禁用、批量操作）、审核教师提交的竞赛、监管所有报名记录并批量审核、管理和发布成绩、管理系统公告（富文本编辑、置顶、草稿）、查看全局统计数据（用户分布、竞赛热度、报名趋势、奖项分布）并导出 CSV。

教师是竞赛的创建者和管理者：创建竞赛（自定义奖项、上传附件、设置时间节点）、管理自己发布的竞赛（编辑草稿、提交审核、重新提交被驳回的竞赛）、审核学生报名和团队、录入和发布成绩（支持 CSV 批量导入）、作为指导老师接受或拒绝团队指导邀请。

学生是竞赛的参与者：浏览已发布的竞赛、报名参赛（个人或团队）、创建团队或加入已有团队、邀请指导老师、查看已发布的成绩、查看完整参赛历史时间线、管理个人资料（修改信息、更换头像、修改密码）。

### 1.2 技术栈总览

前端技术栈：React 19（函数组件 + Hooks）、TypeScript 6（严格模式）、Vite 8（构建工具 + 开发服务器）、Tailwind CSS 4（CSS-first 模式，无 tailwind.config）、Zustand 5（状态管理）、React Router DOM 7（路由）、Motion 12（Framer Motion 的继任者，动画引擎）、Axios（HTTP 客户端）、Lucide React（SVG 图标库）、TipTap 3（富文本编辑器，用于公告编辑）、jsPDF（PDF 生成预留）、Playwright（E2E 测试框架，已安装但尚未编写测试用例）。

后端技术栈：Spring Boot 3.2.5（Java 17）、Spring Security（认证与授权）、MyBatis-Plus 3.5.6（ORM 框架）、MySQL 8（数据库，Docker 容器运行）、JWT / jjwt 0.12.5（令牌认证）、SpringDoc OpenAPI 2.5.0（Swagger API 文档）、EasyExcel 3.3.4（Excel 导出）、Lombok（代码简化）、Hutool 5.8.27（工具包，当前未大量使用）。

基础设施：MySQL 运行在 Docker 容器 `mysql-scms` 中（端口 3306）、Maven 路径为 `C:\apache-maven\apache-maven-3.9.16\bin\mvn.cmd`（不在 PATH 中，需完整路径调用）。

---

## 二、开发环境搭建

### 2.1 必需软件

在 Windows 系统上开发，需要安装以下软件：

JDK 17 或更高版本（推荐 Oracle JDK 或 Eclipse Temurin），安装后确认 `java -version` 输出正确。

Node.js 18 或更高版本（推荐 LTS 版本），安装后确认 `node -v` 和 `npm -v` 输出正确。

Maven 3.8 或更高版本，本项目使用 `C:\apache-maven\apache-maven-3.9.16`，不在系统 PATH 中，调用时需使用完整路径。

Docker Desktop（用于运行 MySQL），安装后确认 `docker --version` 正常。MySQL 容器名为 `mysql-scms`，端口映射 3306:3306，root 密码为 `root`。

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

init.sql 脚本是幂等的（使用 `CREATE DATABASE IF NOT EXISTS` 和 `CREATE TABLE IF NOT EXISTS`），可以安全地多次执行。脚本包含：建库语句（utf8mb4 字符集）、8 张表的 DDL、8 个用户（1 管理员 + 2 教师 + 5 学生，密码统一 123456 的 BCrypt 哈希，学生含昵称/简介/技能标签）、7 个竞赛（含完整描述、规则、奖项 JSON）、6 条报名记录、4 个团队 + 5 条成员关系、3 条成绩记录、3 条招募/求组帖、3 条社区请求、7 条通知（含 3 条全员公告）。**已有旧库请执行 `backend/sql/upgrade-teamup.sql` 增量升级**（start.bat 检测到旧库缺 recruit_post 表时会自动执行）。

### 2.4 启动项目

**方式一：一键启动（推荐新手使用）**

```bash
start.bat
```

该脚本会自动检查 Java/Node/MySQL 环境，创建数据库（如果不存在），在端口 8080 启动后端，在端口 5174 启动前端，在端口 3001 启动动画演示，并自动打开浏览器。**重要区别：start.bat 使用预构建的 JAR 文件**（`backend/target/scms-backend-1.0.0.jar`）启动后端，因此需要先执行 `mvn clean package -DskipTests` 构建 JAR。如果修改了后端代码，必须重新打包 JAR 再启动。

**方式二：开发模式启动（推荐日常开发）**

```bash
start-all.bat
```

该脚本使用 `mvn spring-boot:run` 启动后端（支持热编译，修改代码后自动重新加载），`npm run dev` 启动前端。与 start.bat 的区别在于后端通过 Maven 插件直接运行而非 JAR，修改 Java 代码后无需手动重新打包。

**方式三：手动启动（推荐调试时使用）**

打开两个终端窗口：

```bash
# 终端 1 - 启动后端（端口 8080）
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

后端启动成功后，访问 http://localhost:8080/api/swagger-ui.html 应能看到 Swagger API 文档页面。

前端启动成功后，访问 http://localhost:3000 应能看到登录页面。

使用默认账号登录测试：admin / 123456（管理员）、T2024001 / 123456（教师）、S20210001 / 123456（学生）。

### 2.6 服务端口一览

| 服务 | 端口 | 说明 |
|------|------|------|
| 后端 API | 8080 | Spring Boot，context-path 为 `/api` |
| 前端 (start.bat) | 5174 | Vite 开发服务器 |
| 前端 (npm run dev) | 3000 | Vite 开发服务器（手动启动时） |
| MySQL | 3306 | Docker 容器 |
| 动画演示 | 3001 | 前端动画 Demo（start.bat 启动时） |

---

## 三、数据库设计

### 3.1 设计原则

本系统遵循以下数据库设计原则：所有表间关系为逻辑外键，不在数据库层面建立 FK 约束（由应用层保证一致性）；不使用软删除（无 `deleted` 字段），删除操作为物理删除；组织信息（学院/专业/班级）直接存储在用户表中作为 VARCHAR 字段，不使用独立的组织机构表；奖项和附件以 JSON 格式存储在竞赛表中，不拆分为独立子表。

### 3.2 命名约定

数据库表名使用下划线命名法（如 `competition_result`），字段名同样使用下划线命名法（如 `create_time`）。Java 实体类使用驼峰命名法（如 `createTime`），MyBatis-Plus 通过 `map-underscore-to-camel-case: true` 配置自动映射。

### 3.3 完整表结构

#### 表 1: sys_user（用户表）

```sql
CREATE TABLE `sys_user` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,            -- 主键
    `username` VARCHAR(50) NOT NULL,                  -- 登录账号（唯一）
    `password` VARCHAR(100) NOT NULL,                 -- 密码（BCrypt 哈希）
    `real_name` VARCHAR(50) NOT NULL,                 -- 真实姓名
    `avatar` VARCHAR(255) DEFAULT NULL,               -- 头像 URL
    `phone` VARCHAR(20) DEFAULT NULL,                 -- 手机号
    `email` VARCHAR(100) DEFAULT NULL,                -- 邮箱
    `gender` TINYINT DEFAULT 0,                       -- 性别：0-未知 1-男 2-女
    `user_type` TINYINT NOT NULL,                     -- 用户类型：1-学生 2-教师 3-管理员
    `role` VARCHAR(50) DEFAULT NULL,                  -- 角色编码（admin/teacher/student，冗余字段）
    `dept_name` VARCHAR(50) DEFAULT NULL,             -- 所属学院（纯文本，无外键）
    `major_name` VARCHAR(50) DEFAULT NULL,            -- 专业（纯文本）
    `class_name` VARCHAR(50) DEFAULT NULL,            -- 班级（纯文本）
    `status` TINYINT NOT NULL DEFAULT 1,              -- 状态：1-启用 0-禁用
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `last_login_time` DATETIME DEFAULT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_username` (`username`),
    KEY `idx_user_type` (`user_type`)
);
```

设计说明：`user_type` 是角色的唯一权威字段，认证/授权时以它做 switch 映射推导角色编码（roleCode），`role` 冗余列已于 TeamUp 改造中删除。`dept_name`/`major_name`/`class_name` 存储纯文本而非外键引用，因为系统不需要组织结构的层级管理。**注意：当前 `password` 字段没有标注 `@JsonIgnore`，这意味着在返回用户列表或用户详情时密码哈希会包含在 JSON 响应中。** 这是一个安全隐患，建议尽快添加 `@JsonIgnore` 注解。`roleCode` 是 `@TableField(exist = false)` 虚拟字段，不映射到数据库列，用于前端兼容。

#### 表 2: competition（竞赛信息表）

```sql
CREATE TABLE `competition` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `competition_name` VARCHAR(100) NOT NULL,         -- 竞赛名称
    `organizer` VARCHAR(100) NOT NULL,                -- 主办单位
    `publisher_id` BIGINT NOT NULL,                   -- 发布人 ID → sys_user.id
    `cover_image` VARCHAR(255) DEFAULT NULL,          -- 封面图 URL
    `description` TEXT DEFAULT NULL,                  -- 竞赛描述（支持 HTML）
    `rules` TEXT DEFAULT NULL,                        -- 竞赛规则
    `registration_start` DATETIME NOT NULL,           -- 报名开始时间
    `registration_end` DATETIME NOT NULL,             -- 报名截止时间
    `competition_start` DATETIME NOT NULL,            -- 竞赛开始时间
    `competition_end` DATETIME NOT NULL,              -- 竞赛结束时间
    `location` VARCHAR(200) DEFAULT NULL,             -- 竞赛地点
    `max_members` INT NOT NULL DEFAULT 1,             -- 每队最大人数
    `max_teams` INT DEFAULT NULL,                     -- 最大队伍数
    `awards` JSON DEFAULT NULL,                       -- 自定义奖项
    `attachments` JSON DEFAULT NULL,                  -- 附件列表
    `status` TINYINT NOT NULL DEFAULT 0,              -- 0-草稿 1-待审核 2-已发布 3-进行中 4-已结束 5-已驳回
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_comp_status` (`status`),
    KEY `idx_comp_publisher` (`publisher_id`)
);
```

JSON 字段格式说明：

`awards` 格式为 `[{"name":"一等奖","level":1},{"name":"二等奖","level":2},...]`，教师在创建竞赛时自定义。成绩表的 `award_level` 对应此处的 `level`，`award_name` 对应此处的 `name`。

`attachments` 格式为 `[{"fileName":"文件.pdf","fileUrl":"/uploads/xxx.pdf","fileSize":1024,"fileType":"pdf"},...]`，前端上传文件后将返回的结果追加到此数组，保存竞赛时整体以 JSON 提交。

后端通过 `@JsonIgnore` 标注原始 String 字段，并用 `@JsonProperty` + 自定义 getter 返回解析后的 List，确保前端接收到的是数组而非 JSON 字符串。

#### 表 3: competition_registration（报名表）

```sql
CREATE TABLE `competition_registration` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `competition_id` BIGINT NOT NULL,                 -- 竞赛 ID → competition.id
    `team_id` BIGINT DEFAULT NULL,                    -- 团队 ID → competition_team.id
    `student_id` BIGINT NOT NULL,                     -- 学生 ID → sys_user.id
    `is_team_leader` TINYINT NOT NULL DEFAULT 0,      -- 是否队长
    `contact_phone` VARCHAR(20) DEFAULT NULL,         -- 联系电话
    `remark` VARCHAR(500) DEFAULT NULL,               -- 学生备注
    `attachment_url` VARCHAR(255) DEFAULT NULL,       -- 报名附件 URL
    `status` TINYINT NOT NULL DEFAULT 0,              -- 0-待审核 1-已通过 2-已拒绝
    `audit_remark` VARCHAR(500) DEFAULT NULL,         -- 审核备注（审核团队时同步写入所有成员）
    `audit_time` DATETIME DEFAULT NULL,               -- 审核时间
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_reg_comp` (`competition_id`),
    KEY `idx_reg_student` (`student_id`),
    KEY `idx_reg_status` (`status`)
);
```

#### 表 4: competition_team（团队信息表）

```sql
CREATE TABLE `competition_team` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `competition_id` BIGINT NOT NULL,                 -- 竞赛 ID → competition.id
    `team_name` VARCHAR(50) NOT NULL,                 -- 团队名称
    `leader_id` BIGINT NOT NULL,                      -- 队长 ID → sys_user.id
    `teacher_id` BIGINT DEFAULT NULL,                 -- 指导老师 ID → sys_user.id
    `team_slogan` VARCHAR(200) DEFAULT NULL,          -- 团队口号
    `status` TINYINT NOT NULL DEFAULT 0,              -- 0-组建中 1-已提交 2-已通过 3-已拒绝
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_team_comp` (`competition_id`),
    KEY `idx_team_teacher` (`teacher_id`)
);
```

#### 表 5: competition_team_member（团队成员表）

```sql
CREATE TABLE `competition_team_member` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `team_id` BIGINT NOT NULL,                        -- 团队 ID → competition_team.id
    `student_id` BIGINT NOT NULL,                     -- 学生 ID → sys_user.id
    `join_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `status` TINYINT NOT NULL DEFAULT 1,              -- 0-已退出 1-正常 2-待审核 3-已拒绝
    PRIMARY KEY (`id`),
    KEY `idx_tm_team` (`team_id`)
);
```

#### 表 6: competition_result（成绩表）

```sql
CREATE TABLE `competition_result` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `competition_id` BIGINT NOT NULL,                 -- 竞赛 ID → competition.id
    `registration_id` BIGINT NOT NULL,                -- 报名 ID → competition_registration.id
    `student_id` BIGINT DEFAULT NULL,                 -- 学生 ID → sys_user.id
    `team_id` BIGINT DEFAULT NULL,                    -- 团队 ID → competition_team.id
    `score` DECIMAL(10,2) DEFAULT NULL,               -- 分数
    `ranking` INT DEFAULT NULL,                       -- 排名
    `award_level` TINYINT DEFAULT NULL,               -- 奖项等级（对应 competition.awards 的 level）
    `award_name` VARCHAR(50) DEFAULT NULL,            -- 奖项名称（对应 competition.awards 的 name）
    `remark` VARCHAR(500) DEFAULT NULL,               -- 评语
    `is_published` TINYINT NOT NULL DEFAULT 0,        -- 0-未发布 1-已发布
    `publish_time` DATETIME DEFAULT NULL,             -- 发布时间
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_result_comp` (`competition_id`),
    KEY `idx_result_student` (`student_id`),
    KEY `idx_result_publish` (`is_published`)
);
```

#### 表 7: sys_notice（系统公告表）

```sql
CREATE TABLE `sys_notice` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `notice_title` VARCHAR(100) NOT NULL,             -- 公告标题
    `notice_content` TEXT NOT NULL,                   -- 公告内容（HTML）
    `notice_type` TINYINT NOT NULL DEFAULT 1,         -- 1-通知 2-公告
    `is_top` TINYINT NOT NULL DEFAULT 0,              -- 是否置顶
    `status` TINYINT NOT NULL DEFAULT 1,              -- 状态
    `publish_time` DATETIME DEFAULT NULL,             -- 发布时间
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`)
);
```

### 3.4 实体虚拟字段

所有实体类都包含若干 `@TableField(exist = false)` 标注的虚拟字段，这些字段不映射到数据库列，由 Service 层在查询后填充关联数据，方便前端直接使用而无需额外的 DTO 转换。

User 实体：`roleCode`（String，角色编码冗余字段，兼容前端）。

Competition 实体：原始 `awards`/`attachments` 字段为 String 类型（JSON 字符串），通过 `@JsonIgnore` 隐藏并用 `@JsonProperty` + 自定义 getter 返回解析后的 `List<Map>`，前端直接接收数组。

CompetitionRegistration 实体：`competitionName`（竞赛名称）、`studentName`（学生姓名）、`teamName`（团队名称），由 Service 层关联查询后填充。

CompetitionTeam 实体：`leaderName`（队长姓名）、`teacherName`（指导老师姓名）、`competitionName`（竞赛名称）、`members`（成员列表 `List<CompetitionTeamMember>`）。

CompetitionTeamMember 实体：`studentName`（学生姓名）、`studentUsername`（学生学号）。

CompetitionResult 实体：`competitionName`（竞赛名称）、`studentName`（学生姓名）、`teamName`（团队名称）。

Notice 实体：无虚拟字段。

### 3.5 表间关系

```
sys_user (1) ─── (N) competition             [publisher_id]   用户发布的竞赛
sys_user (1) ─── (N) competition_registration [student_id]     学生的报名记录
sys_user (1) ─── (N) competition_team         [leader_id]      作为队长的团队
sys_user (1) ─── (N) competition_team         [teacher_id]     作为指导老师的团队
sys_user (1) ─── (N) competition_team_member  [student_id]     作为成员的团队
sys_user (1) ─── (N) competition_result       [student_id]     学生的成绩

competition (1) ─── (N) competition_registration [competition_id]
competition (1) ─── (N) competition_team         [competition_id]
competition (1) ─── (N) competition_result       [competition_id]

competition_team (1) ─── (N) competition_team_member  [team_id]
competition_team (1) ─── (N) competition_registration [team_id]
competition_team (1) ─── (N) competition_result       [team_id]

competition_registration (1) ─── (N) competition_result [registration_id]
```

### 3.6 数据库操作

由于 MySQL 运行在 Docker 容器中，所有数据库操作需通过 `docker exec` 执行：

```bash
# 查询数据
docker exec mysql-scms mysql -u root -proot scms -e "SELECT * FROM sys_user;"

# 统计各表数据量
docker exec mysql-scms mysql -u root -proot scms -e "
  SELECT 'sys_user' AS t, COUNT(*) AS c FROM sys_user
  UNION SELECT 'competition', COUNT(*) FROM competition
  UNION SELECT 'competition_registration', COUNT(*) FROM competition_registration
  UNION SELECT 'competition_team', COUNT(*) FROM competition_team
  UNION SELECT 'competition_team_member', COUNT(*) FROM competition_team_member
  UNION SELECT 'competition_result', COUNT(*) FROM competition_result
  UNION SELECT 'sys_notice', COUNT(*) FROM sys_notice;
"

# 重置数据库（删除后重新导入）
docker exec mysql-scms mysql -u root -proot -e "DROP DATABASE IF EXISTS scms;"
docker exec -i mysql-scms mysql -u root -proot < backend/sql/init.sql
```

### 3.7 数据库修改硬性约束

这是一条绝对规定，任何情况下不得违反：禁止新增表、禁止新增字段、禁止删除表或字段、禁止修改字段类型或长度、禁止添加外键约束、禁止编写迁移脚本。如果业务确实需要变更数据库结构，必须经过用户明确确认，并同步更新 AGENT.md 中的表结构文档。

---

## 四、后端架构详解

### 4.1 分层结构

后端采用经典的 Spring Boot 分层架构，包路径为 `com.scms`：

```
com.scms/
├── ScmsApplication.java          -- Spring Boot 启动类
├── common/                       -- 通用组件
│   ├── Result.java               -- 统一响应封装 {code, message, data}
│   ├── PageResult.java           -- 分页响应封装
│   └── GlobalExceptionHandler.java -- 全局异常处理
├── config/                       -- 配置类
│   ├── MybatisPlusConfig.java    -- MyBatis-Plus 分页插件
│   ├── WebMvcConfig.java         -- CORS 配置 + 静态资源映射
│   └── MyMetaObjectHandler.java  -- 自动填充 createTime/updateTime
├── security/                     -- 安全模块
│   ├── SecurityConfig.java       -- Spring Security 配置
│   ├── JwtTokenUtil.java         -- JWT 工具类
│   ├── JwtAuthenticationFilter.java -- JWT 过滤器
│   ├── LoginUser.java            -- 自定义 UserDetails
│   └── UserDetailsServiceImpl.java -- UserDetailsService 实现
├── controller/                   -- REST 控制器（10 个）
├── service/                      -- 业务逻辑层（8 个）
├── mapper/                       -- MyBatis Mapper 接口（7 个）
├── entity/                       -- 数据库实体（7 个）
├── dto/                          -- 数据传输对象（12 个）
├── export/                       -- Excel 导出模型（5 个）
└── util/
    └── ExcelUtil.java            -- 通用 EasyExcel 工具类
```

### 4.2 安全认证体系

认证流程：用户提交 username + password + role 到 `POST /api/auth/login`，后端通过 BCrypt 验证密码，检查角色是否匹配，成功后生成 JWT 令牌返回。令牌有效期 24 小时（86400000 毫秒）。

JWT 令牌结构：payload 中包含 `userId`（Long）、`username`（String）、`role`（String，即 "student"/"teacher"/"admin"），使用 HMAC-SHA 签名。

请求认证流程：`JwtAuthenticationFilter`（继承 `OncePerRequestFilter`）从请求头 `Authorization: Bearer <token>` 中提取令牌，验证有效性，加载 UserDetails，创建 `UsernamePasswordAuthenticationToken` 并设置到 `SecurityContextHolder`。

权限控制：使用 `@EnableMethodSecurity` 启用方法级权限，控制器方法通过 `@PreAuthorize("hasRole('ADMIN')")` 等注解控制访问。

公开访问路径（无需认证）：`/auth/login`、`/auth/register`、`/uploads/**`、`/public/**`、Swagger 文档路径。

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

### 4.4 全局异常处理

`GlobalExceptionHandler` 使用 `@RestControllerAdvice` 捕获所有异常，并标注了对应的 HTTP 状态码：

`MethodArgumentNotValidException`（参数校验失败）返回 400，`IllegalArgumentException`（业务逻辑异常）返回 400，`AccessDeniedException`（权限不足）返回 403，`Exception`（未预期异常）返回 500。所有异常响应均为 `Result.error(code, message)` 格式。

### 4.5 MyBatis-Plus 配置

`MybatisPlusConfig` 注册了分页拦截器 `MybatisPlusInterceptor` + `PaginationInnerInterceptor(DbType.MYSQL)`。

`MyMetaObjectHandler` 实现了 `MetaObjectHandler` 接口，在 INSERT 时自动填充 `createTime`、`updateTime`、`joinTime` 字段（均为 `new Date()`）。这个处理器必须填充所有标注了 `@TableField(fill = FieldFill.INSERT)` 的字段，否则 MyBatis-Plus 会强制将 null 写入 NOT NULL 列导致 `SQLIntegrityConstraintViolation`。

`WebMvcConfig` 配置 CORS 允许 `localhost:3000` 和 `localhost:5174` 的跨域请求，并注册了 `/uploads/**` 的静态资源映射到 `file:./uploads/` 目录。

### 4.6 文件上传与静态资源

文件上传通过 `POST /api/file/upload` 接口，接收 `MultipartFile`，存储到 `{uploadPath}/yyyy/MM/dd/{UUID}.{ext}` 路径下（uploadPath 配置为 `./uploads/`），返回 `{url, fileName, fileSize, fileType}`。最大文件大小 10MB，请求体最大 20MB。

静态资源访问有两个入口：`/uploads/**` 由 `WebMvcConfig` 的 `ResourceHandler` 处理（Spring Boot 默认机制）；`/public/**` 由自定义 `StaticFileController` 处理——这是因为 Spring Boot 内置的 `ResourceHttpRequestHandler` 在 Windows 上处理中文文件名时会抛 500 异常，所以用 `@RestController` + `URLDecoder` 替代。`StaticFileController` 从 JAR 包所在目录的父目录的父目录查找 `public/` 目录（因为 JAR 在 `target/` 下而 `public/` 在项目根目录），支持 PNG/JPG/GIF/WebP/SVG/ICO 格式，并包含路径穿越防护（拒绝文件名中包含 `..`、`/`、`\`）。

### 4.7 自动状态转换

`CompetitionService.listCompetitions()` 在每次查询竞赛列表时自动调用 `autoUpdateStatus()`：如果当前时间超过 `competitionStart`，状态从 2（已发布）自动转为 3（进行中）；如果当前时间超过 `competitionEnd`，状态从 3 自动转为 4（已结束）。

---

## 五、完整 API 接口参考

所有接口基础路径为 `http://localhost:8080/api`，需认证的接口在请求头中携带 `Authorization: Bearer <token>`。

### 5.1 认证接口（公开）

| 方法 | 路径 | 参数 | 说明 |
|------|------|------|------|
| POST | `/auth/login` | Body: `{username, password, role}` | 用户登录，返回 `{token, user}` |
| POST | `/auth/register` | Body: `{username, password, role}` | 用户注册，role 为 "teacher" 时创建教师，否则创建学生 |
| GET | `/auth/info` | 无（从 Token 获取） | 获取当前登录用户信息 |

### 5.2 用户管理接口

| 方法 | 路径 | 参数 | 权限 | 说明 |
|------|------|------|------|------|
| GET | `/user/list` | Query: current, size, keyword?, userType? | 认证用户 | 分页用户列表 |
| GET | `/user/stats` | 无 | ADMIN | 用户统计（总数/学生/教师/管理员） |
| GET | `/user/{id}` | Path: id | 认证用户 | 单个用户详情 |
| POST | `/user` | Body: UserDTO | ADMIN | 创建用户（默认密码 123456） |
| PUT | `/user` | Body: UserDTO | ADMIN | 更新用户（部分更新） |
| DELETE | `/user/{id}` | Path: id | ADMIN | 删除用户 |
| POST | `/user/batch-delete` | Body: `[id1, id2, ...]`（裸数组） | ADMIN | 批量删除用户 |
| PUT | `/user/disable/{id}` | Path: id, Body: `{status}` | ADMIN | 启用/禁用用户 |
| POST | `/user/batch-disable` | Body: `{ids, status}` | ADMIN | 批量启用/禁用 |
| PUT | `/user/reset-password/{id}` | Path: id | ADMIN | 重置密码为 123456 |

### 5.3 竞赛管理接口

| 方法 | 路径 | 参数 | 权限 | 说明 |
|------|------|------|------|------|
| GET | `/competition/list` | Query: current, size, keyword?, status?, publisherId? | 认证用户 | 分页竞赛列表（自动附加报名人数、是否已报名） |
| GET | `/competition/{id}` | Path: id | 认证用户 | 竞赛详情 |
| POST | `/competition` | Body: CompetitionDTO | TEACHER/ADMIN | 创建竞赛 |
| PUT | `/competition` | Body: CompetitionDTO | TEACHER/ADMIN | 更新竞赛 |
| PUT | `/competition/{id}/audit` | Path: id, Query: status, remark? | ADMIN | 审核竞赛（2=通过, 5=驳回） |
| DELETE | `/competition/{id}` | Path: id | TEACHER/ADMIN | 删除竞赛（级联删除报名） |
| GET | `/competition/dashboard` | 无 | 认证用户 | 仪表盘统计（按角色返回不同数据） |

### 5.4 报名管理接口

| 方法 | 路径 | 参数 | 权限 | 说明 |
|------|------|------|------|------|
| GET | `/registration/list` | Query: current, size, competitionId?, studentId?, status?, publisherId?, keyword? | 认证用户 | 分页报名列表 |
| POST | `/registration` | Body: RegistrationDTO | STUDENT | 学生报名 |
| PUT | `/registration/{id}/audit` | Path: id, Body: `{status, auditRemark?}` | TEACHER/ADMIN | 审核报名 |
| PUT | `/registration/batch-audit` | Body: `{ids, status, auditRemark?}` | TEACHER/ADMIN | 批量审核报名 |
| DELETE | `/registration/{id}` | Path: id | STUDENT | 取消报名（设置 status=-1） |
| GET | `/registration/teams` | Query: current, size, competitionId?, status?, teacherId? | 认证用户 | 团队列表 |
| POST | `/registration/team` | Body: TeamDTO | STUDENT | 创建团队（自动加入为队长） |
| POST | `/registration/team/{teamId}/join` | Path: teamId | STUDENT | 加入团队 |
| PUT | `/registration/team/{id}/audit` | Path: id, Query: status, auditRemark? | TEACHER/ADMIN | 审核团队 |
| PUT | `/registration/team/{teamId}/advisor/accept` | Path: teamId | TEACHER | 接受指导老师邀请 |
| PUT | `/registration/team/{teamId}/advisor/reject` | Path: teamId | TEACHER | 拒绝指导老师邀请 |
| PUT | `/registration/team/{teamId}/member/{memberId}/audit` | Path: teamId+memberId, Query: status | TEACHER/ADMIN | 审核加入请求 |
| GET | `/registration/team/{teamId}/member/pending` | Path: teamId | TEACHER/ADMIN | 待审核加入请求列表 |

### 5.5 成绩管理接口

| 方法 | 路径 | 参数 | 权限 | 说明 |
|------|------|------|------|------|
| GET | `/result/list` | Query: current, size, competitionId?, studentId?, awardLevel?, isPublished?, keyword? | 认证用户 | 分页成绩列表 |
| POST | `/result` | Body: ResultDTO | TEACHER/ADMIN | 录入单条成绩 |
| POST | `/result/batch` | Body: `{competitionId, results[]}` | TEACHER/ADMIN | 批量录入成绩 |
| PUT | `/result` | Body: ResultDTO | TEACHER/ADMIN | 更新成绩 |
| POST | `/result/publish/{competitionId}` | Path: competitionId | TEACHER/ADMIN | 发布某竞赛所有成绩 |
| GET | `/result/student/stats` | 无 | STUDENT | 学生成绩统计 |
| GET | `/result/stats` | Query: competitionId | TEACHER/ADMIN | 竞赛成绩统计（均分/最高/最低） |

### 5.6 公告管理接口

| 方法 | 路径 | 参数 | 权限 | 说明 |
|------|------|------|------|------|
| GET | `/notice/list` | Query: current, size, noticeType?, status? | 认证用户 | 分页公告列表（置顶优先） |
| POST | `/notice` | Body: NoticeDTO | ADMIN | 创建公告 |
| PUT | `/notice` | Body: NoticeDTO（含 id） | ADMIN | 更新公告 |
| DELETE | `/notice/{id}` | Path: id | ADMIN | 删除公告 |
| PUT | `/notice/{id}/top` | Path: id | ADMIN | 置顶/取消置顶 |

### 5.7 统计接口

| 方法 | 路径 | 参数 | 权限 | 说明 |
|------|------|------|------|------|
| GET | `/stats/admin` | 无 | ADMIN | 管理员综合统计（用户/竞赛/报名/奖项/趋势/排行） |
| GET | `/stats/enrollment-trends` | 无 | ADMIN | 近 6 个月报名趋势 |
| GET | `/stats/competition-rankings` | 无 | ADMIN | 竞赛热度 Top 10 |
| GET | `/stats/upcoming` | 无 | 认证用户 | 7 天内即将截止/开始的竞赛 |

### 5.8 文件与导出接口

| 方法 | 路径 | 参数 | 权限 | 说明 |
|------|------|------|------|------|
| POST | `/file/upload` | FormData: file | 认证用户 | 上传文件（最大 10MB） |
| GET | `/public/{filename}` | Path: filename | 公开 | 访问静态资源 |
| GET | `/export/competitions` | Query: status?, keyword? | TEACHER/ADMIN | 导出竞赛 Excel |
| GET | `/export/registrations` | Query: competitionId?, status? | TEACHER/ADMIN | 导出报名 Excel |
| GET | `/export/teams` | Query: competitionId?, status? | TEACHER/ADMIN | 导出团队 Excel |
| GET | `/export/results` | Query: competitionId?, awardLevel?, isPublished? | TEACHER/ADMIN | 导出成绩 Excel |
| GET | `/export/student-transcript` | 无 | 认证用户 | 导出个人成绩单 |

---

## 六、前端架构详解

### 6.1 项目结构

```
frontend/src/
├── main.tsx                       -- 入口：StrictMode + BrowserRouter
├── App.tsx                        -- 路由定义 + GlobalErrorBoundary + 全局弹窗容器
├── index.css                      -- 全局样式（~2600 行，玻璃态设计系统）
├── api/
│   ├── request.ts                 -- Axios 实例 + JWT 拦截器
│   ├── types.ts                   -- 所有 TypeScript 接口定义
│   ├── index.ts                   -- 统一导出
│   └── modules/
│       ├── auth.ts                -- 认证 API（3 方法）
│       ├── competition.ts         -- 竞赛 API（7 方法）
│       ├── registration.ts        -- 报名+团队 API（13 方法）
│       ├── result.ts              -- 成绩 API（7 方法）
│       ├── user.ts                -- 用户 API（10 方法）
│       ├── system.ts              -- 公告+统计+文件上传 API
│       └── export.ts              -- 导出 API（6 方法）
├── config/
│   ├── env.ts                     -- 环境变量封装
│   └── constants.ts               -- 常量（状态码、分页大小、动画配置等）
├── store/
│   └── authStore.ts               -- Zustand 认证状态管理
├── hooks/
│   ├── usePagination.ts           -- 分页状态管理
│   ├── useDebounce.ts             -- 值防抖（默认 300ms）
│   ├── useIsMobile.ts             -- 响应式断点检测（768px）
│   ├── useShake.ts                -- 抖动动画触发器
│   ├── useFetch.ts                -- 通用异步数据获取
│   └── useAnimations.ts           -- 玻璃态光效鼠标跟随
├── motion/
│   └── variants.ts                -- Motion 动画变体定义（8 种）
├── utils/
│   ├── format.ts                  -- formatDate, resolveCoverUrl, formatFileSize
│   ├── date.ts                    -- countdownText（倒计时文本）
│   ├── export.ts                  -- downloadFile（Axios blob 下载）
│   └── statusBadge.ts             -- 状态码到徽章样式映射
├── components/                    -- 29 个通用组件
└── pages/                         -- 21 个页面组件
```

### 6.2 路由与权限控制

路由定义在 `App.tsx`，采用嵌套路由结构。所有需要认证的页面包裹在 `<AuthGuard>` 中，布局由 `<DesktopLayout>` 提供。

```
/login                              -- 登录页（公开）
├── AuthGuard                       -- 认证守卫
│   └── DashboardLayout (DesktopLayout + Outlet)
│       ├── /profile                -- 个人中心（所有角色）
│       ├── /admin/*                -- 管理员路由（allowedRoles={['admin']}）
│       │   ├── /admin/dashboard
│       │   ├── /admin/competitions
│       │   ├── /admin/competitions/:id/edit
│       │   ├── /admin/users
│       │   ├── /admin/registrations
│       │   ├── /admin/grades
│       │   ├── /admin/notices
│       │   └── /admin/stats
│       ├── /teacher/*              -- 教师路由（allowedRoles={['teacher']}）
│       │   ├── /teacher/dashboard
│       │   ├── /teacher/competitions
│       │   ├── /teacher/competitions/create
│       │   ├── /teacher/competitions/:id/edit
│       │   ├── /teacher/teams
│       │   └── /teacher/grades
│       ├── /student/*              -- 学生路由（allowedRoles={['student']}）
│       │   ├── /student/dashboard
│       │   ├── /student/competitions
│       │   ├── /student/competitions/:id
│       │   ├── /student/registration
│       │   ├── /student/grades
│       │   ├── /student/teams
│       │   └── /student/history
│       └── * → 重定向到 /login
```

`AuthGuard` 组件的工作流程：首先检查 `isAuthenticated`，未登录则重定向到 `/login`；然后检查 `allowedRoles`，如果用户角色不在允许列表中，则重定向到用户角色对应的仪表盘页面（如 admin → `/admin/dashboard`）。

### 6.3 状态管理

项目使用 Zustand 5 管理认证状态，只有一个 store：`authStore`。

状态字段：`token`（JWT 令牌字符串或 null）、`user`（用户信息对象或 null）、`isAuthenticated`（布尔值）。

操作方法：`login(username, password, role)` 调用后端 API 获取令牌和用户信息，存入 Zustand 状态并持久化到 localStorage（key 为 `scms_token` 和 `scms_user`）；`logout()` 清除状态和 localStorage；`loadUser()` 从服务器刷新用户信息；`setUser()` 直接设置用户信息。

其他页面级状态（如列表数据、分页、筛选条件）由各页面组件内部管理，不使用全局 store。

### 6.4 HTTP 请求层

`request.ts` 创建了 Axios 实例，baseURL 取自环境变量 `VITE_API_BASE_URL`（默认 `http://localhost:8080/api`），超时时间 `VITE_API_TIMEOUT`（默认 15000ms）。

请求拦截器：从 localStorage 读取 `scms_token`，自动附加到请求头 `Authorization: Bearer <token>`。

响应拦截器：检查响应体 `data.code`，等于 200 则返回 `data.data`（解包），否则 reject 整个 data。对于非登录接口返回 HTTP 401 的情况，清除 localStorage 并重定向到 `/login`，使用 `isRedirecting` 标志防止并发重复重定向。

Vite 开发服务器配置了代理：`/api/ws` 走 WebSocket 代理，`/api` 走 HTTP 代理，目标均为 `http://localhost:8080`。

### 6.5 全局弹窗系统

项目实现了 4 个全局弹窗组件，均挂载在 `App.tsx` 根级别，通过全局函数引用实现无 props 调用：

**Toast（提示通知）**：调用方式 `toast.success("操作成功")` / `toast.error("出错了")` / `toast.warning("请注意")` / `toast.info("提示")`。从右侧滑入，自动消失。4 种类型使用不同颜色。

**ConfirmDialog（确认对话框）**：调用方式 `const confirmed = await confirmDialog({ message: "确定要删除吗？", variant: "danger", confirmText: "删除" })`。返回 `Promise<boolean>`。支持 danger（红色）、warning（橙色）、info（蓝色）三种变体。

**PromptDialog（输入对话框）**：调用方式 `const value = await promptDialog({ message: "请输入名称", defaultValue: "", placeholder: "请输入..." })`。返回 `Promise<string | null>`（取消返回 null）。Enter 确认，Escape 取消。

**EditGradeDialog（成绩编辑对话框）**：调用方式 `const result = await editGradeDialog({ competitionId: 1, currentScore: 85, ... })`。返回 `Promise<EditGradeResult | null>`。包含分数（0-100）、排名、奖项等级选择、评语字段。Ctrl+Enter 快速确认。

这些弹窗通过 `window.__showToast` 等全局函数引用实现解耦，容器组件在 mount 时注册引用，任何组件都可以直接调用而无需 Context 或 props drilling。

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

`src/utils/statusBadge.ts` 提供 3 套状态徽章映射，每套返回 `{cls, label}` 对象：

`competitionStatusBadge`（管理员/教师视角）：竞赛状态 0-5 映射为草稿/待审核/已发布/进行中/已结束/已驳回。

`studentCompetitionStatusBadge`（学生视角）：同样的竞赛状态值，但标签不同——例如 status=1 显示"审核中"而非"待审核"，status=2 显示"报名中"而非"已发布"。

`registrationStatusBadge`：报名状态 0-2 映射为待审核/已通过/已拒绝。

`getStatusBadge(status, type)` 函数根据 type 参数（`'competition'` | `'student-competition'` | `'registration'`）选择对应的映射表。

其他工具函数：`src/utils/format.ts` 包含 `formatDate`（日期格式化）、`resolveCoverUrl`（封面 URL 解析，保留 /api 前缀）、`formatFileSize`（文件大小人性化显示）。`src/utils/date.ts` 包含 `countdownText`（倒计时文本）。`src/utils/export.ts` 包含 `downloadFile`（Axios blob 下载）。

### 6.10 错误边界

项目包含两个错误边界：

`GlobalErrorBoundary`（App.tsx）：顶层错误边界，捕获所有渲染异常（如 `.map()` 对非数组调用），显示错误页面和刷新按钮，防止白屏。

`CompetitionDetailErrorBoundary`（StudentCompetitionDetail.tsx）：页面级错误边界，捕获竞赛详情页的渲染错误，提供返回导航。

---

## 七、前端页面详解

### 7.1 登录页 (LoginPage)

分屏布局。左侧面板：全屏奖杯图片 + 鼠标视差效果（mouse-move CSS var tracking）、暗色渐变叠加、装饰性对角线、斜切标题文字（per-character clip-path）。右侧面板：玻璃态表单卡片 + 角色切换器（admin/teacher/student 三选一）+ 用户名密码输入框 + 密码显示切换 + 记住账号 + 登录按钮（loading 状态）+ 错误时抖动动画。

登录成功后根据角色跳转到对应仪表盘。

### 7.2 管理员页面

**AdminDashboard（仪表盘）**：Bento 网格布局，包含竞赛状态分布柱状图、待审核竞赛列表（status=1）、用户统计卡片（总数/活跃/禁用）、团队数量、即将到期提醒、快捷操作入口。

**AdminCompetitions（竞赛管理）**：状态筛选 chips（全部/待审核/已发布/进行中/已结束/草稿/已驳回）+ 防抖搜索 + 分页数据表。操作列：通过/驳回（待审核状态）、编辑/查看详情/删除。详情弹窗显示封面图、描述、元数据、统计、规则、附件。支持导出 Excel。

**AdminUsers（用户管理）**：指标卡片（总数/学生/教师）+ DigitRoller 数字动画 + 角色筛选 + 防抖搜索 + 批量操作（全选、批量删除、批量禁用）+ 数据表 + 创建/编辑用户弹窗（含头像上传）+ 切换状态 + 重置密码 + 导出 Excel。

**AdminRegistrations（报名监管）**：竞赛选择器 + 状态筛选 + 批量操作（通过/拒绝选中项）+ 数据表 + 审核/拒绝操作（拒绝时使用 RejectReasonModal 输入原因）+ 导出 Excel。

**AdminGrades（成绩管理）**：竞赛选择下拉框 + 数据表 + 编辑成绩（EditGradeDialog）+ 发布所有成绩 + 批量选择 + 导出 Excel。

**AdminNotices（公告管理）**：TipTap 富文本编辑器 + 筛选（全部/通知/公告/已发布/草稿）+ 数据表（置顶指示器、标题、类型徽章、状态、发布时间）+ 操作（编辑、置顶/取消、发布/撤回、删除）。

**AdminStats（数据统计）**：日期范围筛选（默认近 6 个月）+ 8 个指标卡片 + 报名趋势图（柱状 + 点可视化，无图表库纯 SVG）+ 竞赛排行（进度条）+ 奖项分布柱状图 + CSV 导出（客户端生成，带 BOM 处理中文编码）。

### 7.3 教师页面

**TeacherDashboard（仪表盘）**：Bento 网格，包含"赛事概览"（我的竞赛数量）、"最近竞赛"时间线（可点击跳转）、即将到期提醒、快捷操作。数据范围限定为教师自己发布的竞赛（`publisherId: user.id`）。

**TeacherCompetitions（我的竞赛）**：状态筛选 + 分页数据表。操作：管理（打开报名管理弹窗）、编辑（仅草稿/已驳回状态）、提交审核/修改后重新提交、删除。报名管理弹窗支持批量审核。

**TeacherCompetitionCreate（创建/编辑竞赛）**：双用途页面（通过 `useParams().id` 判断新建或编辑）。表单字段：竞赛名称、封面图上传、主办单位、分类选择（编程/设计/学术/数学建模/电子硬件/创新创业/其他）、参赛资格、联系方式、描述、规则、自定义奖项管理（动态添加/删除）、时间安排（4 个日期选择器，有时间顺序校验）、地点、最大队员数、最大队伍数。附件区域仅编辑模式可见。双提交按钮："保存草稿"（status=0）和"提交审核"（status=1）。`beforeunload` 事件警告未保存的更改。

**TeacherTeams（团队管理）**：双 Tab 页面——"竞赛团队"（教师发布的竞赛的团队）和"指导团队"（教师作为指导老师的团队）。竞赛筛选 + 分页表格 + 可展开行（显示待审核加入请求和已确认成员）。支持审核通过/拒绝、放弃指导。

**TeacherGrades（成绩管理）**：竞赛选择器 + 统计卡片（均分/最高/最低）+ 成绩分布直方图（SVG）+ 成绩表 + 编辑成绩（EditGradeDialog）+ 批量录入弹窗（支持 CSV 导入）+ 发布成绩。

### 7.4 学生页面

**StudentDashboard（仪表盘）**：Bento 网格，"竞赛总览"（可报名 vs 已报名数量）、已发布竞赛列表、即将到期提醒、快捷操作。

**StudentCompetitions（竞赛浏览）**：防抖搜索 + 状态筛选 chips + 4 列卡片网格。每张卡片：封面图、竞赛名称、状态徽章、组织者、描述截断、元数据（报名时间/地点/人数/竞赛时间）、CountdownTimer（报名倒计时）、操作按钮（"查看详情"/"立即报名"或"已报名"禁用态）。报名成功触发 ConfettiEffect 粒子庆祝动画。

**StudentCompetitionDetail（竞赛详情）**：完整竞赛信息展示——封面 + 标题头、2x2 信息网格、竞赛简介、竞赛规则、奖项设置（按等级排序，金银铜色背景）、竞赛附件（可下载）、报名状态。操作按钮：返回列表 / 立即报名。

**StudentRegistration（我的报名）**：4 个指标卡片（总数/已通过/待审核/已拒绝）+ DigitRoller 动画 + 状态筛选 + 4 列卡片网格。每张卡片：竞赛名称、状态、团队名、角色（队长/队员）、报名时间、联系电话、附件、审核备注（拒绝时红色底）。操作：查看详情 / 取消报名（仅待审核状态）。

**StudentGrades（我的成绩）**：仅显示已发布的成绩（`isPublished: 1`）。导出成绩单按钮 + 4 列卡片网格。每张卡片：竞赛名称、分数 + 排名（大号数字）、奖项名称（金色 Trophy 图标）、评语、发布时间。

**StudentTeams（我的团队）**：创建团队 / 加入团队按钮 + 4 列卡片网格。每张卡片：团队名称、状态、竞赛名称、口号、队长标识、指导老师、成员列表。创建弹窗：竞赛选择、团队名称、口号、指导老师选择。加入弹窗：输入团队 ID。

**StudentHistory（参赛历史）**：3 个指标卡片（参赛总数/通过审核/获奖次数）。将报名和成绩数据合并为时间线条目，按最近活动时间排序。每条时间线：竞赛名称、生命周期阶段（报名/审核通过/被拒/参赛中/已评分/获奖）、4 点进度条可视化、可展开详情面板。

### 7.5 个人中心 (ProfilePage)

两个玻璃卡片：用户信息头部（头像 + 上传覆盖层、真实姓名、角色标签、用户名）+ 编辑表单。编辑字段：realName、email、phone、gender（单选药丸选择器）。头像上传（最大 5MB，JPG/PNG/GIF/WebP）。密码修改：旧密码 + 新密码（最少 6 位）+ 确认密码。修改密码成功后 2 秒延迟跳转到登录页。

---

## 八、组件库参考

### 8.1 布局组件

**DesktopLayout**：主布局壳，同时处理桌面端和移动端。桌面端：68px 宽的浮动图标胶囊侧边栏（圆角 34px、毛玻璃效果、specular 高光伪元素、hover 工具提示、shimmer 光效、layoutId 动画激活指示器）+ 顶部搜索栏 + 通知铃铛。移动端：shell 结构（顶部菜单按钮 + 标题 + 铃铛）、可滚动内容区、底部 Tab 栏（最多 5 项，按角色配置）、滑入式抽屉（完整导航 + 用户信息 + 登出）。支持水平滑动切换 Tab（>50px 位移, <600ms 触发，带触觉反馈）。角色导航项定义在 `navItemsByRole` 和 `mobileTabItemsByRole` 中。

**AuthGuard**：路由守卫，检查认证状态和角色权限。

**PageTransition**：路由转场动画，基于 `location.pathname` 的 `AnimatePresence` + spring 动画。

### 8.2 弹窗组件

**GlassModal**：可复用的玻璃态模态框。Props：open, onClose, title?, maxWidth?, children。spring 动画进出，半透明遮罩 + 模糊背景。

**RegistrationModal**：报名弹窗。表单：个人/团队切换、团队选择器、联系电话（正则校验）、备注、附件上传。

**RejectReasonModal**：拒绝原因输入弹窗。Textarea + 红色确认按钮。

### 8.3 显示组件

**Pagination**：分页控件，页码 + 省略号 + 上下页 + 每页条数选择（10/20/50）+ 总条数。

**EmptyState**：空数据占位，居中图标 + 文字。

**ListMeta**：简单计数显示"共 X 条"。

**Skeleton / PageSkeleton**：加载占位。SkeletonLine/Circle/Card/List 基础骨架，LoadingBar 顶部加载条，DashboardSkeleton 仪表盘骨架，TableSkeleton 表格骨架。

### 8.4 动画组件

**DigitRoller**：数字滚动动画，每位数字独立垂直滚动，交错延迟。

**AnimatedCounter**：平滑数字计数器，使用 Motion 的 useMotionValue。

**ConfettiEffect**：Canvas 粒子庆祝效果，150 粒子 + 15 色 + 重力物理 + "报名成功！"覆盖文字。

**CountdownTimer**：实时倒计时，每秒更新，天/时/分/秒 TimeBlock，紧急模式（<24h 琥珀色）。

**SuccessCheck**：动画 SVG 对勾 + SuccessOverlay 全屏覆盖。

**FailureEffect**：抖动动画 + 错误卡片覆盖 + 自动消失进度条。

---

## 九、样式系统

### 9.1 设计语言

项目采用 iOS 26 Liquid Glass（液态玻璃）设计语言，核心视觉特征包括：半透明毛玻璃表面（`backdrop-filter: blur(24px) saturate(1.8)`）、多层阴影 + 内发光高光、鼠标跟随光效（shimmer）、精致的边框和圆角（18px 卡片圆角）。

### 9.2 CSS 变量体系

所有样式通过 CSS 自定义属性（变量）管理，定义在 `index.css` 的 `:root` 中：

颜色系统：`--accent`（#007AFF 蓝色主色调）、`--success`（#34C759 绿色）、`--warning`（#FF9500 橙色）、`--danger`（#FF3B30 红色）、灰度系列、文字层级（`--text-primary`、`--text-secondary`、`--text-tertiary`）。

玻璃表面：`--glass-bg`（rgba(255,255,255,0.42)）、`--glass-border`、`--glass-highlight`、`--glass-blur`（blur(24px) saturate(1.8)）、多层 `--glass-shadow` 含 inset 高光。

布局：`--sidebar-width`（232px 桌面侧边栏）、`--header-height`（56px）。

缓动函数：`--ease-spring`、`--ease-snap`、`--ease-smooth`。

### 9.3 关键样式类

`.glass-card`：基础玻璃卡片，18px 圆角，白色 0.85 透明度背景，cursor-tracked shimmer 光效（通过 `--mouse-x`/`--mouse-y` CSS 变量 + `::before` 折射渐变 + `::after` 镜面反射伪元素）。

`.metric-card`：指标卡片，40px 模糊半径的毛玻璃效果。

`.bento-grid`：4 列不对称网格布局，含 `.bento-lg`、`.bento-wide`、`.bento-tall` 尺寸变体。

`.data-table`：数据表格，hover 行高亮，大写表头。

`.glass-badge`：徽章，纯文本样式无彩色背景。

`.btn`：按钮系列——primary、success、danger、warning、ghost、filled-primary 变体，hover translateY 微上浮，active scale 微缩小。

`.chip`：筛选 chips，玻璃态药丸按钮，`.active` 使用深色玻璃（rgba(28,28,30,0.78)）。

`.glass-search`：搜索输入框，玻璃态 + 图标 + focus accent 边框。

### 9.4 响应式断点

1024px（平板）：侧边栏收缩，网格减少列数。768px（手机）：切换到移动布局（底部 Tab 栏 + 抽屉导航），卡片单列。374px（小屏手机）：进一步压缩间距。

### 9.5 Tailwind CSS 4 配置

项目使用 Tailwind CSS v4 的 CSS-first 模式，通过 `@import "tailwindcss"` 引入，没有 `tailwind.config.js` 文件。所有自定义设计令牌通过 CSS 变量定义，Tailwind 工具类与自定义 CSS 混合使用。

---

## 十、常见开发任务

### 10.1 添加新页面

1. 在 `frontend/src/pages/` 创建页面组件文件（PascalCase 命名，如 `MyNewPage.tsx`）
2. 在 `frontend/src/App.tsx` 添加 import 和 `<Route>` 定义，注意放在对应角色的路由组中
3. 如果需要侧边栏导航入口，在 `frontend/src/components/DesktopLayout.tsx` 的 `navItemsByRole` 和 `mobileTabItemsByRole` 中添加配置
4. 如果页面需要新的 API 调用，在 `frontend/src/api/modules/` 创建或扩展 API 模块

### 10.2 添加新 API 端点

后端：在对应 Controller 类中添加方法（标注 `@GetMapping`/`@PostMapping` 等 + `@PreAuthorize` 权限注解），在 Service 类中实现业务逻辑，如需新 DTO 则在 `dto/` 目录创建。

前端：在 `src/api/modules/` 对应模块文件中添加方法，在 `src/api/types.ts` 添加类型定义，在页面中调用。

### 10.3 添加新的全局弹窗

1. 创建弹窗组件（如 `MyDialog.tsx`）和工具文件（如 `myDialogUtils.ts`）
2. 组件内部管理状态，通过全局函数引用暴露调用接口
3. 在 `App.tsx` 挂载容器组件
4. 在工具文件中定义调用函数，设置/读取全局函数引用

### 10.4 修改数据库结构

这是受限操作。如果确实需要变更，流程如下：

1. 明确列出需要变更的内容（新增表/字段、修改类型等）
2. 告知用户当前规定并说明原因
3. 等待用户明确确认
4. 执行变更（修改 `backend/sql/init.sql`）
5. 同步更新 AGENT.md 中的表结构文档
6. 重建数据库（`docker exec mysql-scms mysql -u root -proot -e "DROP DATABASE IF EXISTS scms;"` 然后重新导入 init.sql）

### 10.5 调试后端

后端启动时配置了 SQL 日志输出（`log-impl: org.apache.ibatis.logging.stdout.StdOutImpl`），所有 SQL 语句会打印到控制台。日志文件保存在 `app.log`。

### 10.6 前端热更新

Vite 开发服务器支持 HMR（热模块替换），修改 `.tsx`/`.ts`/`.css` 文件后浏览器会自动刷新，无需手动重启。但如果修改了 `vite.config.ts` 或环境变量文件（`.env*`），需要重启开发服务器。

---

## 十一、编码规范

### 11.1 前端规范

组件文件使用 PascalCase 命名（如 `AdminDashboard.tsx`），工具函数使用 camelCase（如 `formatDate`）。

类型定义统一放在 `src/api/types.ts`。

样式使用 Tailwind CSS 工具类 + CSS 变量，不硬编码颜色值（使用 `var(--accent)` 等变量）。

所有 catch 块必须同时包含 `toast.error(...)` （用户提示）和 `console.error(...)` （调试日志），不允许空 catch 块。

加载中统一使用 `<PageSkeleton />`，空数据统一使用 `<EmptyState />`，列表计数统一使用 `<ListMeta />`。

图标按钮使用 `.icon-btn` CSS 类（透明背景、无边框、仅图标），不手写内联样式。

共享工具函数（`formatDate`、`resolveCoverUrl`、`formatFileSize`）在 `src/utils/format.ts`，状态徽章映射在 `src/utils/statusBadge.ts`，不要在页面中重复定义。

### 11.2 后端规范

控制器使用 `@RestController` + `@RequestMapping("/路径")`。

服务层使用 `@Service` + 构造器注入（不用 `@Autowired` 字段注入）。

实体类使用 `@Data` + `@TableName`（Lombok）。

权限控制使用 `@PreAuthorize("hasRole('ADMIN')")` 或 `hasAnyRole('TEACHER', 'ADMIN')`。

password 字段应当标注 `@JsonIgnore` 防止序列化泄露（注意：当前 User.java 尚未添加此注解，属于已知安全隐患）。

JSON 字符串字段（awards/attachments）使用 `@JsonIgnore` + `@JsonProperty` 自定义 getter 返回解析后的 List。

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

启动：`java -jar target/scms-backend-1.0.0.jar`

### 12.2 前端打包

```bash
cd frontend
npm run build
```

生成的静态文件在 `frontend/dist/` 目录。

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

后端 `application.yml` 中数据库密码为硬编码（root/root），生产环境应改为环境变量或加密配置。JWT 密钥同样为硬编码，生产环境必须更换为安全的随机密钥。SQL 日志（`log-impl: StdOutImpl`）生产环境应移除。文件上传路径 `./uploads/` 在生产环境应改为绝对路径并配置持久化存储。

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

原来 `GlobalExceptionHandler` 没有 `@ResponseStatus` 注解，所有异常都返回 HTTP 200，前端只能靠 body.code 判断。已修复：400/403/500 各自对应正确的 HTTP 状态码。

### 13.6 DesktopLayout 角色检测

`/profile` 路径没有角色前缀，`getRoleFromPath` 会 fallback 到 student。已修复为使用 `useAuthStore` 的 `user.role` 作为主要判断，URL 推断仅作兜底。

### 13.7 Competition 的 JSON 字段序列化

`awards` 和 `attachments` 是 JSON 字符串字段，如果后端没有正确处理，前端会收到字符串而非数组，调用 `.map()` 时会导致白屏崩溃。已通过 `@JsonIgnore` + `@JsonProperty` 自定义 getter 解决。竞赛详情页额外加了 fallback `JSON.parse` 作为安全兜底。

### 13.8 团队审核的级联同步

审核团队（`auditTeam`）时会将 `auditRemark` 和 `auditTime` 同步写入该团队所有成员的 `competition_registration` 记录，`CompetitionTeam` 实体不再有 `auditRemark` 虚拟字段。

### 13.9 端口冲突

8080 端口可能被 Docker/WSL 占用。启动前先检查 `netstat -ano | findstr :8080`。

### 13.10 User 实体密码字段缺少 @JsonIgnore

`User.java` 的 `password` 字段当前没有 `@JsonIgnore` 注解，导致所有返回用户信息的 API（用户列表、用户详情等）都会将 BCrypt 密码哈希包含在 JSON 响应中。虽然 BCrypt 哈希不可逆，但这仍属于安全隐患，应尽快在 `password` 字段上添加 `@JsonIgnore`。

### 13.11 零测试覆盖

后端虽然引入了 `spring-boot-starter-test` 和 `spring-security-test` 依赖，但 `src/test/` 目录下没有任何测试用例。前端 Playwright 已安装但也未编写 E2E 测试。接手后建议优先为核心业务流程（登录、报名审核、成绩录入）补充测试。

### 13.12 前端批量操作 API 参数不匹配

存在两处前后端参数不一致的问题：

（1）`userApi.batchDelete(ids)` 发送 `{ids: [...]}` 对象，但后端 `@RequestBody List<Long> ids` 期望裸数组 `[1, 2, 3]`。调用会反序列化失败。修复：前端应改为 `request.post('/user/batch-delete', ids)`。

（2）`userApi.batchDisable(ids)` 只发送 `{ids}`，但后端 `BatchUserDTO` 要求 `{ids, status}` 两个字段（`status` 有 `@NotNull` 校验）。调用会返回 400。修复：前端应传入 `batchDisable: (ids: number[], status: number) => request.post('/user/batch-disable', { ids, status })`。

---

## 十四、项目文件索引

### 14.1 配置文件

| 文件 | 用途 |
|------|------|
| `backend/pom.xml` | Maven 依赖管理 |
| `backend/src/main/resources/application.yml` | Spring Boot 应用配置 |
| `backend/sql/init.sql` | 数据库建表 + 种子数据 |
| `frontend/package.json` | npm 依赖管理 |
| `frontend/vite.config.ts` | Vite 构建 + 代理配置 |
| `frontend/tsconfig.json` | TypeScript 编译配置 |
| `frontend/.env` | 共享环境变量 |
| `frontend/.env.development` | 开发环境变量 |
| `frontend/.env.production` | 生产环境变量 |

### 14.2 启动脚本

| 文件 | 用途 |
|------|------|
| `start.bat` | 智能一键启动全栈（后端用 JAR，需先打包） |
| `stop.bat` | 停止 start.bat 启动的所有服务 |
| `start-all.bat` | 开发模式启动（后端 mvn spring-boot:run，支持热编译） |
| `stop-all.bat` | 停止 start-all.bat 启动的服务 |

### 14.3 文档文件

| 文件 | 用途 |
|------|------|
| `README.md` | 项目简介 + 快速开始 |
| `AGENT.md` | AI 代理指南（含完整数据库结构） |
| `DEVELOPMENT.md` | 本文件（完整开发文档） |
| `docs/ER-DIAGRAM.md` | Mermaid ER 图 |
| `docs/UI设计规范.md` | UI 设计规范（Liquid Glass 风格指南） |

---

## 十五、状态码速查表

### 竞赛状态 (competition.status)

| 值 | 含义 | 英文 |
|----|------|------|
| 0 | 草稿 | DRAFT |
| 1 | 待审核 | PENDING |
| 2 | 已发布 | PUBLISHED |
| 3 | 进行中 | ONGOING |
| 4 | 已结束 | ENDED |
| 5 | 已驳回 | REJECTED |

### 报名状态 (competition_registration.status)

| 值 | 含义 |
|----|------|
| 0 | 待审核 |
| 1 | 已通过 |
| 2 | 已拒绝 |

### 团队状态 (competition_team.status)

| 值 | 含义 |
|----|------|
| 0 | 组建中 |
| 1 | 已提交 |
| 2 | 已通过 |
| 3 | 已拒绝 |

### 团队成员状态 (competition_team_member.status)

| 值 | 含义 |
|----|------|
| 0 | 已退出 |
| 1 | 正常 |
| 2 | 待审核 |
| 3 | 已拒绝 |

### 用户类型 (sys_user.user_type)

| 值 | 含义 | role 编码 |
|----|------|-----------|
| 1 | 学生 | student |
| 2 | 教师 | teacher |
| 3 | 管理员 | admin |

### 性别 (sys_user.gender)

| 值 | 含义 |
|----|------|
| 0 | 未知 |
| 1 | 男 |
| 2 | 女 |

### 公告类型 (sys_notice.notice_type)

| 值 | 含义 |
|----|------|
| 1 | 通知 |
| 2 | 公告 |
