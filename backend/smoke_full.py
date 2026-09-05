# -*- coding: utf-8 -*-
"""TeamUp 全链路冒烟测试：结束时自动清理本次写入的数据。"""
import json, subprocess, sys, urllib.request, urllib.error
from urllib.parse import quote

BASE = 'http://localhost:8080/api'
PASS, FAIL = [], []

def q(sql):
    r = subprocess.run(['docker','exec','mysql-scms','mysql','-uroot','-proot','scms','-N','-e',sql],
                       capture_output=True, text=True)
    return r.stdout.strip()

def http(method, path, token=None, body=None, raw=False):
    path = quote(path, safe="/?&=.%[]:=")  # URL 中文参数编码
    req = urllib.request.Request(BASE+path, method=method)
    req.add_header('Content-Type','application/json')
    if token: req.add_header('Authorization','Bearer '+token)
    data = json.dumps(body).encode() if body is not None else None
    try:
        with urllib.request.urlopen(req, data) as r:
            payload, status, ctype = r.read(), r.status, r.headers.get('Content-Type','')
    except urllib.error.HTTPError as e:
        payload, status, ctype = e.read(), e.code, e.headers.get('Content-Type','')
    except Exception as e:
        return -1, str(e), None
    if raw: return status, ctype, payload
    try: j = json.loads(payload)
    except Exception: return status, ctype, None
    return status, ctype, j

def ok(name, cond, detail=''):
    (PASS if cond else FAIL).append(name)
    print(('[PASS] ' if cond else '[FAIL] ') + name + (('  | ' + str(detail)[:200]) if detail else ''))

def call(name, method, path, token=None, body=None):
    status, ctype, j = http(method, path, token, body)
    good = status == 200 and j is not None and j.get('code') == 200
    ok(name, good, f'http={status} resp={json.dumps(j, ensure_ascii=False)[:200] if j else ctype}')
    return j

def call_fail(name, method, path, token=None, body=None):
    status, ctype, j = http(method, path, token, body)
    good = status != 200 or j is None or j.get('code') != 200
    ok(name, good, f'http={status} resp={json.dumps(j, ensure_ascii=False)[:200] if j else ctype}')
    return j

