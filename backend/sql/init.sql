-- ============================================
-- 学生竞赛信息管理系统 (SCMS) 数据库初始化脚本
-- ============================================

CREATE DATABASE IF NOT EXISTS scms DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE scms;

-- ===== 1. 用户表 =====

CREATE TABLE IF NOT EXISTS `sys_user` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `username` VARCHAR(50) NOT NULL COMMENT '登录账号',
    `password` VARCHAR(100) NOT NULL COMMENT '密码(BCrypt)',
    `real_name` VARCHAR(50) NOT NULL COMMENT '真实姓名',
    `avatar` VARCHAR(255) DEFAULT NULL COMMENT '头像URL',
    `phone` VARCHAR(20) DEFAULT NULL COMMENT '手机号',
    `email` VARCHAR(100) DEFAULT NULL COMMENT '邮箱',
    `gender` TINYINT DEFAULT 0 COMMENT '性别：0-未知 1-男 2-女',
    `user_type` TINYINT NOT NULL COMMENT '用户类型：1-学生 2-教师 3-管理员',
    `role` VARCHAR(50) DEFAULT NULL COMMENT '角色',
    `dept_name` VARCHAR(50) DEFAULT NULL COMMENT '所属学院',
    `major_name` VARCHAR(50) DEFAULT NULL COMMENT '专业',
    `class_name` VARCHAR(50) DEFAULT NULL COMMENT '班级',
    `status` TINYINT NOT NULL DEFAULT 1 COMMENT '状态：1-启用 0-禁用',
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `last_login_time` DATETIME DEFAULT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_username` (`username`),
    KEY `idx_user_type` (`user_type`)
) ENGINE=InnoDB COMMENT='用户表';

-- ===== 2. 竞赛核心表 =====

CREATE TABLE IF NOT EXISTS `competition` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `competition_name` VARCHAR(100) NOT NULL COMMENT '竞赛名称',
    `organizer` VARCHAR(100) NOT NULL COMMENT '主办单位',
    `publisher_id` BIGINT NOT NULL COMMENT '发布人ID',
    `cover_image` VARCHAR(255) DEFAULT NULL,
    `description` TEXT DEFAULT NULL COMMENT '竞赛详细描述',
    `rules` TEXT DEFAULT NULL COMMENT '竞赛规则',
    `registration_start` DATETIME NOT NULL COMMENT '报名开始时间',
    `registration_end` DATETIME NOT NULL COMMENT '报名截止时间',
    `competition_start` DATETIME NOT NULL COMMENT '竞赛开始时间',
    `competition_end` DATETIME NOT NULL COMMENT '竞赛结束时间',
    `location` VARCHAR(200) DEFAULT NULL COMMENT '地点',
    `max_members` INT NOT NULL DEFAULT 1 COMMENT '每队最大人数',
    `max_teams` INT DEFAULT NULL COMMENT '最大队伍数',
    `awards` JSON DEFAULT NULL COMMENT '自定义奖项列表',
    `attachments` JSON DEFAULT NULL COMMENT '附件列表',
    `status` TINYINT NOT NULL DEFAULT 0 COMMENT '0-草稿 1-待审核 2-已发布 3-进行中 4-已结束 5-已驳回',
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_comp_status` (`status`),
    KEY `idx_comp_publisher` (`publisher_id`)
) ENGINE=InnoDB COMMENT='竞赛信息表';

-- ===== 3. 报名与团队 =====

CREATE TABLE IF NOT EXISTS `competition_registration` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `competition_id` BIGINT NOT NULL,
    `team_id` BIGINT DEFAULT NULL COMMENT '团队ID',
    `student_id` BIGINT NOT NULL,
    `is_team_leader` TINYINT NOT NULL DEFAULT 0 COMMENT '是否队长',
    `contact_phone` VARCHAR(20) DEFAULT NULL,
    `remark` VARCHAR(500) DEFAULT NULL,
    `attachment_url` VARCHAR(255) DEFAULT NULL,
    `status` TINYINT NOT NULL DEFAULT 0 COMMENT '0-待审核 1-已通过 2-已拒绝',
    `audit_remark` VARCHAR(500) DEFAULT NULL,
    `audit_time` DATETIME DEFAULT NULL,
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_reg_comp` (`competition_id`),
    KEY `idx_reg_student` (`student_id`),
    KEY `idx_reg_status` (`status`)
) ENGINE=InnoDB COMMENT='竞赛报名表';

CREATE TABLE IF NOT EXISTS `competition_team` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `competition_id` BIGINT NOT NULL,
    `team_name` VARCHAR(50) NOT NULL,
    `leader_id` BIGINT NOT NULL COMMENT '队长ID',
    `team_slogan` VARCHAR(200) DEFAULT NULL,
    `status` TINYINT NOT NULL DEFAULT 0 COMMENT '0-组建中 1-已提交 2-已通过 3-已拒绝',
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_team_comp` (`competition_id`)
) ENGINE=InnoDB COMMENT='团队信息表';

