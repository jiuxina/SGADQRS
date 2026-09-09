-- ============================================
-- 赛友 TeamUp (学生竞赛组队社区) 数据库初始化脚本
-- 已含社区表与演示数据；Lean 精简版（8 表，参赛单位=队伍）
-- 已有旧库请依次执行 upgrade-teamup.sql、upgrade-lean.sql 增量升级
-- ============================================

CREATE DATABASE IF NOT EXISTS scms DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE scms;

-- ===== 1. 用户表 =====
-- 角色不设列：一律由 user_type 推导（1-学生 2-教师 3-管理员）；手机号/邮箱等隐私不入库

CREATE TABLE IF NOT EXISTS `sys_user` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `username` VARCHAR(50) NOT NULL COMMENT '登录账号',
    `password` VARCHAR(100) NOT NULL COMMENT '密码(BCrypt)',
    `real_name` VARCHAR(50) NOT NULL COMMENT '真实姓名',
    `nickname` VARCHAR(50) DEFAULT NULL COMMENT '社区昵称',
    `avatar` VARCHAR(255) DEFAULT NULL COMMENT '头像URL',
    `gender` TINYINT DEFAULT 0 COMMENT '性别：0-未知 1-男 2-女',
    `user_type` TINYINT NOT NULL COMMENT '用户类型：1-学生 2-教师 3-管理员',
    `dept_name` VARCHAR(50) DEFAULT NULL COMMENT '所属学院',
    `major_name` VARCHAR(50) DEFAULT NULL COMMENT '专业',
    `class_name` VARCHAR(50) DEFAULT NULL COMMENT '班级',
    `bio` VARCHAR(500) DEFAULT NULL COMMENT '个人简介',
    `skills` VARCHAR(255) DEFAULT NULL COMMENT '技能标签(逗号分隔)',
    `status` TINYINT NOT NULL DEFAULT 1 COMMENT '状态：1-启用 0-禁用',
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_username` (`username`),
    KEY `idx_user_type` (`user_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='用户表';

-- ===== 2. 竞赛核心表 =====
-- 状态：0-草稿 2-已发布 3-进行中 4-已结束（发布即生效，无审核态）

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
    `awards` JSON DEFAULT NULL COMMENT '自定义奖项列表',
    `attachments` JSON DEFAULT NULL COMMENT '附件列表',
    `status` TINYINT NOT NULL DEFAULT 2 COMMENT '0-草稿 2-已发布 3-进行中 4-已结束',
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_comp_status` (`status`),
    KEY `idx_comp_publisher` (`publisher_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='竞赛信息表';

-- ===== 3. 参赛与团队 =====
-- 参赛单位=队伍（单人赛=1人队）：审核只有一条链 0组建中→1已提交→2已通过/3已拒绝

CREATE TABLE IF NOT EXISTS `competition_team` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `competition_id` BIGINT NOT NULL,
    `team_name` VARCHAR(50) NOT NULL,
    `leader_id` BIGINT NOT NULL,
    `teacher_id` BIGINT DEFAULT NULL COMMENT '指导老师ID（队长指定，老师只读）',
    `team_slogan` VARCHAR(200) DEFAULT NULL,
    `status` TINYINT NOT NULL DEFAULT 0 COMMENT '0-组建中 1-已提交 2-已通过 3-已拒绝',
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_team_comp` (`competition_id`),
    KEY `idx_team_teacher` (`teacher_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='参赛队伍表';

