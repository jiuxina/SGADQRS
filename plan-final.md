# 学生毕业及学位资格审查系统 — 最终版完整计划

> 版本：v3.0 | 日期：2026-06-11 | 定位：辅助决策型系统（非全自动）

---

## 一、项目定位与核心原则

### 1.1 系统定位

**"毕业资格审核辅助决策系统"** —— 辅助教务处、院系负责人、教师快速发现问题学生，减少人工计算错误，最终审核决策仍由人工完成。

### 1.2 核心原则

| 原则 | 说明 |
|------|------|
| **简单优先** | 能用Excel解决的，不上系统；能手动配置的，不做可视化 |
| **人工兜底** | 所有自动审核结果必须支持人工调整，并记录原因 |
| **渐进上线** | 先上一届试运行，对比老方法，逐步推广 |
| **降低预期** | 明确告知用户这是"辅助工具"，不是"万能系统" |
| **留好退路** | 系统出问题，能快速导出数据，回到手工模式 |

---

## 二、需求分析

### 2.1 用户角色

| 角色 | 核心需求 | 使用场景 |
|------|----------|----------|
| **学生** | 查看个人审核结果、了解"还差什么" | 毕业季查询 |
| **辅导员/教师** | 查看班级预警学生、提前干预 | 学期中预警 |
| **院系负责人** | 本院系审核辅助、数据汇总上报 | 学位委员会初审 |
| **教务处管理员** | 全校审核看板、规则配置、数据导入 | 全校终审 |

### 2.2 功能需求

#### P0 — 必须上线
- [ ] 数据导入（Excel模板：学生、课程、成绩）
- [ ] 培养方案管理（各专业毕业要求配置）
- [ ] 学生毕业条件预警（提前一学期告知"还差什么"）
- [ ] 教务处审核辅助看板（快速筛选问题学生）
- [ ] 审核报表导出（学位委员会需要的表格）

#### P1 — 重要
- [ ] 试审核模式（预览不保存）+ 正式审核模式（锁定记录）
- [ ] 多级审核流程（初核→复核→审议→批准）
- [ ] 人工标记（特殊情况手动调整并记录原因）
- [ ] 成绩录入状态（区分"未录入"和"不合格"）

#### P2 — 延后
- [ ] 学生端查询页面（可先由辅导员转发）
- [ ] 消息通知（站内信/邮件）
- [ ] 可视化规则编辑器（初期用JSON配置文件）

### 2.3 非功能需求

| 类型 | 要求 |
|------|------|
| **性能** | 单学生审核<3秒，批量100人/批次，并发200+ |
| **安全** | 等保二级，密码bcrypt加密，JWT认证，SQL参数化 |
| **隐私** | 登录页隐私政策，敏感数据脱敏，操作日志记录查看行为 |
| **维护** | 代码简单直观，文档完整，配置集中管理 |
| **资源** | 适配4核8G服务器，前端代码分割，后端避免N+1查询 |

---

## 三、技术方案

### 3.1 技术栈

| 层级 | 选型 | 理由 |
|------|------|------|
| 前端 | React 18 + TypeScript + Vite | 构建快，适合Agent快速迭代 |
| UI | Tailwind CSS + shadcn/ui | 原子化CSS，现代化设计 |
| 后端 | Express.js + TypeScript | 轻量简单，高校IT人员易维护 |
| 数据库 | MySQL 8.0 | 高校普遍使用，DBA熟悉 |
| ORM | Prisma | 类型安全，迁移方便 |
| Excel | xlsx.js | 前端导入导出，无需服务端处理 |
| Word | docx.js | 客户端生成，减轻服务端压力 |
| 部署 | PM2 + Nginx | 传统方案，学校IT部门熟悉 |

### 3.2 架构图

```
客户端 (React + Vite)
    │
    ▼
Nginx (反向代理 + 静态资源)
    │
    ▼
Express API (业务逻辑 + 数据校验)
    │
    ▼
Prisma ORM (数据库访问)
    │
    ▼
MySQL 8.0 (数据存储)
```

### 3.3 关键技术决策

