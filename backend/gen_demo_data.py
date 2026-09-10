# -*- coding: utf-8 -*-
"""演示数据生成器：生成 backend/sql/demo-data.sql（先清后插，可重复执行）并灌入 docker mysql-scms。

标记约定（cleanup 依据）：演示用户名前缀 D2025(学生)/TD2025(教师)，演示竞赛名前缀「演示·」；
现有竞赛上的演示队伍队长一律为演示学生，保证清理规则可完整回收；个人赛只占用演示学生（不抢种子学生报名位）。
用法：python backend/gen_demo_data.py   （生成 SQL → 执行 → 校验）
所有账号密码与种子一致：123456
"""
import os, subprocess, sys

SQL_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'sql', 'demo-data.sql')

def q(sql):
    """经 stdin 传 SQL 并显式 UTF-8，避免 Windows 下命令行参数中文被破坏"""
    r = subprocess.run(['docker', 'exec', '-i', 'mysql-scms', 'mysql', '-uroot', '-proot',
                        '--default-character-set=utf8mb4', 'scms', '-N'],
                       input=sql.encode('utf-8'), capture_output=True)
    out = r.stdout.decode('utf-8', 'replace').strip()
    err = r.stderr.decode('utf-8', 'replace').strip()
    if r.returncode != 0 and err:
        print('SQL错误:', err[:300]); sys.exit(1)
    return out

def esc(s):
    return s.replace('\\', '\\\\').replace("'", "''")

def d(days):
    """日期表达式：正=未来，负=过去"""
    return f'NOW()+INTERVAL {days} DAY' if days >= 0 else f'NOW()-INTERVAL {-days} DAY'

# ============ 1. 库内现状 ============
mx = {t: int(q(f"select ifnull(max(id),0) from {t}")) for t in
      ['sys_user', 'competition', 'competition_team', 'competition_team_member',
       'recruit_post', 'community_request', 'competition_result', 'sys_notification']}
existing_students = [int(x) for x in q("select group_concat(id) from sys_user where user_type=1 and username not like 'D2025%'").split(',') if x]
teachers = [2, 3]  # 种子教师
per_comp_used = {}
for row in q("select t.competition_id, group_concat(m.student_id) from competition_team_member m join competition_team t on m.team_id=t.id group by t.competition_id").splitlines():
    if row.strip():
        cid, ids = row.split('\t')
        per_comp_used[int(cid)] = set(int(i) for i in ids.split(','))
solo_comps = [int(x) for x in q("select group_concat(id) from competition where max_members=1 and status in (2,3) and competition_name not like '演示·%'").split(',') if x]
team_comps = {}
for row in q("select id, max_members from competition where max_members>1 and status in (2,3) and competition_name not like '演示·%'").splitlines():
    cid, mm = row.split('\t'); team_comps[int(cid)] = int(mm)
print(f"现状: 用户max={mx['sys_user']} 团队赛={team_comps} 个人赛={solo_comps}")

# ============ 2. 用户 ============
NAMES = ['陈嘉伟','林晓彤','王浩然','赵雨欣','刘俊熙','张若彤','黄子轩','吴思远','徐佳琪','孙志强',
         '胡雅婷','朱文博','高欣怡','马天宇','郭静怡','何俊杰','罗雪莹','郑凯文','韩梦琪','唐睿哲',
         '冯思涵','董子墨','萧语嫣','程一鸣','曹语桐','邓浩宇','沈佳怡','曾子航','彭雨桐','吕明轩',
         '苏婉清','蒋昊然','蔡欣妍','贾云帆','丁诗涵','魏子豪','薛冰洁','叶致远','阎语汐','余思琪',
         '钟懿轩','汪静雯']
NICKS = ['夜航星','Bug猎人','蓝莓山丘','摸鱼大师','江畔何人','键盘上的舞者','青柠汽水','格物致知',
         '南山打铁人','极光漫步','早八战神','白鲸','纸飞机','拾光者','硬件老哥','云端漫游','橘猫不秃','量子波动拳手',
         '数据挖掘机','过河卒','静水深流','拾贝少年']
DEPTS = [('计算机学院','计算机科学与技术','计科2201班'),('计算机学院','软件工程','软工2202班'),
         ('人工智能学院','人工智能','AI2301班'),('人工智能学院','数据科学与大数据技术','大数据2201班'),
         ('电子信息学院','电子信息工程','电信2203班'),('电子信息学院','通信工程','通信2201班'),
         ('数学与统计学院','数学与应用数学','数学2201班'),('经济管理学院','信息管理与信息系统','信管2201班'),
         ('外国语学院','英语','英语2302班')]