CREATE TABLE IF NOT EXISTS `competition_team_member` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `team_id` BIGINT NOT NULL,
    `competition_id` BIGINT NOT NULL DEFAULT 0 COMMENT '冗余竞赛ID（一人一赛一队唯一约束）',
    `student_id` BIGINT NOT NULL,
    `join_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_tm_team_student` (`team_id`, `student_id`),
    UNIQUE KEY `uk_tm_comp_student` (`competition_id`, `student_id`),
    KEY `idx_tm_team` (`team_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='团队成员表';

-- ===== 4. 成绩 =====
-- 成绩=一人一行（证书按人发），队伍上下文由 team_id 承载

CREATE TABLE IF NOT EXISTS `competition_result` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `competition_id` BIGINT NOT NULL,
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='竞赛成绩表';

-- ===== 5. 社区表 =====

-- 组队招募/求组帖（还需人数=每队上限-现有成员，实时计算，不落库）
CREATE TABLE IF NOT EXISTS `recruit_post` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `competition_id` BIGINT NOT NULL COMMENT '竞赛ID',
    `user_id` BIGINT NOT NULL COMMENT '发布者用户ID',
    `type` TINYINT NOT NULL DEFAULT 1 COMMENT '1-组队招募 2-求组',
    `title` VARCHAR(100) NOT NULL COMMENT '标题',
    `content` TEXT DEFAULT NULL COMMENT '说明',
    `team_id` BIGINT DEFAULT NULL COMMENT '关联队伍(招募帖)',
    `tags` VARCHAR(255) DEFAULT NULL COMMENT '方向标签(逗号分隔)',
    `contact` VARCHAR(100) DEFAULT NULL COMMENT '联系方式（微信/QQ/邮箱等，选填）',
    `deadline` DATETIME DEFAULT NULL COMMENT '组队截止时间',
    `status` TINYINT NOT NULL DEFAULT 1 COMMENT '1-招募中 0-已关闭',
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_rp_comp` (`competition_id`),
    KEY `idx_rp_user` (`user_id`),
    KEY `idx_rp_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='组队招募/求组帖';

-- 社区请求：2-入队申请 3-入队邀请（1-资料互看已废弃，存量数据仅作历史）
CREATE TABLE IF NOT EXISTS `community_request` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `type` TINYINT NOT NULL COMMENT '2-入队申请 3-入队邀请（1-资料互看已废弃）',
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

-- ===== 6. 站内通知（含全员公告：user_id=0） =====

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

-- ============================================
-- 初始数据
-- ============================================

-- 默认账号密码统一为 123456（BCrypt）
INSERT INTO `sys_user` (`id`, `username`, `password`, `real_name`, `nickname`, `avatar`, `gender`, `user_type`, `dept_name`, `major_name`, `class_name`, `bio`, `skills`, `status`, `create_time`, `update_time`) VALUES
(1, 'admin', '$2b$10$j7XnMEsPsByfvmbAQqFmLORnxpqfL/QrrRccVMsHN.izBV6n1jyRG', '系统管理员', NULL, NULL, 1, 3, NULL, NULL, NULL, NULL, NULL, 1, NOW(), NOW()),
(2, 'T2024001', '$2b$10$j7XnMEsPsByfvmbAQqFmLORnxpqfL/QrrRccVMsHN.izBV6n1jyRG', '张教授', NULL, NULL, 1, 2, '计算机学院', NULL, NULL, NULL, NULL, 1, NOW(), NOW()),
(3, 'T2024002', '$2b$10$j7XnMEsPsByfvmbAQqFmLORnxpqfL/QrrRccVMsHN.izBV6n1jyRG', '李副教授', NULL, NULL, 1, 2, '计算机学院', NULL, NULL, NULL, NULL, 1, NOW(), NOW()),
(4, 'S20210001', '$2b$10$j7XnMEsPsByfvmbAQqFmLORnxpqfL/QrrRccVMsHN.izBV6n1jyRG', '王明', '小明同学', NULL, 1, 1, '计算机学院', '计算机科学与技术', '计科2101班', '热爱算法与数学建模，ACM 校队成员，目标国赛奖牌。', 'C++,Python,算法,数学建模', 1, NOW(), NOW()),
(5, 'S20210002', '$2b$10$j7XnMEsPsByfvmbAQqFmLORnxpqfL/QrrRccVMsHN.izBV6n1jyRG', '李华', 'Hua', NULL, 2, 1, '计算机学院', '计算机科学与技术', '计科2102班', '后端开发方向，熟悉 Spring 全家桶与数据库调优。', 'Java,后端开发,数据库', 1, NOW(), NOW()),
(6, 'S20210003', '$2b$10$j7XnMEsPsByfvmbAQqFmLORnxpqfL/QrrRccVMsHN.izBV6n1jyRG', '赵强', '强子', NULL, 1, 1, '计算机学院', '软件工程', '计科2102班', '竞赛型选手，高中开始打 OI，现在主攻 ICPC。', 'C++,算法,ICPC', 1, NOW(), NOW()),
(7, 'S20220001', '$2b$10$j7XnMEsPsByfvmbAQqFmLORnxpqfL/QrrRccVMsHN.izBV6n1jyRG', '陈静', '静静', NULL, 2, 1, '计算机学院', '计算机科学与技术', '计科2101班', '对创新创业感兴趣，擅长商业计划书与路演答辩。', '商业分析,路演,PPT', 1, NOW(), NOW()),
(8, 'S20220002', '$2b$10$j7XnMEsPsByfvmbAQqFmLORnxpqfL/QrrRccVMsHN.izBV6n1jyRG', '刘洋', '洋仔', NULL, 1, 1, '电子信息学院', '电子信息工程', '软工2201班', '电子发烧友，喜欢做小车和小机器人。', '嵌入式,硬件,单片机', 1, NOW(), NOW());

-- 竞赛数据（发布即生效）
-- 演示数据：status=2(已发布)的竞赛报名时间窗用相对时间，保持"可报名"常青（建队/入队会校验报名截止）
INSERT INTO `competition` (`id`, `competition_name`, `organizer`, `publisher_id`, `cover_image`, `description`, `rules`, `registration_start`, `registration_end`, `competition_start`, `competition_end`, `location`, `max_members`, `awards`, `attachments`, `status`, `create_time`, `update_time`) VALUES
(1, '全国大学生数学建模竞赛', '教育部高等教育司', 2, NULL, '全国大学生数学建模竞赛是国内规模最大的基础性学科竞赛，创办于1992年，每年一届。', '1. 每队3人；2. 赛期3天；3. 提交论文', DATE_SUB(NOW(), INTERVAL 30 DAY), NOW() + INTERVAL 60 DAY, NOW() + INTERVAL 90 DAY, NOW() + INTERVAL 93 DAY, '线上+线下', 3, '[{"name":"一等奖","level":1},{"name":"二等奖","level":2},{"name":"三等奖","level":3}]', NULL, 2, NOW(), NOW()),
(2, 'ACM-ICPC程序设计竞赛', '国际计算机学会', 2, NULL, 'ACM国际大学生程序设计竞赛是最具影响力的大学生程序设计竞赛。', '1. 每队3人；2. 5小时；3. C/C++/Java/Python', DATE_SUB(NOW(), INTERVAL 30 DAY), NOW() + INTERVAL 60 DAY, NOW() + INTERVAL 90 DAY, NOW() + INTERVAL 90 DAY + INTERVAL 5 HOUR, '计算机学院实验室', 3, '[{"name":"金牌","level":1},{"name":"银牌","level":2},{"name":"铜牌","level":3}]', NULL, 2, NOW(), NOW()),
(3, '中国"互联网+"大学生创新创业大赛', '教育部', 3, NULL, '中国"互联网+"大学生创新创业大赛，由教育部与政府、各高校共同主办。', '1. 团队参赛；2. 提交商业计划书；3. 现场路演', DATE_SUB(NOW(), INTERVAL 30 DAY), NOW() + INTERVAL 60 DAY, NOW() + INTERVAL 90 DAY, NOW() + INTERVAL 93 DAY, '学校大礼堂', 5, '[{"name":"金奖","level":1},{"name":"银奖","level":2},{"name":"铜奖","level":3},{"name":"最佳创意奖","level":4}]', NULL, 2, NOW(), NOW()),
(4, '全国大学生电子设计竞赛', '教育部高等教育司', 3, NULL, '全国大学生电子设计竞赛是面向大学生的群众性科技活动。', '1. 每队3人；2. 4天3夜；3. 完成实物制作', DATE_SUB(NOW(), INTERVAL 30 DAY), NOW() + INTERVAL 60 DAY, NOW() + INTERVAL 90 DAY, NOW() + INTERVAL 94 DAY, '电子信息学院实验室', 3, '[{"name":"一等奖","level":1},{"name":"二等奖","level":2},{"name":"三等奖","level":3}]', NULL, 2, NOW(), NOW()),
(5, '校园英语演讲比赛', '外国语学院', 2, NULL, '提升大学生英语口语表达能力和跨文化交际能力。', '1. 个人赛；2. 3分钟定题演讲；3. 2分钟即兴', DATE_SUB(NOW(), INTERVAL 30 DAY), NOW() + INTERVAL 60 DAY, NOW() + INTERVAL 90 DAY, NOW() + INTERVAL 90 DAY + INTERVAL 12 HOUR, '外语学院报告厅', 1, '[{"name":"一等奖","level":1},{"name":"二等奖","level":2},{"name":"三等奖","level":3},{"name":"最佳风采奖","level":4}]', NULL, 2, NOW(), NOW()),
(6, '"蓝桥杯"软件设计大赛', '工业和信息化部', 2, NULL, '蓝桥杯全国软件和信息技术专业人才大赛。', '1. 个人赛；2. 4小时；3. C/C++/Java', '2026-02-01 00:00:00', '2026-03-31 23:59:59', '2026-04-15 00:00:00', '2026-04-15 16:00:00', '线上', 1, '[{"name":"一等奖","level":1},{"name":"二等奖","level":2},{"name":"三等奖","level":3},{"name":"优秀奖","level":4}]', NULL, 4, NOW(), NOW()),
(7, '广西民族大学第九届"创易杯"程序设计竞赛', '人工智能学院', 2, '/public/创易杯海报.png', '<h3>人工智能学院关于举办"广西民族大学第九届创易杯程序设计竞赛"的通知</h3><p>各学院、各班级：</p><p>为丰富校园学术与文化氛围，培养大学生的创新思维和利用计算机分析问题、解决实际问题的能力，促进各学院师生之间的交流与合作，提高全校学生程序设计水平，选拔优秀学生参加各级各类程序设计竞赛，人工智能学院拟于2026年11月29日举办"广西民族大学第九届创易杯程序设计竞赛"。现将有关事项通知如下：</p><h4>一、参赛对象</h4><p>我校全日制在校本科学生。</p><h4>二、参赛时间</h4><p>1. 报名时间：2026年6月16日——7月16日</p><p>2. 竞赛时间：2026年11月29日 8:30--12:00</p><h4>三、报名方式</h4><p>报名网站：https://signup.gxmzu.icu</p><p>联系人及电话：黄志聪，18102763836，QQ: 3543002413</p><p>报名注意事项：</p><ol><li>学院实验室机位有限，今年赛事机位总容量为320人。</li><li>2022-2024级学生在线报名255个名额，报名系统截止条件为：报名人数已满或到达截止时间，请大家及时报名。</li><li>2025级学生不需要在线报名，通过《计算机导论与程序设计基础》课程任课教师推荐获得参赛资格（共65个名额）。</li></ol><h4>四、竞赛奖励</h4><p>本次竞赛按"30%+最低过题数"双原则设置奖励；设置一等奖、二等奖、三等奖、优秀奖，颁发校级获奖证书及相应奖品。</p><h4>五、赛制说明</h4><p>本次竞赛采用希冀平台在线提交评判（OnlineJudge）的ACM赛制，考生用自己熟悉语言（一般有C/C++/Java）写好源代码提交即可，系统会实时返回信息，评判代码是否正确。采用黑箱测试，程序的输出和标准输出完全符合即可。本次竞赛成绩还将作为以下成员选拔的重要依据：</p><ol><li>2026-2027学年人工智能学院程序设计竞赛实验班成员；</li><li>2027年广西民族大学参加各级各类程序设计竞赛成员。</li></ol><h4>六、竞赛委员会联系信息</h4><p>联系人：张桂芬（电话 15907712242）</p><p>覃春芳（电话 18878792124）</p><p>刘美玲（电话 18978939529）</p><p>创易杯程序设计竞赛QQ群：749565226</p>', '1. 个人赛；2. ACM赛制（OnlineJudge）；3. 3.5小时；4. C/C++/Java；5. 黑箱测试', DATE_SUB(NOW(), INTERVAL 30 DAY), NOW() + INTERVAL 60 DAY, NOW() + INTERVAL 90 DAY + INTERVAL 8 HOUR + INTERVAL 30 MINUTE, NOW() + INTERVAL 90 DAY + INTERVAL 12 HOUR, '希冀平台在线', 1, '[{"name":"一等奖","level":1},{"name":"二等奖","level":2},{"name":"三等奖","level":3},{"name":"优秀奖","level":4}]', NULL, 2, NOW(), NOW());

-- 参赛队伍（单人赛=1人队）
INSERT INTO `competition_team` VALUES (1, 1, '算法小分队', 4, 2, '热爱数学建模', 2, NOW());
INSERT INTO `competition_team` VALUES (2, 3, '创新未来队', 6, 3, '用科技改变世界', 2, NOW());
INSERT INTO `competition_team` VALUES (3, 2, '代码大师队', 4, NULL, '挑战极限', 1, NOW());
INSERT INTO `competition_team` VALUES (4, 2, 'ICPC集训队', 6, NULL, '冲击区域赛', 0, NOW());
INSERT INTO `competition_team` VALUES (5, 6, '刘洋', 8, NULL, NULL, 2, NOW());

-- 团队成员
INSERT INTO `competition_team_member` (`id`, `team_id`, `competition_id`, `student_id`, `join_time`) VALUES
(1, 1, 1, 4, NOW()),
(2, 1, 1, 5, NOW()),
(3, 2, 3, 6, NOW()),
(4, 3, 2, 4, NOW()),
(5, 4, 2, 6, NOW()),
(6, 5, 6, 8, NOW());

-- 成绩数据（一人一行）
INSERT INTO `competition_result` (`id`, `competition_id`, `student_id`, `team_id`, `score`, `ranking`, `award_level`, `award_name`, `remark`, `is_published`, `publish_time`, `create_time`) VALUES
(1, 6, 8, 5, 95.50, 3, 2, '二等奖', '表现优秀', 1, NOW(), NOW()),
(2, 1, 4, 1, 88.00, 12, 3, '三等奖', NULL, 1, NOW(), NOW()),
(3, 1, 5, 1, 91.50, 8, 2, '二等奖', '建模思路清晰', 1, NOW(), NOW());

-- 招募/求组帖
INSERT INTO `recruit_post` (`id`, `competition_id`, `user_id`, `type`, `title`, `content`, `team_id`, `tags`, `deadline`, `status`, `create_time`, `update_time`) VALUES
(1, 1, 4, 1, '数学建模国赛招 2 人（算法/写作）', '我们是算法小分队，已有一名建模手和一名编程手，现招 1-2 名队友：最好会 Python 数值计算或论文写作。目标国二以上，赛前每周集训两次。', 1, '算法,Python,论文写作', '2026-06-30 23:59:59', 1, NOW(), NOW()),
(2, 2, 6, 1, 'ICPC 集训队招队友（码力型选手优先）', '本人主攻算法，暑假开始集训，目标区域赛银牌以上。求 1-2 名 C++ 码力强的队友，一起刷题、打网络赛和区域赛。', 4, 'C++,算法,ICPC', '2026-05-10 23:59:59', 1, NOW(), NOW()),
(3, 3, 7, 2, '求组互联网+队伍（商业计划书/路演向）', '会写商业计划书、做过路演，拿过校赛铜奖。希望加入一支有技术成员的队伍，我可以负责 BP 与答辩。', NULL, '商业计划书,路演,市场分析', '2026-04-30 23:59:59', 1, NOW(), NOW());

-- 社区请求（互看/申请/邀请）
INSERT INTO `community_request` (`id`, `type`, `post_id`, `team_id`, `from_user_id`, `to_user_id`, `message`, `status`, `create_time`, `handle_time`) VALUES
(1, 1, NULL, NULL, 5, 8, '你好，看到你在蓝桥杯报名了，想互看下资料交个朋友~', 0, NOW(), NULL),
(2, 2, 2, 4, 8, 6, '学长好！我是刘洋，C++ 写了两年，刷了 300+ 题，想加入 ICPC 集训队。', 0, NOW(), NULL),
(3, 1, NULL, NULL, 7, 4, '想了解下你在数学建模队的经历', 1, NOW(), NOW());

-- 通知（user_id=0 为全员公告）
INSERT INTO `sys_notification` (`user_id`, `type`, `title`, `content`, `ref_type`, `ref_id`, `is_read`, `is_top`, `create_time`) VALUES
(0, 'announcement', '2026年竞赛报名须知', '<p>请各位同学认真阅读竞赛报名须知，按时完成报名。</p>', 'notice', NULL, 0, 1, NOW()),
(0, 'announcement', '系统维护通知', '<p>系统将于本周六进行维护升级，届时可能无法访问。</p>', 'notice', NULL, 0, 0, NOW()),
(0, 'announcement', '全国大学生数学建模竞赛报名已开始', '<p>2026年全国大学生数学建模竞赛报名已正式启动，请有意愿的同学抓紧时间报名。</p>', 'notice', NULL, 0, 1, NOW()),
(6, 'interaction', '收到新的入队申请', '刘洋 申请加入你的队伍「ICPC集训队」，去组队中心处理。', 'request', 2, 0, 0, NOW()),
(8, 'interaction', '收到资料互看请求', '李华 请求与你互看资料，同意后双方可查看完整资料与获奖记录。', 'request', 1, 0, 0, NOW()),
(4, 'interaction', '资料互看已同意', '静静 已同意与你互看资料，现在可以查看彼此的完整资料与获奖记录。', 'request', 3, 0, 0, NOW()),
(7, 'interaction', '资料互看已同意', '小明同学 已同意与你互看资料，现在可以查看彼此的完整资料与获奖记录。', 'request', 3, 0, 0, NOW());
