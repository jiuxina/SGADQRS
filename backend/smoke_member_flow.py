# -*- coding: utf-8 -*-
"""成员流动/联系方式 新功能回归：退队/移除成员/转让队长/招募帖联系方式/报名截止拦截。
依赖 docker mysql-scms 与 localhost:8080 后端；开头自清理上次残留，可重复执行。
用户映射（live 库）：7=S20220002(队长), 6=S20220001(队员)。
"""
import json, subprocess, urllib.request, urllib.error

BASE = 'http://localhost:8080/api'
P, F = [], []

def q(sql):
    r = subprocess.run(['docker', 'exec', 'mysql-scms', 'mysql', '-uroot', '-proot', 'scms', '-N', '-e', sql],
                       capture_output=True, text=True)
    return r.stdout.strip()

def req(method, path, token=None, body=None):
    r = urllib.request.Request(BASE+path, method=method)
    r.add_header('Content-Type', 'application/json')
    if token: r.add_header('Authorization', 'Bearer '+token)
    data = json.dumps(body).encode() if body is not None else None
    try:
        with urllib.request.urlopen(r, data) as resp:
            payload, status = resp.read(), resp.status
    except urllib.error.HTTPError as e:
        payload, status = e.read(), e.code
    return json.loads(payload)

def mark(name, good, detail=''):
    (P if good else F).append(name + ('' if good else f' | {detail}'))
    print(('[PASS] ' if good else '[FAIL] ') + name + ('' if good else f' | {detail}'))

def call(name, method, path, token=None, body=None):
    j = req(method, path, token, body)
    mark(name, j.get('code') == 200, j)
    return j

def expect_fail(name, method, path, token, body, msg):
    j = req(method, path, token, body)
    m = j.get('message') or ''
    mark(name, j.get('code') != 200 and msg in m, f'msg={m}')

T = {}
for u, uid in [('admin', 1), ('S20220001', 6), ('S20220002', 7)]:
    j = req('POST', '/auth/login', body={'username': u, 'password': '123456'})
    T[uid] = j['data']['token']
    mark(f'登录 {u} -> id={uid}', j['data']['user']['id'] == uid)
A, S6, U7 = T[1], T[6], T[7]

# 预清理上次残留（按队名/标题定位，恢复过期的演示报名窗口）
for tid in q("select id from competition_team where team_name like 'NEWFEAT-验证队%'").splitlines():
    call('清理残留队伍', 'DELETE', f'/registration/team/{tid.strip()}', S6, None)
for pid in q("select id from recruit_post where title like 'NEWFEAT-%'").splitlines():
    call('清理残留帖子', 'DELETE', f'/recruit/{pid.strip()}', U7, None)
q("update competition set registration_end=DATE_ADD(NOW(), INTERVAL 30 DAY) where status in (2,3) and registration_end < NOW()")

# U7 在 comp8(已发布,max3) 建队
j = call('U7 建队 comp8', 'POST', '/registration/team', U7,
         {'competitionId': 8, 'teamName': 'NEWFEAT-验证队', 'teamSlogan': '新功能'})
TID = j['data']['id']
# U7 发招募帖带联系方式
j = call('U7 发招募帖(带联系方式)', 'POST', '/recruit', U7,
         {'type': 1, 'competitionId': 8, 'teamId': TID, 'title': 'NEWFEAT-招人', 'contact': 'wx: newfeat-test'})
PID = j['data']['id'] if isinstance(j['data'], dict) else j['data']
j = call('帖子详情含联系方式', 'GET', f'/recruit/{PID}', S6)
mark('详情 contact 字段', j['data'].get('contact') == 'wx: newfeat-test', j['data'].get('contact'))

# S6 申请入队(带备注) → U7 同意
j = call('S6 申请入队(带备注)', 'POST', '/community/request', S6,
         {'type': 2, 'postId': PID, 'message': '想加入，qq 123'})
RID = j['data']['id']
call('U7 同意入队', 'PUT', f'/community/request/{RID}/handle', U7, {'status': 1})
j = call('队伍详情', 'GET', f'/registration/team/{TID}', U7)
mark('S6 已入队', any(m['studentId'] == 6 for m in j['data']['members']))

# 成员流动
expect_fail('队长不能退队', 'PUT', f'/registration/team/{TID}/leave', U7, None, '队长不能直接退队')
call('S6 退队', 'PUT', f'/registration/team/{TID}/leave', S6, None)
j = call('退队后详情', 'GET', f'/registration/team/{TID}', U7)
mark('S6 已退出', not any(m['studentId'] == 6 for m in j['data']['members']))
# S6 重新申请入队 → 转让队长 → 新队长移除旧队长(U7)
j = call('S6 再次申请', 'POST', '/community/request', S6, {'type': 2, 'postId': PID, 'message': 'again'})
RID2 = j['data']['id']
call('U7 再次同意', 'PUT', f'/community/request/{RID2}/handle', U7, {'status': 1})
expect_fail('非队长移除 → 拒', 'DELETE', f'/registration/team/{TID}/member/7', S6, None, '只有队长可以移除成员')
call('U7 转让队长给 S6', 'PUT', f'/registration/team/{TID}/leader/6', U7, None)
j = call('详情复查队长', 'GET', f'/registration/team/{TID}', U7)
mark('leaderId==6', j['data']['leaderId'] == 6, f"leaderId={j['data']['leaderId']}")
call('新队长 S6 移除 U7', 'DELETE', f'/registration/team/{TID}/member/7', S6, None)
j = call('移除后详情', 'GET', f'/registration/team/{TID}', S6)
mark('U7 已被移除', not any(m['studentId'] == 7 for m in j['data']['members']))
expect_fail('被移除者查看详情 → 无权', 'GET', f'/registration/team/{TID}', U7, None, '无权')

# 报名截止拦截：管理员把 comp4 报名截止改到过去，S6 建队应被拒；恢复
j = call('读 comp4', 'GET', '/competition/4', A)
orig = j['data']
call('comp4 截止改到过去', 'PUT', '/competition', A, {'id': 4, 'registrationEnd': '2020-01-01 00:00:00'})
expect_fail('报名已截止 → 建队拒', 'POST', '/registration/team', S6,
            {'competitionId': 4, 'teamName': 'NEWFEAT-晚了的队'}, '报名已截止')
call('恢复 comp4 截止', 'PUT', '/competition', A, {'id': 4, 'registrationEnd': orig['registrationEnd']})

# 清理（当前队长是 S6）
call('S6 解散验证队', 'DELETE', f'/registration/team/{TID}', S6, None)
call('关闭招募帖', 'DELETE', f'/recruit/{PID}', U7, None)
print(f'\n===== 新功能验证 通过 {len(P)} / 失败 {len(F)} =====')
for x in F: print('FAIL:', x)