SKILLS = ['Python,C++,算法','Java,Spring,MySQL','Vue,TypeScript,前端工程化','嵌入式,C,STM32',
          'FPGA,Verilog,电路设计','数学建模,Python,论文写作','深度学习,PyTorch,数据分析',
          '产品设计,Figma,原型','Python,爬虫,数据可视化','C++,游戏开发,Unity']
BIOS = ['热爱技术，常年混迹实验室，目标是打透一个方向。',
        '竞赛爱好者，拿过两次校一等奖，正在冲击国奖。',
        '全栈开发练习生，喜欢把想法快速做成原型。',
        '数学建模常驻队员，擅长论文写作与可视化。',
        '硬件发烧友，宿舍一半空间被开发板占据。',
        '专注后端与分布式，业余写技术博客。',
        '设计转开发，对交互与实现都有一点执念。',
        '大二小白但学习能力强，希望跟大佬组队成长。']
TEACHER_NAMES = ['宋立群','韩明远','欧阳婷婷','白振宇']
TEACHER_DEPTS = ['计算机学院','人工智能学院','电子信息学院','经济管理学院']
PWD = '$2b$10$j7XnMEsPsByfvmbAQqFmLORnxpqfL/QrrRccVMsHN.izBV6n1jyRG'  # 123456

uid = mx['sys_user']
new_students, new_teachers, name_of = [], [], {}
for i, name in enumerate(NAMES):
    uid += 1
    dept, major, cls = DEPTS[i % len(DEPTS)]
    new_students.append(dict(id=uid, username=f'D2025{i+1:03d}', name=name,
                             nick=NICKS[i % len(NICKS)] if i % 2 == 0 else None,
                             gender=1 if i % 3 else 2, dept=dept, major=major, cls=cls,
                             bio=BIOS[i % len(BIOS)], skills=SKILLS[i % len(SKILLS)], days=100 - i))
    name_of[uid] = name
for i, name in enumerate(TEACHER_NAMES):
    uid += 1
    new_teachers.append(dict(id=uid, username=f'TD2025{i+1:03d}', name=name, dept=TEACHER_DEPTS[i], days=120 - i))
    name_of[uid] = name
all_teacher_ids = teachers + [t['id'] for t in new_teachers]
demo_student_ids = [s['id'] for s in new_students]

# ============ 3. 竞赛 ============
AWARD_STD = '[{"name":"一等奖","level":2},{"name":"二等奖","level":3},{"name":"三等奖","level":4},{"name":"优秀奖","level":5}]'
NEW_COMPS = [
    dict(key='A', name='演示·全国大学生人工智能应用创新大赛', org='中国人工智能学会', pub=0, status=2, max=4,
         reg=(-7, 30), comp=(40, 43), loc='线上+校内答辩',
         desc='面向全校学生的 AI 应用开发赛事，鼓励结合真实场景落地，校赛决赛设现场答辩。', age=30),
    dict(key='B', name='演示·全国高校绿色低碳创业挑战赛', org='校创新创业学院', pub=1, status=2, max=3,
         reg=(-3, 25), comp=(35, 38), loc='大学生创业园',
         desc='围绕绿色低碳主题的商业计划与原型路演，优胜团队推荐入驻创业孵化基地。', age=25),
    dict(key='C', name='演示·全国大学生数据挖掘挑战赛', org='中国计算机学会', pub=0, status=3, max=5,
         reg=(-15, -10), comp=(-5, 20), loc='线上赛平台',
         desc='以真实业务数据为题的数据挖掘与建模比拼，报名已截止，正赛进行中。', age=40),
    dict(key='D', name='演示·全国大学生程序设计天梯赛', org='全国高校竞赛组委会', pub=0, status=4, max=3,
         reg=(-120, -90), comp=(-60, -59), loc='各高校机房',
         desc='团队程序设计天梯赛，按队伍累计解题分数排名。', age=130),
    dict(key='E', name='演示·全国大学生数学建模挑战赛', org='中国工业与应用数学学会', pub=1, status=4, max=4,
         reg=(-110, -80), comp=(-45, -42), loc='线上+校内',
         desc='72 小时数学建模挑战，完成建模、求解与论文。', age=125),
    dict(key='F', name='演示·校园英语风采大赛（个人赛）', org='外国语学院', pub=1, status=2, max=1,
         reg=(-5, 28), comp=(35, 35), loc='外语学院报告厅',
         desc='个人赛：定题演讲与即兴问答，展现英语表达能力。', age=20),
]
comps_by_key = {c['key']: c for c in NEW_COMPS}
comp_id = {c['key']: mx['competition'] + 1 + i for i, c in enumerate(NEW_COMPS)}
comp_name = {comp_id[c['key']]: c['name'] for c in NEW_COMPS}
comp_max = {comp_id[c['key']]: c['max'] for c in NEW_COMPS}
comp_max.update(team_comps)
for cid in solo_comps: comp_max[cid] = 1
EXIST_MAP = {f'EXIST_{k}': k for k in team_comps}

