# 学生毕业及学位资格审查系统 - 完整项目计划书

## 1. 项目概述

### 1.1 项目背景

随着高校教育信息化建设的深入，学生毕业及学位资格审查工作日益复杂。传统的人工审核方式存在效率低、易出错、难以追溯等问题。为满足高校对毕业及学位资格审查工作的自动化、规范化、精细化管理需求，特开发本系统。

### 1.2 项目目标

构建一个**多角色、高并发、规则驱动**的学生毕业及学位资格审查平台，实现：
- 自动化审核学生毕业资格和学位授予资格
- 对接学校现有教务系统、学籍系统、成绩系统
- 支持按专业/学位类型灵活配置审核规则
- 提供完整的审核报告和统计报表
- 部署于学校内网服务器，满足等保要求

### 1.3 项目范围

**包含功能：**
- 多角色权限管理（学生/教师/院系负责人/教务处管理员）
- 数据同步对接（教务系统、学籍系统、成绩系统）
- 审核规则引擎（按专业/学位类型配置）
- 资格审核流程（自动计算、人工复核、异议处理）
- 报表与导出（审核表、名单、统计报表）
- 系统管理（用户、日志、备份、监控）

**不包含功能：**
- 教务系统核心功能（排课、选课、考试安排等）
- 财务收费管理
- 学生日常行为管理

---

## 2. 需求分析

### 2.1 用户角色分析

| 角色 | 核心需求 | 使用频率 | 关键场景 |
|------|----------|----------|----------|
| **学生** | 查看个人审核结果、了解未通过原因、提交申诉 | 高（毕业季） | 毕业季查询审核状态 |
| **教师** | 查看班级/指导学生审核情况、协助学生了解规则 | 中 | 毕业班导师查看班级通过率 |
| **院系负责人** | 本院系审核管理、数据汇总、初审上报 | 高（毕业季） | 学位委员会初审 |
| **教务处管理员** | 全校审核管理、规则配置、数据同步控制、终审 | 高 | 全校学位授予终审 |

### 2.2 功能需求

#### 2.2.1 认证授权模块
- 支持学工号/教师工号登录
- 对接学校统一身份认证（CAS/LDAP）
- 基于角色的权限控制（RBAC）
- 登录失败锁定机制
- 操作审计日志

#### 2.2.2 数据同步模块
- 定义中间库数据接口规范
- 定时ETL任务（学生信息、课程信息、成绩信息）
- 数据校验与冲突处理
- 同步状态监控与告警
- 支持手动触发同步

#### 2.2.3 审核规则引擎
- 规则配置可视化编辑器
- 支持条件组合（学分、绩点、课程通过情况等）
- 按专业、学位类型（学士/硕士/博士）区分规则
- 规则版本管理（支持历史版本回溯）
- 规则生效时间控制

#### 2.2.4 审核核心功能
- 单学生实时审核计算
- 批量审核任务队列处理
- 审核结果明细展示（逐条规则通过状态）
- 审核报告生成
- 人工复核与标记
- 异议申请与处理流程

#### 2.2.5 报表与导出
- 审核统计报表（全校/院系/专业维度）
- 毕业资格审核表导出
- 学位授予名单导出
- 正式Word文档生成（学位授予决定书等）
- 数据可视化图表

#### 2.2.6 系统管理
- 用户管理
- 角色权限配置
- 操作日志查询
- 数据备份与恢复
- 系统监控面板

### 2.3 非功能需求

#### 2.3.1 性能需求
- 单学生审核响应时间 < 2秒
- 批量审核支持1000人/批次
- 系统并发用户支持500+
- 数据同步延迟 < 1小时

#### 2.3.2 安全需求
- 符合等保2.0三级要求
- 密码加密存储（bcrypt）
- 敏感数据脱敏展示
- HTTPS传输加密
- 操作审计日志完整记录
- 定期自动备份

#### 2.3.3 可用性需求
- 系统可用性 > 99.5%
- 支持故障恢复
- 数据一致性保障
- 友好的错误提示

---

## 3. 技术方案

### 3.1 技术栈选型

