#!/bin/bash
# 边界操作全量回归脚本:每项输出 PASS/FAIL + 实际响应摘要
BASE=http://localhost:8080/api
J() { python -c "import sys,json;d=json.load(sys.stdin);print(json.dumps(d,ensure_ascii=False)[:160])" 2>/dev/null || echo "RAW"; }

# ===== tokens =====
TA=$(curl -s -X POST $BASE/auth/login -H "Content-Type: application/json" -d '{"username":"admin","password":"123456","role":"admin"}' | python -c "import sys,json;print(json.load(sys.stdin)['data']['token'])")
TT=$(curl -s -X POST $BASE/auth/login -H "Content-Type: application/json" -d '{"username":"T2024001","password":"123456","role":"teacher"}' | python -c "import sys,json;print(json.load(sys.stdin)['data']['token'])")
TS4=$(curl -s -X POST $BASE/auth/login -H "Content-Type: application/json" -d '{"username":"S20210001","password":"123456","role":"student"}' | python -c "import sys,json;print(json.load(sys.stdin)['data']['token'])")
# 学生11:先取一个 token(禁用后用于验证旧 token 失效)
TS11=$(curl -s -X POST $BASE/auth/login -H "Content-Type: application/json" -d '{"username":"S20240002","password":"123456","role":"student"}' | python -c "import sys,json;print(json.load(sys.stdin)['data']['token'])")

check() { # $1=编号 $2=期望子串 $3=实际
  if echo "$3" | grep -q "$2"; then echo "PASS [$1] $2"; else echo "FAIL [$1] 期望含:[$2] 实际:$(echo "$3" | head -c 160)"; fi
}

echo "== B1 审核状态机 =="
R=$(curl -s -X PUT "$BASE/registration/team/1/audit?status=2" -H "Authorization: Bearer $TA")
check B1a "不可审核" "$R"

echo "== B9 同竞赛重复建队 =="
R=$(curl -s -X POST "$BASE/registration/team" -H "Authorization: Bearer $TS4" -H "Content-Type: application/json" -d '{"competitionId":1,"teamName":"boundary-team"}')
check B9 "你已参加了该竞赛的队伍" "$R"

echo "== B2 竞赛归属 =="
R=$(curl -s -X PUT "$BASE/competition" -H "Authorization: Bearer $TT" -H "Content-Type: application/json" -d '{"id":3,"maxMembers":3}')
check B2a "只能编辑自己发布的竞赛" "$R"
R=$(curl -s -X DELETE "$BASE/competition/3" -H "Authorization: Bearer $TT")
check B2b "只能删除自己发布的竞赛" "$R"
R=$(curl -s -X PUT "$BASE/competition" -H "Authorization: Bearer $TA" -H "Content-Type: application/json" -d '{"id":3,"maxMembers":1}')
check B2c "更新成功" "$R"

echo "== B3 日期/人数校验 =="
R=$(curl -s -X POST "$BASE/competition" -H "Authorization: Bearer $TT" -H "Content-Type: application/json" -d '{"competitionName":"boundary-comp","registrationStart":"2026-09-10T00:00:00","registrationEnd":"2026-09-01T00:00:00","competitionStart":"2026-09-20T00:00:00","competitionEnd":"2026-09-21T00:00:00"}')
check B3a "报名截止时间不能早于报名开始时间" "$R"
R=$(curl -s -X POST "$BASE/competition" -H "Authorization: Bearer $TT" -H "Content-Type: application/json" -d '{"competitionName":"boundary-comp","registrationStart":"2026-09-01T00:00:00","registrationEnd":"2026-09-10T00:00:00","competitionStart":"2026-09-20T00:00:00","competitionEnd":"2026-09-21T00:00:00","maxMembers":0}')
check B3b "每队人数" "$R"
R=$(curl -s -X POST "$BASE/competition" -H "Authorization: Bearer $TT" -H "Content-Type: application/json" -d '{"competitionName":"boundary-comp","registrationStart":"2026-09-01T00:00:00","registrationEnd":"2026-09-10T00:00:00","competitionStart":"2026-08-01T00:00:00","competitionEnd":"2026-08-02T00:00:00"}')
check B3c "比赛开始时间不能早于报名截止时间" "$R"