# ============ 4. 队伍与成员 ============
TEAM_NAMES = ['星火小队','云际工作室','破晓战队','极客先锋','智核小组','启航团队','光年之外','逐风者',
              '拓界小组','青云队','深蓝实验室','麒麟小组','追光者','阿波罗计划','天穹小队','磐石战队',
              '灵犀小组','千帆竞技','曙光先锋','凌云小队','织梦团队','破壁者','知行合一','格致小队',
              '坚果小组','闪电手','洞察者','白泽小队','拾贝者','探路者','励行队','观澜小组',
              '枫叶队','北辰小队','鲲鹏战队','木棉花开','灯塔小组','远航者','青苗队','燎原小队']
SLOGANS = ['稳扎稳打，冲出国赛','快乐竞赛，认真做事','一起拿奖！','以赛促学，共同成长']
# (comp_key, [(人数, 状态), ...], 建队天数基数)
TEAM_PLAN = [
    ('EXIST_1', [(3, 2), (2, 0)], 18), ('EXIST_2', [(3, 2), (2, 1)], 17),
    ('EXIST_3', [(5, 2), (3, 0)], 16), ('EXIST_4', [(2, 1)], 15),
    ('EXIST_8', [(2, 0), (2, 0), (3, 1)], 14),
    ('A', [(4, 2), (3, 1), (3, 0)], 10), ('B', [(3, 2), (2, 0)], 9),
    ('C', [(5, 2), (4, 2), (4, 2)], 26),
    ('D', [(3, 2), (3, 2), (3, 2), (3, 2)], 76),
    ('E', [(4, 2), (3, 2), (4, 2)], 74),
]
used = {k: set(v) for k, v in per_comp_used.items()}  # 竞赛ID -> 已占用学生
pool = demo_student_ids + existing_students  # 新生优先，老生只在靠后的队伍穿插
pi = 0

def pick(cid, demo_only=False):
    global pi
    src = demo_student_ids if demo_only else pool
    free = [s for s in src if s not in used.setdefault(cid, set())]
    if not free: raise SystemExit(f'学生池耗尽: 竞赛{cid}')
    s = free[pi % len(free)]; pi += 1
    used[cid].add(s)
    return s

teams, members, team_members = [], [], {}

def add_team(cid, name, mlist, status, age, teacher=None, slogan=None):
    tid = mx['competition_team'] + 1 + len(teams)
    teams.append(dict(id=tid, comp=cid, name=name, leader=mlist[0], teacher=teacher,
                      slogan=slogan, status=status, days=age, size=len(mlist)))
    team_members[tid] = list(mlist)
    for j, s in enumerate(mlist):
        members.append((mx['competition_team_member'] + 1 + len(members), tid, cid, s, max(age - j, 0)))
    return tid

for key, spec, age in TEAM_PLAN:
    cid = EXIST_MAP[key] if key.startswith('EXIST') else comp_id[key]
    for size, st in spec:
        assert size <= comp_max[cid], f'{key} 队伍超员 {size}>{comp_max[cid]}'
        mlist = [pick(cid) for _ in range(size)]
        teacher = all_teacher_ids[len(teams) % len(all_teacher_ids)] if len(teams) % 3 == 0 else None
        slogan = SLOGANS[len(teams) % len(SLOGANS)] if len(teams) % 2 == 0 else None
        add_team(cid, TEAM_NAMES[len(teams) % len(TEAM_NAMES)], mlist, st, age + len(teams) % 4, teacher, slogan)

