# 赛友 TeamUp（SCMS）— 学生竞赛组队社区

> Student Competition Information Management System
>
> 面向高校的学生竞赛信息管理平台，支持管理员、教师、学生三种角色，覆盖竞赛发布、组队招募、参赛审核、成绩录入、消息公告全流程。前后端分离：React 19 SPA + Spring Boot REST API + MySQL 8。

| 文档 | 用途 |
|------|------|
| 本文件（README.md） | **全栈部署与运行手册（面向 AI Agent，命令均可在 Git Bash 直接执行）** |
| [AGENT.md](AGENT.md) | AI 代理的项目上下文、架构约定、编码规范 |
| [DEVELOPMENT.md](DEVELOPMENT.md) | 完整开发文档（数据库/后端/前端/API 参考/踩坑记录） |
| [docs/ER-DIAGRAM.md](docs/ER-DIAGRAM.md) | 数据库 ER 图 |
| [docs/UI设计规范.md](docs/UI设计规范.md) | iOS 26 Liquid Glass 设计规范 |
| [docs/frontend-test-plan/](docs/frontend-test-plan/) | 前端验证计划与历史测试报告 |

---

## 1. 架构与端口总览

| 组件 | 技术 | 地址 | 说明 |
|------|------|------|------|
| 前端 dev server | Vite 8 + React 19 | http://localhost:3000 | `vite.config.ts` 固定端口 3000，占用时 Vite 自动 +1 |
| 后端 API | Spring Boot 3.2.5（Java 17） | http://localhost:8080/api | context-path 为 `/api`，所有接口前缀 `/api/**` |
| Swagger 文档 | SpringDoc OpenAPI | http://localhost:8080/api/swagger-ui/index.html | 后端启动后可访问 |
| MySQL 8 | Docker 容器 `mysql-scms` | localhost:3306 | root/root，库名 `scms`，重启策略 unless-stopped |
| 上传/静态文件 | 本地磁盘 | `./uploads/`、`./public/` | **相对后端进程启动目录解析**，务必从 `backend/` 目录启动（见 §5.2） |

前端 dev server 已配置代理：`/api/**`（含 `/api/ws` WebSocket）→ `http://localhost:8080`，因此浏览器端只访问 3000 端口即可，不存在跨域问题。

## 2. 环境要求（本机实测）

| 工具 | 版本要求 | 本机现状 | 备注 |
|------|------|------|------|
| JDK | 17+ | Zulu 21.0.9 | `java -version` 可用即可 |
| Maven | 3.8+ | 3.9.16，已在 PATH | 若 `mvn` 不可用，尝试 `C:\tools\maven\apache-maven-3.9.16\bin\mvn.cmd` 或 `C:\apache-maven\apache-maven-3.9.16\bin\mvn.cmd` |
| Node.js | 18+ | v22.19.0 | |
| Docker Desktop | 任意近期版本 | 已安装 | **必须先启动 Docker Desktop，容器才会运行** |
| Python | 3.x（仅跑冒烟脚本需要） | 3.12 | 标准库实现，无需 pip 安装 |

---

## 3. Agent 快速部署通道（TL;DR）

> 每一步都给出验证命令与期望输出。按序执行即可得到可登录的完整系统。所有命令在 Git Bash（Windows）下验证通过。

```bash
# ── 第 0 步：确认端口占用情况（后端/前端可能已在运行，先探测再决定是否启动）──
netstat -ano | grep LISTENING | grep -E ':(3000|8080) '
# 有输出 → 服务已在运行，跳过对应启动步骤；无输出 → 继续下面的步骤

# ── 第 1 步：启动 MySQL（必须先启动 Docker Desktop 本体）──
"/c/Program Files/Docker/Docker/Docker Desktop.exe" &   # 若 Docker Desktop 未运行
docker start mysql-scms
docker exec mysql-scms mysql -uroot -proot -e "SELECT 1;"
# 期望：输出 1（有 "Using a password on the command line" 警告属正常）

# ── 第 2 步：初始化数据库（仅全新安装需要；库已存在则跳过）──
docker exec -i mysql-scms mysql -uroot -proot < backend/sql/init.sql
# 期望：无报错退出。init.sql 自带 CREATE DATABASE + 建表 + 种子数据
# 旧库升级路径见 §4.2

# ── 第 3 步：启动后端（工作目录必须是 backend/，原因见 §5.2）──
cd backend && mvn spring-boot:run          # 前台运行；后台任务方式亦可
# 就绪标志：日志出现 "Started ScmsApplication in X seconds"，耗时约 10~20 秒

# 验证后端（新开一个终端）：
curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" -d '{"username":"admin","password":"123456"}'
# 期望：{"code":200,"message":"登录成功","data":{"user":{...},"token":"..."}}

# ── 第 4 步：启动前端 ──
cd frontend
npm install        # 首次或依赖变更后执行
npm run dev
# 期望：Vite 输出 "Local: http://localhost:3000/"

curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/
# 期望：200

# ── 第 5 步：全链路冒烟（可选但推荐，自动清理写入的数据）──
python backend/smoke_full.py
# 期望：全部 [PASS]，结尾 PASS/FAIL 统计且 FAIL=0
```