1. **单仓库结构**：`frontend/` + `backend/` 在一个Git仓库
2. **Express替代NestJS**：减少装饰器、依赖注入，代码更直观
3. **MySQL替代PostgreSQL**：与高校现有技术栈一致
4. **无Redis/BullMQ**：初期用MySQL任务表实现异步
5. **Excel导入优先**：提供标准模板，支持批量导入
6. **规则配置用JSON文件**：初期通过修改配置文件+发版实现
7. **成绩状态设计**：`entryStatus`字段区分已录入/待录入/免修
8. **审核结果双模式**：`trial`（试审核，预览不保存）+ `official`（正式审核，锁定记录日志）
9. **多级审核状态机**：`draft` → `initial` → `dept` → `committee` → `approved`/`rejected`，支持回退
10. **人工标记表**：单独`manual_overrides`表记录人工调整，与自动结果分离
11. **低资源优化**：前端路由懒加载、后端接口分页、数据库索引覆盖查询字段

---

## 四、数据库设计

### 4.1 ER图

```
users (用户表)
  │
  ├── students (学生表) ── majors (专业表) ── departments (院系表)
  │       │
  │       ├── grades (成绩表) ── courses (课程表)
  │       │       │
  │       │       └── entryStatus: entered/pending/exempted
  │       │
  │       ├── audit_results (审核结果表)
  │       │       │
  │       │       ├── mode: trial/official
  │       │       ├── status: passed/failed/warning/pending_score
  │       │       ├── isLocked: boolean
  │       │       └── calculationLog: JSON
  │       │
  │       ├── audit_flows (审核流程表)
  │       │       │
  │       │       ├── currentStage: initial/dept/committee/approved
  │       │       ├── status: pending/passed/rejected/returned
  │       │       └── remarks: JSON
  │       │
  │       └── manual_overrides (人工标记表)
  │               │
  │               ├── overrideType: pass/fail/exempt
  │               ├── reason: text (必填)
  │               └── evidence: text
  │
  └── programs (培养方案表)
          │
          ├── totalCredits: number
          ├── requiredCourses: JSON
          ├── electiveCredits: number
          └── minGPA: number
```

### 4.2 核心表结构

#### users（用户表）
```sql
CREATE TABLE users (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  username VARCHAR(50) NOT NULL UNIQUE COMMENT '学工号',
  password_hash VARCHAR(255) COMMENT '密码哈希',
  name VARCHAR(100) NOT NULL COMMENT '姓名',
  role ENUM('student', 'teacher', 'dept_admin', 'school_admin') NOT NULL,
  department_id VARCHAR(36) COMMENT '所属院系',
  is_active BOOLEAN DEFAULT TRUE,
  last_login_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### students（学生表）
```sql
CREATE TABLE students (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id VARCHAR(36) NOT NULL,
  student_no VARCHAR(20) NOT NULL UNIQUE COMMENT '学号',
  name VARCHAR(100) NOT NULL,
  major_id VARCHAR(36) NOT NULL COMMENT '专业ID',
  degree_type ENUM('bachelor', 'master', 'doctor') NOT NULL,
  enrollment_year INT NOT NULL,
  expected_graduation_year INT NOT NULL,
  status ENUM('active', 'graduated', 'dropped', 'suspended') DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (major_id) REFERENCES majors(id)
);
```

#### grades（成绩表 — 含录入状态）
```sql
CREATE TABLE grades (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  student_id VARCHAR(36) NOT NULL,
  course_id VARCHAR(36) NOT NULL,
  semester VARCHAR(20) NOT NULL COMMENT '学期，如2023-2024-1',
  score DECIMAL(5,2) COMMENT '分数（未录入时为NULL）',
  grade_point DECIMAL(3,2) COMMENT '绩点（未录入时为NULL）',
  entry_status ENUM('entered', 'pending', 'exempted') DEFAULT 'entered' COMMENT '录入状态',
  exam_type ENUM('regular', 'retake', 'exempted') DEFAULT 'regular' COMMENT '考试类型',
  status ENUM('valid', 'invalid') DEFAULT 'valid',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id),
  FOREIGN KEY (course_id) REFERENCES courses(id),
  UNIQUE KEY uk_student_course_semester (student_id, course_id, semester, exam_type)
);
```

#### audit_results（审核结果表 — 双模式）
```sql
CREATE TABLE audit_results (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  student_id VARCHAR(36) NOT NULL,
  audit_type ENUM('graduation', 'degree') NOT NULL COMMENT '审核类型',
  mode ENUM('trial', 'official') DEFAULT 'trial' COMMENT '试审核/正式审核',
  status ENUM('passed', 'failed', 'warning', 'pending_score') NOT NULL,
  total_credits DECIMAL(5,1) COMMENT '总学分',
  gpa DECIMAL(3,2) COMMENT '平均绩点',
  missing_items JSON COMMENT '缺少的条件明细',
  calculation_log JSON COMMENT '完整计算日志',
  rule_version INT DEFAULT 1,
  is_locked BOOLEAN DEFAULT FALSE COMMENT '正式审核后锁定',
  calculated_by VARCHAR(36) COMMENT '计算人',
  calculated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id),
  UNIQUE KEY uk_student_audit_mode (student_id, audit_type, mode, rule_version)
);
```

#### audit_flows（审核流程表 — 多级流转）
```sql
CREATE TABLE audit_flows (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  student_id VARCHAR(36) NOT NULL,
  audit_type ENUM('graduation', 'degree') NOT NULL,
  current_stage ENUM('initial', 'dept', 'committee', 'approved') DEFAULT 'initial',
  status ENUM('pending', 'passed', 'rejected', 'returned') DEFAULT 'pending',
  remarks JSON COMMENT '流转记录',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id)
);
```

#### manual_overrides（人工标记表）
```sql
CREATE TABLE manual_overrides (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  student_id VARCHAR(36) NOT NULL,
  audit_type ENUM('graduation', 'degree') NOT NULL,
  override_type ENUM('pass', 'fail', 'exempt') NOT NULL,
  reason TEXT NOT NULL COMMENT '调整原因（必填）',
  evidence TEXT COMMENT '佐证材料',
  created_by VARCHAR(36) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);