echo "== B15 缺失必填字段 =="
R=$(curl -s -X POST "$BASE/competition" -H "Authorization: Bearer $TT" -H "Content-Type: application/json" -d '{"competitionName":"no-org-comp","registrationStart":"2026-09-01T00:00:00","registrationEnd":"2026-09-10T00:00:00","competitionStart":"2026-09-20T00:00:00","competitionEnd":"2026-09-21T00:00:00"}')
check B15 "主办方不能为空" "$R"

echo "== B4 删除级联 =="
NEWID=$(curl -s -X POST "$BASE/competition" -H "Authorization: Bearer $TT" -H "Content-Type: application/json" -d '{"competitionName":"cascade-comp","organizer":"boundary-org","registrationStart":"2026-09-01T00:00:00","registrationEnd":"2026-09-10T00:00:00","competitionStart":"2026-09-20T00:00:00","competitionEnd":"2026-09-21T00:00:00","maxMembers":3}' | python -c "import sys,json;print(json.load(sys.stdin)['data']['id'])")
docker exec mysql-scms mysql -uroot -proot scms -e "INSERT INTO recruit_post(competition_id,user_id,type,title,status,create_time,update_time) VALUES ($NEWID,4,1,'待级联帖子',1,NOW(),NOW()); INSERT INTO competition_result(competition_id,student_id,score,is_published,create_time,update_time) VALUES ($NEWID,7,66,0,NOW(),NOW());" 2>/dev/null
R=$(curl -s -X DELETE "$BASE/competition/$NEWID" -H "Authorization: Bearer $TT")
check B4a "删除成功" "$R"
LEFT=$(docker exec mysql-scms mysql -uroot -proot scms -N -e "SELECT (SELECT COUNT(*) FROM recruit_post WHERE competition_id=$NEWID)+(SELECT COUNT(*) FROM competition_result WHERE competition_id=$NEWID);" 2>/dev/null | tr -d '\r')
if [ "$LEFT" = "0" ]; then echo "PASS [B4b] 孤儿数据为 0"; else echo "FAIL [B4b] 残留 $LEFT 行"; fi

echo "== B5 成绩查重/范围 =="
R=$(curl -s -X POST "$BASE/result" -H "Authorization: Bearer $TA" -H "Content-Type: application/json" -d '{"competitionId":1,"studentId":4,"score":88}')
check B5a "已存在相同学生" "$R"
R=$(curl -s -X POST "$BASE/result" -H "Authorization: Bearer $TA" -H "Content-Type: application/json" -d '{"competitionId":1,"studentId":7,"score":-5}')
check B5b "分数不能为负数" "$R"

echo "== B6 禁用账号 =="
# 造一条未发布成绩供 B10 使用(学生11, 竞赛5)
RESID=$(curl -s -X POST "$BASE/result" -H "Authorization: Bearer $TA" -H "Content-Type: application/json" -d '{"competitionId":5,"studentId":11,"score":77}' | python -c "import sys,json;print(json.load(sys.stdin)['data']['id'])")
curl -s -X PUT "$BASE/user/disable/11" -H "Authorization: Bearer $TA" -H "Content-Type: application/json" -d '{"status":0}' > /dev/null
R=$(curl -s -X POST $BASE/auth/login -H "Content-Type: application/json" -d '{"username":"S20240002","password":"123456","role":"student"}')
check B6a "账号已被禁用" "$R"
CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/registration/teams" -H "Authorization: Bearer $TS11")
if [ "$CODE" != "200" ]; then echo "PASS [B6b] 旧 token 已失效 (HTTP $CODE)"; else echo "FAIL [B6b] 旧 token 仍可用"; fi
curl -s -X PUT "$BASE/user/disable/11" -H "Authorization: Bearer $TA" -H "Content-Type: application/json" -d '{"status":1}' > /dev/null
R=$(curl -s -X POST $BASE/auth/login -H "Content-Type: application/json" -d '{"username":"S20240002","password":"123456","role":"student"}')
check B6c "登录成功" "$R"

