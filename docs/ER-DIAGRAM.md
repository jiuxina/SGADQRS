# 赛友 TeamUp 数据库 E-R 图（原 SCMS，2026-09-05 社区化 + Lean 精简）

> 以 `backend/sql/init.sql` 为准。

```mermaid
erDiagram
    sys_user {
        bigint id PK
        varchar username UK
        varchar password
        varchar real_name
        varchar nickname "社区昵称(脱敏展示)"
        varchar avatar
        tinyint gender "0未知 1男 2女"
        tinyint user_type "1学生 2教师 3管理员"
        tinyint status "0禁用 1启用"
        varchar dept_name "院系名称"
        varchar major_name "专业名称"
        varchar class_name "班级名称"
        varchar bio "个人简介"
        varchar skills "技能标签(逗号分隔)"
        datetime create_time
        datetime update_time
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
        json awards "自定义奖项列表"
        json attachments "竞赛附件列表"
        tinyint status "0草稿 2发布 3进行 4结束"
        datetime create_time
        datetime update_time
    }

    competition_result {
        bigint id PK
        bigint competition_id FK
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

    recruit_post {
        bigint id PK
        bigint competition_id FK
        bigint user_id FK
        tinyint type "1组队招募 2求组"
        varchar title
        text content
        bigint team_id FK "可空,招募帖自动建队"
        varchar tags "方向标签"
        datetime deadline "组队截止"
        tinyint status "1招募中 0已关闭"
        datetime create_time
        datetime update_time
    }

    community_request {
        bigint id PK
        tinyint type "1互看 2入队申请 3入队邀请"
        bigint post_id FK "可空"
        bigint team_id FK "可空"
        bigint from_user_id FK
        bigint to_user_id FK
        varchar message
        tinyint status "0待处理 1同意 2拒绝"
        datetime create_time
        datetime handle_time
    }

    sys_notification {
        bigint id PK
        bigint user_id "0=全员公告"
        varchar type "announcement/interaction/system"
        varchar title
        varchar content
        varchar ref_type "request/recruit/user/notice"
        bigint ref_id
        tinyint is_read
        tinyint is_top
        datetime create_time
    }

    %% ===== 关系 =====

    sys_user ||--o{ competition : "发布竞赛"
    competition ||--o{ competition_result : "产生成绩"
    competition ||--o{ competition_team : "组建团队"

    sys_user ||--o{ competition_result : "学生成绩"

    competition_team ||--o{ competition_team_member : "包含成员"
    competition_team ||--o{ competition_result : "团队成绩"
    sys_user ||--o{ competition_team_member : "加入团队"
    sys_user ||--o{ competition_team : "担任队长"


    sys_user ||--o{ recruit_post : "发布招募/求组"
    recruit_post ||--o{ community_request : "产生请求"
    community_request }o--|| sys_user : "发起人/接收人"
    sys_user ||--o{ sys_notification : "接收通知"
```

> 隐私规则：招募帖/请求列表仅返回脱敏资料卡（昵称打码/头像/院系/专业/技能/简介摘要）；`type=1 且 status=1` 的 community_request 表示双方互看解锁，解锁后 `GET /user/public/{id}` 才返回真实姓名、完整简介与已发布获奖记录；手机号/邮箱永不在社区展示。

## 表说明

| 表名 | 用途 |
|------|------|
| `sys_user` | 用户（学生/教师/管理员） |
| `competition` | 竞赛信息 |
| `competition_result` | 成绩记录 |
| `competition_team` | 团队 |
| `competition_team_member` | 团队成员 |
| `recruit_post` | 组队招募/求组帖 |
| `community_request` | 社区请求（资料互看/入队申请/入队邀请） |
| `sys_notification` | 站内通知（含全员公告，替代原 sys_notice） |