CREATE TABLE IF NOT EXISTS `competition_team_member` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `team_id` BIGINT NOT NULL,
    `student_id` BIGINT NOT NULL,
    `join_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `status` TINYINT NOT NULL DEFAULT 1 COMMENT '0-已退出 1-正常',
    PRIMARY KEY (`id`),
    KEY `idx_tm_team` (`team_id`)
) ENGINE=InnoDB COMMENT='团队成员表';

-- ===== 4. 成绩 =====

CREATE TABLE IF NOT EXISTS `competition_result` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `competition_id` BIGINT NOT NULL,
    `registration_id` BIGINT NOT NULL,
    `student_id` BIGINT DEFAULT NULL,
    `team_id` BIGINT DEFAULT NULL,
    `score` DECIMAL(10,2) DEFAULT NULL,
    `ranking` INT DEFAULT NULL,
    `award_level` TINYINT DEFAULT NULL COMMENT '1-特等奖 2-一等奖 3-二等奖 4-三等奖 5-优秀奖',
    `award_name` VARCHAR(50) DEFAULT NULL,
    `remark` VARCHAR(500) DEFAULT NULL,
    `is_published` TINYINT NOT NULL DEFAULT 0 COMMENT '0-否 1-是',
    `publish_time` DATETIME DEFAULT NULL,
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_result_comp` (`competition_id`),
    KEY `idx_result_student` (`student_id`),
    KEY `idx_result_publish` (`is_published`)
) ENGINE=InnoDB COMMENT='竞赛成绩表';

-- ===== 5. 系统辅助表 =====

CREATE TABLE IF NOT EXISTS `sys_notice` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `notice_title` VARCHAR(100) NOT NULL,
    `notice_content` TEXT NOT NULL,
    `notice_type` TINYINT NOT NULL DEFAULT 1 COMMENT '1-通知 2-公告',
    `is_top` TINYINT NOT NULL DEFAULT 0,
    `status` TINYINT NOT NULL DEFAULT 1,
    `publish_time` DATETIME DEFAULT NULL,
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB COMMENT='系统公告表';

-- ============================================
-- 初始数据
-- ============================================

-- 默认账号密码统一为 123456
-- BCrypt加密
INSERT INTO `sys_user` VALUES (1, 'admin', '$2b$10$j7XnMEsPsByfvmbAQqFmLORnxpqfL/QrrRccVMsHN.izBV6n1jyRG', '系统管理员', NULL, NULL, NULL, 1, 3, 'admin', NULL, NULL, NULL, 1, NOW(), NOW(), NOW());

-- 教师账号（密码: 123456）
INSERT INTO `sys_user` VALUES (2, 'T2024001', '$2b$10$j7XnMEsPsByfvmbAQqFmLORnxpqfL/QrrRccVMsHN.izBV6n1jyRG', '张教授', NULL, NULL, NULL, 1, 2, 'teacher', '计算机学院', NULL, NULL, 1, NOW(), NOW(), NOW());
INSERT INTO `sys_user` VALUES (3, 'T2024002', '$2b$10$j7XnMEsPsByfvmbAQqFmLORnxpqfL/QrrRccVMsHN.izBV6n1jyRG', '李副教授', NULL, NULL, NULL, 2, 2, 'teacher', '计算机学院', NULL, NULL, 1, NOW(), NOW(), NOW());

