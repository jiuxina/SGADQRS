-- ============================================
-- 赛友 TeamUp 升级脚本（在已有 scms 库上执行一次）
-- 用法：mysql -u root -proot scms < backend/sql/upgrade-teamup.sql
-- 内容：
--   1. sys_user 精简：删 role 列（角色由 user_type 推导），新增 nickname/bio/skills
--   2. competition_registration 精简：删 is_team_leader / contact_phone（队长由 team.leader_id 推导，手机号属隐私不入报名表）
--   3. sys_notice 并入统一通知表 sys_notification 后删除
--   4. 新增社区表：recruit_post（招募/求组帖）、community_request（互看/申请/邀请）
--   5. 写入社区演示数据
-- ============================================
USE scms;

-- ===== 1. sys_user =====
ALTER TABLE `sys_user` ADD COLUMN `nickname` VARCHAR(50) DEFAULT NULL COMMENT '社区昵称' AFTER `real_name`;
ALTER TABLE `sys_user` ADD COLUMN `bio` VARCHAR(500) DEFAULT NULL COMMENT '个人简介' AFTER `class_name`;
ALTER TABLE `sys_user` ADD COLUMN `skills` VARCHAR(255) DEFAULT NULL COMMENT '技能标签(逗号分隔)' AFTER `bio`;
ALTER TABLE `sys_user` DROP COLUMN `role`;

-- ===== 2. competition_registration =====
ALTER TABLE `competition_registration` DROP COLUMN `is_team_leader`;
ALTER TABLE `competition_registration` DROP COLUMN `contact_phone`;

-- ===== 3. 统一通知表（替代 sys_notice；user_id=0 表示全员公告） =====
CREATE TABLE IF NOT EXISTS `sys_notification` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT NOT NULL DEFAULT 0 COMMENT '接收者用户ID，0-全员公告',
    `type` VARCHAR(20) NOT NULL DEFAULT 'system' COMMENT '类型：announcement-公告 interaction-互动 system-系统',
    `title` VARCHAR(100) NOT NULL,
    `content` VARCHAR(500) DEFAULT NULL,
    `ref_type` VARCHAR(20) DEFAULT NULL COMMENT '关联对象类型：request/recruit/user/notice',
    `ref_id` BIGINT DEFAULT NULL COMMENT '关联对象ID',
    `is_read` TINYINT NOT NULL DEFAULT 0 COMMENT '0-未读 1-已读（公告不跟踪已读）',
    `is_top` TINYINT NOT NULL DEFAULT 0 COMMENT '公告置顶',
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_noti_user` (`user_id`, `is_read`),
    KEY `idx_noti_ref` (`ref_type`, `ref_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='站内通知表(含公告)';

-- 迁移旧公告
INSERT INTO `sys_notification` (`user_id`, `type`, `title`, `content`, `ref_type`, `is_top`, `create_time`)
SELECT 0, 'announcement', n.notice_title, n.notice_content, 'notice', n.is_top, COALESCE(n.publish_time, n.create_time)
FROM `sys_notice` n;
DROP TABLE IF EXISTS `sys_notice`;

-- ===== 4. 招募/求组帖 =====
CREATE TABLE IF NOT EXISTS `recruit_post` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `competition_id` BIGINT NOT NULL COMMENT '竞赛ID',
    `user_id` BIGINT NOT NULL COMMENT '发布者用户ID',
    `type` TINYINT NOT NULL DEFAULT 1 COMMENT '1-组队招募 2-求组',
    `title` VARCHAR(100) NOT NULL COMMENT '标题',
    `content` TEXT DEFAULT NULL COMMENT '说明',
    `team_id` BIGINT DEFAULT NULL COMMENT '关联队伍(招募帖)',
    `need_count` INT NOT NULL DEFAULT 1 COMMENT '还需人数',
    `tags` VARCHAR(255) DEFAULT NULL COMMENT '方向标签(逗号分隔)',
    `deadline` DATETIME DEFAULT NULL COMMENT '组队截止时间',
    `status` TINYINT NOT NULL DEFAULT 1 COMMENT '1-招募中 0-已关闭',
    `view_count` INT NOT NULL DEFAULT 0,
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_rp_comp` (`competition_id`),
    KEY `idx_rp_user` (`user_id`),
    KEY `idx_rp_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='组队招募/求组帖';