# 个人赛：现有 solo 竞赛各 4 人 + 新个人赛 F 6 人（只占演示学生，不抢种子学生报名位）
solo_plan = [(cid, [2, 2, 2, 1]) for cid in solo_comps] + [('F', [2, 2, 2, 2, 1, 0])]
for key, statuses in solo_plan:
    cid = comp_id['F'] if key == 'F' else key
    for i, st in enumerate(statuses):
        sid = pick(cid, demo_only=True)
        add_team(cid, name_of[sid], [sid], st, 16 - i)

# ============ 5. 招募/求组帖 ============
TAGS = ['算法,Python','后端,Java,Spring','前端,Vue,TypeScript','嵌入式,硬件','论文写作,可视化','数据分析,建模']
posts = []
recruitable = [t for t in teams if t['status'] in (0, 1) and comp_max[t['comp']] > 1 and t['size'] < comp_max[t['comp']]]
for i, t in enumerate(recruitable):
    missing = comp_max[t['comp']] - t['size']
    posts.append(dict(id=mx['recruit_post'] + 1 + len(posts), comp=t['comp'], user=t['leader'], type=1,
                      title=f"【招人】「{t['name']}」招 {missing} 人，一起备赛",
                      content=f"队伍「{t['name']}」现有 {t['size']} 人，还差 {missing} 位队友。每周一次线上例会，赛前集中冲刺，欢迎靠谱的同学加入。",
                      team=t['id'], tags=TAGS[i % len(TAGS)],
                      contact=f"微信：demo_wx{i+1:02d}" if i % 3 != 2 else f"QQ：1002{i+1:04d}",
                      deadline=12 + i, status=1, days=9 - i))
SEEK = [('A', SKILLS[6]), ('A', SKILLS[0]), ('B', SKILLS[7]), ('B', SKILLS[2]), ('C', SKILLS[6]), ('C', SKILLS[9])]
for zi, (ck, skill) in enumerate(SEEK):
    cid = comp_id[ck]
    owner = pick(cid, demo_only=True)
    short = comps_by_key[ck]['name'].split('·', 1)[1]
    posts.append(dict(id=mx['recruit_post'] + 1 + len(posts), comp=cid, user=owner, type=2,
                      title=f"【求组】{short}找队，擅长{skill.split(',')[0]}",
                      content=f"想参加该竞赛，擅长 {skill}，每周可投入 15+ 小时，希望加入一支认真备赛的队伍。",
                      team=None, tags=skill, contact=f"微信：seek_{zi+1:02d}" if zi % 2 == 0 else None,
                      deadline=10, status=1, days=6 - zi))

# ============ 6. 社区请求 ============
requests = []
def add_req(type_, post, team, frm, to, msg, status, days, handle_days=None):
    requests.append(dict(id=mx['community_request'] + 1 + len(requests), type=type_, post=post, team=team,
                         frm=frm, to=to, msg=msg, status=status, days=days, handle=handle_days))

for p in [p for p in posts if p['type'] == 1][:8]:  # 待处理入队申请
    applicant = pick(p['comp'], demo_only=True)
    add_req(2, p['id'], p['team'], applicant, p['user'], f"想加入队伍，我的微信 wx_{applicant}，方便沟通。", 0, 4 - len(requests) % 4)
for p in [p for p in posts if p['type'] == 2]:  # 待处理邀请（队长 → 求组帖作者）
    cands = [t for t in recruitable if t['comp'] == p['comp'] and t['leader'] != p['user'] and t['size'] < comp_max[p['comp']]]
    if not cands or len([r for r in requests if r['type'] == 3]) >= 3: continue
    t = cands[0]
    add_req(3, p['id'], t['id'], t['leader'], p['user'], f"诚邀你加入「{t['name']}」，一起备赛冲奖！", 0, 3 - len(requests) % 3)
for p in [p for p in posts if p['type'] == 1][:4]:  # 历史上被拒绝的申请
    applicant = pick(p['comp'], demo_only=True)
    add_req(2, p['id'], p['team'], applicant, p['user'], "想加入，求带！", 2, 8, 7)
posted = [t for t in teams if t['size'] >= 2 and any(p.get('team') == t['id'] for p in posts)][:2]
for t in posted:  # 已同意（与成员表一致：队员 → 队长）
    p = next(p for p in posts if p.get('team') == t['id'])
    add_req(2, p['id'], t['id'], team_members[t['id']][1], t['leader'], "已入队，谢谢队长！", 1, 6, 6)