浏览器访问 http://localhost:3000 ，用 §6 的账号登录即完成部署。

---

## 4. 分步详解

### 4.1 MySQL（Docker）

容器 `mysql-scms` 的实际配置（`docker inspect` 可复核）：镜像 `mysql:8.0`，端口 `3306:3306`，环境变量 `MYSQL_ROOT_PASSWORD=root`、`MYSQL_DATABASE=scms`，重启策略 `unless-stopped`。

**Windows 上最常见的失败原因：Docker Desktop 本体没有启动。** 容器设了自启，但宿主的 Docker 引擎不跑，`docker` 命令会报 `error during connect`。先启动 Docker Desktop（双击或命令行启动），等托盘图标变绿，再 `docker start mysql-scms`（若因 `unless-stopped` 已自启会提示已在运行，无害）。

新机器上没有该容器时，按原配置重建：

```bash
docker run -d --name mysql-scms -p 3306:3306 \
  -e MYSQL_ROOT_PASSWORD=root -e MYSQL_DATABASE=scms \
  --restart unless-stopped mysql:8.0
```

### 4.2 数据库初始化与升级

| 场景 | 操作 |
|------|------|
| 全新安装 | `docker exec -i mysql-scms mysql -uroot -proot < backend/sql/init.sql`（自带建库建表 + 演示数据） |
| 旧版 SCMS 库（无社区表） | 依次执行 `upgrade-teamup.sql` → `upgrade-lean.sql` → `upgrade-lean2.sql`（导入方式同上，逐个执行） |
| 已是当前结构 | 无需操作；判断依据：`docker exec mysql-scms mysql -uroot -proot -N -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='scms';"` 应为 8 |

当前 schema 共 **8 张表**：`sys_user`（用户）、`competition`（竞赛）、`competition_team`（参赛队伍，单人赛=1 人队）、`competition_team_member`（队员）、`competition_result`（成绩）、`recruit_post`（招募/求组帖）、`community_request`（互看/入队申请/邀请）、`sys_notification`（站内通知，`user_id=0` 为全员公告）。

> **Agent 注意**：数据库结构变更必须先获得用户明确确认，并同步更新 `init.sql`、升级脚本与文档（见 AGENT.md）。禁止为测试随意删除/修改种子数据。

### 4.3 后端启动

**开发模式（推荐）**——改代码后重启进程即生效，日志实时可见：

```bash
cd backend
mvn spring-boot:run
```

**JAR 模式**（`start.bat` 依赖）：

```bash
cd backend
mvn clean package -DskipTests     # 产物 backend/target/scms-backend-1.0.0.jar
java -jar target/scms-backend-1.0.0.jar
```

**工作目录敏感**：`application.yml` 中 `file.upload-path: ./uploads/`、`logging.file.name: app.log` 均为相对路径，`StaticFileController` 也按 `user.dir` 解析 `public/`（种子海报存于 `backend/public/`）。因此**必须让后端进程的工作目录是 `backend/`**，否则海报 404、上传文件散落、日志写到别处。

- 日志位置：`backend/app.log`（按天滚动出 `app.log.YYYY-MM-DD.0.gz`）
- 端口/上下文：`server.port=8080`，`servlet.context-path=/api`

### 4.4 前端启动

```bash
cd frontend
npm install
npm run dev        # http://localhost:3000
```

- 端口固定 3000（`vite.config.ts`）；3000 被占时 Vite 自动使用 3001——此时 Playwright e2e 会失败（baseURL 写死 3000），先释放 3000 再跑。
- 环境变量：`.env.development` 的 `VITE_API_BASE_URL` 仅在直连后端时使用；dev 下请求走 Vite 代理，通常无需改动。`.env.production` 指向占位域名 `https://api.your-domain.com`，**生产构建前必须改成实际地址**。
- 前端代码改动由 Vite HMR 热更新；**后端 Java 代码改动需重启 `mvn spring-boot:run` 进程**。

### 4.5 默认账号

| 角色 | 账号 | 密码 | user_id |
|------|------|------|------|
| 管理员 | `admin` | `123456` | 1 |
| 教师 | `T2024001` | `123456` | 2 |
| 学生 | `S20210001` | `123456` | 4 |

密码为 BCrypt 存储；**禁止在测试中真实修改这些账号的密码**。

## 5. 一键脚本（Windows）

| 脚本 | 模式 | 行为 |
|------|------|------|
| `start.bat` | JAR | 检查 Java/Node/MySQL → 建库（缺失时自动导入 init.sql，旧库自动跑 upgrade-teamup）→ `java -jar` 起后端 → `npm run dev` 起前端 → 开浏览器。**需先 `mvn clean package -DskipTests`** |
| `stop.bat` | — | 按窗口标题 + 端口（8080/3000）兜底杀进程 |
| `start-all.bat` | dev | `mvn spring-boot:run` + `npm run dev`，各开一个 cmd 窗口 |
| `stop-all.bat` | — | 按窗口标题杀进程 |