| 层级 | 技术选型 | 版本 | 选型理由 |
|------|----------|------|----------|
| **前端框架** | React | 18.x | 组件化开发，生态丰富 |
| **前端语言** | TypeScript | 5.x | 类型安全，提升开发效率 |
| **UI组件库** | shadcn/ui + Tailwind CSS | 3.4.x | 现代化设计，高度可定制 |
| **后端框架** | NestJS | 10.x | 企业级架构，依赖注入，适合复杂业务 |
| **后端语言** | TypeScript | 5.x | 前后端统一语言，类型共享 |
| **数据库** | PostgreSQL | 16.x | 支持复杂查询、事务、JSON字段 |
| **缓存** | Redis | 7.x | 热点数据缓存、会话管理、队列 |
| **消息队列** | BullMQ | 5.x | 基于Redis，轻量高效 |
| **文档生成** | docx.js | 8.x | 客户端Word文档生成 |
| **部署** | Docker + Docker Compose | - | 容器化部署，环境一致 |

### 3.2 系统架构

```
┌─────────────────────────────────────────────────────────────┐
│                        客户端层                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   学生端     │  │   教师端     │  │   院系/教务处管理端   │  │
│  │   (React)   │  │   (React)   │  │      (React)        │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      API网关层 (Nginx)                       │
│              负载均衡、SSL终止、静态资源服务                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      应用服务层 (NestJS)                     │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌────────┐ │
│  │ 认证服务 │ │ 审核服务 │ │ 规则服务 │ │ 报表服务 │ │ 同步服务 │ │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      领域服务层                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐  │
│  │   审核规则引擎    │  │   数据同步适配器   │  │  文档生成器   │  │
│  │  (策略模式+规则链) │  │   (ETL+中间库)   │  │  (docx.js)  │  │
│  └─────────────────┘  └─────────────────┘  └─────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      基础设施层                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │  PostgreSQL  │  │    Redis    │  │      文件存储        │  │
│  │   (主数据库)  │  │ (缓存+队列)  │  │   (报告/导出文件)     │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      外部系统层                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   教务系统   │  │   学籍系统   │  │      成绩系统        │  │
│  │  (中间库/API)│  │  (中间库/API)│  │    (中间库/API)      │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 3.3 数据流设计

```
外部系统 ──> 中间库 ──> ETL任务 ──> 数据校验 ──> PostgreSQL
                                              │
                                              ▼
用户请求 ──> API网关 ──> 认证授权 ──> 业务服务 ──> 规则引擎
                                              │
                                              ▼
                                         审核结果 ──> Redis缓存
                                              │
                                              ▼
                                         报表/导出 ──> 文件存储
```

### 3.4 关键技术决策

#### 决策1：自研轻量级规则引擎
- **方案**：基于JSON配置 + 策略模式实现
- **理由**：高校审核规则逻辑相对固定但参数多变，自研引擎更轻量、可控、易维护
- **对比**：Drools等重型引擎学习成本高，过度设计

#### 决策2：中间库 + 定时ETL数据同步
- **方案**：现有系统写入中间库，本系统定时拉取
- **理由**：最小化对现有系统侵入，符合高校IT现状
- **对比**：直接API对接需要改造现有系统，协调成本高

#### 决策3：异步任务处理批量审核
- **方案**：BullMQ队列处理批量审核任务
- **理由**：毕业季集中审核时避免阻塞用户请求
- **对比**：同步处理会导致超时和系统卡顿

#### 决策4：审核结果缓存 + 增量更新
- **方案**：Redis缓存审核结果，成绩变动时触发增量重算
- **理由**：减少重复计算，提升查询性能
- **对比**：全量重算性能差，实时计算压力大

---

## 4. 数据库设计

### 4.1 实体关系图

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│    User     │       │   Student   │       │    Major    │
│  (用户表)    │◄─────►│  (学生表)    │◄─────►│  (专业表)    │
└─────────────┘       └─────────────┘       └─────────────┘
                              │
                              │
                              ▼
                       ┌─────────────┐
                       │   Course    │
                       │  (课程表)    │
                       └─────────────┘
                              │
                              │
                              ▼
                       ┌─────────────┐       ┌─────────────┐
                       │    Grade    │◄─────►│   Semester  │
                       │  (成绩表)    │       │  (学期表)    │
                       └─────────────┘       └─────────────┘
                              │
                              │
                              ▼
                       ┌─────────────┐       ┌─────────────┐
                       │AuditResult  │◄─────►│  AuditRule  │
                       │ (审核结果表) │       │ (审核规则表)  │
                       └─────────────┘       └─────────────┘
                              │
                              │
                              ▼
                       ┌─────────────┐
                       │ AuditDetail │
                       │ (审核明细表) │
                       └─────────────┘
```

