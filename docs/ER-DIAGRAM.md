# 赛友 TeamUp 数据库 E-R 图（原 SCMS，2026-09-05 社区化 + Lean 精简；2026-09-09 组队 2.0）

> 以 `backend/sql/init.sql` 为准（含 `upgrade-teamup2.sql` 对应变更：成员表冗余竞赛ID + 双唯一键、招募帖联系方式、资料互看下线）。

```mermaid
erDiagram
    sys_user {
        bigint id PK
        varchar username UK
        varchar password
        varchar real_name
        varchar nickname "社区昵称"
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
        bigint teacher_id FK "指导老师(队长指定,老师只读)"
        varchar team_slogan
        tinyint status "0组建中 1已提交 2已通过 3已拒绝"
        datetime create_time
    }

    competition_team_member {
        bigint id PK
        bigint team_id FK "uk(team_id,student_id)"
        bigint competition_id FK "冗余竞赛ID, uk(competition_id,student_id)"
        bigint student_id FK
        datetime join_time
    }

    recruit_post {
        bigint id PK
        bigint competition_id FK
        bigint user_id FK
        tinyint type "1组队招募 2求组"
        varchar title
        text content
        bigint team_id FK "可空;招募帖必关联发布者已有队伍"
        varchar tags "方向标签"
        varchar contact "联系方式(微信/QQ/邮箱,选填)"
        datetime deadline "组队截止"
        tinyint status "1招募中 0已关闭"
        datetime create_time
        datetime update_time
    }

    community_request {
        bigint id PK
        tinyint type "2入队申请 3入队邀请(1资料互看已废弃)"
        bigint post_id FK "可空"
        bigint team_id FK "可空"
        bigint from_user_id FK
        bigint to_user_id FK
        varchar message "备注(常写联系方式)"
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
        varchar ref_type "request/recruit/team/user/notice"
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

    competition ||--o{ competition_team_member : "冗余竞赛ID(库层强制一人一赛一队)"
    competition_team ||--o{ competition_team_member : "包含成员"
    competition_team ||--o{ competition_result : "团队成绩"
    sys_user ||--o{ competition_team_member : "加入团队"
    sys_user ||--o{ competition_team : "担任队长"


    sys_user ||--o{ recruit_post : "发布招募/求组"
    recruit_post ||--o{ community_request : "产生请求"
    community_request }o--|| sys_user : "发起人/接收人"
    sys_user ||--o{ sys_notification : "接收通知"
```

> **资料可见性（2026-09 组队 2.0 起）**：原"资料互看解锁"机制已下线——社区资料卡与 `GET /user/public/{id}` 的完整资料（真实姓名、完整简介、已发布获奖记录、参赛统计）对**所有登录用户**开放；展示名优先昵称、无昵称用真实姓名（不再打码）。想私聊沟通的用户在招募帖 `contact` 字段（选填）或申请/邀请备注（`message`）中自行留联系方式。手机号、邮箱等隐私字段始终不入库、不外露。
>
> **队伍规则要点**：提交审核后名单冻结（不可退队/移除成员，驳回后可调整）；`uk_tm_comp_student` 在库层兜底"一人一赛一队"；建队/入队/发申请邀请均校验竞赛报名窗口（`registration_start/end`，空值放行兼容旧数据）；队伍提交审核、审核通过或解散时自动下架关联招募帖。

## 表说明

| 表名 | 用途 |
|------|------|
| `sys_user` | 用户（学生/教师/管理员） |
| `competition` | 竞赛信息 |
| `competition_result` | 成绩记录 |
| `competition_team` | 团队 |
| `competition_team_member` | 团队成员（冗余竞赛ID + 双唯一键） |
| `recruit_post` | 组队招募/求组帖（含联系方式） |
| `community_request` | 社区请求（入队申请/入队邀请；互看类型已废弃仅存历史） |
| `sys_notification` | 站内通知（含全员公告，替代原 sys_notice） |
