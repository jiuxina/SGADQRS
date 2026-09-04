# SCMS - 学生竞赛信息管理系统

> Student Competition Information Management System
>
> 面向高校的学生竞赛信息管理平台，支持管理员、教师、学生三种角色，覆盖竞赛发布、报名审核、团队组建、成绩录入、数据统计全流程。

## 技术栈

前端: React 19 + TypeScript + Vite 8 + Tailwind CSS 4 + Zustand 5 + React Router 7 + Motion (Framer Motion) + Lucide React + TipTap 富文本编辑器

后端: Spring Boot 3.2.5 + Java 17 + MyBatis-Plus 3.5.6 + MySQL 8 + Spring Security + JWT (jjwt 0.12.5) + EasyExcel 3.3.4 + SpringDoc OpenAPI 2.5.0

## 快速开始

### 环境要求

JDK 17+、Node.js 18+、MySQL 8.0+、Maven 3.8+

### 数据库准备

MySQL 运行在 Docker 容器 `mysql-scms` 中（端口 3306）。创建数据库并导入初始化脚本:

```sql
CREATE DATABASE scms DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
```

```bash
docker exec -i mysql-scms mysql -u root -proot scms < backend/sql/init.sql
```

### 启动项目

**一键启动（推荐）:**

```bash
start.bat
```

该脚本自动检查环境、创建数据库、启动后端 (8080)、前端 (5174)、动画演示 (3001) 并打开浏览器。注意: start.bat 使用预构建的 JAR 文件 (`backend/target/scms-backend-1.0.0.jar`) 启动后端，需先执行 `mvn clean package -DskipTests` 构建 JAR。

**开发模式启动 (使用 mvn spring-boot:run):**

```bash
start-all.bat
```

该脚本使用 `mvn spring-boot:run` 启动后端（支持热编译）、`npm run dev` 启动前端，适合日常开发调试。

**手动启动:**

```bash
# 终端 1 - 后端
cd backend
C:\apache-maven\apache-maven-3.9.16\bin\mvn.cmd spring-boot:run

# 终端 2 - 前端
cd frontend
npm install
npm run dev
```

### 访问地址

| 服务 | 地址 |
|------|------|
| 前端 | http://localhost:5174 (start.bat) 或 http://localhost:3000 (手动) |
| 后端 API | http://localhost:8080/api |
| Swagger 文档 | http://localhost:8080/api/swagger-ui.html |

### 默认账号

| 角色 | 账号 | 密码 |
|------|------|------|
| 管理员 | admin | 123456 |
| 教师 | T2024001 | 123456 |
| 学生 | S20210001 | 123456 |

## 项目结构

```
SGADQRS/
├── frontend/                    # 前端项目 (React + Vite)
│   ├── src/
│   │   ├── api/                 # API 请求层
│   │   │   ├── request.ts       # Axios 实例 + JWT 拦截器
│   │   │   ├── types.ts         # TypeScript 类型定义
│   │   │   └── modules/         # 按功能分组的 API 模块
│   │   ├── components/          # 通用组件 (29 个)
│   │   ├── config/              # 环境变量 + 常量
│   │   ├── hooks/               # 自定义 Hooks (6 个)
│   │   ├── motion/              # Motion 动画配置
│   │   ├── pages/               # 页面 (按 admin/teacher/student 分组, 共 21 个)
│   │   ├── store/               # Zustand 状态管理
│   │   ├── types/               # 类型声明
│   │   └── utils/               # 工具函数
│   └── package.json
├── backend/                     # 后端项目 (Spring Boot)
│   ├── src/main/java/com/scms/
│   │   ├── common/              # 通用类 (Result, GlobalExceptionHandler)
│   │   ├── config/              # 配置 (MyBatis, WebMvc, MetaObjectHandler)
│   │   ├── controller/          # REST 控制器 (10 个, ~50 个 API 端点)
│   │   ├── dto/                 # 数据传输对象 (12 个)
│   │   ├── entity/              # 数据库实体 (7 个)
│   │   ├── export/              # Excel 导出模型 (5 个)
│   │   ├── mapper/              # MyBatis Mapper (7 个)
│   │   ├── security/            # JWT + Spring Security (5 个)
│   │   ├── service/             # 业务逻辑 (8 个)
│   │   └── util/                # 工具类 (ExcelUtil)
│   ├── src/main/resources/
│   │   └── application.yml      # 应用配置
│   ├── sql/
│   │   └── init.sql             # 建表 + 初始数据
│   └── pom.xml
├── docs/                        # 项目文档
├── start.bat / stop.bat         # 启停脚本 (JAR 模式)
├── start-all.bat / stop-all.bat # 开发启停脚本 (mvn 模式)
├── AGENT.md                     # AI 代理指南
├── DEVELOPMENT.md               # 完整开发文档
└── README.md                    # 本文件
```

## 核心功能

**管理员**: 系统总览仪表盘、用户 CRUD (含批量操作)、竞赛审核与管理、报名监管 (批量审核)、成绩管理与发布、公告管理 (富文本 + 草稿)、数据统计与 CSV 导出

**教师**: 竞赛创建与管理 (自定义奖项、附件上传)、团队管理 (含指导老师审核)、成绩录入与发布 (批量 CSV 导入)、仪表盘

**学生**: 竞赛浏览与报名、团队组建 (创建/加入/邀请指导老师)、成绩查询 (自定义奖项展示)、参赛历史时间线

## 数据库

系统共 7 张表: `sys_user` (用户)、`competition` (竞赛)、`competition_registration` (报名)、`competition_team` (团队)、`competition_team_member` (团队成员)、`competition_result` (成绩)、`sys_notice` (公告)。

完整的表结构定义、字段说明和表间关系详见 [AGENT.md](AGENT.md) 和 [DEVELOPMENT.md](DEVELOPMENT.md)。

> 当前数据库结构为最终定稿，禁止新增表/字段、删除表/字段、修改字段类型或添加 FK 约束。如需变更须用户明确确认并同步更新文档。

## 生产部署

```bash
# 后端打包
cd backend
C:\apache-maven\apache-maven-3.9.16\bin\mvn.cmd clean package -DskipTests
java -jar target/scms-backend-1.0.0.jar

# 前端构建
cd frontend
npm run build
```

Nginx 反向代理配置:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        root /path/to/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://localhost:8080/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 许可证

本项目仅供学习交流使用。