# ============ 7. 成绩 ============
results = []
for ck, published in [('D', 1), ('E', 1), ('C', 0)]:
    c = comps_by_key[ck]; cid = comp_id[ck]
    pub_days = c['comp'][1] + 1
    create_days = 2 if c['comp'][1] > 0 else c['comp'][1] + 2
    for t in [x for x in teams if x['comp'] == cid]:
        for idx, sid in enumerate(team_members[t['id']]):
            level, aname = {0: (2, '一等奖'), 1: (3, '二等奖'), 2: (4, '三等奖')}.get(idx, (5, '优秀奖'))
            results.append(dict(id=mx['competition_result'] + 1 + len(results), comp=cid, student=sid, team=t['id'],
                                score=round(92.5 - idx * 2.5 - (t['id'] % 3) * 0.5, 1), rank=idx + 1,
                                level=level, aname=aname, published=published, pub_days=pub_days, days=create_days))

# ============ 8. 通知与公告 ============
notis = []
def add_noti(user, type_, title, content, ref_type, ref, days, top=0, read=0):
    notis.append(dict(id=mx['sys_notification'] + 1 + len(notis), user=user, type=type_, title=title,
                      content=content, ref_type=ref_type, ref=ref, read=read, top=top, days=days))

for t in [t for t in teams if t['status'] == 2][:4]:
    for sid in team_members[t['id']]:
        add_noti(sid, 'interaction', '参赛队伍审核通过', f"「{t['name']}」已通过参赛审核。", 'team', t['id'], max(t['days'] - 1, 0))
team_name = {t['id']: t['name'] for t in teams}
for r in [r for r in requests if r['status'] == 0]:
    who = name_of.get(r['frm'], '有同学')
    if r['type'] == 2:
        add_noti(r['to'], 'interaction', '收到新的入队申请', f"{who} 申请加入你的队伍，去组队中心处理。", 'request', r['id'], r['days'])
    else:
        add_noti(r['to'], 'interaction', '收到入队邀请', f"{who} 邀请你加入「{team_name.get(r['team'], '队伍')}」，去组队中心处理。", 'request', r['id'], r['days'])
add_noti(0, 'announcement', '2026年秋季学期竞赛报名通道已开启',
         '多场高水平竞赛已开放报名，欢迎同学们组队参赛；招募帖可填写联系方式，沟通更高效。', 'notice', None, 3, top=1)
add_noti(0, 'announcement', '平台使用小贴士', '组队后由队长提交审核；个人赛报名即提交，无需组队。', 'notice', None, 10)

# ============ 9. 生成 SQL ============
DUSER = "(SELECT id FROM sys_user WHERE username LIKE 'D2025%' OR username LIKE 'TD2025%')"
DCOMP = "(SELECT id FROM competition WHERE competition_name LIKE '演示·%')"
DTEAM = f"(SELECT t.id FROM competition_team t WHERE t.competition_id IN {DCOMP} OR t.leader_id IN {DUSER})"
DPOST = f"(SELECT p.id FROM recruit_post p WHERE p.competition_id IN {DCOMP} OR p.user_id IN {DUSER})"

L = ['-- 由 backend/gen_demo_data.py 生成：演示数据（先清后插，可重复执行）',
     '-- 用法: docker exec -i mysql-scms mysql -uroot -proot --default-character-set=utf8mb4 scms < backend/sql/demo-data.sql',
     'SET NAMES utf8mb4;', '', '-- ===== 1. 清理上次演示数据 =====']