```

#### programs（培养方案表）
```sql
CREATE TABLE programs (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  major_id VARCHAR(36) NOT NULL,
  degree_type ENUM('bachelor', 'master', 'doctor') NOT NULL,
  total_credits DECIMAL(5,1) NOT NULL COMMENT '总学分要求',
  required_courses JSON COMMENT '必修课课程代码列表',
  elective_credits DECIMAL(5,1) NOT NULL COMMENT '选修课学分要求',
  practice_required BOOLEAN DEFAULT TRUE COMMENT '是否需要实践环节',
  thesis_required BOOLEAN DEFAULT TRUE COMMENT '是否需要毕业论文',
  min_gpa DECIMAL(3,2) NOT NULL COMMENT '最低平均绩点',
  min_degree_gpa DECIMAL(3,2) COMMENT '最低学位课程绩点',
  effective_year INT NOT NULL COMMENT '生效年级',
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (major_id) REFERENCES majors(id)
);
```

### 4.3 索引设计

```sql
-- 学生表索引
CREATE INDEX idx_students_major ON students(major_id);
CREATE INDEX idx_students_degree_type ON students(degree_type);
CREATE INDEX idx_students_expected_graduation ON students(expected_graduation_year);
CREATE INDEX idx_students_status ON students(status);

-- 成绩表索引
CREATE INDEX idx_grades_student ON grades(student_id);
CREATE INDEX idx_grades_course ON grades(course_id);
CREATE INDEX idx_grades_entry_status ON grades(entry_status);

-- 审核结果表索引
CREATE INDEX idx_audit_results_student ON audit_results(student_id);
CREATE INDEX idx_audit_results_type ON audit_results(audit_type);
CREATE INDEX idx_audit_results_status ON audit_results(status);
CREATE INDEX idx_audit_results_mode ON audit_results(mode);