-- 学生账号（密码: 123456）
INSERT INTO `sys_user` VALUES (4, 'S20210001', '$2b$10$j7XnMEsPsByfvmbAQqFmLORnxpqfL/QrrRccVMsHN.izBV6n1jyRG', '王明', NULL, NULL, NULL, 1, 1, 'student', '计算机学院', '计算机科学与技术', '计科2101班', 1, NOW(), NOW(), NOW());
INSERT INTO `sys_user` VALUES (5, 'S20210002', '$2b$10$j7XnMEsPsByfvmbAQqFmLORnxpqfL/QrrRccVMsHN.izBV6n1jyRG', '李华', NULL, NULL, NULL, 2, 1, 'student', '计算机学院', '计算机科学与技术', '计科2102班', 1, NOW(), NOW(), NOW());
INSERT INTO `sys_user` VALUES (6, 'S20210003', '$2b$10$j7XnMEsPsByfvmbAQqFmLORnxpqfL/QrrRccVMsHN.izBV6n1jyRG', '赵强', NULL, NULL, NULL, 1, 1, 'student', '计算机学院', '软件工程', '计科2102班', 1, NOW(), NOW(), NOW());
INSERT INTO `sys_user` VALUES (7, 'S20220001', '$2b$10$j7XnMEsPsByfvmbAQqFmLORnxpqfL/QrrRccVMsHN.izBV6n1jyRG', '陈静', NULL, NULL, NULL, 2, 1, 'student', '计算机学院', '计算机科学与技术', '计科2101班', 1, NOW(), NOW(), NOW());
INSERT INTO `sys_user` VALUES (8, 'S20220002', '$2b$10$j7XnMEsPsByfvmbAQqFmLORnxpqfL/QrrRccVMsHN.izBV6n1jyRG', '刘洋', NULL, NULL, NULL, 1, 1, 'student', '电子信息学院', '电子信息工程', '软工2201班', 1, NOW(), NOW(), NOW());

-- 竞赛数据
INSERT INTO `competition` VALUES (1, '全国大学生数学建模竞赛', '教育部高等教育司', 2, NULL, '全国大学生数学建模竞赛是国内规模最大的基础性学科竞赛，创办于1992年，每年一届。', '1. 每队3人；2. 赛期3天；3. 提交论文', '2026-05-01 00:00:00', '2026-06-30 23:59:59', '2026-09-10 00:00:00', '2026-09-13 00:00:00', '线上+线下', 3, 100, '[{"name":"一等奖","level":1},{"name":"二等奖","level":2},{"name":"三等奖","level":3}]', NULL, 2, NOW(), NOW());
INSERT INTO `competition` VALUES (2, 'ACM-ICPC程序设计竞赛', '国际计算机学会', 2, NULL, 'ACM国际大学生程序设计竞赛是最具影响力的大学生程序设计竞赛。', '1. 每队3人；2. 5小时；3. C/C++/Java/Python', '2026-04-01 00:00:00', '2026-05-15 23:59:59', '2026-06-01 00:00:00', '2026-06-01 05:00:00', '计算机学院实验室', 3, 50, '[{"name":"金牌","level":1},{"name":"银牌","level":2},{"name":"铜牌","level":3}]', NULL, 2, NOW(), NOW());
INSERT INTO `competition` VALUES (3, '中国"互联网+"大学生创新创业大赛', '教育部', 3, NULL, '中国"互联网+"大学生创新创业大赛，由教育部与政府、各高校共同主办。', '1. 团队参赛；2. 提交商业计划书；3. 现场路演', '2026-03-01 00:00:00', '2026-04-30 23:59:59', '2026-07-01 00:00:00', '2026-07-03 00:00:00', '学校大礼堂', 5, 30, '[{"name":"金奖","level":1},{"name":"银奖","level":2},{"name":"铜奖","level":3},{"name":"最佳创意奖","level":4}]', NULL, 2, NOW(), NOW());
INSERT INTO `competition` VALUES (4, '全国大学生电子设计竞赛', '教育部高等教育司', 3, NULL, '全国大学生电子设计竞赛是面向大学生的群众性科技活动。', '1. 每队3人；2. 4天3夜；3. 完成实物制作', '2026-05-15 00:00:00', '2026-07-15 23:59:59', '2026-08-01 00:00:00', '2026-08-04 00:00:00', '电子信息学院实验室', 3, 40, '[{"name":"一等奖","level":1},{"name":"二等奖","level":2},{"name":"三等奖","level":3}]', NULL, 1, NOW(), NOW());
INSERT INTO `competition` VALUES (5, '校园英语演讲比赛', '外国语学院', 2, NULL, '提升大学生英语口语表达能力和跨文化交际能力。', '1. 个人赛；2. 3分钟定题演讲；3. 2分钟即兴', '2026-04-10 00:00:00', '2026-05-10 23:59:59', '2026-05-25 00:00:00', '2026-05-25 12:00:00', '外语学院报告厅', 1, 60, '[{"name":"一等奖","level":1},{"name":"二等奖","level":2},{"name":"三等奖","level":3},{"name":"最佳风采奖","level":4}]', NULL, 2, NOW(), NOW());
INSERT INTO `competition` VALUES (6, '"蓝桥杯"软件设计大赛', '工业和信息化部', 2, NULL, '蓝桥杯全国软件和信息技术专业人才大赛。', '1. 个人赛；2. 4小时；3. C/C++/Java', '2026-02-01 00:00:00', '2026-03-31 23:59:59', '2026-04-15 00:00:00', '2026-04-15 16:00:00', '线上', 1, 200, '[{"name":"一等奖","level":1},{"name":"二等奖","level":2},{"name":"三等奖","level":3},{"name":"优秀奖","level":4}]', NULL, 4, NOW(), NOW());