L += [
    f'DELETE FROM sys_notification WHERE user_id IN {DUSER};',
    f'DELETE n FROM sys_notification n JOIN competition_team t ON n.ref_type=\'team\' AND n.ref_id=t.id WHERE t.id IN {DTEAM};',
    f'DELETE n FROM sys_notification n JOIN recruit_post p ON n.ref_type=\'recruit\' AND n.ref_id=p.id WHERE p.id IN {DPOST};',
    f'DELETE n FROM sys_notification n JOIN community_request r ON n.ref_type=\'request\' AND n.ref_id=r.id WHERE r.team_id IN {DTEAM} OR r.post_id IN {DPOST};',
    f'DELETE FROM community_request WHERE from_user_id IN {DUSER} OR to_user_id IN {DUSER} OR team_id IN {DTEAM} OR post_id IN {DPOST};',
    f'DELETE FROM recruit_post WHERE user_id IN {DUSER} OR competition_id IN {DCOMP};',
    f'DELETE FROM competition_result WHERE student_id IN {DUSER} OR competition_id IN {DCOMP};',
    f'DELETE FROM competition_team_member WHERE team_id IN {DTEAM};',
    f'DELETE FROM competition_team WHERE competition_id IN {DCOMP} OR leader_id IN {DUSER};',
    "DELETE FROM competition WHERE competition_name LIKE '演示·%';",
    "DELETE FROM sys_user WHERE username LIKE 'D2025%' OR username LIKE 'TD2025%';",
    '', '-- 兜底：清理历史遗留的孤儿引用（引用目标已不存在）',
    "DELETE m FROM competition_team_member m LEFT JOIN competition_team t ON m.team_id=t.id LEFT JOIN competition c ON m.competition_id=c.id LEFT JOIN sys_user u ON m.student_id=u.id WHERE t.id IS NULL OR c.id IS NULL OR u.id IS NULL;",
    "DELETE r FROM competition_result r LEFT JOIN sys_user u ON r.student_id=u.id LEFT JOIN competition_team t ON r.team_id=t.id LEFT JOIN competition c ON r.competition_id=c.id WHERE (r.student_id IS NOT NULL AND u.id IS NULL) OR (r.team_id IS NOT NULL AND t.id IS NULL) OR c.id IS NULL;",
    "DELETE p FROM recruit_post p LEFT JOIN competition c ON p.competition_id=c.id LEFT JOIN sys_user u ON p.user_id=u.id LEFT JOIN competition_team t ON p.team_id=t.id WHERE c.id IS NULL OR u.id IS NULL OR (p.team_id IS NOT NULL AND t.id IS NULL);",
    "DELETE q FROM community_request q LEFT JOIN recruit_post p ON q.post_id=p.id LEFT JOIN sys_user u ON q.from_user_id=u.id LEFT JOIN sys_user v ON q.to_user_id=v.id LEFT JOIN competition_team t ON q.team_id=t.id WHERE (q.post_id IS NOT NULL AND p.id IS NULL) OR u.id IS NULL OR v.id IS NULL OR (q.team_id IS NOT NULL AND t.id IS NULL);",
    "DELETE n FROM sys_notification n LEFT JOIN sys_user u ON n.user_id=u.id WHERE n.user_id <> 0 AND u.id IS NULL;",
    "DELETE t FROM competition_team t LEFT JOIN competition c ON t.competition_id=c.id WHERE c.id IS NULL;",
    '', '-- ===== 2. 用户 =====']
L.append('INSERT INTO sys_user (id, username, password, real_name, nickname, avatar, gender, user_type, dept_name, major_name, class_name, bio, skills, status, create_time, update_time) VALUES')
rows = []
for s in new_students:
    rows.append(f"({s['id']},'{s['username']}','{PWD}','{esc(s['name'])}',{('NULL' if not s['nick'] else chr(39) + esc(s['nick']) + chr(39))},NULL,{s['gender']},1,'{s['dept']}','{s['major']}','{s['cls']}','{esc(s['bio'])}','{s['skills']}',1,{d(-s['days'])},NOW())")
for t in new_teachers:
    rows.append(f"({t['id']},'{t['username']}','{PWD}','{esc(t['name'])}',NULL,NULL,1,2,'{t['dept']}',NULL,NULL,'指导教师，负责赛前培训与项目指导。',NULL,1,{d(-t['days'])},NOW())")
L.append(',\n'.join(rows) + ';')

L += ['', '-- ===== 3. 竞赛 =====']
L.append('INSERT INTO competition (id, competition_name, organizer, publisher_id, cover_image, description, rules, registration_start, registration_end, competition_start, competition_end, location, max_members, awards, attachments, status, create_time, update_time) VALUES')
rows = []
for c in NEW_COMPS:
    rows.append(f"({comp_id[c['key']]},'{c['name']}','{c['org']}',{all_teacher_ids[c['pub']]},NULL,'{c['desc']}','赛前培训 + 线上答疑，细则见竞赛群通知。',{d(c['reg'][0])},{d(c['reg'][1])},{d(c['comp'][0])},{d(c['comp'][1])},'{c['loc']}',{c['max']},'{AWARD_STD}',NULL,{c['status']},{d(-c['age'])},NOW())")
