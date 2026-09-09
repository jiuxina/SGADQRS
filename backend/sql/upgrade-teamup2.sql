-- ============================================
-- 组队逻辑优化增量升级（成员流动 + 招募帖联系方式）
-- 用法: mysql -u root -proot scms < backend/sql/upgrade-teamup2.sql
-- ============================================
USE scms;

-- ===== 1. 成员流动：冗余竞赛ID + 唯一约束兜底 =====
-- competition_id 冗余到成员表，用于数据库层强制"一人一赛一队"
-- 1a) 加列（已有旧库执行；若列已存在会报错，可忽略）
ALTER TABLE `competition_team_member`
    ADD COLUMN `competition_id` BIGINT NOT NULL DEFAULT 0 COMMENT '冗余竞赛ID（一人一赛一队唯一约束）' AFTER `team_id`;

-- 1b) 存量数据回填
UPDATE `competition_team_member` m JOIN `competition_team` t ON m.`team_id` = t.`id`
SET m.`competition_id` = t.`competition_id`;

-- 1c) 加唯一键前先检查脏数据（有结果则先人工清理，否则 1d 会失败）：
-- SELECT student_id, competition_id, COUNT(*) c FROM competition_team_member GROUP BY competition_id, student_id HAVING c > 1;
-- SELECT team_id, student_id, COUNT(*) c FROM competition_team_member GROUP BY team_id, student_id HAVING c > 1;
ALTER TABLE `competition_team_member`
    ADD UNIQUE KEY `uk_tm_team_student` (`team_id`, `student_id`),
    ADD UNIQUE KEY `uk_tm_comp_student` (`competition_id`, `student_id`);

-- ===== 2. 招募帖联系方式 =====
-- 招募帖/求组帖可留联系方式，配合"直接申请/邀请 + 备注沟通"（资料互看机制已下线）
ALTER TABLE `recruit_post`
    ADD COLUMN `contact` VARCHAR(100) DEFAULT NULL COMMENT '联系方式（微信/QQ/邮箱等，选填）' AFTER `tags`;