### 4.2 核心表结构

#### 4.2.1 用户表 (users)
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) NOT NULL UNIQUE,        -- 学工号
    password_hash VARCHAR(255),                   -- 密码哈希（对接统一认证可为空）
    name VARCHAR(100) NOT NULL,                   -- 姓名
    role VARCHAR(20) NOT NULL,                    -- 角色：student/teacher/dept_admin/school_admin
    email VARCHAR(100),
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 4.2.2 学生表 (students)
```sql
CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    student_no VARCHAR(20) NOT NULL UNIQUE,       -- 学号
    name VARCHAR(100) NOT NULL,
    gender VARCHAR(10),                           -- 性别
    id_card VARCHAR(18),                          -- 身份证号
    major_id UUID REFERENCES majors(id),          -- 专业
    degree_type VARCHAR(20) NOT NULL,             -- 学位类型：bachelor/master/doctor
    enrollment_year INT,                          -- 入学年份
    expected_graduation_year INT,                 -- 预计毕业年份
    status VARCHAR(20) DEFAULT 'active',          -- 状态：active/graduated/dropped
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 4.2.3 专业表 (majors)
```sql
CREATE TABLE majors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(20) NOT NULL UNIQUE,             -- 专业代码
    name VARCHAR(100) NOT NULL,                   -- 专业名称
    department_id UUID REFERENCES departments(id), -- 所属院系
    degree_type VARCHAR(20) NOT NULL,             -- 学位类型
    total_credits_required INT,                   -- 总学分要求
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 4.2.4 课程表 (courses)
```sql
CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(20) NOT NULL UNIQUE,             -- 课程代码
    name VARCHAR(200) NOT NULL,                   -- 课程名称
    credits DECIMAL(3,1) NOT NULL,                -- 学分
    course_type VARCHAR(20) NOT NULL,             -- 课程类型：required/elective/general
    category VARCHAR(50),                         -- 课程类别
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 4.2.5 成绩表 (grades)
```sql
CREATE TABLE grades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id),
    course_id UUID REFERENCES courses(id),
    semester_id UUID REFERENCES semesters(id),
    score DECIMAL(5,2),                           -- 分数
    grade_point DECIMAL(3,2),                     -- 绩点
    is_passed BOOLEAN,                            -- 是否通过
    exam_type VARCHAR(20),                        -- 考试类型：regular/retake
    status VARCHAR(20) DEFAULT 'valid',           -- 状态：valid/invalid
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, course_id, semester_id, exam_type)
);
```

#### 4.2.6 审核规则表 (audit_rules)
```sql
CREATE TABLE audit_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,                   -- 规则名称
    rule_type VARCHAR(20) NOT NULL,               -- 规则类型：graduation/degree
    degree_type VARCHAR(20),                      -- 适用学位类型
    major_ids UUID[],                             -- 适用专业（空表示全部）
    version INT NOT NULL DEFAULT 1,               -- 版本号
    config JSONB NOT NULL,                        -- 规则配置（JSON格式）
    effective_date DATE NOT NULL,                 -- 生效日期
    expiry_date DATE,                             -- 失效日期
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 4.2.7 审核结果表 (audit_results)
```sql
CREATE TABLE audit_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id),
    audit_type VARCHAR(20) NOT NULL,              -- 审核类型：graduation/degree
    status VARCHAR(20) NOT NULL,                  -- 状态：passed/failed/pending
    total_credits DECIMAL(5,1),                   -- 总学分
    gpa DECIMAL(3,2),                             -- 平均绩点
    rule_version INT,                             -- 使用的规则版本
    calculated_at TIMESTAMP,                      -- 计算时间
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, audit_type, rule_version)
);
```

#### 4.2.8 审核明细表 (audit_details)
```sql
CREATE TABLE audit_details (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_result_id UUID REFERENCES audit_results(id),
    rule_id UUID REFERENCES audit_rules(id),
    rule_name VARCHAR(200),                       -- 规则名称
    status VARCHAR(20) NOT NULL,                  -- 状态：passed/failed
    actual_value TEXT,                            -- 实际值
    expected_value TEXT,                          -- 期望值
    message TEXT,                                 -- 说明信息
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 4.3 索引设计

```sql
-- 学生表索引
CREATE INDEX idx_students_major ON students(major_id);
CREATE INDEX idx_students_degree_type ON students(degree_type);
CREATE INDEX idx_students_expected_graduation ON students(expected_graduation_year);