L.append(',\n'.join(rows) + ';')

L += ['', '-- ===== 4. 队伍与成员 =====']
L.append('INSERT INTO competition_team (id, competition_id, team_name, leader_id, teacher_id, team_slogan, status, create_time) VALUES')
L.append(',\n'.join(
    f"({t['id']},{t['comp']},'{esc(t['name'])}',{t['leader']},{t['teacher'] or 'NULL'},{('NULL' if not t['slogan'] else chr(39) + esc(t['slogan']) + chr(39))},{t['status']},{d(-t['days'])})"
    for t in teams) + ';')
L.append('INSERT INTO competition_team_member (id, team_id, competition_id, student_id, join_time) VALUES')
L.append(',\n'.join(f"({m[0]},{m[1]},{m[2]},{m[3]},{d(-m[4])})" for m in members) + ';')

L += ['', '-- ===== 5. 招募/求组帖 =====']
L.append('INSERT INTO recruit_post (id, competition_id, user_id, type, title, content, team_id, tags, contact, deadline, status, create_time, update_time) VALUES')
L.append(',\n'.join(
    f"({p['id']},{p['comp']},{p['user']},{p['type']},'{esc(p['title'])}','{esc(p['content'])}',{p['team'] or 'NULL'},'{p['tags']}',"
    f"{('NULL' if not p['contact'] else chr(39) + esc(p['contact']) + chr(39))},{d(p['deadline'])},1,{d(-p['days'])},NOW())"
    for p in posts) + ';')

L += ['', '-- ===== 6. 社区请求 =====']
L.append('INSERT INTO community_request (id, type, post_id, team_id, from_user_id, to_user_id, message, status, create_time, handle_time) VALUES')
L.append(',\n'.join(
    f"({r['id']},{r['type']},{r['post']},{r['team']},{r['frm']},{r['to']},'{esc(r['msg'])}',{r['status']},{d(-r['days'])},"
    f"{('NULL' if r['handle'] is None else d(-r['handle']) + ' + INTERVAL 3 HOUR')})"
    for r in requests) + ';')

L += ['', '-- ===== 7. 成绩 =====']
L.append('INSERT INTO competition_result (id, competition_id, student_id, team_id, score, ranking, award_level, award_name, remark, is_published, publish_time, create_time) VALUES')
L.append(',\n'.join(
    f"({r['id']},{r['comp']},{r['student']},{r['team']},{r['score']},{r['rank']},{r['level']},'{r['aname']}',NULL,{r['published']},"
    f"{('NULL' if not r['published'] else d(-r['pub_days']))},{d(-r['days'])})"
    for r in results) + ';')

L += ['', '-- ===== 8. 通知与公告 =====']
L.append('INSERT INTO sys_notification (id, user_id, type, title, content, ref_type, ref_id, is_read, is_top, create_time) VALUES')
L.append(',\n'.join(
    f"({n['id']},{n['user']},'{n['type']}','{esc(n['title'])}','{esc(n['content'])}',"
    f"{('NULL' if not n['ref_type'] else chr(39) + n['ref_type'] + chr(39))},{n['ref'] or 'NULL'},{n['read']},{n['top']},{d(-n['days'])})"
    for n in notis) + ';')

sql_text = '\n'.join(L) + '\n'
with open(SQL_PATH, 'w', encoding='utf-8') as f:
    f.write(sql_text)
print(f'SQL 已生成: {SQL_PATH} ({len(sql_text)} 字符)')

# ============ 10. 执行 ============
with open(SQL_PATH, 'rb') as fin:
    r = subprocess.run(['docker', 'exec', '-i', 'mysql-scms', 'mysql', '-uroot', '-proot',
                        '--default-character-set=utf8mb4', 'scms'],
                       stdin=fin, capture_output=True, text=True)
if r.returncode != 0:
    print('导入失败:', r.stderr[:1500]); sys.exit(1)
print('导入成功')

# ============ 11. 校验 ============
first = {k: mx[v] + 1 for k, v in [('user', 'sys_user'), ('comp', 'competition'), ('team', 'competition_team'),
                                   ('mem', 'competition_team_member'), ('post', 'recruit_post'),
                                   ('req', 'community_request'), ('res', 'competition_result'),
                                   ('noti', 'sys_notification')]}
