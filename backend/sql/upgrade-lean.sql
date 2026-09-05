-- ============================================
-- TeamUp Lean 精简升级脚本（在已升级到 TeamUp 的 scms 库上执行一次）
-- 用法：mysql -u root -proot scms < backend/sql/upgrade-lean.sql
-- 内容（2026-09-05 经用户确认）：
--   1. sys_user 删 phone/email/last_login_time（全站无消费方，隐私字段不入库展示链）
--   2. competition 删 max_teams（从未强制校验）；状态归一：发布即生效（1待审核→2，5已驳回→0草稿）
--   3. recruit_post 删 view_count/need_count（浏览量纯装饰；还需人数=每队上限-现有成员，实时计算）
--   4. competition_result 删 registration_id（成绩=一人一行，队伍上下文由 team_id 承载）
--   5. 删除 competition_registration 表（参赛单位统一为队伍，单人赛=1人队）
-- ============================================
USE scms;

-- ===== 1. sys_user =====
ALTER TABLE `sys_user` DROP COLUMN `phone`;
ALTER TABLE `sys_user` DROP COLUMN `email`;
ALTER TABLE `sys_user` DROP COLUMN `last_login_time`;

-- ===== 2. competition：状态归一 + 删装饰字段 =====
UPDATE `competition` SET `status` = 2 WHERE `status` = 1;
UPDATE `competition` SET `status` = 0 WHERE `status` = 5;
ALTER TABLE `competition` DROP COLUMN `max_teams`;

-- ===== 3. recruit_post =====
ALTER TABLE `recruit_post` DROP COLUMN `view_count`;
ALTER TABLE `recruit_post` DROP COLUMN `need_count`;

-- ===== 4. competition_result =====
ALTER TABLE `competition_result` DROP COLUMN `registration_id`;

-- ===== 5. 删除报名表（参赛单位=队伍） =====
DROP TABLE IF EXISTS `competition_registration`;
