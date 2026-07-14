-- ============================================
-- V2：sys_user表添加status字段
-- 状态：0-禁用 1-正常（默认1）
-- ============================================

ALTER TABLE `sys_user`
    ADD COLUMN `status` TINYINT DEFAULT 1 COMMENT '状态：0-禁用 1-正常' AFTER `user_type`;

-- 将已有用户全部设为正常状态
UPDATE `sys_user` SET `status` = 1 WHERE `status` IS NULL;
