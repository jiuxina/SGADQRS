ALTER TABLE competition ADD COLUMN category VARCHAR(50) DEFAULT NULL COMMENT '竞赛分类' AFTER max_teams;
UPDATE competition SET category = CASE 
  WHEN category_id = 1 THEN '学科类'
  WHEN category_id = 2 THEN '科技类'
  WHEN category_id = 3 THEN '文体类'
  WHEN category_id = 4 THEN '创新创业'
  ELSE '其他'
END WHERE category IS NULL;
SELECT id, competition_name, category_id, category FROM competition;
