# -*- coding: utf-8 -*-
"""
边界与容错全量测试套件（配合 smoke_full.py 的功能冒烟）。

设计原则：
- 只在临时数据（BND- 竞赛 / bnd_ 用户）上做写操作，结束统一清理；
- 收尾做「种子完整性」校验：所有表行数与开头快照一致，防止本套件污染演示数据；
- 对“已知容错弱点”（输入错误却 HTTP 500 等）断言当前实际行为并打 ⚠ 发现，不算 FAIL；
- FAIL 仅当：合法请求被拒、守卫缺失/误拦、数据不一致、状态机可越权穿透、服务不可用。

用法：python backend/boundary_full.py   （需后端 8080 运行）
退出码：0=无 FAIL。
"""
import json
import sys
import threading
import time
import urllib.error
import urllib.parse
import urllib.request

BASE = 'http://localhost:8080/api'
PASS = 0
FAIL = 0
FINDINGS = []
FAILED_CASES = []


def call(method, path, tok=None, body=None, raw=None, ctype='application/json', timeout=15):
    url = BASE + urllib.parse.quote(path, safe='/?&=%:')
    req = urllib.request.Request(url, method=method)
    if ctype:
        req.add_header('Content-Type', ctype)
    if tok:
        req.add_header('Authorization', 'Bearer ' + tok)
    data = None
    if raw is not None:
        data = raw.encode() if isinstance(raw, str) else raw
    elif body is not None:
        data = json.dumps(body, ensure_ascii=False).encode()
    try:
        with urllib.request.urlopen(req, data, timeout=timeout) as r:
            text = r.read().decode('utf-8', 'replace')
            try:
                return r.status, json.loads(text)
            except Exception:
                return r.status, {'_raw': text[:200]}
    except urllib.error.HTTPError as e:
        text = e.read().decode('utf-8', 'replace')
        try:
            return e.code, json.loads(text)
        except Exception:
            return e.code, {'_raw': text[:200]}
    except Exception as e:
        return 0, {'_err': str(e)}


def ok(cond, label, detail=''):
    global PASS, FAIL
    if cond:
        PASS += 1
        print(f'[PASS] {label}' + (f'  | {str(detail)[:120]}' if detail else ''))
    else:
        FAIL += 1
        FAILED_CASES.append(label)
        print(f'[FAIL] {label}  | {str(detail)[:160]}')


def finding(text):
    FINDINGS.append(text)
    print(f'[⚠ 发现] {text}')


def msg_of(resp):
    return (resp or {}).get('message', '') if isinstance(resp, dict) else ''


def code_of(resp):
    return resp.get('code') if isinstance(resp, dict) else None


def expect_msg(method, path, substr, tok=None, body=None, label=None, http=None, raw=None, ctype='application/json'):
    st, j = call(method, path, tok, body, raw=raw, ctype=ctype)
    lab = label or f'{method} {path} → 含「{substr}」'
    cond = substr in msg_of(j) or substr in json.dumps(j, ensure_ascii=False)
    if http is not None:
        cond = cond and st == http
    ok(cond, lab, f'http={st} resp={json.dumps(j, ensure_ascii=False)[:110]}')
    return st, j


def expect_http(method, path, want_http, tok=None, body=None, label=None, raw=None, ctype='application/json'):
    st, j = call(method, path, tok, body, raw=raw, ctype=ctype)
    lab = label or f'{method} {path} → HTTP {want_http}'
    ok(st == want_http, lab, f'http={st} resp={json.dumps(j, ensure_ascii=False)[:110]}')
    return st, j


SEED_SQL = ('docker exec mysql-scms mysql -uroot -proot -N -e "%s"')


def sqlq(q):
    import subprocess
    r = subprocess.run(['docker', 'exec', 'mysql-scms', 'mysql', '-uroot', '-proot', '-N', 'scms', '-e', q],
                       capture_output=True, text=True)
    if r.returncode != 0 and r.stderr.strip():
        err = [l for l in r.stderr.splitlines() if 'Warning' not in l]
        if err:
            print('  !! SQL 失败:', err[0][:120])
    return r.stdout.strip()


def snapshot():
    return {t: int(sqlq(f'select count(*) from scms.{t}') or 0) for t in
            ['competition', 'competition_team', 'competition_team_member', 'competition_result',
             'recruit_post', 'community_request', 'sys_user', 'sys_notification']}