echo "== B10 学生只见已发布成绩 =="
VIS=$(curl -s "$BASE/result/list?competitionId=5" -H "Authorization: Bearer $TS4" | python -c "import sys,json;rs=json.load(sys.stdin)['data']['records'];print(sum(1 for r in rs if r['studentId']==11))")
if [ "$VIS" = "0" ]; then echo "PASS [B10a] 学生看不到未发布成绩"; else echo "FAIL [B10a] 学生看到了 $VIS 条未发布成绩"; fi
VIS=$(curl -s "$BASE/result/list?competitionId=5" -H "Authorization: Bearer $TA" | python -c "import sys,json;rs=json.load(sys.stdin)['data']['records'];print(sum(1 for r in rs if r['studentId']==11))")
if [ "$VIS" != "0" ]; then echo "PASS [B10b] 管理员可见未发布成绩"; else echo "FAIL [B10b] 管理员不可见"; fi
docker exec mysql-scms mysql -uroot -proot scms -e "DELETE FROM competition_result WHERE id=$RESID;" 2>/dev/null

echo "== B7 分页边界 =="
CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/competition/list?current=0&size=999999" -H "Authorization: Bearer $TA")
if [ "$CODE" = "200" ]; then echo "PASS [B7a] current=0&size=999999 -> HTTP 200"; else echo "FAIL [B7a] HTTP $CODE"; fi
CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/registration/teams?current=-3&size=0" -H "Authorization: Bearer $TS4")
if [ "$CODE" = "200" ]; then echo "PASS [B7b] current=-3&size=0 -> HTTP 200"; else echo "FAIL [B7b] HTTP $CODE"; fi

echo "== B8 上传白名单 =="
echo "<html><script>alert(1)</script></html>" > /tmp/evil.html
R=$(curl -s -X POST "$BASE/file/upload" -H "Authorization: Bearer $TA" -F "file=@/tmp/evil.html")
check B8a "不支持的文件类型" "$R"
cp F:/xm/SGADQRS/frontend/public/avatar/s1-1.webp /tmp/ok.webp 2>/dev/null || cp F:/xm/SGADQRS/frontend/public/favicon.svg /tmp/ok.webp
R=$(curl -s -X POST "$BASE/file/upload" -H "Authorization: Bearer $TA" -F "file=@/tmp/ok.webp")
check B8b "上传成功" "$R"
URL=$(echo "$R" | python -c "import sys,json;print(json.load(sys.stdin)['data']['url'])" 2>/dev/null)
[ -n "$URL" ] && rm -f "F:/xm/SGADQRS/backend$URL" && echo "  (已清理测试上传文件 $URL)"

echo "== B11 教师导出(限定本人竞赛) =="
CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/export/teams" -H "Authorization: Bearer $TT")
echo "教师导出队伍 HTTP $CODE (期望 200)"
CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/export/results" -H "Authorization: Bearer $TT")
echo "教师导出成绩 HTTP $CODE (期望 200)"

echo "== B13 重复发布提示 =="
R=$(curl -s -X POST "$BASE/result/publish/1" -H "Authorization: Bearer $TA")
check B13 "暂无未发布的成绩" "$R"

echo "== 冒烟:核心流程未被破坏 =="
R=$(curl -s "$BASE/registration/teams?current=1&size=20" -H "Authorization: Bearer $TS4" | python -c "import sys,json;d=json.load(sys.stdin);print('teams:',d['code'],d['data']['total'])")
echo "$R"
R=$(curl -s "$BASE/competition/list?current=1&size=10" -H "Authorization: Bearer $TS4" | python -c "import sys,json;d=json.load(sys.stdin);print('comps:',d['code'],d['data']['total'])")
echo "$R"
rm -f /tmp/evil.html /tmp/ok.webp
