# SCMS - 学生竞赛信息管理系统

Student Competition Information Management System

## 项目简介

SCMS 是一个面向高校的学生竞赛信息管理平台，支持管理员、教师、学生三种角色，提供竞赛管理、报名管理、成绩管理、团队协作等功能。项目包含 7 张数据表。

## 功能特性

### 管理员
- 系统总览仪表盘
- 用户管理（增删改查、启用/禁用、批量操作）
- 竞赛审核与管理
- 报名监管（批量审核）
- 成绩管理（编辑、发布、批量录入）
- 公告管理（草稿支持）
- 数据统计（日期筛选、CSV 导出）

### 教师
- 竞赛创建与管理（支持自定义奖项）
- 团队管理（审核备注）
- 成绩录入与发布（批量导入 CSV、按竞赛自定义奖项选择）

### 学生
- 竞赛浏览与报名
- 团队组建与管理
- 成绩查询（显示自定义奖项名称）
- 参赛历史

## 技术栈

### 前端
- **框架**: React 19 + TypeScript
- **构建**: Vite 8
- **样式**: Tailwind CSS 4
- **状态管理**: Zustand 5
- **路由**: React Router DOM 7
- **动画**: Motion (Framer Motion)
- **图标**: Lucide React
- **富文本**: TipTap

### 后端
- **框架**: Spring Boot 3.2.5
- **ORM**: MyBatis-Plus 3.5.6
- **数据库**: MySQL 8
- **认证**: JWT (jjwt 0.12.5)
- **安全**: Spring Security
- **API 文档**: SpringDoc OpenAPI 2.5.0
- **Excel 导出**: EasyExcel 3.3.4
- **工具包**: Hutool 5.8.27

## 快速开始

### 环境要求

- JDK 17+
- Node.js 18+
- MySQL 8.0+
- Maven 3.8+

### 数据库准备

```sql
-- 创建数据库
CREATE DATABASE scms DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;

-- 导入初始化脚本
mysql -u root -p scms < backend/sql/init.sql
```

### 启动项目

#### 方式一：使用脚本（Windows）

```bash
# 启动所有服务
start-all.bat

# 停止所有服务
stop-all.bat
```

#### 方式二：手动启动

**启动后端：**
```bash
cd backend
mvn spring-boot:run
```

**启动前端：**
```bash
cd frontend
npm install
npm run dev
```

### 访问地址

| 服务 | 地址 |
|------|------|
| 前端 | http://localhost:3000 |
| 后端 API | http://localhost:8080/api |
| Swagger | http://localhost:8080/api/swagger-ui.html |

### 默认账号

| 角色 | 账号 | 密码 |
|------|------|------|
| 管理员 | admin | 123456 |
| 教师 | T2024001 | 123456 |
| 学生 | S20210001 | 123456 |

## 项目结构

```
SGADQRS/
├── frontend/                # 前端项目
│   ├── src/
│   │   ├── api/             # API 请求
│   │   │   └── modules/     # 按功能分组 (auth, competition, registration, result, export, system, user)
│   │   ├── components/      # 通用组件 (32 个)
│   │   ├── config/          # 环境变量和常量
│   │   ├── hooks/           # 自定义 Hooks
│   │   ├── motion/          # 动画配置
│   │   ├── pages/           # 页面组件 (按 admin/teacher/student 分组)
│   │   ├── store/           # Zustand 状态管理
│   │   ├── types/           # 类型声明
│   │   └── utils/           # 工具函数
│   └── package.json
├── backend/                 # 后端项目
│   ├── src/main/java/com/scms/
│   │   ├── common/          # 通用类 (Result, GlobalExceptionHandler)
│   │   ├── config/          # 配置 (MyBatis, WebMvc)
│   │   ├── controller/      # REST 控制器 (9 个)
│   │   ├── dto/             # 数据传输对象
│   │   ├── entity/          # 数据库实体
│   │   ├── export/          # Excel 导出模型
│   │   ├── mapper/          # MyBatis Mapper
│   │   ├── security/        # JWT + Spring Security
│   │   ├── service/         # 业务逻辑
│   │   └── util/            # 工具类 (ExcelUtil)
│   ├── sql/                 # 数据库脚本
│   └── pom.xml
├── docs/                    # 文档 (ER 图)
├── AGENT.md                 # AI 代理指南
└── README.md                # 本文件
```

## 配置说明

### 后端配置 (application.yml)

```yaml
server:
  port: 8080
  servlet:
    context-path: /api

spring:
  datasource:
    url: jdbc:mysql://localhost:3306/scms
    username: root
    password: root

jwt:
  secret: your-secret-key
  expiration: 86400000  # 24小时
```

### 前端配置 (vite.config.ts)

```typescript
export default defineConfig({
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
      },
    },
  },
})
```

## API 接口

> 完整接口文档：启动后端后访问 `http://localhost:8080/api/swagger-ui.html`

### 认证

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/auth/login | 用户登录 |
| POST | /api/auth/register | 用户注册 |
| GET | /api/auth/info | 获取当前用户信息 |

### 竞赛管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/competition/list | 竞赛列表（分页、筛选） |
| GET | /api/competition/{id} | 竞赛详情 |
| POST | /api/competition | 创建竞赛 |
| PUT | /api/competition | 更新竞赛 |
| PUT | /api/competition/{id}/audit | 审核竞赛 |
| DELETE | /api/competition/{id} | 删除竞赛 |
| GET | /api/competition/dashboard | 仪表盘统计 |

