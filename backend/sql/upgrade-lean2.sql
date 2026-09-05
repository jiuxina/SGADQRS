-- TeamUp 精简第二批：删除死列
-- 1) competition_team_member.status：Lean 后成员只有一种状态（入队即生效），列恒为 1
ALTER TABLE `competition_team_member` DROP COLUMN `status`;