-- 审核流程表索引
CREATE INDEX idx_audit_flows_student ON audit_flows(student_id);
CREATE INDEX idx_audit_flows_stage ON audit_flows(current_stage);
```

---

## 五、接口设计

### 5.1 规范

- 基础路径：`/api/v1`
- 认证：JWT Bearer Token
- 数据格式：JSON
- 分页：`page`, `pageSize`
- 响应：
```json
{
  "code": 200,
  "message": "success",
  "data": {},
  "timestamp": 1718083200000
}
```

### 5.2 核心接口

#### 认证模块
| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| POST | `/auth/login` | 登录 | 公开 |
| POST | `/auth/logout` | 登出 | 已登录 |
| GET | `/auth/profile` | 获取当前用户 | 已登录 |

#### 学生模块
| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | `/students` | 学生列表 | admin |
| GET | `/students/:id` | 学生详情 | 本人/admin |
| GET | `/students/:id/audit` | 学生审核结果 | 本人/admin |

#### 审核模块（核心）
| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| POST | `/audit/trial` | 试审核（预览不保存） | admin |
| POST | `/audit/official` | 正式审核（锁定记录） | school_admin |
| GET | `/audit/results` | 审核结果列表 | admin |
| GET | `/audit/results/:id/detail` | 审核明细（含计算日志） | admin |

#### 审核流程模块
| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| POST | `/audit-flow/:id/submit` | 提交到下一级 | admin |
| POST | `/audit-flow/:id/approve` | 批准 | admin |
| POST | `/audit-flow/:id/reject` | 驳回 | admin |
| POST | `/audit-flow/:id/return` | 退回上一级 | admin |

#### 人工标记模块
| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| POST | `/manual-overrides` | 创建人工标记 | school_admin |
| GET | `/manual-overrides` | 人工标记列表 | admin |
| DELETE | `/manual-overrides/:id` | 撤销人工标记 | school_admin |

#### 数据导入模块
| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| POST | `/import/students` | 导入学生 | school_admin |
| POST | `/import/courses` | 导入课程 | school_admin |
| POST | `/import/grades` | 导入成绩 | school_admin |
| GET | `/import/template/:type` | 下载导入模板 | admin |

#### 报表模块
| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | `/reports/statistics` | 审核统计 | admin |
| GET | `/reports/export` | 导出名单 | admin |
| GET | `/reports/audit-detail` | 导出审核明细 | admin |

---

## 六、页面设计

### 6.1 页面清单

| 页面 | 路径 | 角色 | 说明 |
|------|------|------|------|
| 登录页 | `/login` | 公开 | 含隐私政策链接 |
| 学生审核结果 | `/student/audit` | student | 含待录入状态提示 |
| 教师预警看板 | `/teacher/dashboard` | teacher | 班级预警学生列表 |
| 教务处审核看板 | `/admin/dashboard` | school_admin | 全校统计+筛选 |
| 试审核页面 | `/admin/trial-audit` | school_admin | 预览不保存 |
| 正式审核页面 | `/admin/official-audit` | school_admin | 锁定记录 |
| 审核流程管理 | `/admin/audit-flow` | school_admin | 多级流转管理 |
| 人工标记页面 | `/admin/manual-override` | school_admin | 特殊情况调整 |
| 培养方案管理 | `/admin/programs` | school_admin | 各专业要求配置 |
| 数据导入页面 | `/admin/import` | school_admin | 极简三步导入 |
| 报表中心 | `/admin/reports` | school_admin | 统计+导出 |

### 6.2 核心页面原型

#### 登录页
```
┌─────────────────────────────────────────┐
│                                         │
│           [学校Logo]                     │
│                                         │
│      学生毕业及学位资格审查系统            │
│                                         │
│   ┌─────────────────────────────────┐   │
│   │  用户名（学工号）                │   │
│   └─────────────────────────────────┘   │
│   ┌─────────────────────────────────┐   │
│   │  密码                           │   │
│   └─────────────────────────────────┘   │
│                                         │
│        [ 登 录 ]                        │
│                                         │
│   登录即表示同意《隐私政策》              │
│                                         │
└─────────────────────────────────────────┘
```

#### 学生审核结果页
```
┌─────────────────────────────────────────────────────────────┐
│  学生毕业及学位资格审查系统                        [张三] ▼  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  个人信息                                            │   │
│  │  姓名：张三  学号：2021001001  专业：计算机科学与技术    │   │
│  │  预计毕业：2025年6月                                  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  毕业资格审核                        [状态：待成绩录入] │   │
│  │  ─────────────────────────────────────────────────  │   │
│  │  ✓ 总学分：165 / 160                                  │   │
│  │  ✓ 必修课：全部通过                                    │   │
│  │  ⚠ 选修课：30 / 30（待最后一学期成绩录入确认）          │   │
│  │  ✓ 实践环节：已完成                                    │   │
│  │  ? 毕业论文：成绩待录入（预计6月录入）                  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  [查看详细成绩单]  [下载审核报告]                           │
│                                                             │
│  ⚠️ 温馨提示：系统显示"待成绩录入"表示该课程成绩尚未录入，   │
│     并非审核不通过。请关注教务系统成绩发布。                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### 教务处审核看板
```
┌─────────────────────────────────────────────────────────────┐
│  学生毕业及学位资格审查系统                     [教务处] ▼  │
├──────┬──────────────────────────────────────────────────────┤
│      │  审核管理看板                                         │
│ 首页  │  ─────────────────────────────────────────────────  │
│ 审核  │                                                     │
│ 流程  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐ │
│ 导入  │  │ 待审核    │ │ 已通过    │ │ 未通过    │ │ 待录入  │ │
│ 报表  │  │  1,234   │ │  5,678   │ │   432    │ │  890   │ │
│ 设置  │  └──────────┘ └──────────┘ └──────────┘ └────────┘ │
│      │                                                     │
│      │  [开始试审核] [执行正式审核] [导出通过名单]           │
│      │                                                     │
│      │  ⚠️ 正式审核前请先执行试审核，确认数据无误           │
│      │                                                     │
│      │  ┌─────────────────────────────────────────────────┐│
│      │  │  学生审核列表                                    ││
│      │  │  [搜索] [筛选: 全部/已通过/未通过/待录入/预警]    ││
│      │  │  ─────────────────────────────────────────────  ││
│      │  │  学号    姓名   专业      毕业审核   学位审核   操作 ││
│      │  │  2021..  张三   计算机     待录入    待录入   [详情]││
│      │  │  2021..  李四   软件工程   未通过    未通过   [详情]││
│      │  │  2021..  王五   计算机     已通过    已通过   [详情]││
│      │  │  ...                                              ││
│      │  └─────────────────────────────────────────────────┘│
│      │                                                     │
└──────┴──────────────────────────────────────────────────────┘
```