checks = [
    ('队长均在队内', f"select count(*) from competition_team t left join competition_team_member m on m.team_id=t.id and m.student_id=t.leader_id where t.id>={first['team']} and m.id is null"),
    ('无超员队伍', f"select count(*) from (select t.id from competition_team t join competition c on t.competition_id=c.id join competition_team_member m on m.team_id=t.id where t.id>={first['team']} group by t.id, c.max_members having count(m.id)>c.max_members) x"),
    ('一人一赛一队', "select count(*) from (select competition_id, student_id from competition_team_member group by competition_id, student_id having count(*)>1) x"),
    ('演示帖一人一赛一帖', "select count(*) from (select user_id, competition_id from recruit_post where status=1 and user_id in (select id from sys_user where username like 'D2025%') group by user_id, competition_id having count(*)>1) x"),
    ('成员竞赛ID与队伍一致', "select count(*) from competition_team_member m join competition_team t on m.team_id=t.id where m.competition_id<>t.competition_id"),
    ('孤儿成员(队伍/竞赛/学生缺失)', "select count(*) from competition_team_member m left join competition_team t on m.team_id=t.id left join competition c on m.competition_id=c.id left join sys_user u on m.student_id=u.id where t.id is null or c.id is null or u.id is null"),
    ('孤儿队伍(竞赛缺失)', "select count(*) from competition_team t left join competition c on t.competition_id=c.id where c.id is null"),
    ('孤儿成绩(学生/队伍/竞赛缺失)', "select count(*) from competition_result r left join sys_user u on r.student_id=u.id left join competition_team t on r.team_id=t.id left join competition c on r.competition_id=c.id where (r.student_id is not null and u.id is null) or (r.team_id is not null and t.id is null) or c.id is null"),
    ('孤儿帖子(竞赛/作者/队伍缺失)', "select count(*) from recruit_post p left join competition c on p.competition_id=c.id left join sys_user u on p.user_id=u.id left join competition_team t on p.team_id=t.id where c.id is null or u.id is null or (p.team_id is not null and t.id is null)"),
    ('孤儿请求(帖子/收发人/队伍缺失)', "select count(*) from community_request q left join recruit_post p on q.post_id=p.id left join sys_user u on q.from_user_id=u.id left join sys_user v on q.to_user_id=v.id left join competition_team t on q.team_id=t.id where (q.post_id is not null and p.id is null) or u.id is null or v.id is null or (q.team_id is not null and t.id is null)"),
    ('孤儿通知(接收人缺失)', "select count(*) from sys_notification n left join sys_user u on n.user_id=u.id where n.user_id<>0 and u.id is null"),
]
fails = 0
for name, sql in checks:
    v = q(sql)
    if v != '0': fails += 1
    print(('  ✓ ' if v == '0' else '  ✗ ') + f'{name} = {v}')

expect = [('本轮用户', 'sys_user', 'user', len(new_students) + len(new_teachers)),
          ('本轮竞赛', 'competition', 'comp', len(NEW_COMPS)),
          ('本轮队伍', 'competition_team', 'team', len(teams)),
          ('本轮成员', 'competition_team_member', 'mem', len(members)),
          ('本轮帖子', 'recruit_post', 'post', len(posts)),
          ('本轮请求', 'community_request', 'req', len(requests)),
          ('本轮成绩', 'competition_result', 'res', len(results)),
          ('本轮通知', 'sys_notification', 'noti', len(notis))]
for label, table, key, n in expect:
    v = q(f"select count(*) from {table} where id >= {first[key]}")
    if v != str(n): fails += 1
    print(('  ✓ ' if v == str(n) else '  ✗ ') + f'{label} {v}/{n}')

# 清理历史 auto_increment 空洞造成的 id 断档不影响使用，仅提示
print(f"\n演示数据: 用户 {len(new_students) + len(new_teachers)} | 竞赛 {len(NEW_COMPS)} | 队伍 {len(teams)} | "
      f"成员 {len(members)} | 帖子 {len(posts)} | 请求 {len(requests)} | 成绩 {len(results)} | 通知公告 {len(notis)}")
print('示例账号: 学生 D2025001 / 教师 TD2025001 / 密码 123456')
if fails:
    print(f'\n✗ 校验未通过 {fails} 项，请检查'); sys.exit(1)
print('✓ 全部校验通过')