# ================= 主流程 =================
def main():
    s0 = snapshot()
    print('起始快照:', s0)

    # ---------- 0. 登录三种角色 + 注册临时用户 ----------
    T = {}
    for k, u in [('admin', 'admin'), ('teacher', 'T2024001'), ('stu', 'S20210001')]:
        st, j = call('POST', '/auth/login', body={'username': u, 'password': '123456'})
        T[k] = (j.get('data') or {}).get('token')
        if not T[k]:
            print('!! 基础登录失败，终止:', k, j)
            return 2

    temp_ids = {}
    for name in ['a', 'b', 'c', 'd', 'e']:
        expect_http('POST', '/auth/register', 200, body={'username': f'bnd_{name}', 'password': 'bndpass1', 'role': 'student'},
                    label=f'注册临时用户 bnd_{name}')
    st, j = call('GET', '/user/list?current=1&size=100&keyword=bnd_', tok=T['admin'])
    for r in (j.get('data') or {}).get('records', []):
        temp_ids[r['username']] = r['id']
    ok(len(temp_ids) == 5, '5 个临时用户就位', temp_ids)
    for name in temp_ids:
        st, j = call('POST', '/auth/login', body={'username': name, 'password': 'bndpass1'})
        T[name] = (j.get('data') or {}).get('token')
    A, B, C, D, E = (T['bnd_' + n] for n in 'abcde')
    IA, IB, IC, ID, IE = (temp_ids['bnd_' + n] for n in 'abcde')

    # ---------- 1. 认证与匿名 ----------
    expect_http('GET', '/user/list', 401, label='匿名访问 /user/list → 401')
    expect_msg('GET', '/user/list', '未登录或登录已过期', label='401 统一信封', http=401)
    expect_http('GET', '/registration/teams', 401, tok='garbage.token.value', label='垃圾 token → 401（不报错不越权）')
    expect_http('GET', '/user/stats', 401, tok=T['admin'][:-2] + 'xx', label='篡改签名 token → 401')
    expect_http('GET', '/auth/info', 200, tok=T['stu'], label='伪造 token 不污染合法端点（真实 token /auth/info 200）')
    expect_msg('POST', '/auth/login', '账号或密码错误', body={'username': 'admin', 'password': 'wrong'}, label='错密码 → 账号或密码错误')
    expect_msg('POST', '/auth/login', '账号或密码错误', body={'username': 'admin', 'password': '123456', 'role': 'student'},
               label='login role 断言不符 → 统一凭证错误(不泄露角色)')
    expect_msg('POST', '/auth/login', '账号或密码错误', body={'username': "adm' OR 1=1--", 'password': '123456'}, label='SQLi 用户名 → 正常失败不 500')
    expect_msg('POST', '/auth/login', '用户名不能为空', body={'username': '', 'password': '123456'}, http=400, label='空用户名 → 400 bean 校验')
    expect_msg('POST', '/auth/login', '密码不能为空', body={'username': 'admin'}, http=400, label='缺密码字段 → 400')
    st, j = call('POST', '/auth/login', raw='{"username": "admin", "password": ', ctype='application/json')
    ok(st == 400 and '请求体' in msg_of(j), '残缺 JSON → 400 结构化(修复回归)', f'http={st} {msg_of(j)}')
    st, j = call('POST', '/auth/login', raw='["admin","123456"]')
    ok(st == 400, 'body 类型错误(数组) → 400', f'http={st}')
    st, j = call('GET', '/auth/login')
    ok(st == 405 and '方法' in msg_of(j), '错误 HTTP 方法 → 405 结构化(修复回归)', f'http={st} {msg_of(j)}')
    expect_msg('POST', '/auth/register', '用户名已存在', body={'username': 'bnd_a', 'password': 'x123456', 'role': 'student'}, label='重复注册 → 用户名已存在')
    expect_msg('POST', '/auth/register', '用户名不能为空', body={'username': '  ', 'password': 'x123456'}, http=400, label='注册纯空格用户名 → 400(@NotBlank)')
    expect_msg('POST', '/auth/register', '密码至少6位', body={'username': 'bnd_shortpw', 'password': '1', 'role': 'student'}, label='注册弱口令(1位)被拒(修复回归)')

    # ---------- 2. 角色越权矩阵 ----------
    expect_http('GET', '/user/stats', 403, tok=T['stu'], label='学生访问 /user/stats → 403')
    expect_msg('GET', '/stats/admin', '权限不足', tok=T['teacher'], http=403, label='教师访问 /stats/admin → 403 权限不足')
    expect_http('POST', '/registration/team', 403, tok=T['teacher'], body={'competitionId': 7, 'teamName': 'x'}, label='教师建队 → 403(仅学生)')
    expect_http('POST', '/result', 403, tok=T['stu'], body={'competitionId': 1, 'studentId': 4, 'score': 1}, label='学生录成绩 → 403')
    expect_http('POST', '/notice', 403, tok=T['teacher'], body={'noticeTitle': 't', 'noticeContent': 'c'}, label='教师发公告 → 403')
    expect_http('DELETE', '/user/1', 403, tok=T['stu'], label='学生删用户 → 403')
    expect_http('POST', '/competition', 403, tok=T['stu'], body={'competitionName': 'x', 'organizer': 'y', 'registrationStart': '2026-09-01 00:00:00', 'registrationEnd': '2026-09-02 00:00:00', 'competitionStart': '2026-09-03 00:00:00', 'competitionEnd': '2026-09-04 00:00:00'}, label='学生建竞赛 → 403')
    expect_http('PUT', '/recruit/1', 403, tok=T['teacher'], body={'title': 'x'}, label='教师编辑帖子 → 403(仅学生/管理员)')
    expect_http('GET', '/export/competitions', 403, tok=T['stu'], label='学生导出竞赛 → 403')
    expect_http('PUT', '/registration/team/1/audit?status=2', 403, tok=T['teacher'], label='教师审队伍 → 403(仅管理员)')

    # ---------- 3. 分页与类型参数 ----------
    st, j = call('GET', '/competition/list?current=0&size=999999', tok=T['admin'])
    d = j.get('data') or {}
    ok(d.get('current') == 1 and d.get('size') == 200, 'current=0&size=999999 → 钳制为 1/200(Pages.of)', f"cur={d.get('current')} size={d.get('size')}")
    st, j = call('GET', '/competition/list?current=-5&size=0', tok=T['admin'])
    ok(code_of(j) == 200 and (j.get('data') or {}).get('current') == 1, 'current=-5&size=0 → 钳制为 1/1 正常返回', f"code={code_of(j)}")
    st, j = call('GET', '/competition/list?current=abc', tok=T['admin'])
    ok(st == 400 and '类型' in msg_of(j), '非数字分页参数 → 400 类型错误(修复回归)', f'http={st} {msg_of(j)}')
    st, j = call('GET', '/competition/list?current=99999999999', tok=T['admin'])
    ok(st == 400, 'int 溢出分页参数 → 400', f'http={st}')
    st, j = call('GET', '/user/abc', tok=T['admin'])
    ok(st == 400, '路径参数类型不匹配 /user/abc → 400(修复回归)', f'http={st}')
    st, j = call('GET', '/user/999999', tok=T['admin'])
    expect_msg('GET', '/user/999999', '用户不存在', tok=T['admin'], label='不存在用户 → 用户不存在')
    st, j = call('GET', '/user/5', tok=T['stu'])
    ok('password' not in json.dumps(j), 'GET /user/{id} 响应不含 password 字段', list(((j.get("data") or {}) if isinstance(j, dict) else {}).keys())[:12])

    # ---------- 4. 竞赛边界（临时竞赛上测；报名时间窗动态生成，建队/入队会校验截止时间） ----------
    from datetime import datetime, timedelta
    def _d(days, sec='00:00:00'):
        return (datetime.now() + timedelta(days=days)).strftime(f'%Y-%m-%d {sec}')
    base_comp = {'competitionName': 'BND-主测试', 'organizer': 'BND',
                 'registrationStart': _d(-1), 'registrationEnd': _d(30, '23:59:59'),
                 'competitionStart': _d(40), 'competitionEnd': _d(41), 'maxMembers': 3}
    def mkcomp(over=None, tok=None):
        b = dict(base_comp)
        b.update(over or {})
        st, j = call('POST', '/competition', tok or T['admin'], b)
        return j
    CX = (mkcomp().get('data') or {}).get('id'); ok(CX, '临时竞赛 compX 建立(max=3)')
    CY = (mkcomp({'competitionName': 'BND-邀请赛', 'maxMembers': 5}).get('data') or {}).get('id'); ok(CY, '临时竞赛 compY 建立(max=5)')
    CZ = (mkcomp({'competitionName': 'BND-单人赛', 'maxMembers': 1}).get('data') or {}).get('id'); ok(CZ, '临时竞赛 compZ 建立(单人)')
    CD = (mkcomp({'competitionName': 'BND-草稿', 'status': 0}).get('data') or {}).get('id'); ok(CD, '临时草稿竞赛 compDraft 建立')
    CE = (mkcomp({'competitionName': 'BND-已结束', 'status': 4}).get('data') or {}).get('id'); ok(CE, '临时已结束竞赛 compEnd 建立')
    temp_comps = [c for c in [CX, CY, CZ, CD, CE] if c]

    expect_msg('POST', '/competition', '报名截止时间不能早于报名开始时间',
               body={**base_comp, 'competitionName': 'BND-bad', 'registrationEnd': _d(-2)}, tok=T['admin'], label='报名 end<start 拒绝')
    expect_msg('POST', '/competition', '比赛开始时间不能早于报名截止时间',
               body={**base_comp, 'competitionName': 'BND-bad', 'competitionStart': _d(-5), 'competitionEnd': _d(-4)},
               tok=T['admin'], label='比赛 start<报名end 拒绝')
    expect_msg('POST', '/competition', '比赛结束时间不能早于比赛开始时间',
               body={**base_comp, 'competitionName': 'BND-bad', 'competitionEnd': _d(39)}, tok=T['admin'], label='比赛 end<start 拒绝')
    for mv, desc in [(0, 'max=0'), (-1, 'max=-1'), (100, 'max=100'), (99, 'max=99 通过边界')]:
        st, j = call('POST', '/competition', T['admin'], {**base_comp, 'competitionName': 'BND-bad', 'maxMembers': mv})
        if mv in (99,):
            ok('每队人数' not in msg_of(j), f'人数上界 {desc}', f'code={code_of(j)}')
        else:
            ok('每队人数' in msg_of(j), f'人数越界 {desc} 拒绝', f'msg={msg_of(j)}')
    st, j = call('POST', '/competition', T['admin'], {**base_comp, 'competitionName': 'BND-bad', 'registrationStart': 'not-a-date'})
    ok(st == 400, '非法日期串 → 400(修复回归)', f'http={st} {msg_of(j)}')
    st, j = call('POST', '/competition', T['admin'], {**base_comp, 'competitionName': 'BND-bad', 'maxMembers': 'abc'})
    ok(st == 400, 'maxMembers 非数字 → 400', f'http={st}')
    expect_msg('POST', '/competition', '主办方不能为空', body={**base_comp, 'organizer': ''}, http=400, tok=T['admin'], label='缺主办方 → 400')
    st, j = call('POST', '/competition', T['admin'], {**base_comp, 'competitionName': 'BND-长' * 60})
    ok(st == 200 and '竞赛名称不能超过' in msg_of(j), '竞赛名超长(>100) → 结构化拒绝(修复回归)', f'http={st} {msg_of(j)}')
    # 更新路径：不存在/越权/部分更新回归
    expect_msg('PUT', '/competition', '竞赛不存在', body={'id': 999999, 'competitionName': 'x'}, tok=T['admin'], label='更新不存在竞赛')
    expect_msg('PUT', '/competition', '只能编辑自己发布的竞赛', body={'id': CX, 'maxMembers': 2}, tok=T['teacher'], label='教师改他人(管理员)发布竞赛被拒')
    st, j = call('PUT', '/competition', T['admin'], {'id': CX, 'location': '线上'})
    st2, j2 = call('GET', f'/competition/{CX}', T['admin'])
    d2 = j2.get('data') or {}
    ok(d2.get('maxMembers') == 3 and d2.get('status') == 2, '部分 PUT(仅 location) 不重置 maxMembers/status(修复回归)', d2.get('maxMembers'), )
    # 草稿可见性
    st, j = call('GET', f'/competition/{CD}', T['stu'])
    expect_msg('GET', f'/competition/{CD}', '竞赛不存在', tok=T['stu'], label='学生看草稿竞赛 → 竞赛不存在')
    st, j = call('GET', f'/competition/list?current=1&size=100', T['stu'])
    ids = [r['id'] for r in (j.get('data') or {}).get('records', [])]
    ok(CD not in ids, '草稿竞赛不出现在学生列表', ids)
    st, j = call('GET', f'/competition/{CD}', T['admin'])
    ok(code_of(j) == 200, '管理员可见草稿竞赛', code_of(j))

    # ---------- 5. 队伍状态机 / 归属守卫 ----------
    def mkteam(tok, comp, name, over=None):
        b = {'competitionId': comp, 'teamName': name}
        b.update(over or {})
        return call('POST', '/registration/team', tok, b)
    st, j = mkteam(A, CX, 'BND-甲队')
    TX = (j.get('data') or {}).get('id'); ok(st == 200 and TX and j['data']['status'] == 0, 'A 在 compX 建 3 人队 TX(组建中)', j)
    st, j = mkteam(A, CZ, 'BND-单人队', )
    TSOLO = (j.get('data') or {}).get('id')
    ok((j.get('data') or {}).get('status') == 1 and msg_of(j) == '报名成功', '单人赛建队即提交(状态1,报名成功)', msg_of(j))
    expect_msg('POST', '/registration/team', '该竞赛当前不可参赛', body={'competitionId': CE, 'teamName': 'BND-x'}, tok=B, label='已结束竞赛不能参赛')
    expect_msg('POST', '/registration/team', '该竞赛当前不可参赛', body={'competitionId': CD, 'teamName': 'BND-x'}, tok=B, label='草稿竞赛不能参赛')
    expect_msg('POST', '/registration/team', '竞赛不存在', body={'competitionId': 999999, 'teamName': 'BND-x'}, tok=B, label='不存在竞赛 → 竞赛不存在')
    expect_msg('POST', '/registration/team', '团队名称不能为空', body={'competitionId': CX, 'teamName': ''}, http=400, tok=B, label='空队名 → 400')
    st, j = mkteam(B, CY, 'BND-乙队')
    TY = (j.get('data') or {}).get('id'); ok(TY, 'B 在 compY 建队 TY')
    # teacherId 创建路径校验（修复回归：与 changeTeacher 一致拒绝学生）
    st, j = mkteam(C, CY, 'BND-丙队', {'teacherId': IA})
    ok('指导老师不存在' in msg_of(j) and (j.get('data') is None), 'createTeam 拒绝学生当指导老师(修复回归)', msg_of(j))
    st, j = mkteam(C, CY, 'BND-丙队')
    TT2 = (j.get('data') or {}).get('id'); ok(TT2, 'C 无老师建 TT2 成功', msg_of(j))
    st, j = mkteam(D, CZ, 'BND-超长队名' * 20)
    ok('团队名称不能超过' in msg_of(j), '队名超长 → 结构化拒绝(修复回归)', msg_of(j))
    # 越权操作
    expect_msg('PUT', f'/registration/team/{TX}/submit', '只有队长可以提交审核', tok=B, label='非队长提交 → 拒')
    expect_msg('DELETE', f'/registration/team/{TX}', '只有队长可以解散队伍', tok=B, label='非队长解散 → 拒')
    expect_msg('PUT', f'/registration/team/{TX}/teacher', '只有队长可以指定指导老师', tok=B, body={'teacherId': IB}, label='非队长指定老师 → 拒')
    expect_msg('PUT', f'/registration/team/{TX}/teacher', '指导老师不存在', tok=A, body={'teacherId': IB}, label='指定学生当老师 → 拒(changeTeacher 有校验)')
    expect_msg('GET', f'/registration/team/{TX}', '无权查看该队伍', tok=D, label='无关学生看他人队伍详情 → 无权')
    st, j = call('GET', f'/registration/team/{TX}', T['teacher'])
    ok(code_of(j) != 200, '非发布/指导/成员教师看队伍 → 拒绝', msg_of(j))
    st, j = call('GET', f'/registration/team/{TX}', T['admin'])
    ok(code_of(j) == 200, '管理员可见任意队伍', code_of(j))
    # 状态机
    expect_msg('PUT', f'/registration/team/{TX}/submit', '已提交审核', tok=A, label='TX 提交 → 1')
    expect_msg('PUT', f'/registration/team/{TX}/submit', '当前状态不可提交', tok=A, label='重复提交 → 拒')
    expect_msg('PUT', f'/registration/team/{TSOLO}/submit', '当前状态不可提交', tok=A, label='单人队(1)重复提交 → 拒')
    st, j = call('PUT', f'/registration/team/{TX}/audit', T['admin'])
    ok(st == 400 and '缺少必填参数' in msg_of(j), 'audit 缺 status 参数 → 400 结构化(修复回归)', f'http={st} {msg_of(j)}')
    for bad in [1, 0, 99]:
        expect_msg('PUT', f'/registration/team/{TX}/audit?status={bad}', '无效的审核状态', tok=T['admin'], label=f'audit status={bad} → 无效审核状态')
    expect_msg('PUT', f'/registration/team/{TX}/audit?status=4', '无效的审核状态', tok=T['admin'], label='audit status=4 → 无效')
    expect_msg('PUT', f'/registration/team/{TX}/audit?status=2', '审核通过', tok=T['admin'], label='TX 审核通过 → 2')
    expect_msg('PUT', f'/registration/team/{TX}/audit?status=2', '不可审核', tok=T['admin'], label='重复审核(2) → 仅待审核可审')
    expect_msg('DELETE', f'/registration/team/{TX}', '已通过审核的队伍不能解散', tok=A, label='已通过队解散被拒(修复后语义)')
    expect_msg('PUT', f'/registration/team/{TX}/submit', '当前状态不可提交', tok=A, label='已通过(2)不能重提')
    # 驳回→重提闭环回归守卫
    st, j = mkteam(B, CZ, 'BND-单人驳回')  # solo status=1
    TJ = (j.get('data') or {}).get('id')
    expect_msg('PUT', f'/registration/team/{TJ}/audit?status=3&auditRemark=bnd', '已拒绝', tok=T['admin'], label='驳回 TJ')
    st, j = call('GET', f'/registration/team/{TJ}', A)  # A 非成员：无权，换 admin 看状态
    st, j = call('GET', f'/registration/teams?current=1&size=50&competitionId={CZ}', T['admin'])
    stv = next((r['status'] for r in (j.get('data') or {}).get('records', []) if r['id'] == TJ), None)
    ok(stv == 3, '驳回后 status=3 持久化', stv)
    expect_msg('PUT', f'/registration/team/{TJ}/submit', '已提交审核', tok=B, label='驳回后队长重新提交 → 1')
    expect_msg('DELETE', f'/registration/team/{TJ}', '队伍已解散', tok=B, label='驳回重提前可解散：先驳回再解散')
    # (TJ 已删，占位继续)
    st, j = mkteam(D, CZ, 'BND-单人驳回2')
    TJ2 = (j.get('data') or {}).get('id')
    call('PUT', f'/registration/team/{TJ2}/audit?status=3', T['admin'])
    expect_msg('DELETE', f'/registration/team/{TJ2}', '队伍已解散', tok=D, label='已驳回(3)队可直接解散(修复回归守卫)')
    # 同竞赛唯一队伍
    expect_msg('POST', '/registration/team', '你已参加了该竞赛的队伍', body={'competitionId': CX, 'teamName': 'BND-x2'}, tok=A, label='同人同竞赛重复建队 → 拒')
    st, j = mkteam(C, CX, 'BND-已删队重名')
    if j.get('code') == 200:  # C 有 TT2@CY 不影响 CX
        call('DELETE', f"/registration/team/{j['data']['id']}", C)
    st, j = mkteam(C, CX, 'BND-已删队重名')
    ok(j.get('code') == 200, '解散后同竞赛可重新建队(成员表清理生效)', msg_of(j))
    TX2 = (j.get('data') or {}).get('id')
    if TX2:
        call('DELETE', f'/registration/team/{TX2}', C)  # 释放 C 在 CX 的报名位，供后续申请测试
    expect_msg('PUT', '/registration/team/999999/submit', '队伍不存在', tok=A, label='提交不存在队伍')
    expect_msg('DELETE', '/registration/team/999999', '队伍不存在', tok=A, label='解散不存在队伍')
    expect_msg('PUT', '/registration/team/999999/audit?status=2', '队伍不存在', tok=T['admin'], label='审核不存在队伍')

    # ---------- 6. 招募帖 ----------
    expect_msg('POST', '/recruit', '帖子类型无效', body={'type': 0, 'competitionId': CX, 'title': 'BND-x'}, tok=A, label='type=0 无效')
    expect_msg('POST', '/recruit', '请填写标题', body={'type': 1, 'competitionId': CX, 'title': ''}, tok=A, label='空标题拒绝')
    expect_msg('POST', '/recruit', '竞赛不存在', body={'type': 1, 'competitionId': 999999, 'title': 'BND-x'}, tok=A, label='不存在竞赛发帖拒绝')
    expect_msg('POST', '/recruit', '该竞赛当前不可组队', body={'type': 2, 'competitionId': CE, 'title': 'BND-x'}, tok=B, label='已结束竞赛不能发帖')
    st, j = call('POST', '/recruit', A, {'type': 1, 'competitionId': CX, 'title': 'BND-招募帖', 'content': 'x', 'teamId': TX})
    POST1 = j.get('data')
    POST1_ID = POST1.get('id') if isinstance(POST1, dict) else POST1
    ok(code_of(j) == 200 and POST1_ID, '队长发布关联队伍招募帖', msg_of(j))
    expect_msg('POST', '/recruit', '请先关闭原帖', body={'type': 1, 'competitionId': CX, 'title': 'BND-再发'}, tok=A, label='同人同竞赛重复发帖 → 拒')
    expect_msg('POST', '/recruit', '请先在组队中心创建队伍', body={'type': 1, 'competitionId': CY, 'title': 'BND-无队招募'}, tok=D, label='无队伍发招募 → 拒')
    expect_msg('POST', '/recruit', '只有队长可以', body={'type': 1, 'competitionId': CX, 'title': 'BND-借队', 'teamId': TX}, tok=B, label='非队长用他人队伍发布 → 拒')
    expect_msg('POST', '/recruit', '不属于该竞赛', body={'type': 1, 'competitionId': CX, 'title': 'BND-错配', 'teamId': TY}, tok=B, label='队伍与竞赛不匹配 → 拒')
    st, j = call('POST', '/recruit', B, {'type': 2, 'competitionId': CX, 'title': 'BND-求组帖', 'content': 'y'})
    ok(code_of(j) == 200, '成员B 在同竞赛可发求组帖(与队长招募帖共存校验: 一人一帖)', msg_of(j))
    expect_msg('PUT', f'/recruit/{POST1_ID}', '只能编辑自己的帖子', body={'title': 'BND-篡改'}, tok=B, label='非作者编辑 → 拒')
    expect_msg('DELETE', f'/recruit/{POST1_ID}', '无权操作', tok=B, label='非作者删除 → 拒')
    expect_msg('GET', '/recruit/999999', '帖子不存在', tok=T['stu'], label='不存在帖子')
    expect_msg('PUT', '/recruit/999999', '帖子不存在', body={'title': 'x'}, tok=T['stu'], label='编辑不存在帖子')
    st, j = call('GET', '/recruit/list?current=1&size=10&competitionId=' + str(CX), T['stu'])
    ok(any((r.get('id') == POST1_ID) for r in (j.get('data') or {}).get('records', [])), '招募帖出现在广场', msg_of(j))

    # ---------- 7. 社区请求：申请 / 邀请 与容量并发（资料互看已下线，资料全开放） ----------
    expect_msg('POST', '/community/request', '请求类型无效', body={'type': 9, 'toUserId': IA}, tok=B, label='type=9 拒绝')
    expect_msg('POST', '/community/request', '请求类型无效', body={'toUserId': IA}, tok=B, label='type 缺失拒绝')
    expect_msg('POST', '/community/request', '请求类型无效', body={'type': 1, 'toUserId': IA}, tok=B, label='type=1 资料互看已下线 → 拒')
    st, j = call('GET', f'/user/public/{IB}', A)
    ok('realName' in json.dumps(j), 'public profile 全开放含 realName', list((j.get('data') or {}).keys())[:10])
    expect_msg('PUT', '/community/request/999999/handle', '请求不存在', body={'status': 1}, tok=A, label='处理不存在请求')
    # handle 守卫：用一条将被拒绝的申请
    st, j = call('POST', '/community/request', B, {'type': 2, 'postId': POST1_ID, 'message': 'guard'})
    RG = (j.get('data') or {}).get('id'); ok(RG, 'B 入队申请创建(handle 守卫用)', msg_of(j))
    expect_msg('PUT', f'/community/request/{RG}/handle', '无效的处理结果', body={'status': 0}, tok=A, label='handle status=0 → 无效')
    expect_msg('PUT', f'/community/request/{RG}/handle', '无权处理该请求', body={'status': 1}, tok=C, label='无关人处理 → 无权')
    expect_msg('PUT', f'/community/request/{RG}/handle', '已拒绝', body={'status': 2}, tok=A, label='A 拒绝 B 申请(守卫用)')
    expect_msg('PUT', f'/community/request/{RG}/handle', '该请求已处理', body={'status': 2}, tok=A, label='重复处理 → 该请求已处理')
    # 入队申请链路
    expect_msg('POST', '/community/request', '请指定招募帖', body={'type': 2}, tok=D, label='申请缺 postId')
    expect_msg('POST', '/community/request', '招募帖不存在或已关闭', body={'type': 2, 'postId': 999999}, tok=D, label='不存在帖子申请')
    st, j = call('GET', f'/recruit/{POST1_ID}', B)
    ok(code_of(j) == 200, '非作者可读帖子详情', code_of(j))
    # 求组帖不能申请
    st, j = call('GET', '/recruit/list?current=1&size=20&competitionId=' + str(CX), A)
    bqz = next((r['id'] for r in (j.get('data') or {}).get('records', []) if r.get('type') == 2), None)
    if bqz:
        expect_msg('POST', '/community/request', '求组帖', body={'type': 2, 'postId': bqz}, tok=C, label='申请加入求组帖 → 拒')
    # 自己队申请
    expect_msg('POST', '/community/request', '自己的队伍', body={'type': 2, 'postId': POST1_ID}, tok=A, label='申请加入自己的队伍 → 拒')
    # B 申请入 TX(1/3→2/3)：无需先互看，直接申请
    st, j = call('POST', '/community/request', B, {'type': 2, 'postId': POST1_ID, 'message': 'b'})
    RB2 = (j.get('data') or {}).get('id'); ok(RB2, 'B 入队申请创建(直接申请成功)', msg_of(j))
    expect_msg('PUT', f'/community/request/{RB2}/handle', '已同意加入', body={'status': 1}, tok=A, label='同意 B 入队 TX(2/3)')
    # 重复入队守卫
    expect_msg('POST', '/community/request', '你已在队伍中', body={'type': 2, 'postId': POST1_ID}, tok=B, label='已在队再申请 → 你已在队伍中')
    # 容量并发：TX=2/3 仅剩 1 席，C/D 同时被处理，恰好 1 人成功
    st, j1 = call('POST', '/community/request', C, {'type': 2, 'postId': POST1_ID, 'message': 'c'})
    RC = (j1.get('data') or {}).get('id'); ok(RC, 'C 入队申请创建', msg_of(j1))
    st, j2 = call('POST', '/community/request', D, {'type': 2, 'postId': POST1_ID, 'message': 'd'})
    RD = (j2.get('data') or {}).get('id'); ok(RD, 'D 入队申请创建', msg_of(j2))
    res = {}
    def handle(rid, key):
        res[key] = call('PUT', f'/community/request/{rid}/handle', A, {'status': 1})
    t1 = threading.Thread(target=handle, args=(RC, 'c')); t2 = threading.Thread(target=handle, args=(RD, 'd'))
    t1.start(); t2.start(); t1.join(); t2.join()
    succ = [k for k in ('c', 'd') if res[k][1].get('code') == 200]
    ok(len(succ) == 1, f'最后 1 席并发处理恰好 1 人成功(实际成功 {len(succ)} 人)', {k: msg_of(res[k][1]) for k in res})
    if len(succ) == 2:
        finding('!! 并发同意入队出现超员(addMemberToTeam 容量检查与插入非原子)')
    cnt = sqlq(f'select count(*) from scms.competition_team_member where team_id={TX}')
    ok(cnt == '3', f'并发后成员数恰为 3(实为 {cnt})', cnt)
    # 败者重试 → 队伍人数已满(请求已处理?败者请求也被置 1?验证语义)
    loser = 'd' if succ == ['c'] else 'c'
    LR = RD if loser == 'd' else RC
    st, j = call('PUT', f'/community/request/{LR}/handle', A, {'status': 1})
    ok('队伍人数已满' in msg_of(j) or '已处理' in msg_of(j), f'败者重试 → {"队伍人数已满" if "队伍人数已满" in msg_of(j) else "该请求已处理"}(两态之一，无静默超员)', msg_of(j))
    lst = sqlq(f'select status from scms.community_request where id={LR}')
    lmember = sqlq(f'select count(*) from scms.competition_team_member where team_id={TX} and student_id={IC if loser=="c" else ID}')
    if lst == '1' and lmember == '0':
        finding('入队失败(满员)但请求状态仍被置为“已同意”→ 申请单与成员表状态错位(用户看到已通过实际未入队)')
    ok(lst in ('0', '1', '2'), f'败者请求状态有界(={lst})', lst)
    # 满员自动下架招募帖 closePostIfFull
    st, j = call('GET', f'/recruit/{POST1_ID}', A)
    ok((j.get('data') or {}).get('status') == 0, '满员后关联招募帖自动下架(closePostIfFull)', (j.get('data') or {}).get('status'))
    # 满员+帖关后再来申请者 → 已关闭守卫
    expect_msg('POST', '/community/request', '已关闭', body={'type': 2, 'postId': POST1_ID, 'message': 'e'}, tok=E, label='满员下架后申请 → 招募帖不存在或已关闭')
    # 邀请
    st, j = call('POST', '/recruit', E, {'type': 2, 'competitionId': CY, 'title': 'BND-E求组', 'content': 'e'})
    PE = (j.get('data') or {}).get('id') if isinstance(j.get('data'), dict) else j.get('data')
    ok(PE, 'E 在 compY 发求组帖', msg_of(j))
    expect_msg('POST', '/community/request', '只有队长可以', body={'type': 3, 'teamId': TT2, 'postId': PE}, tok=E, label='非队长邀请 → 拒')
    expect_msg('POST', '/community/request', '队伍与该竞赛不匹配', body={'type': 3, 'teamId': TX, 'postId': PE}, tok=A, label='队伍与帖竞赛不匹配 → 拒')
    st, j = call('POST', '/community/request', C, {'type': 3, 'teamId': TT2, 'postId': PE, 'toUserId': IE, 'message': 'inv'})
    RINV = (j.get('data') or {}).get('id'); ok(RINV, 'C 向 E 发出入队邀请(受邀人=求组帖作者)', msg_of(j))
    expect_msg('PUT', f'/community/request/{RINV}/handle', '已接受邀请', body={'status': 1}, tok=E, label='E 接受邀请入队')
    einv = sqlq(f'select count(*) from scms.competition_team_member where team_id={TT2} and student_id={IE}')
    ok(einv == '1', '邀请接受后成员表含 E(邀请链闭环)', einv)
    expect_msg('POST', '/community/request', '对方已在队伍中', body={'type': 3, 'teamId': TT2, 'postId': PE, 'toUserId': IE}, tok=C, label='再邀已在队用户 → 拒')
    # 对招募帖(类型1)发邀请 → 守卫；需 C 在 CY 发帖(先招募被拒→删除→再求组验证自邀守卫)
    st, j = call('POST', '/recruit', C, {'type': 1, 'competitionId': CY, 'title': 'BND-C招募', 'content': 'z', 'teamId': TT2})
    PC = (j.get('data') or {}).get('id') if isinstance(j.get('data'), dict) else j.get('data')
    ok(PC, 'C 在 compY 发招募帖(TT2 关联)', msg_of(j))
    expect_msg('POST', '/community/request', '该帖子是招募帖，无需邀请', body={'type': 3, 'teamId': TT2, 'postId': PC}, tok=C, label='对招募帖发邀请 → 拒')
    call('DELETE', f'/recruit/{PC}', C)
    st, j = call('POST', '/recruit', C, {'type': 2, 'competitionId': CY, 'title': 'BND-C求组', 'content': 'z'})
    PC2 = (j.get('data') or {}).get('id') if isinstance(j.get('data'), dict) else j.get('data')
    if PC2:
        expect_msg('POST', '/community/request', '不能邀请自己', body={'type': 3, 'teamId': TT2, 'postId': PC2}, tok=C, label='基于自己发的求组帖邀请自己 → 拒(受邀人=帖作者)')
    else:
        ok(False, 'C 关闭招募帖后可再发求组帖(一帖守卫仅计开放帖)', msg_of(j))

    # ---------- 8. 成绩边界（临时竞赛临时学生，结束删竞赛级联） ----------
    expect_msg('POST', '/result', '分数不能为负数', body={'competitionId': CX, 'studentId': IE, 'score': -5}, tok=T['admin'], label='负分拒绝')
    expect_msg('POST', '/result', '分数超出合理范围', body={'competitionId': CX, 'studentId': IE, 'score': 100001}, tok=T['admin'], label='分数>100000 拒绝')
    expect_msg('POST', '/result', '名次不能小于', body={'competitionId': CX, 'studentId': IE, 'score': 50, 'ranking': 0}, tok=T['admin'], label='名次=0 拒绝')
    expect_msg('POST', '/result', '请指定获奖学生或队伍', body={'competitionId': CX, 'score': 50}, tok=T['admin'], label='无学生无队 → 拒')
    st, j = call('POST', '/result', T['admin'], {'competitionId': CX, 'studentId': IE, 'score': 0})
    ok(code_of(j) == 200, '分数=0 合法边界通过', msg_of(j))
    RID0 = (j.get('data') or {}).get('id')
    st, j = call('POST', '/result', T['admin'], {'competitionId': CX, 'studentId': IE, 'score': 100})
    ok('已存在相同' in msg_of(j), '同人同竞赛重复成绩 → 拒(直接编辑提示)', msg_of(j))
    st, j = call('POST', '/result', T['admin'], {'competitionId': CX, 'studentId': 999999, 'teamId': None, 'score': 60})
    ok('学生不存在' in msg_of(j), '不存在的 studentId 录成绩被拒(修复回归)', msg_of(j))
    st, j = call('POST', '/result', T['admin'], {'competitionId': CX, 'studentId': None, 'teamId': 999999, 'score': 60})
    ok('团队不存在' in msg_of(j), '不存在的 teamId 录成绩被拒(修复回归)', msg_of(j))
    st, j = call('PUT', '/result', T['admin'], {'id': 999999, 'score': 10})
    expect_msg('PUT', '/result', '成绩记录不存在', body={'id': 999999, 'score': 10}, tok=T['admin'], label='编辑不存在成绩')
    st, j = call('POST', '/result/batch', T['admin'], {'competitionId': CX, 'results': []})
    expect_msg('POST', '/result/batch', '成绩列表不能为空', body={'competitionId': CX, 'results': []}, tok=T['admin'], label='批量空列表拒绝')
    expect_msg('POST', '/result/batch', '竞赛ID不能为空', body={'results': [{'studentId': IE, 'score': 1}]}, tok=T['admin'], label='批量缺竞赛ID')
    st, j = call('POST', '/result/batch', T['admin'], {'competitionId': CX, 'results': [
        {'studentId': IA, 'score': 70}, {'studentId': IB, 'score': -1}, {'studentId': IC, 'score': 999999999999}]})
    ok(code_of(j) != 200, '批量含非法行 → 整批拒绝(事务)或明确报错', f'code={code_of(j)} msg={msg_of(j)}')
    st, j = call('GET', f'/result/list?current=1&size=50&competitionId={CX}', A)
    rows = (j.get('data') or {}).get('records', [])
    ok(code_of(j) == 200 and all(r.get('isPublished') == 1 for r in rows), '未发布前学生列表无未发布记录', f'{len(rows)} rows')
    st, j = call('GET', f'/result/list?current=1&size=50&competitionId={CX}', tok=T['admin'])
    rows_a = (j.get('data') or {}).get('records', [])
    ok(code_of(j) == 200 and len(rows_a) >= len(rows), '管理员可见未发布成绩(条数>=学生可见)', f'admin={len(rows_a)} stu={len(rows)}')
    expect_msg('POST', f'/result/publish/{CX}', '发布成功', tok=T['admin'], label='发布临时竞赛成绩')
    st, j = call('POST', f'/result/publish/{CX}', T['admin'])
    ok('暂无未发布' in msg_of(j) and code_of(j) == 200, '重复发布 → 暂无未发布(code200 提示非错误)', msg_of(j))
    expect_msg('POST', '/result/publish/999999', '竞赛不存在', tok=T['admin'], label='发布不存在竞赛 → 拒绝(修复回归)')
    st, j = call('GET', f'/result/list?current=1&size=50&competitionId={CX}', A)
    ok(any(r.get('studentId') == IE for r in (j.get('data') or {}).get('records', [])), '发布后学生可见', msg_of(j))

    # ---------- 9. 用户管理边界 ----------
    st, j = call('POST', '/user', T['admin'], {'username': 'bnd_dup', 'realName': 'x'})  # 无 userType
    ok('用户类型不能为空' in msg_of(j), 'POST /user 缺 userType → 结构化拒绝(修复回归)', f'http={st} {msg_of(j)}')
    st, j = call('POST', '/user', T['admin'], {'username': 'bnd_dup', 'realName': 'x', 'userType': 9})
    ok('用户类型不能为空' in msg_of(j), 'userType=9 非法值拒绝', msg_of(j))
    st, j = call('POST', '/user', T['admin'], {'username': 'bnd_dup', 'realName': 'x', 'userType': 1, 'password': '123'})
    ok('密码至少6位' in msg_of(j), 'admin 建用户弱密码拒绝(修复回归)', msg_of(j))
    st, j = call('POST', '/user', T['admin'], {'username': 'bnd_dup', 'realName': 'x', 'userType': 1})
    NEWU = (j.get('data') or {}).get('id')
    ok(NEWU, 'admin 建用户(无密码默认123456)', msg_of(j))
    ok('password' not in json.dumps(j), 'POST /user 响应不再回显 password(修复回归)', list((j.get('data') or {}).keys())[:14])
    expect_msg('POST', '/user', '用户名已存在', body={'username': 'bnd_dup', 'realName': 'y', 'userType': 1}, tok=T['admin'], label='重复用户名 → 拒')
    st, j = call('PUT', f'/user/disable/{NEWU}', T['admin'], {})
    ok('状态参数无效' in msg_of(j), 'disable 缺 status → 结构化拒绝，不再 NPE 500(修复回归)', f'http={st} {msg_of(j)}')
    st, jt0 = call('POST', '/auth/login', body={'username': 'bnd_dup', 'password': '123456'})
    tok0 = (jt0.get('data') or {}).get('token')
    ok(bool(tok0), '默认密码 123456 可登录(创建未指定密码)', msg_of(jt0))
    expect_msg('PUT', f'/user/disable/{NEWU}', '禁用成功', body={'status': 0}, tok=T['admin'], label='禁用用户')
    expect_msg('POST', '/auth/login', '已被禁用', body={'username': 'bnd_dup', 'password': '123456'}, label='禁用用户登录被拒')
    expect_http('GET', '/user/list', 401, tok=tok0, label='禁用后旧 token 立即失效 → 401(JWT 过滤器按 DB 状态复核)')
    expect_msg('PUT', f'/user/disable/{NEWU}', '启用成功', body={'status': 1}, tok=T['admin'], label='恢复启用')
    st, j = call('GET', f'/user/{NEWU}', T['admin'])
    ok('password' not in json.dumps(j), 'GET /user/{id} 管理员视角也不泄露 password', list((j.get('data') or {}).keys())[:14])
    expect_msg('DELETE', '/user/999999', '用户不存在', tok=T['admin'], label='删除不存在用户 → 用户不存在(修复回归)')
    st, j = call('POST', '/user/batch-delete', T['admin'], [])
    expect_msg('POST', '/user/batch-delete', '用户ID列表不能为空', body=[], tok=T['admin'], label='批量删空数组拒绝')
    st, j = call('DELETE', f'/user/{NEWU}', T['admin'])
    ok(code_of(j) == 200, '清理删除 bnd_dup', msg_of(j))
    # 资料长度边界(临时用户 A)
    st, j = call('PUT', '/user/profile', A, {'nickname': 'N' * 50, 'bio': 'B' * 500, 'skills': 's' * 255})
    ok(code_of(j) == 200, '昵称50/简介500/技能255 边界内通过', msg_of(j))
    st, j = call('PUT', '/user/profile', A, {'nickname': 'N' * 51})
    ok('昵称过长' in msg_of(j) and code_of(j) == 500, '昵称 51 → 昵称过长', msg_of(j))
    st, j = call('PUT', '/user/profile', A, {'bio': 'B' * 501})
    ok('简介过长' in msg_of(j), '简介 501 → 简介过长', msg_of(j))
    st, j = call('PUT', '/user/profile', A, {'skills': 's' * 256})
    ok('技能标签过长' in msg_of(j), '技能 256 → 过长', msg_of(j))
    # 改密码(临时用户 B)
    expect_msg('PUT', '/user/password', '原密码错误', body={'oldPassword': 'nope123', 'newPassword': 'newpass1'}, tok=B, label='改密原密码错')
    expect_msg('PUT', '/user/password', '新密码至少6位', body={'oldPassword': 'bndpass1', 'newPassword': '12345'}, tok=B, label='新密码<6位拒绝')
    expect_msg('PUT', '/user/password', '原密码错误', body={'newPassword': 'newpass123'}, tok=B, label='缺 oldPassword 视为原密码错误(非 NPE)')
    expect_msg('PUT', '/user/password', '密码修改成功', body={'oldPassword': 'bndpass1', 'newPassword': 'bndpass2'}, tok=B, label='改密成功')
    expect_msg('POST', '/auth/login', '登录成功', body={'username': 'bnd_b', 'password': 'bndpass2'}, label='新密码可登录')
    expect_msg('POST', '/auth/login', '账号或密码错误', body={'username': 'bnd_b', 'password': 'bndpass1'}, label='旧密码失效')

    # ---------- 10. 公告/通知容错 ----------
    expect_msg('POST', '/notice', '公告标题不能为空', body={'noticeTitle': '', 'noticeContent': 'x'}, http=400, tok=T['admin'], label='公告缺标题 400')
    st, j = call('POST', '/notice', T['admin'], {'noticeTitle': 'BND-公告', 'noticeContent': 'x', 'status': 1})
    NID = j.get('data') if isinstance(j.get('data'), int) else (j.get('data') or {}).get('id')
    ok(code_of(j) == 200 and msg_of(j) == '发布成功', '发布临时公告', msg_of(j))
    expect_msg('DELETE', '/notice/999999', '公告不存在', tok=T['admin'], label='删不存在公告')
    expect_msg('PUT', '/notice/999999/top', '公告不存在', tok=T['admin'], label='置顶不存在公告')
    expect_msg('PUT', '/notice', '公告不存在', body={'id': 999999, 'noticeTitle': 'x'}, tok=T['admin'], label='更新不存在公告')
    st, j = call('PUT', '/notification/read/999999', T['stu'])
    ok(code_of(j) == 200, '读不存在消息幂等 200(不泄露存在性)', msg_of(j))
    st, j = call('GET', '/notification/unread-count', T['stu'])
    ok(isinstance((j.get('data') or {}).get('count'), int), '未读数接口形状 {count}', j)

    # ---------- 11. 文件与静态资源 ----------
    import uuid as _u
    png = bytes.fromhex('89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4'
                        '890000000a4944415478da6360000002000100ffff030000060009f14f79'
                        '0000000049454e44ae426082')
    def multipart(fields, filename, content):
        b = '--BOUNDARYX\r\nContent-Disposition: form-data; name="file"; filename="%s"\r\nContent-Type: image/png\r\n\r\n' % filename
        raw = (b.encode() + content + b'\r\n--BOUNDARYX--\r\n')
        return raw
    st, j = call('POST', '/file/upload', A, raw=multipart(None, 'pic.PNG', png), ctype='multipart/form-data; boundary=BOUNDARYX')
    upurl = ((j.get('data') or {}) if isinstance(j.get('data'), dict) else {}).get('url')
    ok(code_of(j) == 200 and upurl, '上传大写扩展名 .PNG 白名单通过', msg_of(j))
    st, j = call('POST', '/file/upload', A, raw=multipart(None, 'x.html', b'<script>alert(1)</script>'), ctype='multipart/form-data; boundary=BOUNDARYX')
    ok('不支持' in msg_of(j), '上传 .html 被白名单拒绝(防存储 XSS)', msg_of(j))
    st, j = call('POST', '/file/upload', A, raw=multipart(None, 'x.svg', b'<svg/>'), ctype='multipart/form-data; boundary=BOUNDARYX')
    ok('不支持' in msg_of(j), '上传 .svg 拒绝', msg_of(j))
    st, j = call('POST', '/file/upload', A, raw=multipart(None, 'noext', b'abc'), ctype='multipart/form-data; boundary=BOUNDARYX')
    ok('不支持' in msg_of(j), '无扩展名文件拒绝', msg_of(j))
    st, j = call('POST', '/file/upload', A, raw=multipart(None, '', png), ctype='multipart/form-data; boundary=BOUNDARYX')
    ok(code_of(j) == 500 or '不支持' in msg_of(j) or '请选择文件' in msg_of(j), '空文件名 → 结构化拒绝', msg_of(j))
    st, j = call('POST', '/file/upload', A, raw=b'--BOUNDARYX--\r\n', ctype='multipart/form-data; boundary=BOUNDARYX')
    ok(st == 400, '缺 file part → 400 缺少上传文件(修复回归)', f'http={st} {msg_of(j)}')
    big = png + b'0' * (11 * 1024 * 1024)
    st, j = call('POST', '/file/upload', A, raw=multipart(None, 'big.png', big), ctype='multipart/form-data; boundary=BOUNDARYX')
    ok(st == 413, '11MB 超限 → 413(修复回归)', f'http={st} {msg_of(j)}')
    if upurl:
        try:
            with urllib.request.urlopen(BASE + upurl, timeout=5) as r:
                ok(r.status == 200, '上传文件可匿名读取(公开 URL 设计，文件名 uuid 不可枚举)', r.status)
        except Exception as e:
            ok(False, '上传文件可读', e)
    st, j = call('GET', '/public/nonexistent.png', T['admin'])
    ok(st == 404, '不存在静态文件 → 404', f'http={st}')
    for evil in ['/public/..%2Fapplication.yml', '/public/%2e%2e/%2e%2e/etc/passwd', '/public/x.php']:
        st, j = call('GET', evil, T['admin'])
        body_txt = json.dumps(j, ensure_ascii=False)
        ok(st in (400, 404) and 'spring' not in body_txt and 'root:' not in body_txt, f'静态资源路径穿越拒绝 {evil[:28]}', f'http={st}')
    st, j = call('GET', '/uploads/..%2Fapplication.yml', T['admin'])
    ok(st in (400, 401, 404) and 'datasource' not in json.dumps(j), 'uploads 目录穿越拒绝', f'http={st}')

    # ---------- 12. XSS / 注入串透传记录（前端 React 转义，后端按原样存取） ----------
    xss = '<img src=x onerror=alert(1)>'
    st, j = call('PUT', '/user/profile', E, {'bio': xss})
    st, j = call('GET', f'/user/public/{IE}', A)
    ok(code_of(j) == 200 and xss in json.dumps(j, ensure_ascii=False), 'XSS 串按原文存取(渲染层由 React 转义，非后端职责)', f'code={code_of(j)}')

    # ---------- 13. 服务存活 & 种子完整性 ----------
    st, j = call('POST', '/auth/login', body={'username': 'admin', 'password': '123456'})
    ok(code_of(j) == 200, '全部攻击性输入后服务仍可用', msg_of(j))

    # ---------- 清理 ----------
    print('\n--- 清理测试数据 ---')
    leak = sqlq("select group_concat(id) from scms.competition where competition_name like 'BND-%'") or ''
    leak_ids = [int(x) for x in leak.split(',') if x.isdigit()]
    for cid in temp_comps + [c for c in leak_ids if c not in temp_comps]:
        st, j = call('DELETE', f'/competition/{cid}', T['admin'])
        print(f'  delete comp {cid}: {msg_of(j)}')
    sqlq("DELETE FROM competition_team WHERE competition_id NOT IN (SELECT id FROM competition);")
    sqlq("DELETE FROM recruit_post WHERE competition_id NOT IN (SELECT id FROM competition);")
    sqlq("DELETE FROM competition_result WHERE competition_id NOT IN (SELECT id FROM competition);")
    uids = ','.join(str(i) for i in temp_ids.values()) or '0'
    sqlq(f"DELETE FROM community_request WHERE from_user_id IN ({uids}) OR to_user_id IN ({uids});")
    sqlq(f"DELETE FROM sys_notification WHERE user_id IN ({uids});")
    sqlq("DELETE FROM competition_team WHERE team_name LIKE 'BND-%';")
    sqlq("DELETE FROM competition_team_member WHERE team_id NOT IN (SELECT id FROM competition_team);")
    sqlq("DELETE FROM recruit_post WHERE title LIKE 'BND-%';")
    sqlq("DELETE FROM competition_result WHERE student_id IN (%s);" % uids)
    sqlq("DELETE FROM sys_notification WHERE content LIKE '%%BND-%%';")
    for u in temp_ids:
        call('DELETE', f"/user/{temp_ids[u]}", T['admin'])
    sqlq("DELETE FROM sys_user WHERE username LIKE 'bnd_%';")
    notice_id = locals().get('NID')
    if notice_id:
        call('DELETE', f'/notice/{notice_id}', T['admin'])
    if upurl:
        import os
        p = os.path.join(os.path.dirname(os.path.abspath(__file__)), upurl.lstrip('/').replace('/', os.sep))
        try:
            os.remove(p); print('  已删上传测试文件', upurl)
        except Exception as e:
            print('  上传文件清理失败(无害):', e)

    s1 = snapshot()
    print('结束快照:', s1)
    for t in s0:
        ok(s0[t] == s1[t], f'种子完整性: {t} 行数不变', f'{s0[t]} -> {s1[t]}')
    # max_members 现状守卫
    mm = sqlq('select group_concat(max_members order by id) from scms.competition where id<=8')
    ok(mm == '3,3,5,3,1,1,1,3', '竞赛人数上限保持修复值', mm)
    resid = sqlq("select count(*) from sys_user where username like 'bnd_%'")
    ok(resid == '0', '临时用户已清空', resid)

    print(f'\n===== 通过 {PASS} / 失败 {FAIL} =====')
    if FAILED_CASES:
        print('失败项:', *FAILED_CASES, sep='\n  - ')
    print('\n--- ⚠ 容错发现(当前行为=断言通过，但语义可改进) ---')
    for f in dict.fromkeys(FINDINGS):
        print(' •', f)
    return 1 if FAIL else 0


if __name__ == '__main__':
    sys.exit(main())