### 报名管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/registration/list | 报名列表 |
| POST | /api/registration | 学生报名 |
| PUT | /api/registration/{id}/audit | 审核报名 |
| PUT | /api/registration/batch-audit | 批量审核报名 |
| DELETE | /api/registration/{id} | 取消报名 |
| GET | /api/registration/teams | 团队列表 |
| POST | /api/registration/team | 创建团队 |
| POST | /api/registration/team/{id}/join | 加入团队 |
| PUT | /api/registration/team/{id}/audit | 审核团队（支持 auditRemark 参数） |

### 成绩管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/result/list | 成绩列表 |
| POST | /api/result | 录入成绩 |
| PUT | /api/result | 更新成绩 |
| POST | /api/result/publish/{competitionId} | 发布成绩 |
| GET | /api/result/student/stats | 学生成绩统计 |
| GET | /api/result/stats | 按竞赛统计成绩（平均/最高/最低分） |
| POST | /api/result/batch | 批量录入成绩 |

### 用户管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/user/list | 用户列表 |
| GET | /api/user/{id} | 用户详情 |
| POST | /api/user | 创建用户 |
| PUT | /api/user | 更新用户 |
| DELETE | /api/user/{id} | 删除用户 |
| PUT | /api/user/disable/{id} | 启用/禁用用户 |
| PUT | /api/user/reset-password/{id} | 重置密码 |
| POST | /api/user/batch-delete | 批量删除用户 |
| POST | /api/user/batch-disable | 批量禁用/启用用户 |
| GET | /api/user/stats | 用户统计（学生/教师/管理员数量） |

### 公告管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/notice/list | 公告列表 |
| POST | /api/notice | 发布公告 |
| PUT | /api/notice | 更新公告 |
| DELETE | /api/notice/{id} | 删除公告 |
| PUT | /api/notice/{id}/top | 置顶/取消置顶 |

### 数据统计

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/stats/admin | 管理员统计数据 |
| GET | /api/stats/enrollment-trends | 报名趋势 |
| GET | /api/stats/competition-rankings | 竞赛热度排行 |
| GET | /api/stats/upcoming | 即将开始/截止的竞赛 |

### 文件上传

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/file/upload | 上传文件 |

### 数据导出

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/export/competitions | 导出竞赛 |
| GET | /api/export/registrations | 导出报名 |
| GET | /api/export/teams | 导出团队 |
| GET | /api/export/results | 导出成绩 |
| GET | /api/export/student-transcript | 学生成绩单 |

## 部署

### 生产环境构建

```bash
# 后端
cd backend
mvn clean package -DskipTests
java -jar target/scms-backend-1.0.0.jar

# 前端
cd frontend
npm run build
# 将 dist/ 目录部署到 Nginx
```

### Nginx 配置示例

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

## 开发指南

### 添加新页面

1. 在 `frontend/src/pages/` 创建页面组件
2. 在 `frontend/src/App.tsx` 添加路由
3. 在 `frontend/src/components/DesktopLayout.tsx` 添加菜单项

### 添加新 API

1. 在 `frontend/src/api/modules/` 创建 API 模块
2. 在 `frontend/src/api/index.ts` 导出
3. 在 `frontend/src/api/types.ts` 定义类型

### 数据库结构

数据库共 7 张表，完整字段定义和表间关系详见 [AGENT.md](AGENT.md) 中的「数据库结构」章节。

> 当前数据库结构为最终定稿，禁止新增表、新增字段、删除表、删除字段或修改字段类型。详细规定见 AGENT.md。

## 常见问题

### Q: 后端启动失败，端口被占用

```bash
# 查看占用端口的进程
netstat -ano | findstr :8080

# 终止进程
taskkill /PID <进程ID> /F
```

### Q: 前端无法连接后端

1. 确认后端已启动
2. 检查 `vite.config.ts` 代理配置
3. 检查浏览器控制台错误信息

## 更新日志

### 2026-06-16 前端/后端全面优化

修复审查报告中 32 项 A/B/C 类问题，主要改动：
- 修复 4 处硬编码 localhost:8080，统一使用环境变量
- 修复搜索与服务端分页冲突，支持 keyword 服务端搜索
- 新增搜索防抖（useDebounce hook，300ms）
- 新增管理员批量操作（用户批量删除/禁用、报名批量审核）
- 新增成绩批量录入接口（CSV 导入 + 手动编辑）
- 新增成绩统计接口（按竞赛统计平均/最高/最低分）
- 新增用户统计接口
- 新增拒绝原因输入弹窗
- 新增管理员成绩编辑功能
- 新增通知草稿保存功能
- 修复竞赛结束时间（00:00:00 → 23:59:59）
- 修复死链接路由
- 统一确认对话框风格
- 提取报名弹窗为共享组件 RegistrationModal
- 新增加载进度条（LoadingBar）
- 竞赛创建增加分类、参赛资格、联系方式字段

### 2024-12-15 UI 优化

1. **卡片布局优化**：学生端各页面（竞赛浏览、成绩查询、团队管理、报名管理、参赛历史）的卡片布局从 2 列调整为 4 列，提升信息密度
2. **竞赛详情页错误处理**：添加错误边界（Error Boundary），防止页面白屏，并提供友好的错误提示
3. **悬停效果修正**：修复卡片悬停时变得更透明的问题，现在悬停时卡片会变得更不透明，符合直觉交互
4. **封面图比例统一**：赛事封面图统一为 16:9 比例显示

## 许可证

本项目仅供学习交流使用。

## 联系方式

如有问题，请提交 Issue 或联系项目维护者。