---

## 七、开发计划（面向Agent）

### 7.1 任务分解

| 阶段 | 任务 | 说明 | 预估时间 |
|------|------|------|----------|
| **1** | 项目初始化 | Express + React + MySQL + Prisma，单仓库 | 1天 |
| **2** | 数据库设计 | 建表、索引、迁移脚本 | 1天 |
| **3** | 认证授权 | JWT登录、多角色权限、隐私政策 | 1天 |
| **4** | 数据导入 | Excel模板、批量导入、自动校验 | 2天 |
| **5** | 培养方案 | 各专业毕业要求配置CRUD | 1天 |
| **6** | 审核核心 | 单学生计算、试审核、正式审核、预警 | 3天 |
| **7** | 多级流程 | 初核→复核→审议→批准状态流转 | 2天 |
| **8** | 人工标记 | 特殊情况调整、记录原因佐证 | 1天 |
| **9** | 学生教师端 | 个人结果、班级预警看板 | 2天 |
| **10** | 教务处端 | 审核看板、流程管理、数据导入、报表 | 3天 |
| **11** | 报表导出 | 统计报表、名单导出、审核明细导出 | 2天 |
| **12** | 测试部署 | 功能测试、低资源优化、PM2部署、文档 | 2天 |

**总计：约22天（4-5周）**

### 7.2 Agent开发原则

1. **逐条领取任务** → 完成代码 → 验证运行 → 标记完成
2. **优先可运行的Demo**，不追求完美架构
3. **数据库表直观简单**，避免过度抽象
4. **接口扁平化**，减少前后端沟通成本
5. **每完成一个任务立即测试**，不堆积到后期

---

## 八、测试策略