-- 成绩表索引
CREATE INDEX idx_grades_student ON grades(student_id);
CREATE INDEX idx_grades_course ON grades(course_id);
CREATE INDEX idx_grades_semester ON grades(semester_id);

-- 审核结果表索引
CREATE INDEX idx_audit_results_student ON audit_results(student_id);
CREATE INDEX idx_audit_results_type ON audit_results(audit_type);
CREATE INDEX idx_audit_results_status ON audit_results(status);
```

---

## 5. 接口设计

### 5.1 API规范

- **基础路径**：`/api/v1`
- **认证方式**：JWT Bearer Token
- **数据格式**：JSON
- **分页参数**：`page`, `pageSize`
- **响应格式**：
```json
{
  "code": 200,
  "message": "success",
  "data": {},
  "timestamp": 1718083200000
}
```

### 5.2 核心接口列表

#### 认证模块
| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| POST | `/auth/login` | 用户登录 | 公开 |
| POST | `/auth/logout` | 用户登出 | 已登录 |
| GET | `/auth/profile` | 获取当前用户信息 | 已登录 |
| POST | `/auth/refresh` | 刷新Token | 已登录 |

#### 学生模块
| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | `/students` | 学生列表 | admin |
| GET | `/students/:id` | 学生详情 | 本人/admin |
| GET | `/students/:id/audit` | 学生审核结果 | 本人/admin |
| GET | `/students/me/audit` | 当前学生审核结果 | student |

#### 审核模块
| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| POST | `/audit/single` | 单学生审核 | admin |
| POST | `/audit/batch` | 批量审核 | admin |
| GET | `/audit/batch/:id/progress` | 批量审核进度 | admin |
| GET | `/audit/results` | 审核结果列表 | admin |
| GET | `/audit/results/:id` | 审核结果详情 | 本人/admin |

#### 规则模块
| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | `/rules` | 规则列表 | admin |
| GET | `/rules/:id` | 规则详情 | admin |
| POST | `/rules` | 创建规则 | school_admin |
| PUT | `/rules/:id` | 更新规则 | school_admin |
| POST | `/rules/:id/activate` | 激活规则 | school_admin |

#### 报表模块
| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | `/reports/statistics` | 审核统计 | admin |
| GET | `/reports/export` | 导出名单 | admin |
| POST | `/reports/generate` | 生成文档 | admin |

#### 同步模块
| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | `/sync/status` | 同步状态 | admin |
| POST | `/sync/trigger` | 手动触发同步 | school_admin |
| GET | `/sync/logs` | 同步日志 | admin |

---

## 6. 页面设计

### 6.1 页面清单

| 页面 | 路径 | 角色 | 说明 |
|------|------|------|------|
| 登录页 | `/login` | 公开 | 统一身份认证入口 |
| 个人审核结果 | `/student/audit` | student | 毕业/学位审核结果总览 |
| 班级审核情况 | `/teacher/class` | teacher | 指导学生审核统计 |
| 院系审核管理 | `/department/audit` | dept_admin | 本院系学生审核管理 |
| 全校审核看板 | `/admin/dashboard` | school_admin | 全校审核状态可视化 |
| 规则配置 | `/admin/rules` | school_admin | 审核规则可视化配置 |
| 数据同步 | `/admin/sync` | school_admin | 数据同步管理与监控 |
| 报表中心 | `/admin/reports` | school_admin | 统计报表与导出 |
| 系统设置 | `/admin/settings` | school_admin | 用户、角色、日志管理 |

### 6.2 核心页面原型

#### 6.2.1 学生端 - 个人审核结果页
```
┌─────────────────────────────────────────────────────────────┐
│  学生毕业及学位资格审查系统                        [用户名] ▼  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  个人信息                                            │   │
│  │  姓名：张三  学号：2021001001  专业：计算机科学与技术    │   │
│  │  学位类型：学士  预计毕业：2025年6月                   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  毕业资格审核                        [状态：已通过]   │   │
│  │  ─────────────────────────────────────────────────  │   │
│  │  ✓ 总学分要求：已修 165 / 要求 160                   │   │
│  │  ✓ 必修课完成情况：全部通过                          │   │
│  │  ✓ 选修课学分：已修 35 / 要求 30                     │   │
│  │  ✓ 实践环节：已完成                                  │   │
│  │  ✓ 毕业论文：已通过                                  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  学位资格审核                        [状态：已通过]   │   │
│  │  ─────────────────────────────────────────────────  │   │
│  │  ✓ 平均绩点：3.6 / 要求 ≥ 2.0                       │   │
│  │  ✓ 学位课程绩点：3.8 / 要求 ≥ 2.5                   │   │
│  │  ✓ 无处分记录                                       │   │
│  │  ✓ 学位论文：已通过                                  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  [查看详细成绩单]  [下载审核报告]  [有异议？申请复核]        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### 6.2.2 教务处 - 审核管理看板
```
┌─────────────────────────────────────────────────────────────┐
│  学生毕业及学位资格审查系统                        [用户名] ▼  │
├──────┬──────────────────────────────────────────────────────┤
│      │  审核管理看板                                         │
│  首页 │  ─────────────────────────────────────────────────  │
│  审核 │                                                     │
│  规则 │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐ │
│  同步 │  │ 待审核    │ │ 已通过    │ │ 未通过    │ │ 总计   │ │
│  报表 │  │  1,234   │ │  5,678   │ │   432    │ │ 7,344  │ │
│  设置 │  └──────────┘ └──────────┘ └──────────┘ └────────┘ │
│      │                                                     │
│      │  [开始批量审核] [导出通过名单] [导出未通过名单]       │
│      │                                                     │
│      │  ┌─────────────────────────────────────────────────┐│
│      │  │  各院系审核情况                                    ││
│      │  │  [柱状图：计算机学院 85% | 文学院 92% | ...]       ││
│      │  └─────────────────────────────────────────────────┘│
│      │                                                     │
│      │  ┌─────────────────────────────────────────────────┐│
│      │  │  学生审核列表                    [搜索] [筛选]   ││
│      │  │  ─────────────────────────────────────────────  ││
│      │  │  学号    姓名   专业      毕业审核   学位审核   操作 ││
│      │  │  2021..  张三   计算机     已通过    已通过   [详情]││
│      │  │  2021..  李四   软件工程   未通过    未通过   [详情]││
│      │  │  ...                                              ││
│      │  └─────────────────────────────────────────────────┘│
│      │                                                     │
└──────┴──────────────────────────────────────────────────────┘
```