脚本假设 MySQL 已在 3306 运行且 root/root 可连；Docker Desktop 未启动时请先手动处理。

## 6. 测试与验证

```bash
# 后端全链路冒烟（需后端 8080 + mysql-scms 运行；自动清理本次写入的数据）
python backend/smoke_full.py

# 前端 e2e（需前端 3000 + 后端 8080 运行）
cd frontend && npx playwright test          # 用例：frontend/e2e/teamup.spec.ts

# 前端类型检查 + 生产构建
cd frontend && npm run build                # tsc -b && vite build

# 后端编译 / 打包
cd backend && mvn compile
cd backend && mvn clean package -DskipTests
```

## 7. 生产部署

```bash
# 后端
cd backend && mvn clean package -DskipTests
java -jar target/scms-backend-1.0.0.jar        # 建议注册为系统服务（如 WinSW/systemd）

# 前端
cd frontend && npm run build                  # 产物 frontend/dist/
```

Nginx 反向代理参考（前端静态 + API 转发）：

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
        proxy_http_version 1.1;               # /api/ws 需要
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

生产前检查清单：`frontend/.env.production` 的 API 域名、`application.yml` 的数据源口令与 `jwt.secret`（默认值仅供开发）、上传目录磁盘位置、MySQL 口令。

## 8. 故障排查（Agent 速查）

| 症状 | 根因 | 处置 |
|------|------|------|
| 登录接口 500 / 后端启动即报数据库连接失败 | Docker Desktop 未启动或 `mysql-scms` 未运行 | 启动 Docker Desktop → `docker start mysql-scms` → 重试 |
| `docker` 命令报 `error during connect` | Docker 引擎未运行 | 同上 |
| 8080 被占用（`Port 8080 was already in use`） | 残留 java 进程 | `netstat -ano | grep LISTENING | grep ':8080 '` 查 PID，CMD 下 `taskkill /F /PID <pid> /T`（Git Bash 中斜杠写成 `//F //PID <pid> //T`） |
| 3000 被占，Vite 用了 3001 | 前端已在跑或残留进程 | 释放 3000（复用已跑的前端即可），否则 e2e 会连不上 |
| `mvn: command not found` | PATH 缺失 | 用全路径 `C:\tools\maven\apache-maven-3.9.16\bin\mvn.cmd` |
| 海报/静态文件 404 | 后端启动目录不对，`public/` 未被解析 | 从 `backend/` 目录启动后端 |
| 上传的文件找不到 | `./uploads/` 相对启动目录 | 同上；历史文件在仓库根 `uploads/`（不要删除） |
| 前端请求全部 404/超时 | 后端没起或端口非 8080 | 先 `curl -s http://localhost:8080/api/auth/login -X POST -H "Content-Type: application/json" -d '{}'`，有 JSON 返回（哪怕 code≠200）即后端正常 |
| e2e 大面积超时 | 前端或后端未启动 | 先按 §3 检查两个端口 |
| Git Bash 管道导入 SQL 报编码问题 | — | 改在 CMD/PowerShell 执行 `docker exec -i mysql-scms mysql -uroot -proot scms < backend/sql/init.sql`，或 `docker cp` 进容器后 `docker exec` 导入 |

## 9. 项目结构（整理后）

```
SGADQRS/
├── README.md                    # 本文件：部署运行手册
├── AGENT.md                     # AI 代理指南（架构/规范）
├── DEVELOPMENT.md               # 完整开发文档
├── start.bat / stop.bat           # 一键启停（JAR 模式）
├── start-all.bat / stop-all.bat   # 一键启停（dev 模式）
├── .gitignore                   # 已忽略：日志、backend/target、测试输出等
├── backend/
│   ├── src/main/java/com/scms/    # controller/dto/entity/mapper/service/security/export/util
│   ├── src/main/resources/application.yml
│   ├── public/                    # 种子海报（随 /public/** 提供，启动目录敏感）
│   ├── sql/                       # init.sql + upgrade-teamup/lean/lean2.sql
│   ├── smoke_full.py              # 全链路冒烟脚本（自动清理）
│   └── target/                    # 构建产物（git 忽略，不入库）
├── frontend/
│   ├── src/                       # api/components/config/hooks/pages/store/utils
│   ├── e2e/teamup.spec.ts         # Playwright 用例
│   ├── scripts/                 # 一次性调试/截图/审计脚本（node scripts/xxx.mjs）
│   ├── e2e / playwright.config.ts
│   └── .env*                       # 环境变量
├── docs/                          # ER 图、UI 规范、历史测试报告（frontend-test-plan/）
└── uploads/                       # 用户上传文件（运行时数据，勿删）
```

## 10. 维护约定

- 数据库结构变更：先经用户确认，同步改 `init.sql` + 升级脚本 + 文档。
- 种子数据（8 张表演示数据、`backend/public/` 海报、根 `uploads/` 文件）视为资产，禁止删除。
- 日志（`*.log`）、`backend/target/`、`frontend/test-results/`、截图输出均已 gitignore，不要提交。
- 提交信息请描述变更内容，勿使用纯序号。
