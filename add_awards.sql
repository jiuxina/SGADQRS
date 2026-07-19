ALTER TABLE `competition` ADD COLUMN `awards` JSON DEFAULT NULL COMMENT '自定义奖项列表' AFTER `max_teams`;

UPDATE `competition` SET `awards` = JSON_ARRAY(
    JSON_OBJECT('name', '特等奖', 'level', 1),
    JSON_OBJECT('name', '一等奖', 'level', 2),
    JSON_OBJECT('name', '二等奖', 'level', 3),
    JSON_OBJECT('name', '三等奖', 'level', 4),
    JSON_OBJECT('name', '优秀奖', 'level', 5)
) WHERE `awards` IS NULL;

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

SELECT id, competition_name, LEFT(awards, 80) as awards_prefix FROM competition;