---

## 7. 开发计划

### 7.1 项目阶段划分

| 阶段 | 时间 | 里程碑 | 交付物 |
|------|------|--------|--------|
| **第一阶段** | 第1-2周 | 基础架构搭建 | 项目框架、数据库、认证模块 |
| **第二阶段** | 第3-4周 | 核心功能开发 | 数据同步、规则引擎、审核核心 |
| **第三阶段** | 第5-6周 | 前端页面开发 | 学生端、教师端、管理端页面 |
| **第四阶段** | 第7周 | 报表与导出 | 统计报表、Word文档生成 |
| **第五阶段** | 第8周 | 测试与优化 | 单元测试、集成测试、性能优化 |
| **第六阶段** | 第9周 | 部署与上线 | Docker部署、等保配置、上线 |

### 7.2 详细任务分解

#### 第一阶段：基础架构搭建（第1-2周）

**第1周：项目初始化**
- [ ] 初始化Monorepo项目结构
- [ ] 配置NestJS后端项目
- [ ] 配置React前端项目
- [ ] 配置Docker开发环境
- [ ] 配置代码规范（ESLint、Prettier）
- [ ] 配置Git工作流

**第2周：数据库与认证**
- [ ] 设计数据库ER图
- [ ] 编写数据库迁移脚本
- [ ] 实现用户实体与基础CRUD
- [ ] 实现JWT认证模块
- [ ] 实现RBAC权限守卫
- [ ] 实现登录/登出API
- [ ] 实现前端登录页面

#### 第二阶段：核心功能开发（第3-4周）

**第3周：数据同步与规则引擎**
- [ ] 定义中间库数据接口规范
- [ ] 实现ETL数据同步服务
- [ ] 实现数据校验与冲突处理
- [ ] 设计规则引擎核心模型
- [ ] 实现条件解析器
- [ ] 实现策略执行器
- [ ] 实现规则版本管理

**第4周：审核核心功能**
- [ ] 实现单学生审核计算
- [ ] 实现批量审核任务队列
- [ ] 实现审核结果存储
- [ ] 实现审核结果查询API
- [ ] 实现审核报告生成
- [ ] 实现人工复核功能

