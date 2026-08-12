# SCMS 数据库 E-R 图

> 以 `backend/sql/init.sql` 为准。

```mermaid
erDiagram
    sys_user {
        bigint id PK
        varchar username UK
        varchar password
        varchar real_name
        varchar avatar
        tinyint gender "0未知 1男 2女"
        varchar phone
        varchar email
        tinyint user_type "1学生 2教师 3管理员"
        varchar role "角色标识"
        tinyint status "0禁用 1启用"
        varchar dept_name "院系名称"
        varchar major_name "专业名称"
        varchar class_name "班级名称"
        datetime create_time
        datetime update_time
        datetime last_login_time
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
        json attachments "竞赛附件列表"
        tinyint status "0草稿 1审核 2发布 3进行 4结束 5驳回"
        datetime create_time
        datetime update_time
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
        datetime create_time
    }

    competition_result {
        bigint id PK
        bigint competition_id FK
        bigint registration_id FK
        bigint student_id FK
        bigint team_id FK
        decimal score
        int ranking
        tinyint award_level "1特等 2一等 3二等 4三等 5优秀"
        varchar award_name
        varchar remark
        tinyint is_published "0否 1是"
        datetime publish_time
        datetime create_time
    }

    competition_team {
        bigint id PK
        bigint competition_id FK
        varchar team_name
        bigint leader_id FK
        varchar team_slogan
        tinyint status "0组建中 1已提交 2已通过 3已拒绝"
        datetime create_time
    }

    competition_team_member {
        bigint id PK
        bigint team_id FK
        bigint student_id FK
        datetime join_time
        tinyint status "0已退出 1正常"
    }

    sys_notice {
        bigint id PK
        varchar notice_title
        text notice_content
        tinyint notice_type "1通知 2公告"
        tinyint is_top
        tinyint status
        datetime publish_time
        datetime create_time
    }

    %% ===== 关系 =====

    sys_user ||--o{ competition : "发布竞赛"
    competition ||--o{ competition_registration : "被报名"
    competition ||--o{ competition_result : "产生成绩"
    competition ||--o{ competition_team : "组建团队"

    sys_user ||--o{ competition_registration : "学生报名"
    sys_user ||--o{ competition_result : "学生成绩"

    competition_team ||--o{ competition_team_member : "包含成员"
    competition_team ||--o{ competition_result : "团队成绩"
    sys_user ||--o{ competition_team_member : "加入团队"
    sys_user ||--o{ competition_team : "担任队长"

    competition_registration ||--o| competition_result : "关联成绩"
```

## 表说明

| 表名 | 用途 |
|------|------|
| `sys_user` | 用户（学生/教师/管理员） |
| `competition` | 竞赛信息 |
| `competition_registration` | 报名记录 |
| `competition_result` | 成绩记录 |
| `competition_team` | 团队 |
| `competition_team_member` | 团队成员 |
| `sys_notice` | 系统公告 |