| 类型 | 工具 | 覆盖率 | 说明 |
|------|------|--------|------|
| 单元测试 | Jest | ≥60% | 核心审核逻辑必须覆盖 |
| 接口测试 | Jest + Supertest | 核心接口 | 登录、审核、导入 |
| 功能测试 | 手工 | 全部页面 | 按操作手册逐条验证 |
| 低资源测试 | 手工 | - | 在4核8G环境测试性能 |

---

## 九、部署方案

### 9.1 服务器配置

| 组件 | 配置 | 说明 |
|------|------|------|
| 应用服务器 | 4核8G | 跑Express + Nginx |
| 数据库服务器 | 4核8G | 跑MySQL（可与应用同机） |
| 磁盘 | 200GB | 数据+日志+导出文件 |

### 9.2 部署流程

1. 服务器安装Node.js 18、MySQL 8.0、Nginx
2. 克隆代码，安装依赖
3. 执行数据库迁移：`npx prisma migrate deploy`
4. 配置Nginx反向代理
5. PM2启动后端：`pm2 start app.js`
6. 验证接口、页面访问

### 9.3 等保实施

| 阶段 | 时间 | 内容 |
|------|------|------|
| 定级备案 | 上线前1个月 | 确定等保二级，提交备案 |
| 差距分析 | 上线前2周 | 对照等保二级要求，找出差距 |
| 整改建设 | 上线前1周 | 配置安全策略、购买必要设备 |
| 测评验收 | 上线后1个月 | 委托测评机构，出具报告 |

---

## 十、运维与文档

### 10.1 必须交付的文档

| 文档 | 说明 |
|------|------|
| `docs/api.md` | API接口文档（含请求/响应示例） |
| `docs/deploy.md` | 部署文档（环境准备、安装步骤、配置说明） |
| `docs/database.md` | 数据库结构说明（表、字段、索引、关系） |
| `docs/operation-manual.md` | 操作手册（图文步骤，面向50+岁用户） |
| `docs/excel-templates/` | 标准导入模板（学生/课程/成绩） |
| `docs/rules/audit-rules.json` | 审核规则配置文件说明 |

### 10.2 运维监控

| 指标 | 工具 | 告警阈值 |
|------|------|----------|
| 服务存活 | PM2 | 进程退出自动重启 |
| 磁盘空间 | 脚本 | 使用率>85%告警 |
| 数据库备份 | 定时脚本 | 每日凌晨2点备份 |
| 慢查询 | MySQL慢查询日志 | 超过3秒记录 |

---

## 十一、风险与应对

| 风险 | 影响 | 应对 |
|------|------|------|
| 成绩延迟录入导致审核不准 | 高 | 增加"待录入"状态，区分未录入和不合格 |
| 特殊情况规则覆盖不了 | 高 | 人工标记功能，记录原因和佐证 |
| 用户不会用系统 | 高 | 极简界面、三步操作、图文手册 |
| 系统审核与人工结果不一致 | 高 | 明确标注"辅助审核"，提供明细导出方便核对 |
| 服务器资源不足 | 中 | 低资源优化、代码分割、数据库索引 |
| 维护人员交接困难 | 中 | 代码简单直观、文档完整、配置集中 |
| 等保测评不通过 | 中 | 预留整改时间和预算，先做二级 |

---

## 十二、附录

### 12.1 术语表

| 术语 | 说明 |
|------|------|
| 毕业资格 | 完成培养方案要求，准予毕业的条件 |
| 学位资格 | 达到学位授予标准，准予授予学位的条件 |
| 试审核 | 预览审核结果，不保存到数据库 |
| 正式审核 | 生成正式审核结果，锁定不可修改 |
| 待录入 | 成绩尚未录入教务系统，非审核不通过 |
| 人工标记 | 特殊情况手动调整审核结果 |

### 12.2 修订记录

| 版本 | 日期 | 修订内容 |
|------|------|----------|
| v1.0 | 2026-06-11 | 初始版本（NestJS + PostgreSQL + Docker） |
| v2.0 | 2026-06-11 | 批判后改进（Express + MySQL + PM2） |
| v3.0 | 2026-06-11 | 整合现实难题（试审核、多级流程、人工标记、低素养适配） |

---

*本文档为学生毕业及学位资格审查系统的最终版完整计划，面向Agent快速开发，强调务实落地。*