-- ===== 5. 社区请求（互看资料 / 入队申请 / 入队邀请） =====
CREATE TABLE IF NOT EXISTS `community_request` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `type` TINYINT NOT NULL COMMENT '1-资料互看 2-入队申请 3-入队邀请',
    `post_id` BIGINT DEFAULT NULL COMMENT '关联招募帖',
    `team_id` BIGINT DEFAULT NULL COMMENT '关联队伍',
    `from_user_id` BIGINT NOT NULL COMMENT '发起人',
    `to_user_id` BIGINT NOT NULL COMMENT '接收人',
    `message` VARCHAR(500) DEFAULT NULL,
    `status` TINYINT NOT NULL DEFAULT 0 COMMENT '0-待处理 1-已同意 2-已拒绝',
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `handle_time` DATETIME DEFAULT NULL,
    PRIMARY KEY (`id`),
    KEY `idx_cr_to` (`to_user_id`, `status`),
    KEY `idx_cr_from` (`from_user_id`),
    KEY `idx_cr_pair` (`from_user_id`, `to_user_id`, `type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='社区请求表';

-- ===== 6. 社区演示数据 =====
UPDATE `sys_user` SET nickname='小明同学', bio='热爱算法与数学建模，ACM 校队成员，目标国赛奖牌。', skills='C++,Python,算法,数学建模' WHERE id=4;
UPDATE `sys_user` SET nickname='Hua', bio='后端开发方向，熟悉 Spring 全家桶与数据库调优。', skills='Java,后端开发,数据库' WHERE id=5;
UPDATE `sys_user` SET nickname='强子', bio='竞赛型选手，高中开始打 OI，现在主攻 ICPC。', skills='C++,算法,ICPC' WHERE id=6;
UPDATE `sys_user` SET nickname='静静', bio='对创新创业感兴趣，擅长商业计划书与路演答辩。', skills='商业分析,路演,PPT' WHERE id=7;
UPDATE `sys_user` SET nickname='洋仔', bio='电子发烧友，喜欢做小车和小机器人。', skills='嵌入式,硬件,单片机' WHERE id=8;

INSERT IGNORE INTO `competition_team` (`id`, `competition_id`, `team_name`, `leader_id`, `teacher_id`, `team_slogan`, `status`, `create_time`)
VALUES (4, 2, 'ICPC集训队', 6, NULL, '冲击区域赛', 0, NOW());
INSERT IGNORE INTO `competition_team_member` (`id`, `team_id`, `student_id`, `join_time`, `status`) VALUES (5, 4, 6, NOW(), 1);

INSERT IGNORE INTO `recruit_post` (`id`, `competition_id`, `user_id`, `type`, `title`, `content`, `team_id`, `need_count`, `tags`, `deadline`, `status`, `view_count`, `create_time`, `update_time`) VALUES
(1, 1, 4, 1, '数学建模国赛招 2 人（算法/写作）', '我们是算法小分队，已有一名建模手和一名编程手，现招 1-2 名队友：最好会 Python 数值计算或论文写作。目标国二以上，赛前每周集训两次。', 1, 2, '算法,Python,论文写作', '2026-06-30 23:59:59', 1, 23, NOW(), NOW()),
(2, 2, 6, 1, 'ICPC 集训队招队友（码力型选手优先）', '本人主攻算法，暑假开始集训，目标区域赛银牌以上。求 1-2 名 C++ 码力强的队友，一起刷题、打网络赛和区域赛。', 4, 2, 'C++,算法,ICPC', '2026-05-10 23:59:59', 1, 41, NOW(), NOW()),
(3, 3, 7, 2, '求组互联网+队伍（商业计划书/路演向）', '会写商业计划书、做过路演，拿过校赛铜奖。希望加入一支有技术成员的队伍，我可以负责 BP 与答辩。', NULL, 1, '商业计划书,路演,市场分析', '2026-04-30 23:59:59', 1, 12, NOW(), NOW());

INSERT IGNORE INTO `community_request` (`id`, `type`, `post_id`, `team_id`, `from_user_id`, `to_user_id`, `message`, `status`, `create_time`, `handle_time`) VALUES
(1, 1, NULL, NULL, 5, 8, '你好，看到你在蓝桥杯报名了，想互看下资料交个朋友~', 0, NOW(), NULL),
(2, 2, 2, 4, 8, 6, '学长好！我是刘洋，C++ 写了两年，刷了 300+ 题，想加入 ICPC 集训队。', 0, NOW(), NULL),
(3, 1, NULL, NULL, 7, 4, '想了解下你在数学建模队的经历', 1, NOW(), NOW());

INSERT IGNORE INTO `sys_notification` (`user_id`, `type`, `title`, `content`, `ref_type`, `ref_id`, `is_read`, `is_top`, `create_time`) VALUES
(6, 'interaction', '收到新的入队申请', '刘洋 申请加入你的队伍「ICPC集训队」，去组队中心处理。', 'request', 2, 0, 0, NOW()),
(8, 'interaction', '收到资料互看请求', '李华 请求与你互看资料，同意后双方可查看完整资料与获奖记录。', 'request', 1, 0, 0, NOW()),
(4, 'interaction', '资料互看已同意', '静静 已同意与你互看资料，现在可以查看彼此的完整资料与获奖记录。', 'request', 3, 0, 0, NOW()),
(7, 'interaction', '资料互看已同意', '小明同学 已同意与你互看资料，现在可以查看彼此的完整资料与获奖记录。', 'request', 3, 0, 0, NOW());