try:
    # ---------- 快照（用于清理） ----------
    snap_team = int(q('select ifnull(max(id),0) from competition_team'))
    snap_result = int(q('select ifnull(max(id),0) from competition_result'))
    snap_post = int(q('select ifnull(max(id),0) from recruit_post'))
    snap_req = int(q('select ifnull(max(id),0) from community_request'))
    snap_notif = int(q('select ifnull(max(id),0) from sys_notification'))
    print(f'snapshot team>12(result>={snap_result} post>={snap_post} req>={snap_req} notif>={snap_notif})')

    # ---------- 1. 登录 ----------
    tokens, users = {}, {}
    for u, p, uid in [('admin','123456',1),('T2024001','123456',2),('S20210001','123456',4),
                      ('S20220001','123456',6),('S20230001','123456',8)]:
        j = call(f'登录 {u}', 'POST', '/auth/login', body={'username':u,'password':p})
        d = (j or {}).get('data') or {}
        tokens[uid] = d.get('token'); users[uid] = d.get('user') or {}
        ok(f'  {u} id=={uid}', (users[uid] or {}).get('id') == uid, users[uid])
    A, T2T, S4, S6, S8 = (tokens[i] for i in (1,2,4,6,8))
    rn6 = users[6].get('realName'); rn8 = users[8].get('realName')

    # ---------- 2. 竞赛列表 / 详情 ----------
    j = call('学生看竞赛列表', 'GET', '/competition/list?current=1&size=10', S6)
    recs = (j or {}).get('data', {}).get('records', [])
    ok('  列表非空且含 hasRegistered', len(recs) > 0 and 'hasRegistered' in recs[0], len(recs))
    j = call('竞赛6详情(未报名)', 'GET', '/competition/6', S6)
    ok('  comp6 hasRegistered==False', (j or {}).get('data', {}).get('hasRegistered') == False, (j or {}).get('data', {}).get('hasRegistered'))

    # ---------- 3. solo 一键报名（自动1人队 status=1） ----------
    j = call('solo报名 comp6', 'POST', '/registration/team', S6, {'competitionId':6,'teamName':'张伟的参赛队'})
    solo = (j or {}).get('data') or {}
    T_SOLO = solo.get('id')
    ok('  solo 队 status==1', solo.get('status') == 1, solo)
    j = call('  comp6 详情复查', 'GET', '/competition/6', S6)
    ok('  comp6 hasRegistered==True', (j or {}).get('data', {}).get('hasRegistered') == True)

    # ---------- 4. 团队建队 → 提交 → 管理员审核 ----------
    j = call('建队 comp8(指定老师2)', 'POST', '/registration/team', S4,
             {'competitionId':8,'teamName':'TEST-冒烟小队','teamSlogan':'全链路冒烟','teacherId':2})
    T1 = ((j or {}).get('data') or {}).get('id')
    j = call('队长提交审核', 'PUT', f'/registration/team/{T1}/submit', S4)
    j = call('管理员审核通过', 'PUT', f'/registration/team/{T1}/audit?status=2&auditRemark=冒烟通过', A)
    j = call('队伍列表(admin)', 'GET', '/registration/teams?current=1&size=50&competitionId=8', A)
    rec = next((r for r in (j or {}).get('data', {}).get('records', []) if r.get('id') == T1), {})
    ok('  T1 status==2 且 teacherId==2', rec.get('status') == 2 and rec.get('teacherId') == 2, rec)

    # ---------- 5. 权限与守卫 ----------
    call_fail('学生无权审核', 'PUT', f'/registration/team/{T1}/audit?status=3', S6)
    call_fail('solo 队重复提交被拒', 'PUT', f'/registration/team/{T_SOLO}/submit', S6)

    # ---------- 6. 参赛者名单（教师） ----------
    j = call('参赛者名单 comp8', 'GET', '/registration/participants?competitionId=8', T2T)
    rows = (j or {}).get('data') or []
    ok('  名单含 student4/teamId', any(r.get('studentId') == 4 and r.get('teamId') == T1 for r in rows), rows[:3])

    # ---------- 7. 更换指导老师 ----------
    call('更换指导老师为3', 'PUT', f'/registration/team/{T1}/teacher', S4, {'teacherId':3})
    j = call('  队伍列表复查', 'GET', '/registration/teams?current=1&size=50&competitionId=8', A)
    rec = next((r for r in (j or {}).get('data', {}).get('records', []) if r.get('id') == T1), {})
    ok('  teacherId==3', rec.get('teacherId') == 3, rec.get('teacherId'))

    # ---------- 8. 旧端点已删 ----------
    call_fail('POST /registration/join 已删', 'POST', '/registration/join', S4, {'invitationCode':'x'})
    call_fail('GET /registration/list 已删', 'GET', '/registration/list', S4)
    call_fail('POST /registration 已删', 'POST', '/registration', S4, {'competitionId':8})
    call_fail('PUT /competition/8/audit 已删', 'PUT', '/competition/8/audit?status=1', A)
    call_fail('advisor 端点已删', 'PUT', f'/registration/team/{T1}/advisor', S4, {'action':'accept'})

    # ---------- 9. 招募帖（先建队再发帖；已移除自动建队） ----------
    call_fail('无队伍发招募被拒', 'POST', '/recruit', S8,
              {'type':1,'competitionId':8,'title':'TEST-无队发帖','content':'冒烟测试','tags':'Python'})
    j = call('建队 comp8(student8)', 'POST', '/registration/team', S8,
             {'competitionId':8,'teamName':'TEST-冒烟招人队','teamSlogan':'全链路冒烟'})
    T2 = ((j or {}).get('data') or {}).get('id')
    ok('  T2 建队成功', T2 and T2 > snap_team, f'T2={T2}')
    j = call('发招募帖(student8,带teamId)', 'POST', '/recruit', S8,
             {'type':1,'competitionId':8,'teamId':T2,'title':'TEST-寻找队友','content':'冒烟测试','tags':'Python'})
    P = ((j or {}).get('data') or {}).get('id') if isinstance((j or {}).get('data'), dict) else (j or {}).get('data')
    n_team8 = q(f'select count(*) from competition_team where leader_id=8 and competition_id=8')
    ok('  发帖不再自动建队', n_team8 == '1', f'leader8@comp8 teams={n_team8}')
    j = call('招募广场列表', 'GET', '/recruit/list?current=1&size=10&competitionId=8', S6)
    ok('  列表含新帖', any(r.get('id') == P for r in (j or {}).get('data', {}).get('records', [])), f'P={P}')
    j = call('帖子详情', 'GET', f'/recruit/{P}', S6)
    dkeys = set(((j or {}).get('data') or {}).keys())
    ok('  详情无 viewCount/needCount', 'viewCount' not in dkeys and 'needCount' not in dkeys, dkeys)

    # ---------- 10. 脱敏卡 → 互看解锁 → 公开资料 ----------
    j = call('发起互看请求', 'POST', '/community/request', S6, {'type':1,'toUserId':8,'postId':P})
    R1 = ((j or {}).get('data') or {}).get('id') if isinstance((j or {}).get('data'), dict) else (j or {}).get('data')
    j = call('对方收到请求', 'GET', '/community/request/received?current=1&size=10', S8)
    ok('  received 含 R1', any(r.get('id') == R1 for r in (j or {}).get('data', {}).get('records', [])), f'R1={R1}')
    j = call('未解锁帖详情(作者卡打码)', 'GET', f'/recruit/{P}', S6)
    d = ((j or {}).get('data') or {}).get('author') or {}
    ok('  作者卡无 realName 且打码', 'realName' not in d and d.get('displayName') != rn8, d)
    call('同意互看', 'PUT', f'/community/request/{R1}/handle', S8, {'status':1})
    j = call('解锁后帖详情(author卡)', 'GET', f'/recruit/{P}', S6)
    d = ((j or {}).get('data') or {}).get('author') or {}
    ok('  解锁后作者卡 unlocked==True 且仍无 realName', d.get('unlocked') == True and 'realName' not in d, {k: d.get(k) for k in ('unlocked','displayName','realName')})
    j = call('解锁后公开资料(user6看8)', 'GET', '/user/public/8', S6)
    d = (j or {}).get('data') or {}
    ok('  realName 可见', d.get('realName') == rn8, d.get('realName'))
    ok('  含 awards 字段', 'awards' in d, list(d.keys())[:10])

    # ---------- 11. 入队申请 → 同意入队 ----------
    j = call('发起入队申请', 'POST', '/community/request', S6, {'type':2,'teamId':T2,'toUserId':8,'postId':P,'message':'想加入'})
    R2 = ((j or {}).get('data') or {}).get('id') if isinstance((j or {}).get('data'), dict) else (j or {}).get('data')
    call('队长同意入队', 'PUT', f'/community/request/{R2}/handle', S8, {'status':1})
    cnt = q(f'select count(*) from competition_team_member where team_id={T2} and student_id=6')
    ok('  成员已入队 status=1', cnt == '1', cnt)

    # ---------- 12. 成绩批量录入 + 发布 + 通知 ----------
    call('批量录成绩', 'POST', '/result/batch', T2T,
         {'competitionId':8,'results':[
             {'studentId':4,'teamId':T1,'score':88.5,'ranking':1,'awardLevel':1},
             {'studentId':6,'teamId':T2,'score':90,'ranking':1,'awardLevel':1}]})
    j = call('成绩列表', 'GET', '/result/list?current=1&size=10&competitionId=8', T2T)
    rs = (j or {}).get('data', {}).get('records', [])
    ok('  成绩带 teamId', len(rs) == 2 and all(r.get('teamId') for r in rs), rs[:2])
    call('发布成绩', 'POST', '/result/publish/8', T2T)
    j = call('学生通知列表', 'GET', '/notification/list?current=1&size=10', S6)
    ns = (j or {}).get('data', {}).get('records', [])
    ok('  收到成绩发布通知', any('成绩' in (r.get('title') or '') + (r.get('content') or '') for r in ns),
       [(r.get('title'), r.get('content')) for r in ns[:3]])

    # ---------- 13. 公开主页获奖可见 ----------
    j = call('公开主页(user8看6,已互看)', 'GET', '/user/public/6', S8)
    aw = ((j or {}).get('data') or {}).get('awards') or []
    ok('  awards 非空(含comp8奖)', len(aw) > 0, aw[:2])

    # ---------- 14. 统计 / 导出 ----------
    call('学生 dashboard', 'GET', '/competition/dashboard', S6)
    call('管理员 stats', 'GET', '/stats/admin', A)
    st, ct, _ = http('GET', '/export/competitions', A, raw=True)
    ok('导出竞赛 Excel', st == 200 and ('sheet' in ct or 'octet' in ct), f'{st} {ct}')
    st, ct, _ = http('GET', '/export/teams?competitionId=8', A, raw=True)
    ok('导出队伍 Excel', st == 200 and ('sheet' in ct or 'octet' in ct), f'{st} {ct}')

finally:
    # ---------- 清理（含历史残留 teams 13-15） ----------
    print('\n--- 清理测试数据 ---')
    for sql in [
        'delete from competition_team_member where team_id > 5',
        'delete from competition_team where id > 5',
        f'delete from competition_result where id > {snap_result}',
        f'delete from recruit_post where id > {snap_post}',
        f'delete from community_request where id > {snap_req}',
        f'delete from sys_notification where id > {snap_notif}',
        "delete from competition where id > 8 and competition_name like '%冒烟%'",
    ]:
        out = subprocess.run(['docker','exec','mysql-scms','mysql','-uroot','-proot','scms','-e',sql],
                             capture_output=True, text=True)
        print(('OK  ' if out.returncode == 0 else 'ERR ') + sql + (out.stderr[:120] if out.returncode else ''))
    left_t = q('select count(*) from competition_team'); left_m = q('select count(*) from competition_team_member')
    left_r = q('select count(*) from competition_result')
    print(f'清理后: teams={left_t} members={left_m} results={left_r}')
    print(f'\n===== 通过 {len(PASS)} / 失败 {len(FAIL)} =====')
    if FAIL: print('失败项: ' + '; '.join(FAIL))
    sys.exit(1 if FAIL else 0)
