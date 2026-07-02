-- ============================================
-- 修复中文乱码 - 重新插入种子数据
-- 执行前请确保 MySQL 连接使用 UTF-8 编码
-- ============================================

USE scms;

-- 设置连接字符集
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- ===== 清除旧数据（按外键依赖顺序） =====
DELETE FROM `competition_result`;
DELETE FROM `competition_team_member`;
DELETE FROM `competition_team`;
DELETE FROM `competition_registration`;
DELETE FROM `competition_attachment`;
DELETE FROM `competition`;
DELETE FROM `sys_oper_log`;
DELETE FROM `sys_message`;
DELETE FROM `sys_notice`;
DELETE FROM `sys_config`;
DELETE FROM `sys_user_role`;
DELETE FROM `sys_user`;
DELETE FROM `sys_role`;
DELETE FROM `sys_class`;
DELETE FROM `sys_major`;
DELETE FROM `sys_dept`;

-- ===== 重置自增ID =====
ALTER TABLE `sys_role` AUTO_INCREMENT = 1;
ALTER TABLE `sys_user` AUTO_INCREMENT = 1;
ALTER TABLE `sys_dept` AUTO_INCREMENT = 1;
ALTER TABLE `sys_major` AUTO_INCREMENT = 1;
ALTER TABLE `sys_class` AUTO_INCREMENT = 1;
ALTER TABLE `competition` AUTO_INCREMENT = 1;
ALTER TABLE `competition_registration` AUTO_INCREMENT = 1;
ALTER TABLE `competition_team` AUTO_INCREMENT = 1;
ALTER TABLE `competition_team_member` AUTO_INCREMENT = 1;
ALTER TABLE `competition_result` AUTO_INCREMENT = 1;
ALTER TABLE `sys_notice` AUTO_INCREMENT = 1;
ALTER TABLE `sys_message` AUTO_INCREMENT = 1;
ALTER TABLE `sys_oper_log` AUTO_INCREMENT = 1;
ALTER TABLE `sys_config` AUTO_INCREMENT = 1;

-- ===== 重新插入角色数据 =====
INSERT INTO `sys_role` VALUES (1, 'admin', '系统管理员', NOW());
INSERT INTO `sys_role` VALUES (2, 'teacher', '教师角色', NOW());
INSERT INTO `sys_role` VALUES (3, 'student', '学生角色', NOW());