#### 第三阶段：前端页面开发（第5-6周）

**第5周：学生端与教师端**
- [ ] 实现学生端个人审核结果页面
- [ ] 实现学生端成绩详情页面
- [ ] 实现教师端班级审核统计页面
- [ ] 实现教师端学生详情页面
- [ ] 实现通用布局组件（侧边栏、顶部栏）

**第6周：管理端**
- [ ] 实现教务处审核管理看板
- [ ] 实现审核列表与详情页面
- [ ] 实现规则配置可视化编辑器
- [ ] 实现数据同步管理页面
- [ ] 实现系统设置页面

#### 第四阶段：报表与导出（第7周）
- [ ] 实现审核统计报表API
- [ ] 实现数据可视化图表组件
- [ ] 实现名单导出功能（Excel/CSV）
- [ ] 实现Word文档生成功能
- [ ] 实现报表中心页面

#### 第五阶段：测试与优化（第8周）
- [ ] 编写单元测试（目标覆盖率80%+）
- [ ] 编写集成测试
- [ ] 性能测试与优化
- [ ] 安全漏洞扫描与修复
- [ ] 代码审查与重构

#### 第六阶段：部署与上线（第9周）
- [ ] 编写Docker生产配置
- [ ] 配置Nginx反向代理
- [ ] 配置SSL证书
- [ ] 配置等保安全策略
- [ ] 数据迁移与初始化
- [ ] 用户培训
- [ ] 正式上线

---

## 8. 风险与应对

### 8.1 技术风险

| 风险 | 影响 | 概率 | 应对措施 |
|------|------|------|----------|
| 现有系统数据格式不兼容 | 高 | 中 | 提前调研数据格式，设计灵活的数据适配层 |
| 毕业季高并发性能瓶颈 | 高 | 高 | 异步队列处理，Redis缓存，数据库优化 |
| 审核规则复杂导致引擎性能差 | 中 | 中 | 规则预编译，缓存规则解析结果 |
| 数据同步延迟导致审核结果不准 | 高 | 中 | 数据版本快照，同步状态监控 |

### 8.2 业务风险

| 风险 | 影响 | 概率 | 应对措施 |
|------|------|------|----------|
| 审核规则频繁变更 | 中 | 高 | 可视化规则配置，版本管理 |
| 用户对审核结果有异议 | 中 | 高 | 审核明细展示，申诉流程 |
| 多部门协调困难 | 高 | 中 | 明确需求边界，定期沟通会议 |
| 等保测评不通过 | 高 | 低 | 提前了解等保要求，安全设计 |

### 8.3 项目管理风险

| 风险 | 影响 | 概率 | 应对措施 |
|------|------|------|----------|
| 需求变更频繁 | 高 | 中 | 敏捷开发，迭代交付 |
| 开发人员不足 | 中 | 低 | 合理排期，预留缓冲时间 |
| 测试不充分导致线上问题 | 高 | 中 | 自动化测试，灰度发布 |

---

## 9. 质量保证

### 9.1 代码质量

- **代码规范**：ESLint + Prettier统一代码风格
- **类型安全**：TypeScript严格模式
- **代码审查**：Pull Request强制审查
- **静态分析**：SonarQube代码质量扫描

### 9.2 测试策略

| 测试类型 | 工具 | 覆盖率目标 | 说明 |
|----------|------|------------|------|
| 单元测试 | Jest | ≥80% | 核心模块必须覆盖 |
| 集成测试 | Jest + Supertest | ≥60% | API接口测试 |
| E2E测试 | Playwright | 核心流程 | 关键用户场景 |
| 性能测试 | k6 | - | 毕业季并发场景 |

### 9.3 安全要求

- [ ] 密码加密存储（bcrypt）
- [ ] JWT Token过期与刷新机制
- [ ] 接口防重放攻击（nonce + timestamp）
- [ ] SQL注入防护（参数化查询）
- [ ] XSS防护（输入过滤、输出编码）
- [ ] CSRF防护
- [ ] 敏感数据脱敏展示
- [ ] 操作审计日志完整记录
- [ ] 定期安全漏洞扫描

---

## 10. 部署方案

### 10.1 服务器配置

| 组件 | 配置 | 数量 | 说明 |
|------|------|------|------|
| 应用服务器 | 8核16G | 2台 | 负载均衡部署 |
| 数据库服务器 | 16核32G | 1台 | 主库 |
| Redis服务器 | 4核8G | 1台 | 缓存+队列 |
| 文件存储 | 500GB SSD | - | 报告/导出文件 |

