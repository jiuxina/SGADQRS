# SCMS - 学生竞赛信息管理系统

Student Competition Information Management System

## 项目简介

SCMS 是一个面向高校的学生竞赛信息管理平台，支持管理员、教师、学生三种角色，提供竞赛管理、报名管理、成绩管理、团队协作等功能。

## 功能特性

### 管理员
- 系统总览仪表盘
- 用户管理（增删改查、启用/禁用）
- 组织架构管理（院系、专业、班级）
- 竞赛审核与管理
- 报名监管
- 成绩管理
- 公告管理
- 系统日志
- 数据统计

### 教师
- 竞赛创建与管理（支持自定义奖项）
- 团队管理
- 成绩录入与发布（按竞赛自定义奖项选择）
- 证书附件上传
- 消息通知

### 学生
- 竞赛浏览与报名
- 团队组建与管理
- 成绩查询（显示自定义奖项名称）
- 证书下载
- 参赛历史
- 消息通知

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
- **WebSocket**: STOMP + SockJS

### 后端
- **框架**: Spring Boot 3.2.5
- **ORM**: MyBatis-Plus 3.5.6
- **数据库**: MySQL 8
- **认证**: JWT (jjwt 0.12.5)
- **安全**: Spring Security
- **WebSocket**: Spring WebSocket + STOMP

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
│   │   ├── components/      # 通用组件
│   │   ├── config/          # 配置
│   │   ├── hooks/           # 自定义 Hooks
│   │   ├── pages/           # 页面组件
│   │   ├── store/           # 状态管理
│   │   └── utils/           # 工具函数
│   └── package.json
├── backend/                 # 后端项目
│   ├── src/main/java/com/scms/
│   │   ├── controller/      # REST 控制器
│   │   ├── service/         # 业务逻辑
│   │   ├── entity/          # 数据库实体
│   │   ├── mapper/          # MyBatis Mapper
│   │   ├── security/        # 安全认证
│   │   └── config/          # 配置类
│   └── pom.xml
├── docs/                    # 文档
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

### 认证

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/auth/login | 用户登录 |
| POST | /api/auth/register | 用户注册 |
| GET | /api/auth/info | 获取当前用户信息 |

### 竞赛管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/competition/list | 竞赛列表 |
| POST | /api/competition | 创建竞赛 |
| PUT | /api/competition | 更新竞赛 |
| DELETE | /api/competition/{id} | 删除竞赛 |

### 成绩管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/result/list | 成绩列表 |
| POST | /api/result | 录入成绩 |
| PUT | /api/result | 更新成绩 |
| POST | /api/result/publish/{id} | 发布成绩 |

### 文件上传

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/file/upload | 上传文件 |

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

    location /api/ws {
        proxy_pass http://localhost:8080/api/ws;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
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

### 数据库迁移

```bash
# 连接数据库
mysql -u root -p scms

# 执行迁移脚本
source backend/sql/migration_xxx.sql
```

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

### Q: WebSocket 连接失败

- 确认 WebSocket URL 为 `/api/ws`（不是 `/ws`）
- 检查 Vite proxy 配置中 `ws: true`

## 许可证

本项目仅供学习交流使用。

## 联系方式

如有问题，请提交 Issue 或联系项目维护者。