-- ===== 重新插入用户数据 =====
-- 管理员账号（密码: admin123）
INSERT INTO `sys_user` VALUES (1, 'admin', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', '系统管理员', NULL, 3, 1, NULL, NULL, NULL, NOW(), NOW(), NOW());

-- 教师账号（密码: 123456）
INSERT INTO `sys_user` VALUES (2, 'T2024001', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', '张教授', NULL, 2, 1, 1, NULL, NULL, NOW(), NOW(), NOW());
INSERT INTO `sys_user` VALUES (3, 'T2024002', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', '李副教授', NULL, 2, 1, 1, NULL, NULL, NOW(), NOW(), NOW());

-- 学生账号（密码: 123456）
INSERT INTO `sys_user` VALUES (4, 'S20210001', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', '王明', NULL, 1, 1, 1, 1, 1, NOW(), NOW(), NOW());
INSERT INTO `sys_user` VALUES (5, 'S20210002', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', '李华', NULL, 1, 1, 1, 1, 1, NOW(), NOW(), NOW());
INSERT INTO `sys_user` VALUES (6, 'S20210003', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', '赵强', NULL, 1, 1, 1, 2, 2, NOW(), NOW(), NOW());
INSERT INTO `sys_user` VALUES (7, 'S20220001', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', '陈静', NULL, 1, 1, 1, 1, 1, NOW(), NOW(), NOW());
INSERT INTO `sys_user` VALUES (8, 'S20220002', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', '刘洋', NULL, 1, 1, 2, 3, 3, NOW(), NOW(), NOW());

-- 用户角色关联
INSERT INTO `sys_user_role` VALUES (1, 1), (2, 2), (3, 2), (4, 3), (5, 3), (6, 3), (7, 3), (8, 3);

-- ===== 重新插入学院数据 =====
INSERT INTO `sys_dept` VALUES (1, 0, '计算机学院', 'CS', 1, 1, NOW());
INSERT INTO `sys_dept` VALUES (2, 0, '电子信息学院', 'EE', 2, 1, NOW());
INSERT INTO `sys_dept` VALUES (3, 0, '数学学院', 'MATH', 3, 1, NOW());

-- ===== 重新插入专业数据 =====
INSERT INTO `sys_major` VALUES (1, 1, '计算机科学与技术', 'CS', 1, NOW());
INSERT INTO `sys_major` VALUES (2, 1, '软件工程', 'SE', 2, NOW());
INSERT INTO `sys_major` VALUES (3, 2, '电子信息工程', 'EE', 1, NOW());
INSERT INTO `sys_major` VALUES (4, 3, '应用数学', 'AM', 1, NOW());

-- ===== 重新插入班级数据 =====
INSERT INTO `sys_class` VALUES (1, 1, '计科2101班', '2021', 1, NOW());
INSERT INTO `sys_class` VALUES (2, 1, '计科2102班', '2021', 1, NOW());
INSERT INTO `sys_class` VALUES (3, 2, '软工2201班', '2022', 1, NOW());
INSERT INTO `sys_class` VALUES (4, 3, '电信2101班', '2021', 1, NOW());

-- ===== 重新插入竞赛数据 =====
INSERT INTO `competition` VALUES (1, '全国大学生数学建模竞赛', '教育部高等教育司', 2, NULL, '全国大学生数学建模竞赛是国内规模最大的基础性学科竞赛，创办于1992年，每年一届。', '1. 每队3人；2. 赛期3天；3. 提交论文', '2026-05-01 00:00:00', '2026-06-30 23:59:59', '2026-09-10 00:00:00', '2026-09-13 00:00:00', '线上+线下', 3, 100, 2, NOW(), NOW());
INSERT INTO `competition` VALUES (2, 'ACM-ICPC程序设计竞赛', '国际计算机学会', 2, NULL, 'ACM国际大学生程序设计竞赛是最具影响力的大学生程序设计竞赛。', '1. 每队3人；2. 5小时；3. C/C++/Java/Python', '2026-04-01 00:00:00', '2026-05-15 23:59:59', '2026-06-01 00:00:00', '2026-06-01 05:00:00', '计算机学院实验室', 3, 50, 2, NOW(), NOW());
INSERT INTO `competition` VALUES (3, '中国"互联网+"大学生创新创业大赛', '教育部', 3, NULL, '中国"互联网+"大学生创新创业大赛，由教育部与政府、各高校共同主办。', '1. 团队参赛；2. 提交商业计划书；3. 现场路演', '2026-03-01 00:00:00', '2026-04-30 23:59:59', '2026-07-01 00:00:00', '2026-07-03 00:00:00', '学校大礼堂', 5, 30, 2, NOW(), NOW());
INSERT INTO `competition` VALUES (4, '全国大学生电子设计竞赛', '教育部高等教育司', 3, NULL, '全国大学生电子设计竞赛是面向大学生的群众性科技活动。', '1. 每队3人；2. 4天3夜；3. 完成实物制作', '2026-05-15 00:00:00', '2026-07-15 23:59:59', '2026-08-01 00:00:00', '2026-08-04 00:00:00', '电子信息学院实验室', 3, 40, 1, NOW(), NOW());
INSERT INTO `competition` VALUES (5, '校园英语演讲比赛', '外国语学院', 2, NULL, '提升大学生英语口语表达能力和跨文化交际能力。', '1. 个人赛；2. 3分钟定题演讲；3. 2分钟即兴', '2026-04-10 00:00:00', '2026-05-10 23:59:59', '2026-05-25 00:00:00', '2026-05-25 12:00:00', '外语学院报告厅', 1, 60, 2, NOW(), NOW());
INSERT INTO `competition` VALUES (6, '"蓝桥杯"软件设计大赛', '工业和信息化部', 2, NULL, '蓝桥杯全国软件和信息技术专业人才大赛。', '1. 个人赛；2. 4小时；3. C/C++/Java', '2026-02-01 00:00:00', '2026-03-31 23:59:59', '2026-04-15 00:00:00', '2026-04-15 16:00:00', '线上', 1, 200, 4, NOW(), NOW());

-- ===== 重新插入报名数据 =====
INSERT INTO `competition_registration` VALUES (1, 1, NULL, 4, 1, '13700000001', '想参加数学建模竞赛', NULL, 1, '符合条件', NOW(), NOW());
INSERT INTO `competition_registration` VALUES (2, 1, NULL, 5, 0, '13700000002', NULL, NULL, 1, NULL, NOW(), NOW());
INSERT INTO `competition_registration` VALUES (3, 2, NULL, 4, 1, '13700000001', NULL, NULL, 0, NULL, NULL, NOW());
INSERT INTO `competition_registration` VALUES (4, 3, NULL, 6, 1, '13700000003', '创新创业项目', NULL, 1, '项目很有创意', NOW(), NOW());
INSERT INTO `competition_registration` VALUES (5, 5, NULL, 7, 0, '13700000004', NULL, NULL, 2, '名额已满', NOW(), NOW());
INSERT INTO `competition_registration` VALUES (6, 6, NULL, 8, 0, '13700000005', NULL, NULL, 0, NULL, NULL, NOW());

-- ===== 重新插入团队数据 =====
INSERT INTO `competition_team` VALUES (1, 1, '算法小分队', 4, '热爱数学建模', 2, NOW());
INSERT INTO `competition_team` VALUES (2, 3, '创新未来队', 6, '用科技改变世界', 2, NOW());
INSERT INTO `competition_team` VALUES (3, 2, '代码大师队', 4, '挑战极限', 1, NOW());

-- 团队成员
INSERT INTO `competition_team_member` VALUES (1, 1, 4, NOW(), 1);
INSERT INTO `competition_team_member` VALUES (2, 1, 5, NOW(), 1);
INSERT INTO `competition_team_member` VALUES (3, 2, 6, NOW(), 1);
INSERT INTO `competition_team_member` VALUES (4, 3, 4, NOW(), 1);

-- ===== 重新插入成绩数据 =====
INSERT INTO `competition_result` VALUES (1, 6, 6, 8, NULL, 95.50, 3, 2, '二等奖', '表现优秀', 1, NOW(), NOW());
INSERT INTO `competition_result` VALUES (2, 1, 1, 4, 1, 88.00, 12, 3, '三等奖', NULL, 1, NOW(), NOW());
INSERT INTO `competition_result` VALUES (3, 1, 2, 5, 1, 91.50, 8, 2, '二等奖', '建模思路清晰', 1, NOW(), NOW());

-- ===== 重新插入公告数据 =====
INSERT INTO `sys_notice` VALUES (1, '2026年竞赛报名须知', '<p>请各位同学认真阅读竞赛报名须知，按时完成报名。</p>', 2, 1, 1, NOW(), NOW());
INSERT INTO `sys_notice` VALUES (2, '系统维护通知', '<p>系统将于本周六进行维护升级，届时可能无法访问。</p>', 1, 0, 1, NOW(), NOW());
INSERT INTO `sys_notice` VALUES (3, '全国大学生数学建模竞赛报名已开始', '<p>2026年全国大学生数学建模竞赛报名已正式启动，请有意愿的同学抓紧时间报名。</p>', 2, 1, 1, NOW(), NOW());

-- ===== 重新插入消息数据 =====
INSERT INTO `sys_message` VALUES (1, 4, '报名审核通过', '您报名的"全国大学生数学建模竞赛"已通过审核', 1, NOW());
INSERT INTO `sys_message` VALUES (2, 4, '成绩已发布', '"蓝桥杯"软件设计大赛成绩已发布，请查看', 1, NOW());
INSERT INTO `sys_message` VALUES (3, 5, '报名审核通过', '您报名的"全国大学生数学建模竞赛"已通过审核', 1, NOW());
INSERT INTO `sys_message` VALUES (4, 7, '报名被拒绝', '您报名的"校园英语演讲比赛"未通过审核，原因：名额已满', 0, NOW());
INSERT INTO `sys_message` VALUES (5, 2, '新报名通知', '学生王明报名了ACM-ICPC程序设计竞赛', 0, NOW());
INSERT INTO `sys_message` VALUES (6, 8, '竞赛提醒', '"蓝桥杯"软件设计大赛报名即将截止', 0, NOW());

-- ===== 重新插入操作日志数据 =====
INSERT INTO `sys_oper_log` VALUES (1, 1, 'admin', '审核竞赛', 'PUT', '/api/competition/1/audit', '{"status":2}', '127.0.0.1', 45, 1, NULL, NOW());
INSERT INTO `sys_oper_log` VALUES (2, 2, 'T2024001', '发布竞赛', 'POST', '/api/competition', '{}', '127.0.0.1', 120, 1, NULL, NOW());
INSERT INTO `sys_oper_log` VALUES (3, 4, 'S20210001', '报名竞赛', 'POST', '/api/registration', '{"competitionId":1}', '127.0.0.1', 35, 1, NULL, NOW());
INSERT INTO `sys_oper_log` VALUES (4, 2, 'T2024001', '录入成绩', 'POST', '/api/result', '{}', '127.0.0.1', 88, 1, NULL, NOW());
INSERT INTO `sys_oper_log` VALUES (5, 1, 'admin', '禁用用户', 'PUT', '/api/user/5/status', '{"status":0}', '127.0.0.1', 22, 0, '用户存在关联数据', NOW());
INSERT INTO `sys_oper_log` VALUES (6, 2, 'T2024001', '审核报名', 'PUT', '/api/registration/3/audit', '{"status":1}', '127.0.0.1', 30, 1, NULL, NOW());
INSERT INTO `sys_oper_log` VALUES (7, 3, 'T2024002', '上传文件', 'POST', '/api/file/upload', NULL, '127.0.0.1', 256, 1, NULL, NOW());
INSERT INTO `sys_oper_log` VALUES (8, 1, 'admin', '导出用户', 'GET', '/api/user/export', NULL, '127.0.0.1', 1500, 1, NULL, NOW());
INSERT INTO `sys_oper_log` VALUES (9, 4, 'S20210001', '取消报名', 'DELETE', '/api/registration/7', NULL, '127.0.0.1', 18, 1, NULL, NOW());
INSERT INTO `sys_oper_log` VALUES (10, 2, 'T2024001', '发布成绩', 'POST', '/api/result/publish/6', NULL, '127.0.0.1', 340, 1, NULL, NOW());

-- ===== 重新插入系统配置 =====
INSERT INTO `sys_config` VALUES (1, 'max_registration_per_student', '5', '每名学生最多报名竞赛数', NOW());
INSERT INTO `sys_config` VALUES (2, 'max_file_size', '10', '上传文件最大大小(MB)', NOW());
INSERT INTO `sys_config` VALUES (3, 'competition_audit_required', 'true', '竞赛发布是否需要审核', NOW());
INSERT INTO `sys_config` VALUES (4, 'auto_update_status', 'true', '自动更新竞赛状态', NOW());
INSERT INTO `sys_config` VALUES (5, 'system_name', '学生竞赛信息管理系统', '系统名称', NOW());
INSERT INTO `sys_config` VALUES (6, 'system_version', '1.0.0', '系统版本', NOW());
INSERT INTO `sys_config` VALUES (7, 'allow_self_register', 'true', '是否允许自助注册', NOW());
INSERT INTO `sys_config` VALUES (8, 'default_password', '123456', '新用户默认密码', NOW());

SELECT '数据修复完成！' AS result;