-- 报名数据
INSERT INTO `competition_registration` VALUES (1, 1, NULL, 4, 1, '13700000001', '想参加数学建模竞赛', NULL, 1, '符合条件', NOW(), NOW());
INSERT INTO `competition_registration` VALUES (2, 1, NULL, 5, 0, '13700000002', NULL, NULL, 1, NULL, NOW(), NOW());
INSERT INTO `competition_registration` VALUES (3, 2, NULL, 4, 1, '13700000001', NULL, NULL, 0, NULL, NULL, NOW());
INSERT INTO `competition_registration` VALUES (4, 3, NULL, 6, 1, '13700000003', '创新创业项目', NULL, 1, '项目很有创意', NOW(), NOW());
INSERT INTO `competition_registration` VALUES (5, 5, NULL, 7, 0, '13700000004', NULL, NULL, 2, '名额已满', NOW(), NOW());
INSERT INTO `competition_registration` VALUES (6, 6, NULL, 8, 0, '13700000005', NULL, NULL, 0, NULL, NULL, NOW());

-- 团队数据
INSERT INTO `competition_team` VALUES (1, 1, '算法小分队', 4, '热爱数学建模', 2, NOW());
INSERT INTO `competition_team` VALUES (2, 3, '创新未来队', 6, '用科技改变世界', 2, NOW());
INSERT INTO `competition_team` VALUES (3, 2, '代码大师队', 4, '挑战极限', 1, NOW());

-- 团队成员
INSERT INTO `competition_team_member` VALUES (1, 1, 4, NOW(), 1);
INSERT INTO `competition_team_member` VALUES (2, 1, 5, NOW(), 1);
INSERT INTO `competition_team_member` VALUES (3, 2, 6, NOW(), 1);
INSERT INTO `competition_team_member` VALUES (4, 3, 4, NOW(), 1);

-- 成绩数据
INSERT INTO `competition_result` VALUES (1, 6, 6, 8, NULL, 95.50, 3, 2, '二等奖', '表现优秀', 1, NOW(), NOW());
INSERT INTO `competition_result` VALUES (2, 1, 1, 4, 1, 88.00, 12, 3, '三等奖', NULL, 1, NOW(), NOW());
INSERT INTO `competition_result` VALUES (3, 1, 2, 5, 1, 91.50, 8, 2, '二等奖', '建模思路清晰', 1, NOW(), NOW());

-- 公告数据
INSERT INTO `sys_notice` VALUES (1, '2026年竞赛报名须知', '<p>请各位同学认真阅读竞赛报名须知，按时完成报名。</p>', 2, 1, 1, NOW(), NOW());
INSERT INTO `sys_notice` VALUES (2, '系统维护通知', '<p>系统将于本周六进行维护升级，届时可能无法访问。</p>', 1, 0, 1, NOW(), NOW());
INSERT INTO `sys_notice` VALUES (3, '全国大学生数学建模竞赛报名已开始', '<p>2026年全国大学生数学建模竞赛报名已正式启动，请有意愿的同学抓紧时间报名。</p>', 2, 1, 1, NOW(), NOW());