### 10.2 Docker Compose配置

```yaml
version: '3.8'
services:
  app:
    image: sgadqrs-app:latest
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DB_HOST=postgres
      - REDIS_HOST=redis
    depends_on:
      - postgres
      - redis
    deploy:
      replicas: 2

  web:
    image: sgadqrs-web:latest
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - app

  postgres:
    image: postgres:16-alpine
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init-scripts:/docker-entrypoint-initdb.d
    environment:
      - POSTGRES_DB=sgadqrs
      - POSTGRES_USER=sgadqrs
      - POSTGRES_PASSWORD=${DB_PASSWORD}

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

### 10.3 部署流程

1. **环境准备**：服务器初始化、Docker安装、网络配置
2. **数据库部署**：PostgreSQL安装、初始化脚本执行
3. **应用部署**：Docker镜像构建、容器启动
4. **Nginx配置**：反向代理、SSL证书配置
5. **监控配置**：Prometheus + Grafana监控面板
6. **备份配置**：定时数据库备份脚本
7. **安全加固**：防火墙配置、等保策略实施

---

## 11. 运维与监控

### 11.1 监控指标

| 指标类型 | 具体指标 | 告警阈值 |
|----------|----------|----------|
| **系统资源** | CPU使用率、内存使用率、磁盘使用率 | CPU>80%, 内存>85% |
| **应用性能** | API响应时间、错误率、吞吐量 | P99>2s, 错误率>1% |
| **业务指标** | 审核任务队列长度、同步延迟 | 队列>1000, 延迟>1h |
| **数据库** | 连接数、慢查询、锁等待 | 连接数>80%, 慢查询>10/min |

### 11.2 日志管理

- **应用日志**：Winston日志框架，分级记录（error/warn/info/debug）
- **访问日志**：Nginx访问日志
- **审计日志**：数据库记录所有敏感操作
- **日志保留**：应用日志30天，审计日志永久保留

### 11.3 备份策略

| 备份对象 | 备份频率 | 保留周期 | 存储位置 |
|----------|----------|----------|----------|
| 数据库全量 | 每日凌晨2点 | 30天 | 本地 + 异地 |
| 数据库增量 | 每小时 | 7天 | 本地 |
| 配置文件 | 变更时 | 永久 | Git仓库 |
| 导出文件 | 每日 | 90天 | 对象存储 |

---

## 12. 项目团队

### 12.1 角色分工

| 角色 | 人数 | 职责 |
|------|------|------|
| 项目经理 | 1 | 项目整体管理、进度把控、风险协调 |
| 后端开发工程师 | 2 | NestJS后端开发、数据库设计、接口实现 |
| 前端开发工程师 | 2 | React前端开发、页面实现、交互优化 |
| 测试工程师 | 1 | 测试用例编写、自动化测试、性能测试 |
| 运维工程师 | 1 | 部署配置、监控告警、故障处理 |

### 12.2 沟通机制

- **每日站会**：15分钟，同步进度与阻塞
- **周会**：1小时，回顾本周、计划下周
- **迭代评审**：每2周，演示功能、收集反馈
- **技术分享**：每月，团队技术能力提升

---

## 13. 附录

### 13.1 术语表

| 术语 | 说明 |
|------|------|
| **毕业资格** | 学生完成培养方案要求，准予毕业的条件 |
| **学位资格** | 学生达到学位授予标准，准予授予学位的条件 |
| **审核规则** | 判定学生是否满足毕业/学位条件的规则集合 |
| **ETL** | Extract-Transform-Load，数据抽取转换加载 |
| **RBAC** | Role-Based Access Control，基于角色的访问控制 |
| **等保** | 信息安全等级保护 |

### 13.2 参考文档

- [NestJS官方文档](https://docs.nestjs.com/)
- [React官方文档](https://react.dev/)
- [PostgreSQL官方文档](https://www.postgresql.org/docs/)
- [等保2.0基本要求](http://www.djbh.net/)

### 13.3 修订记录

| 版本 | 日期 | 修订人 | 修订内容 |
|------|------|--------|----------|
| v1.0 | 2025-06-11 | - | 初始版本 |

---

*本文档为学生毕业及学位资格审查系统的完整项目计划书，涵盖了从需求分析到部署运维的全生命周期规划。*
