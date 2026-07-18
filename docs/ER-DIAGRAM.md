# SCMS 数据库 E-R 图

```mermaid
erDiagram
    sys_user {
        bigint id PK
        varchar username UK
        varchar password
        varchar real_name
        varchar avatar
        tinyint gender
        varchar phone
        varchar email
        tinyint user_type "1学生 2教师 3管理员"
        tinyint status "0禁用 1启用"
        bigint dept_id FK
        bigint major_id FK
        bigint class_id FK
    }

    sys_role {
        bigint id PK
        varchar role_name
        varchar role_code UK "admin/teacher/student"
    }

    sys_user_role {
        bigint user_id PK_FK
        bigint role_id PK_FK
    }

    sys_dept {
        bigint id PK
        bigint parent_id
        varchar dept_name
        varchar dept_code
        int sort_order
        tinyint status
    }

    sys_major {
        bigint id PK
        bigint dept_id FK
        varchar major_name
        varchar major_code
        tinyint status
    }

    sys_class {
        bigint id PK
        bigint major_id FK
        varchar class_name
        varchar grade
        tinyint status
    }

    competition {
        bigint id PK
        varchar competition_name
        varchar organizer
        bigint publisher_id FK
        varchar cover_image
        text description
        text rules
        datetime registration_start
        datetime registration_end
        datetime competition_start
        datetime competition_end
        varchar location
        int max_members
        int max_teams
        json awards "自定义奖项列表"
        tinyint status "0草稿 1审核 2发布 3进行 4结束 5驳回"
        int view_count
    }

    competition_attachment {
        bigint id PK
        bigint competition_id FK
        varchar file_name
        varchar file_url
        bigint file_size
        varchar file_type
    }

    competition_registration {
        bigint id PK
        bigint competition_id FK
        bigint team_id FK
        bigint student_id FK
        tinyint is_team_leader
        varchar contact_phone
        varchar remark
        varchar attachment_url
        tinyint status "0待审 1通过 2拒绝"
        varchar audit_remark
        datetime audit_time
    }

    competition_result {
        bigint id PK
        bigint competition_id FK
        bigint registration_id FK
        bigint student_id FK
        bigint team_id FK
        decimal score
        int ranking
        tinyint award_level
        varchar award_name
        varchar remark
        varchar certificate_url "老师上传"
        tinyint is_published
        datetime publish_time
    }

    competition_team {
        bigint id PK
        bigint competition_id FK
        varchar team_name
        bigint leader_id FK
        varchar team_slogan
        tinyint status
    }

    competition_team_member {
        bigint id PK
        bigint team_id FK
        bigint student_id FK
        tinyint status "0待确认 1确认 2拒绝"
    }

    sys_message {
        bigint id PK
        bigint user_id FK
        varchar message_title
        varchar message_content
        tinyint message_type
        tinyint is_read
    }

    sys_notice {
        bigint id PK
        varchar notice_title
        text notice_content
        tinyint notice_type
        tinyint is_top
        tinyint status
        datetime publish_time
    }

    sys_oper_log {
        bigint id PK
        bigint user_id FK
        varchar username
        varchar operation
        varchar method
        varchar request_url
        text request_params
        varchar ip_address
        int spend_time
        tinyint status
        varchar error_msg
    }

    %% ===== 关系 =====

    sys_user ||--o{ sys_user_role : "拥有角色"
    sys_role ||--o{ sys_user_role : "被分配给"

    sys_dept ||--o{ sys_major : "包含专业"
    sys_major ||--o{ sys_class : "包含班级"
    sys_dept ||--o{ sys_user : "所属院系"
    sys_major ||--o{ sys_user : "所属专业"
    sys_class ||--o{ sys_user : "所属班级"

    sys_user ||--o{ competition : "发布竞赛"
    competition ||--o{ competition_attachment : "拥有附件"
    competition ||--o{ competition_registration : "被报名"
    competition ||--o{ competition_result : "产生成绩"
    competition ||--o{ competition_team : "组建团队"

    sys_user ||--o{ competition_registration : "学生报名"
    sys_user ||--o{ competition_result : "学生成绩"

    competition_team ||--o{ competition_team_member : "包含成员"
    sys_user ||--o{ competition_team_member : "加入团队"
    sys_user ||--o{ competition_team : "担任队长"

    sys_user ||--o{ sys_message : "接收消息"
    sys_user ||--o{ sys_oper_log : "产生日志"
```

## 表说明

| 表名 | 用途 | 记录数 |
|------|------|--------|
| `sys_user` | 用户（学生/教师/管理员） | 8 |
| `sys_role` | 角色定义 | 3 |
| `sys_user_role` | 用户-角色关联 | 8 |
| `sys_dept` | 院系 | - |
| `sys_major` | 专业 | - |
| `sys_class` | 班级 | - |
| `competition` | 竞赛信息 | 6 |
| `competition_attachment` | 竞赛附件 | - |
| `competition_registration` | 报名记录 | - |
| `competition_result` | 成绩记录 | - |
| `competition_team` | 团队 | - |
| `competition_team_member` | 团队成员 | - |
| `sys_message` | 站内消息 | - |
| `sys_notice` | 系统公告 | - |
| `sys_oper_log` | 操作日志 | - |
