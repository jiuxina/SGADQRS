-- ============================================
-- SCMS 数据库清理 + 奖项系统改造 迁移脚本
-- 执行顺序：先删除表，再删除字段，最后添加字段
-- ============================================

USE scms;

-- ===== 1. 删除不需要的表 =====

-- 竞赛分类表（如果存在）
DROP TABLE IF EXISTS `competition_category`;

-- 证书表（如果存在）
DROP TABLE IF EXISTS `competition_certificate`;

-- 竞赛收藏表（如果存在）
DROP TABLE IF EXISTS `competition_favorite`;

-- 菜单权限表（如果存在）
DROP TABLE IF EXISTS `sys_role_menu`;

-- 角色菜单关联表（如果存在）
DROP TABLE IF EXISTS `sys_menu`;

-- 系统配置表
DROP TABLE IF EXISTS `sys_config`;

-- ===== 2. 删除不需要的字段 =====

-- 竞赛表：删除分类字段
ALTER TABLE `competition` DROP COLUMN IF EXISTS `category_id`;
ALTER TABLE `competition` DROP COLUMN IF EXISTS `category`;

-- 角色表：删除描述和状态字段（如果存在）
ALTER TABLE `sys_role` DROP COLUMN IF EXISTS `description`;
ALTER TABLE `sys_role` DROP COLUMN IF EXISTS `status`;

-- ===== 3. 奖项系统改造 =====

-- 竞赛表：添加奖项字段（JSON格式存储自定义奖项列表）
ALTER TABLE `competition` ADD COLUMN `awards` JSON DEFAULT NULL COMMENT '自定义奖项列表，格式: [{"name":"一等奖","level":1},{"name":"二等奖","level":2}]' AFTER `max_teams`;

-- 更新已有竞赛的奖项数据（为已有竞赛设置默认奖项）
UPDATE `competition` SET `awards` = JSON_ARRAY(
    JSON_OBJECT('name', '特等奖', 'level', 1),
    JSON_OBJECT('name', '一等奖', 'level', 2),
    JSON_OBJECT('name', '二等奖', 'level', 3),
    JSON_OBJECT('name', '三等奖', 'level', 4),
    JSON_OBJECT('name', '优秀奖', 'level', 5)
) WHERE `awards` IS NULL;

-- 更新已有成绩记录的奖项名称（确保award_name与新的奖项系统一致）
UPDATE `competition_result` cr
JOIN `competition` c ON cr.competition_id = c.id
SET cr.award_name = CASE cr.award_level
    WHEN 1 THEN '特等奖'
    WHEN 2 THEN '一等奖'
    WHEN 3 THEN '二等奖'
    WHEN 4 THEN '三等奖'
    WHEN 5 THEN '优秀奖'
    ELSE cr.award_name
END
WHERE cr.award_level IS NOT NULL AND cr.award_name IS NULL;
