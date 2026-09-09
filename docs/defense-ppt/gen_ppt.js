const pptxgen = require("pptxgenjs");
const fs = require("fs");
const path = require("path");

const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE";
pres.author = "TeamUp 小组";
pres.title = "赛友 TeamUp — 学生竞赛信息管理与组队社区平台";

// ---------- design tokens ----------
const W = 13.33, H = 7.5, M = 0.5;
const INK = "1E1B3A";      // deep indigo navy (dark slides)
const BG = "FFFFFF";
const SURFACE = "F6F7FC";  // light card surface
const TINT = "EEF0FE";     // indigo tint band / accents
const PRIMARY = "4F46E5";
const PRIMARY_DK = "3730A3";
const ACCENT = "F97316";
const TEXT = "1E293B";
const MUTED = "64748B";
const LINE = "E2E8F0";
const ON_DARK = "E0E7FF";
const DIM = "8B93B8";
const FONT = "Microsoft YaHei";

const F = { fontFace: FONT };
const shadow = () => ({ type: "outer", color: "22304A", blur: 9, offset: 3, angle: 90, opacity: 0.14 });
const soft = () => ({ type: "outer", color: "22304A", blur: 5, offset: 2, angle: 90, opacity: 0.10 });
const bullet = () => ({ code: "2022", indent: 12 });

const shotsDir = path.join(__dirname, "shots");

// ---------- helpers ----------
function header(slide, kicker, title, idx, dark) {
  const tCol = dark ? "#FFFFFF" : TEXT, kCol = dark ? ACCENT : ACCENT;
  slide.addText(kicker, { x: M, y: 0.42, w: 9, h: 0.34, ...F, fontSize: 13, bold: true, color: kCol, charSpacing: 2, margin: 0 });
  slide.addText(title, { x: M, y: 0.74, w: 11, h: 0.62, ...F, fontSize: 28, bold: true, color: tCol, margin: 0 });
  if (idx) {
    slide.addText(String(idx).padStart(2, "0"), { x: W - 1.35, y: 0.5, w: 0.9, h: 0.5, ...F, fontSize: 20, bold: true, color: dark ? DIM : LINE, align: "right", margin: 0 });
    slide.addText("/ 19", { x: W - 1.35, y: 0.98, w: 0.9, h: 0.3, ...F, fontSize: 11, color: dark ? DIM : "CBD5E1", align: "right", margin: 0 });
  }
}
function footer(slide, dark) {
  const c = dark ? DIM : "94A3B8";
  slide.addText("赛友 TeamUp · 学生竞赛信息管理与组队社区平台 ——《软件综合实践》课程项目答辩", { x: M, y: 7.12, w: 9.5, h: 0.28, ...F, fontSize: 12, color: c, margin: 0 });
}
function card(slide, x, y, w, h, fill, sh, line) {
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, fill: { color: fill || "FFFFFF" }, rectRadius: 0.06, line: line ? { color: line, width: 1 } : { color: "FFFFFF", transparency: 100 }, shadow: sh ? shadow() : undefined });
}
function chip(slide, x, y, text, w, opts) {
  const o = Object.assign({ x, y, w: w || 1.55, h: 0.34, fill: { color: opts && opts.fill ? opts.fill : "FFFFFF" }, rectRadius: 0.17, line: { color: opts && opts.line ? opts.line : LINE, width: opts && opts.line ? 0.75 : 1 } }, opts ? opts.shapeOpts : {});
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, o);
  slide.addText(text, { x, y: y + 0.005, w: w || 1.55, h: 0.33, ...F, fontSize: 11.5, bold: true, color: opts && opts.color ? opts.color : MUTED, align: "center", valign: "middle", margin: 0 });
  return w || 1.55;
}
function dotRow(slide, x, y, w, num, tip, desc, tCol, numFill, h) {
  // number block + title + desc
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w: 0.46, h: 0.46, fill: { color: numFill || TINT }, rectRadius: 0.12 });
  slide.addText(num, { x, y: y + 0.02, w: 0.46, h: 0.42, ...F, fontSize: 15, bold: true, color: numFill ? "FFFFFF" : PRIMARY, align: "center", valign: "middle", margin: 0 });
  slide.addText(tip, { x: x + 0.62, y: y - 0.03, w: w - 0.62, h: 0.4, ...F, fontSize: 15.5, bold: true, color: tCol || TEXT, margin: 0 });
  if (desc) slide.addText(desc, { x: x + 0.62, y: y + 0.42, w: w - 0.62, h: 0.72, ...F, fontSize: 12.5, color: MUTED, margin: 0 });
  return h || y;
}
function arrowLine(slide, x, y, w, color) {
  slide.addShape(pres.shapes.LINE, { x, y, w, h: 0, line: { color: color || LINE, width: 1.5, endArrowType: "triangle" } });
}
function bigNum(slide, x, y, w, num, label, accent) {
  slide.addText(num, { x, y, w, h: 0.95, ...F, fontSize: 44, bold: true, color: accent ? ACCENT : PRIMARY, margin: 0 });
  slide.addText(label, { x, y: y + 0.98, w, h: 0.4, ...F, fontSize: 13, color: MUTED, margin: 0 });
}

const SHOTS = fs.existsSync(shotsDir) ? fs.readdirSync(shotsDir).filter(f => /\.png$/i.test(f)).sort() : [];
const shot = (n) => SHOTS.find(f => f.startsWith(n));

// ============================================================ 1 · cover
{
  const s = pres.addSlide();
  s.background = { color: INK };
  s.addShape(pres.shapes.OVAL, { x: 10.6, y: -1.9, w: 5.6, h: 5.6, fill: { color: PRIMARY, transparency: 78 }, line: { color: "FFFFFF", transparency: 100 } });
  s.addShape(pres.shapes.OVAL, { x: 11.7, y: -0.8, w: 3.4, h: 3.4, fill: { color: ACCENT, transparency: 74 } });
  s.addShape(pres.shapes.OVAL, { x: -2.4, y: 5.3, w: 4.6, h: 4.6, fill: { color: PRIMARY, transparency: 84 } });
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: M, y: 1.05, w: 2.35, h: 0.5, fill: { color: "FFFFFF", transparency: 88 }, rectRadius: 0.25, line: { color: "A5B4FC", width: 1 } });
  s.addText("《软件综合实践》课程项目答辩", { x: M - 0.3, y: 1.06, w: 9, h: 0.48, ...F, fontSize: 13, bold: true, color: "A5B4FC", margin: 0 });
  s.addText("赛友 TeamUp", { x: M, y: 1.95, w: 10, h: 1.15, ...F, fontSize: 58, bold: true, color: "FFFFFF", margin: 0 });
  s.addText("学生竞赛信息管理与组队社区平台", { x: M, y: 3.12, w: 10, h: 0.6, ...F, fontSize: 22, color: ON_DARK, margin: 0 });
  s.addText("竞赛发布 · 智能组队 · 报名审核 · 成绩管理 · 消息通知 —— 覆盖竞赛组织全流程", { x: M, y: 3.85, w: 11, h: 0.44, ...F, fontSize: 14, color: "94A3B8", margin: 0 });
  const stack = ["React 19", "TypeScript", "Spring Boot 3.2", "MySQL 8", "JWT 鉴权", "Docker"];
  let cx = M;
  stack.forEach(t => {
    const w = 1.0 + t.length * 0.082;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: cx, y: 4.62, w, h: 0.46, fill: { color: "FFFFFF", transparency: 90 }, rectRadius: 0.23, line: { color: "3E4A6B", width: 1 } });
    s.addText(t, { x: cx, y: 4.63, w, h: 0.44, ...F, fontSize: 12, bold: true, color: "C7D2FE", align: "center", valign: "middle", margin: 0 });
    cx += w + 0.18;
  });
  s.addText("第 ＿ 组    组长：＿＿＿＿＿    组员：＿＿＿＿＿＿＿＿＿＿＿＿", { x: M, y: 6.35, w: 11, h: 0.4, ...F, fontSize: 13, color: DIM, margin: 0 });
  s.addText("2026 年 9 月 · 指导老师：＿＿＿＿＿＿", { x: M, y: 6.72, w: 11, h: 0.4, ...F, fontSize: 13, color: DIM, margin: 0 });
}

// ============================================================ 2 · outline
{
  const s = pres.addSlide();
  s.background = { color: BG };
  header(s, "OUTLINE · 汇报大纲", "六大板块，对应考核体系三项指标", 2);
  const items = [
    ["01", "项目背景与需求调研", "痛点分析 · 问卷访谈 · 竞品与文献调研"],
    ["02", "需求分析与系统设计", "三角色用例 · 分层架构 · 8 表数据模型"],
    ["03", "核心功能实现", "竞赛全生命周期 · 组队社区 · 报名成绩"],
    ["04", "界面设计与创新点", "Liquid Glass 设计语言 · 四大亮点"],
    ["05", "系统测试", "全链路冒烟回归 · 9 步业务闭环"],
    ["06", "团队合作与项目管理", "分工协作 · 进度管控 · 总结展望"],
  ];
  items.forEach((it, i) => {
    const y = 1.45 + i * 0.9;
    s.addText(it[0], { x: M, y, w: 1.2, h: 0.6, ...F, fontSize: 22, bold: true, color: PRIMARY, margin: 0 });
    s.addText(it[1], { x: M + 1.25, y: y - 0.04, w: 5.4, h: 0.5, ...F, fontSize: 17.5, bold: true, color: TEXT, margin: 0 });
    s.addText(it[2], { x: M + 1.25, y: y + 0.46, w: 6.2, h: 0.38, ...F, fontSize: 12.5, color: MUTED, margin: 0 });
    if (i < items.length - 1) s.addShape(pres.shapes.LINE, { x: M + 1.25, y: y + 0.88, w: 6.1, h: 0, line: { color: LINE, width: 0.75 } });
  });
  const dims = [
    ["50%", "分析研究", "需求调研 · 方案设计\n功能实现 · 界面质量"],
    ["34%", "团队合作", "有效沟通 · 分享协作\n协调整合"],
    ["16%", "项目管理", "计划管控 · 进度掌控\n效益与影响分析"],
  ];
  dims.forEach((d, i) => {
    const y = 1.5 + i * 1.78;
    card(s, 8.35, y, 4.48, 1.62, SURFACE, true);
    s.addText(d[0], { x: 8.55, y: y + 0.08, w: 1.5, h: 0.9, ...F, fontSize: 34, bold: true, color: i === 0 ? ACCENT : PRIMARY, margin: 0 });
    s.addText(d[1], { x: 8.55, y: y + 0.95, w: 1.5, h: 0.55, ...F, fontSize: 15, bold: true, color: TEXT, margin: 0 });
    s.addText(d[2], { x: 10.15, y: y + 0.2, w: 2.55, h: 1.25, ...F, fontSize: 12.5, color: MUTED, valign: "middle", margin: 0 });
  });
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 8.35, y: 6.66, w: 4.48, h: 0.42, fill: { color: TINT }, rectRadius: 0.21 });
  s.addText("讲解内容与考核指标逐项对应", { x: 8.35, y: 6.67, w: 4.48, h: 0.4, ...F, fontSize: 12.5, bold: true, color: PRIMARY_DK, align: "center", valign: "middle", margin: 0 });
}

// ============================================================ 3 · background & research
{
  const s = pres.addSlide();
  s.background = { color: BG };
  header(s, "01 · 研究能力 —— 需求调研", "项目背景：竞赛组织为什么需要一个新系统", 3);
  s.addText("高校竞赛组织现状的四类痛点", { x: M, y: 1.5, w: 6.5, h: 0.44, ...F, fontSize: 16, bold: true, color: TEXT, margin: 0 });
  const pains = [
    ["信息分散", "竞赛通知散落在 QQ 群、官网、海报，易错过报名窗口"],
    ["组队困难", "跨专业、跨年级找队友靠人脉转发，技能匹配度低"],
    ["流程混乱", "纸质 / 微信群报名，审核无留痕，名单靠人工统计"],
    ["数据缺失", "获奖成绩无统一归档，学院难以汇总竞赛成果"],
  ];
  pains.forEach((p, i) => {
    const y = 2.06 + i * 0.88;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: M, y, w: 6.42, h: 0.78, fill: { color: SURFACE }, rectRadius: 0.1 });
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: M + 0.18, y: y + 0.19, w: 0.4, h: 0.4, fill: { color: i % 2 ? ACCENT : PRIMARY }, rectRadius: 0.1 });
    s.addText(String(i + 1), { x: M + 0.18, y: y + 0.2, w: 0.4, h: 0.38, ...F, fontSize: 14, bold: true, color: "FFFFFF", align: "center", valign: "middle", margin: 0 });
    s.addText(p[0], { x: M + 0.72, y: y + 0.12, w: 1.5, h: 0.36, ...F, fontSize: 14, bold: true, color: TEXT, margin: 0 });
    s.addText(p[1], { x: M + 2.25, y: y + 0.14, w: 4.1, h: 0.55, ...F, fontSize: 12, color: MUTED, margin: 0 });
  });
  s.addText("调研方法", { x: 7.15, y: 1.5, w: 5.7, h: 0.44, ...F, fontSize: 16, bold: true, color: TEXT, margin: 0 });
  card(s, 7.15, 2.06, 5.68, 3.7, SURFACE, true);
  const methods = [
    ["问卷与访谈", "面向同学与指导老师发放问卷、开展访谈，收集报名与组队环节的真实痛点"],
    ["竞品分析", "调研“到梦空间”、各竞赛官网报名系统与校园 QQ 群组队模式，分析优劣"],
    ["文献调研", "查阅需求分析与管理信息系统设计相关文献与工程实践，确定技术路线"],
  ];
  methods.forEach((m, i) => {
    const y = 2.3 + i * 1.13;
    s.addText(m[0], { x: 7.4, y, w: 5.25, h: 0.4, ...F, fontSize: 14.5, bold: true, color: PRIMARY_DK, margin: 0 });
    s.addText(m[1], { x: 7.4, y: y + 0.4, w: 5.25, h: 0.68, ...F, fontSize: 12, color: MUTED, margin: 0 });
    if (i < 2) s.addShape(pres.shapes.LINE, { x: 7.4, y: y + 1.06, w: 5.2, h: 0, line: { color: LINE, width: 0.75 } });
  });
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: M, y: 5.6, w: 12.33, h: 1.0, fill: { color: TINT }, rectRadius: 0.07 });
  s.addText("识别的复杂工程问题", { x: M + 0.25, y: 5.72, w: 2.3, h: 0.38, ...F, fontSize: 14.5, bold: true, color: PRIMARY_DK, margin: 0 });
  s.addText("多角色权限下业务状态机的一致性管理  ·  组队匹配的交互与数据设计  ·  数据结构精简与可扩展性的平衡", { x: M + 0.25, y: 6.12, w: 11.9, h: 0.38, ...F, fontSize: 13, bold: true, color: PRIMARY, margin: 0 });
}

// ============================================================ 4 · requirements & roles
{
  const s = pres.addSlide();
  s.background = { color: BG };
  header(s, "02 · 需求分析", "三种角色 · 六类业务模块", 4);
  const roles = [
    ["管理员", PRIMARY_DK, ["用户管理：启停、重置密码、批量操作", "竞赛审核发布与全局报名监管", "数据统计看板与公告发布", "全院竞赛数据资产沉淀"]],
    ["教师", PRIMARY, ["创建 / 编辑 / 发布竞赛", "团队组建审核与指导分配", "成绩录入、排名与奖项发布", "查看名下竞赛与参赛情况"]],
    ["学生", ACCENT, ["竞赛浏览 · 关键词搜索", "组队报名与招募广场", "互看 / 入队申请 · 消息通知", "成绩、参赛历史与个人中心"]],
  ];
  roles.forEach((r, i) => {
    const x = M + i * 4.28;
    card(s, x, 1.5, 4.0, 4.55, SURFACE, true);
    s.addShape(pres.shapes.OVAL, { x: x + 0.28, y: 1.78, w: 0.34, h: 0.34, fill: { color: r[1] } });
    s.addText(r[0], { x: x + 0.72, y: 1.72, w: 3.0, h: 0.46, ...F, fontSize: 19, bold: true, color: r[1], margin: 0 });
    r[2].forEach((f, j) => {
      const y = 2.44 + j * 0.88;
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: x + 0.3, y: y + 0.09, w: 0.2, h: 0.2, fill: { color: r[1] }, rectRadius: 0.05 });
      s.addText(f, { x: x + 0.62, y, w: 3.2, h: 0.8, ...F, fontSize: 12, color: TEXT, margin: 0 });
    });
  });
  s.addShape(PRIMARY ? pres.shapes.ROUNDED_RECTANGLE : pres.shapes.RECTANGLE, { x: M, y: 6.22, w: 12.33, h: 0.62, fill: { color: INK }, rectRadius: 0.07 });
  s.addText("非功能需求：JWT 无状态鉴权 + 三角色权限控制  ·  角色路由守卫  ·  统一响应体与全局异常处理  ·  状态自动推进与级联一致", { x: M + 0.25, y: 6.28, w: 11.9, h: 0.5, ...F, fontSize: 12.5, color: "C7D2FE", margin: 0 });
}

// ============================================================ 5 · architecture
{
  const s = pres.addSlide();
  s.background = { color: BG };
  header(s, "02 · 系统设计", "前后端分离的分层系统架构", 5);
  const layers = [
    ["前端展示层", "React 19 SPA", "Tailwind 4 · Zustand 5 · React Router 7 · Motion 动画", PRIMARY],
    ["业务服务层", "Spring Boot 3.2.5", "Controller × 13 · Service × 12 · Spring Security + JWT · EasyExcel", PRIMARY],
    ["数据持久层", "MySQL 8（Docker）", "8 张核心表 · JSON 灵活字段 · 事务与索引", PRIMARY_DK],
  ];
  const gap = [
    ["Axios（JWT 拦截器）", "REST / JSON"],
    ["MyBatis-Plus 3.5.6", "ORM · 自动映射"],
  ];
  layers.forEach((l, i) => {
    const y = 1.55 + i * 1.58;
    card(s, M, y, 8.3, 1.18, SURFACE, false, LINE);
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: M + 0.2, y: y + 0.22, w: 1.85, h: 0.74, fill: { color: l[3] }, rectRadius: 0.1 });
    s.addText(l[0], { x: M + 0.2, y: y + 0.23, w: 1.85, h: 0.72, ...F, fontSize: 13.5, bold: true, color: "FFFFFF", align: "center", valign: "middle", margin: 0 });
    s.addText(l[1], { x: M + 2.25, y: y + 0.14, w: 5.9, h: 0.4, ...F, fontSize: 15.5, bold: true, color: TEXT, margin: 0 });
    s.addText(l[2], { x: M + 2.25, y: y + 0.58, w: 5.9, h: 0.42, ...F, fontSize: 11.5, color: MUTED, margin: 0 });
    if (i < 2) {
      const gy = y + 1.22;
      s.addShape(pres.shapes.LINE, { x: M + 3.6, y: gy, w: 1.1, h: 0, line: { color: PRIMARY, width: 1.75, endArrowType: "triangle" } });
      s.addText(gap[i][0], { x: M + 4.8, y: gy - 0.2, w: 3.4, h: 0.4, ...F, fontSize: 12, bold: true, color: PRIMARY, margin: 0 });
      s.addText(gap[i][1], { x: M + 4.8, y: gy + 0.2, w: 3.4, h: 0.32, ...F, fontSize: 11, color: MUTED, margin: 0 });
    }
  });
  card(s, 9.2, 1.55, 3.63, 4.7, TINT, true);
  s.addText("工程化配套", { x: 9.45, y: 1.78, w: 3.2, h: 0.42, ...F, fontSize: 15.5, bold: true, color: PRIMARY_DK, margin: 0 });
  const extras = [
    ["Vite 代理", "一键转发 /api，免跨域配置"],
    ["Swagger OpenAPI", "79 个端点在线文档与调试"],
    ["统一 Result 封装", "{code, message, data} 契约"],
    ["全局异常处理", "400 / 403 / 500 状态码语义化"],
    ["文件上传服务", "封面 / 附件 / 报名材料"],
  ];
  extras.forEach((e, i) => {
    const y = 2.32 + i * 0.78;
    s.addText(e[0], { x: 9.45, y, w: 3.15, h: 0.34, ...F, fontSize: 13.5, bold: true, color: TEXT, margin: 0 });
    s.addText(e[1], { x: 9.45, y: y + 0.34, w: 3.15, h: 0.36, ...F, fontSize: 11.5, color: MUTED, margin: 0 });
  });
}

// ============================================================ 6 · tech stack
{
  const s = pres.addSlide();
  s.background = { color: BG };
  header(s, "02 · 技术选型", "技术栈与选型理由", 6);
  const rows = [
    ["前端框架", "React 19 + TypeScript", "生态成熟 · 类型安全 · Hooks 组件化"],
    ["UI / 样式", "Tailwind CSS 4 + Motion", "原子化样式，快速实现玻璃拟态与动效"],
    ["后端框架", "Spring Boot 3.2.5（Java 17）", "LTS 支持 · REST 生态完善 · 事务与安全开箱即用"],
    ["ORM", "MyBatis-Plus 3.5.6", "CRUD 零 SQL，复杂查询仍可手写控制"],
    ["数据库", "MySQL 8（Docker）", "JSON 字段支持灵活结构 · 容器化一键部署"],
    ["认证安全", "JWT + Spring Security", "无状态鉴权 · 三角色权限矩阵"],
  ];
  const data = [[{ text: "层级", options: { fill: { color: PRIMARY }, color: "FFFFFF", bold: true, align: "center" } }, { text: "技术", options: { fill: { color: PRIMARY }, color: "FFFFFF", bold: true, align: "center" } }, { text: "选型理由", options: { fill: { color: PRIMARY }, color: "FFFFFF", bold: true, align: "center" } }]];
  rows.forEach(r => data.push([{ text: r[0], options: { bold: true, color: TEXT } }, r[1], r[2]]));
  s.addTable(data, {
    x: M, y: 1.5, w: 12.33, h: 4.15, colW: [2.2, 4.65, 5.48],
    fontFace: FONT, fontSize: 12.5,
    border: { pt: 0.75, color: LINE },
    fill: { color: "FFFFFF" },
    rowH: [0.6, 0.71, 0.71, 0.71, 0.71, 0.71, 0.71],
    valign: "middle", margin: 0.08,
  });
  s.addText("开发工具链", { x: M, y: 5.85, w: 1.5, h: 0.4, ...F, fontSize: 14.5, bold: true, color: TEXT, margin: 0 });
  const tools = ["VS Code", "IntelliJ IDEA", "Maven", "Docker Desktop", "Git", "Swagger", "Chrome DevTools"];
  let cx = M + 1.55;
  tools.forEach(t => {
    const w = 0.7 + t.length * 0.075;
    chip(s, cx, 5.87, t, w, { color: PRIMARY_DK, fill: TINT, line: "D6D9F7", shapeOpts: {} });
    cx += w + 0.12;
  });
  s.addText("开发工具与语言即可作为答辩问题 1 的直接答案", { x: M, y: 6.5, w: 11, h: 0.36, ...F, fontSize: 12, italic: true, color: MUTED, margin: 0 });
}

// ============================================================ 7 · database
{
  const s = pres.addSlide();
  s.background = { color: BG };
  header(s, "02 · 数据库设计", "8 表数据模型：从 15 张精简而来", 7);
  const nodes = [
    ["competition", "竞赛信息", 0.75, 1.7], ["recruit_post", "招募帖子", 3.35, 1.7], ["sys_notification", "系统消息", 5.95, 1.7],
    ["team_member", "团队成员", 0.95, 3.55], ["community_request", "互动请求", 5.15, 3.55],
    ["competition_team", "竞赛团队", 0.75, 5.3], ["competition_result", "竞赛成绩", 3.95, 5.3],
  ];
  // center user node
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 3.1, y: 3.0, w: 2.0, h: 1.0, fill: { color: PRIMARY }, rectRadius: 0.09, shadow: shadow() });
  s.addText("sys_user", { x: 3.1, y: 3.12, w: 2.0, h: 0.4, ...F, fontSize: 15, bold: true, color: "FFFFFF", align: "center", margin: 0 });
  s.addText("用户 / 三角色", { x: 3.1, y: 3.5, w: 2.0, h: 0.4, ...F, fontSize: 11.5, color: "C7D2FE", align: "center", margin: 0 });
  nodes.forEach(n => {
    const [t, c, x, y] = n;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w: 2.15, h: 0.8, fill: { color: TINT }, rectRadius: 0.09, line: { color: "C7CBF5", width: 0.75 } });
    s.addText(t, { x, y: y + 0.08, w: 2.15, h: 0.34, ...F, fontSize: 12.5, bold: true, color: PRIMARY_DK, align: "center", margin: 0 });
    s.addText(c, { x, y: y + 0.42, w: 2.15, h: 0.3, ...F, fontSize: 11, color: MUTED, align: "center", margin: 0 });
  });
  // connectors from user center to each node edge
  const links = [
    [2.9, 2.5], [4.5, 2.5], [6.9, 2.5],   // top row
    [3.1, 3.9], [5.45, 3.9],              // middle row
    [2.9, 5.3], [4.9, 5.3],               // bottom row
  ];
  links.forEach(([ex, ey]) => {
    const sx = 3.6, sy = ey < 3.5 ? 3.05 : 4.0;
    s.addShape(pres.shapes.LINE, { x: sx, y: sy, w: ex - sx, h: ey - sy, line: { color: "A5B4FC", width: 1 } });
  });
  s.addText("1 : N 关系 · sys_user 为三角色主表", { x: M, y: 6.42, w: 7.5, h: 0.32, ...F, fontSize: 12, color: MUTED, margin: 0 });
  // right side: design highlights
  card(s, 8.5, 1.55, 4.33, 5.15, SURFACE, true);
  s.addText("设计亮点", { x: 8.75, y: 1.8, w: 3.8, h: 0.42, ...F, fontSize: 15.5, bold: true, color: PRIMARY_DK, margin: 0 });
  s.addText("15", { x: 8.75, y: 2.35, w: 1.3, h: 0.9, ...F, fontSize: 42, bold: true, color: ACCENT, margin: 0 });
  s.addText("→ 8 表", { x: 10.25, y: 2.5, w: 1.7, h: 0.7, ...F, fontSize: 26, bold: true, color: TEXT, margin: 0 });
  s.addText("Lean 精简：三张社区化迭代中合并冗余表，结构更清晰", { x: 8.75, y: 3.28, w: 3.85, h: 0.62, ...F, fontSize: 12, color: MUTED, margin: 0 });
  const hl = [
    ["JSON 灵活字段", "awards 奖项 / attachments 附件自描述"],
    ["命名统一", "snake_case ↔ camelCase 自动映射"],
    ["逻辑外键", "不加物理外键，便于 Lean 重构演进"],
    ["索引覆盖查询", "状态、发布人、报名人高频索引"],
  ];
  hl.forEach((h, i) => {
    const y = 4.05 + i * 0.66;
    s.addText(h[0], { x: 8.75, y, w: 3.9, h: 0.32, ...F, fontSize: 13, bold: true, color: TEXT, margin: 0 });
    s.addText(h[1], { x: 8.75, y: y + 0.3, w: 3.9, h: 0.3, ...F, fontSize: 11.5, color: MUTED, margin: 0 });
  });
  s.addText("来源：backend/sql/init.sql · docs/ER-DIAGRAM.md", { x: M, y: 6.72, w: 7, h: 0.3, ...F, fontSize: 12, color: "94A3B8", margin: 0 });
}

// ============================================================ 8 · competition lifecycle
{
  const s = pres.addSlide();
  s.background = { color: BG };
  header(s, "03 · 核心功能（一）", "竞赛全生命周期状态机", 8);
  const states = ["草稿", "待审核", "已发布", "进行中", "已结束"];
  const stW = 2.14, gap = 0.24;
  states.forEach((st, i) => {
    const x = M + i * (stW + gap);
    const c = i === 4 ? PRIMARY_DK : (i === 3 ? PRIMARY : (i % 2 ? "6D6AD9" : "9AA0F0"));
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: 1.85, w: stW, h: 1.0, fill: { color: c }, rectRadius: 0.1 });
    s.addText(st, { x, y: 1.86, w: stW, h: 0.98, ...F, fontSize: 20, bold: true, color: "FFFFFF", align: "center", valign: "middle", margin: 0 });
    if (i < 4) arrowLine(s, x + stW + 0.015, 2.32, gap - 0.03, "8BA0F0");
  });
  // rejected branch
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: M + 2.38, y: 3.35, w: 1.6, h: 0.78, fill: { color: "FEE2E2" }, rectRadius: 0.1, line: { color: "FCA5A5", width: 1 } });
  s.addText("已驳回", { x: M + 2.38, y: 3.36, w: 1.6, h: 0.76, ...F, fontSize: 16, bold: true, color: "DC2626", align: "center", valign: "middle", margin: 0 });
  s.addShape(pres.shapes.LINE, { x: M + 2.6, y: 3.32, w: 0, h: -0.48, line: { color: "F87171", width: 1.5, endArrowType: "triangle" } });
  s.addShape(pres.shapes.LINE, { x: M + 2.9, y: 3.32, w: 0, h: -0.5, line: { color: "F87171", width: 1.5 } });
  s.addShape(pres.shapes.LINE, { x: M + 2.9, y: 2.82, w: -0.3, h: 0, line: { color: "F87171", width: 1.5, endArrowType: "triangle" } });
  s.addText("审核不通过 → 退回草稿，可修改后重新提交", { x: M + 4.3, y: 3.4, w: 7.5, h: 0.4, ...F, fontSize: 13, color: MUTED, margin: 0 });
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: M, y: 4.6, w: 12.33, h: 1.05, fill: { color: TINT }, rectRadius: 0.07 });
  s.addText("状态自动推进", { x: M + 0.25, y: 4.75, w: 1.8, h: 0.4, ...F, fontSize: 14.5, bold: true, color: PRIMARY_DK, margin: 0 });
  s.addText("定时任务按报名截止 / 比赛时间自动流转：到点即从未发布 → 进行中 → 已结束，无需人工干预", { x: M + 0.25, y: 5.16, w: 11.8, h: 0.4, ...F, fontSize: 13, bold: true, color: PRIMARY, margin: 0 });
  s.addText("状态即权限：草稿仅发布人可见 · 待审核由管理员审 · 已发布对全校开放报名 · 已结束锁定并归档成绩", { x: M, y: 6.05, w: 12.3, h: 0.4, ...F, fontSize: 13.5, color: TEXT, margin: 0 });
  s.addText("5 个主状态 + 驳回分支，覆盖竞赛从发布到归档的完整生命周期", { x: M, y: 6.5, w: 12.3, h: 0.36, ...F, fontSize: 12, italic: true, color: MUTED, margin: 0 });
}

// ============================================================ 9 · team-up community
{
  const s = pres.addSlide();
  s.background = { color: BG };
  header(s, "03 · 核心功能（二）", "组队社区 TeamUp：从“报名”到“组队”", 9);
  const steps = [
    ["发布招募/求组", "带技能标签与截止时间，招募帖可自动建队"],
    ["广场浏览·搜索", "按方向标签、关键词筛选全局招募帖"],
    ["互看认识", "浏览对方主页，技能标签与经历"],
    ["申请/邀请", "队长处理入队申请，也可主动邀请"],
    ["成团", "队伍满员提交审核，关联竞赛报名"],
  ];
  steps.forEach((st, i) => {
    const x = M + i * 2.56;
    card(s, x, 1.62, 2.32, 1.72, SURFACE, true);
    s.addText(String(i + 1), { x: x + 0.18, y: 1.78, w: 0.6, h: 0.5, ...F, fontSize: 24, bold: true, color: i === 4 ? ACCENT : PRIMARY, margin: 0 });
    s.addText(st[0], { x: x + 0.84, y: 1.82, w: 1.42, h: 0.42, ...F, fontSize: 13, bold: true, color: TEXT, margin: 0 });
    s.addText(st[1], { x: x + 0.18, y: 2.42, w: 2.0, h: 0.82, ...F, fontSize: 11, color: MUTED, margin: 0 });
    if (i < 4) arrowLine(s, x + 2.34, 2.42, 0.2, "A5B4FC");
  });
  card(s, M, 3.72, 12.33, 2.8, BG, false, LINE);
  s.addText("设计要点", { x: M + 0.3, y: 3.95, w: 2, h: 0.4, ...F, fontSize: 15, bold: true, color: PRIMARY_DK, margin: 0 });
  const feats = [
    ["帖子即队伍", "招募帖直接建队，帖子与队伍一体化"],
    ["双向互动", "互看、入队申请/邀请三类请求统一流转"],
    ["队伍详情页", "成员、口号、状态、一键跳转，信息透明"],
    ["状态通知", "申请同意/拒绝，消息中心即时通知"],
    ["审核闭环", "教师审核队伍，意见级联到每名成员"],
  ];
  feats.forEach((f, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = M + 0.3 + col * 6.1, y = 4.45 + row * 0.78;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: y + 0.07, w: 0.24, h: 0.24, fill: { color: ACCENT }, rectRadius: 0.06 });
    s.addText(f[0], { x: x + 0.38, y: y + 0.01, w: 2.0, h: 0.34, ...F, fontSize: 13, bold: true, color: TEXT, margin: 0 });
    s.addText(f[1], { x: x + 2.4, y: y + 0.02, w: 3.6, h: 0.32, ...F, fontSize: 11.5, color: MUTED, margin: 0 });
  });
  s.addText("对照答辩问题 4：组队社区是本系统“校园特色”与差异化亮点", { x: M, y: 6.68, w: 11.5, h: 0.34, ...F, fontSize: 12, italic: true, color: MUTED, margin: 0 });
}

// ============================================================ 10 · registration & result
{
  const s = pres.addSlide();
  s.background = { color: BG };
  header(s, "03 · 核心功能（三）", "报名审核与成绩管理", 10);
  card(s, M, 1.55, 6.0, 3.15, SURFACE, true);
  s.addText("报名审核流", { x: M + 0.3, y: 1.78, w: 5.4, h: 0.42, ...F, fontSize: 16, bold: true, color: PRIMARY_DK, margin: 0 });
  const reg = [
    ["提交报名", "个人或随团队报名，上传附件与备注"],
    ["教师审核", "通过 / 拒绝并填写审核备注"],
    ["留痕归档", "审核时间与意见写入记录，可追溯"],
    ["状态通知", "学生端实时可见结果"],
  ];
  reg.forEach((r, i) => {
    const y = 2.36 + i * 0.56;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: M + 0.3, y: y + 0.1, w: 0.22, h: 0.22, fill: { color: PRIMARY }, rectRadius: 0.05 });
    s.addText(r[0], { x: M + 0.66, y, w: 1.6, h: 0.4, ...F, fontSize: 13, bold: true, color: TEXT, margin: 0 });
    s.addText(r[1], { x: M + 2.25, y, w: 4.0, h: 0.4, ...F, fontSize: 12, color: MUTED, margin: 0 });
  });
  card(s, 6.83, 1.55, 6.0, 3.15, SURFACE, true);
  s.addText("成绩管理流", { x: 7.13, y: 1.78, w: 5.4, h: 0.42, ...F, fontSize: 16, bold: true, color: PRIMARY_DK, margin: 0 });
  const res = [
    ["录入成绩", "分数 · 排名 · 奖项等级（支持自定义奖项）"],
    ["发布", "教师确认后发布，学生端可见"],
    ["历史归档", "沉淀为参赛历史，可长期查询"],
    ["数据复用", "导出成绩单 / 同步统计数据"],
  ];
  res.forEach((r, i) => {
    const y = 2.36 + i * 0.56;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 7.13, y: y + 0.1, w: 0.22, h: 0.22, fill: { color: ACCENT }, rectRadius: 0.05 });
    s.addText(r[0], { x: 7.49, y, w: 1.6, h: 0.4, ...F, fontSize: 13, bold: true, color: TEXT, margin: 0 });
    s.addText(r[1], { x: 9.08, y, w: 3.6, h: 0.4, ...F, fontSize: 12, color: MUTED, margin: 0 });
  });
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: M, y: 4.95, w: 12.33, h: 1.62, fill: { color: TINT }, rectRadius: 0.07 });
  s.addText("查找与模糊搜索 + 一键导出", { x: M + 0.28, y: 5.12, w: 4.2, h: 0.4, ...F, fontSize: 14.5, bold: true, color: PRIMARY_DK, margin: 0 });
  s.addText("关键词 LIKE 模糊查询：竞赛名称 · 主办单位 · 用户姓名 · 招募帖标题 · 获奖信息，列表均支持分页与搜索", { x: M + 0.28, y: 5.54, w: 11.8, h: 0.4, ...F, fontSize: 13, color: TEXT, margin: 0 });
  s.addText("EasyExcel 导出报名名单与成绩单，替代人工统计表格", { x: M + 0.28, y: 5.98, w: 11.8, h: 0.4, ...F, fontSize: 13, color: TEXT, margin: 0 });
  s.addText("可直接回答：答辩问题 6 / 7（查找与模糊搜索字段）", { x: M, y: 6.78, w: 11.5, h: 0.35, ...F, fontSize: 12, italic: true, color: MUTED, margin: 0 });
}

// ============================================================ 11 · message center
{
  const s = pres.addSlide();
  s.background = { color: BG };
  header(s, "03 · 核心功能（四）", "消息中心：三类消息 · 全站跳转", 11);
  const types = [
    ["公告 announcement", "管理员向全员发布通知、报名提醒", PRIMARY],
    ["互动 interaction", "互看、入队申请 / 邀请、审核结果", ACCENT],
    ["系统 system", "状态变更、成绩发布等系统提示", "6D6AD9"],
  ];
  types.forEach((t, i) => {
    const x = M + i * 4.28;
    card(s, x, 1.55, 4.0, 2.6, SURFACE, true);
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: x + 0.26, y: 1.8, w: 0.32, h: 0.32, fill: { color: t[2] }, rectRadius: 0.08 });
    s.addText(t[0], { x: x + 0.66, y: 1.78, w: 3.3, h: 0.4, ...F, fontSize: 15, bold: true, color: t[2], margin: 0 });
    s.addText(t[1], { x: x + 0.26, y: 2.35, w: 3.5, h: 0.9, ...F, fontSize: 12.5, color: MUTED, margin: 0 });
    s.addText(i === 1 ? "最多交互 · 即答即达" : i === 0 ? "全员触达覆盖" : "流程联动", { x: x + 0.26, y: 3.42, w: 3.5, h: 0.4, ...F, fontSize: 12.5, bold: true, color: t[2], margin: 0 });
  });
  s.addText("消息触达能力", { x: M, y: 4.45, w: 6, h: 0.42, ...F, fontSize: 16, bold: true, color: TEXT, margin: 0 });
  const caps = [
    ["未读角标", "导航栏实时未读数", "一键已读", "批量标记，红点清零"],
    ["置顶公告", "重要通知置顶展示", "全站跳转", "点击直达对应业务页面"],
  ];
  caps.forEach((row, r) => row.forEach((c, i) => {
    if (i % 2) return;
    const x = M + (i / 2) * 4.28, y = 4.95 + r * 0.78;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: y + 0.06, w: 0.26, h: 0.26, fill: { color: PRIMARY }, rectRadius: 0.06 });
    s.addText(c, { x: x + 0.4, y: y - 0.02, w: 1.7, h: 0.42, ...F, fontSize: 13.5, bold: true, color: TEXT, margin: 0 });
    const d = caps[r][i + 1];
    s.addText(d, { x: x + 2.1, y: y, w: 2.1, h: 0.42, ...F, fontSize: 12, color: MUTED, margin: 0 });
  }));
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: M, y: 6.55, w: 12.33, h: 0.5, fill: { color: INK }, rectRadius: 0.07 });
  s.addText("消息带引用（ref_type + ref_id），点击可直接跳转到对应业务页面 —— 信息闭环", { x: M + 0.25, y: 6.56, w: 11.9, h: 0.48, ...F, fontSize: 13, bold: true, color: "C7D2FE", align: "center", valign: "middle", margin: 0 });
}

// ============================================================ 12 · UI design (+ screenshots)
{
  const s = pres.addSlide();
  s.background = { color: BG };
  header(s, "04 · 界面设计", "Liquid Glass 设计语言 · 组件化工程", 12);
  const hasImg = shot("01") && shot("02");
  if (hasImg) {
    const imgs = [shot("01"), shot("02")];
    imgs.forEach((f, i) => {
      const x = M + i * 3.32, y = 1.55;
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: x - 0.06, y: y - 0.06, w: 3.3, h: 2.15, fill: { color: "FFFFFF" }, rectRadius: 0.08, shadow: shadow(), line: { color: LINE, width: 1 } });
      s.addImage({ path: path.join(shotsDir, f), x, y, w: 3.18, h: 2.03, sizing: { type: "cover", w: 3.18, h: 2.03 } });
    });
    s.addText("真实界面：登录页 / 学生竞赛列表", { x: M, y: 3.72, w: 6.6, h: 0.36, ...F, fontSize: 12, color: MUTED, margin: 0 });
    const im2 = [shot("03"), shot("04")];
    im2.forEach((f, i) => {
      if (!f) return;
      const x = M + i * 3.32, y = 4.25;
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: x - 0.06, y: y - 0.06, w: 3.3, h: 2.1, fill: { color: "FFFFFF" }, rectRadius: 0.08, shadow: shadow(), line: { color: LINE, width: 1 } });
      s.addImage({ path: path.join(shotsDir, f), x, y, w: 3.18, h: 1.98, sizing: { type: "cover", w: 3.18, h: 1.98 } });
    });
    s.addText("招募广场 / 管理员数据统计", { x: M, y: 6.38, w: 6.6, h: 0.36, ...F, fontSize: 12, color: MUTED, margin: 0 });
  } else {
    // design token showcase fallback
    card(s, M, 1.55, 6.2, 5.0, SURFACE, true);
    s.addText("设计语言", { x: M + 0.3, y: 1.78, w: 5.6, h: 0.42, ...F, fontSize: 16, bold: true, color: PRIMARY_DK, margin: 0 });
    const toks = [
      ["毛玻璃质感", "半透明卡片 + 柔和阴影，层次分明"],
      ["统一动效", "Motion 驱动页面过渡与悬浮反馈"],
      ["状态徽章体系", "竞赛 / 报名 / 团队状态颜色语义一致"],
      ["空状态与骨架屏", "加载、无数据均有规范呈现"],
    ];
    toks.forEach((t, i) => {
      const y = 2.4 + i * 0.98;
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: M + 0.3, y: y + 0.05, w: 0.28, h: 0.28, fill: { color: PRIMARY }, rectRadius: 0.07 });
      s.addText(t[0], { x: M + 0.72, y: y - 0.03, w: 5.2, h: 0.4, ...F, fontSize: 14, bold: true, color: TEXT, margin: 0 });
      s.addText(t[1], { x: M + 0.72, y: y + 0.38, w: 5.2, h: 0.4, ...F, fontSize: 12, color: MUTED, margin: 0 });
    });
  }
  card(s, 7.15, 1.55, 5.68, 5.0, TINT, true);
  s.addText("组件化工程", { x: 7.42, y: 1.78, w: 5.1, h: 0.42, ...F, fontSize: 16, bold: true, color: PRIMARY_DK, margin: 0 });
  bigNum(s, 7.42, 2.35, 2.3, "35", "通用组件", false);
  bigNum(s, 10.3, 2.35, 2.3, "25+", "业务页面", false);
  bigNum(s, 7.42, 3.9, 2.3, "13.9k", "前端代码行", true);
  bigNum(s, 10.3, 3.9, 2.3, "5.1k", "后端代码行", true);
  s.addText("GlassModal · EmptyState · PageSkeleton · ListMeta · statusBadge…… 统一命名与职责，跨页面复用", { x: 7.42, y: 5.75, w: 5.15, h: 0.72, ...F, fontSize: 12, color: MUTED, margin: 0 });
}

// ============================================================ 13 · innovations
{
  const s = pres.addSlide();
  s.background = { color: BG };
  header(s, "04 · 创新点", "四大亮点，答辩问题 10 的答案", 13);
  const nov = [
    ["社区化组队", "把“报名系统”升级为“组队社区”：招募 / 求组 / 互看双向匹配，帖子即队伍，闭环成团报赛"],
    ["全生命周期状态机", "竞赛状态自动推进，团队审核意见级联同步到每位成员，杜绝流程状态不一致"],
    ["灵活的数据设计", "JSON 字段承载自定义奖项与附件，8 表精简结构支撑全业务，兼顾灵活与可维护"],
    ["全链路可验证", "Python 冒烟脚本一键回归 9 步业务闭环 + Swagger 在线接口文档，联调效率高"],
  ];
  nov.forEach((n, i) => {
    const y = 1.5 + i * 1.34;
    s.addText(String(i + 1), { x: M, y: y + 0.05, w: 0.95, h: 0.75, ...F, fontSize: 30, bold: true, color: i % 2 ? ACCENT : PRIMARY, margin: 0 });
    card(s, M + 1.0, y, 11.33, 1.16, SURFACE, false, LINE);
    s.addText(n[0], { x: M + 1.25, y: y + 0.16, w: 3.1, h: 0.45, ...F, fontSize: 15.5, bold: true, color: PRIMARY_DK, margin: 0 });
    s.addText(n[1], { x: M + 4.4, y: y + 0.14, w: 7.9, h: 0.9, ...F, fontSize: 12.5, color: TEXT, valign: "middle", margin: 0 });
  });
  s.addText("创新点均来自真实需求调研与工程实践，非“为创新而创新”", { x: M, y: 6.85, w: 11.5, h: 0.35, ...F, fontSize: 12, italic: true, color: MUTED, margin: 0 });
}

// ============================================================ 14 · testing
{
  const s = pres.addSlide();
  s.background = { color: BG };
  header(s, "05 · 系统测试", "三层测试策略 · 全链路回归", 14);
  const tiers = [
    ["全链路接口冒烟", "smoke_full.py：注册 → 登录 → 发布竞赛 → 组队 → 报名 → 审核 → 成绩 → 消息，9 步业务闭环自动执行、数据自动清理", PRIMARY],
    ["前端验证计划", "docs/frontend-test-plan：按模块列验证单，三角色页面逐项覆盖，历史报告留档", PRIMARY],
    ["联调与回归", "Git 版本化迭代 + Swagger 契约对齐，每个大版本发布前跑全链路冒烟", PRIMARY_DK],
  ];
  tiers.forEach((t, i) => {
    const y = 1.5 + i * 1.62;
    card(s, M, y, 7.3, 1.42, SURFACE, true);
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: M + 0.2, y: y + 0.22, w: 0.36, h: 0.36, fill: { color: t[2] }, rectRadius: 0.09 });
    s.addText(String(i + 1), { x: M + 0.2, y: y + 0.23, w: 0.36, h: 0.34, ...F, fontSize: 14, bold: true, color: "FFFFFF", align: "center", valign: "middle", margin: 0 });
    s.addText(t[0], { x: M + 0.72, y: y + 0.18, w: 6.4, h: 0.4, ...F, fontSize: 15, bold: true, color: TEXT, margin: 0 });
    s.addText(t[1], { x: M + 0.72, y: y + 0.62, w: 6.45, h: 0.72, ...F, fontSize: 11.5, color: MUTED, margin: 0 });
  });
  card(s, 8.15, 1.5, 4.68, 4.85, INK, true);
  s.addText("覆盖规模", { x: 8.4, y: 1.72, w: 4.2, h: 0.42, ...F, fontSize: 15.5, bold: true, color: "FFFFFF", margin: 0 });
  const stats = [
    ["79", "REST API 端点", 8.4, 2.3], ["8", "数据表全覆盖", 10.6, 2.3],
    ["25+", "页面组件验证", 8.4, 3.9], ["9", "步冒烟业务闭环", 10.6, 3.9],
  ];
  stats.forEach(st => {
    s.addText(st[0], { x: st[2], y: st[3], w: 1.9, h: 0.8, ...F, fontSize: 34, bold: true, color: st[0] === "79" ? ACCENT : "A5B4FC", margin: 0 });
    s.addText(st[1], { x: st[2], y: st[3] + 0.78, w: 2.1, h: 0.5, ...F, fontSize: 12, color: "94A3B8", margin: 0 });
  });
  s.addText("如实说明：单元测试覆盖率仍待提升，已列入下一迭代计划", { x: M, y: 6.45, w: 11.5, h: 0.4, ...F, fontSize: 12.5, italic: true, color: MUTED, margin: 0 });
}

// ============================================================ 15 · teamwork
{
  const s = pres.addSlide();
  s.background = { color: BG };
  header(s, "05 · 团队合作（34%）", "分工明确 · 沟通高效 · 协作分享", 15);
  card(s, M, 1.5, 5.9, 5.05, SURFACE, true);
  s.addText("组员分工", { x: M + 0.28, y: 1.72, w: 5.3, h: 0.42, ...F, fontSize: 15.5, bold: true, color: PRIMARY_DK, margin: 0 });
  const div = [
    ["组长 · 后端", "（姓名：＿＿＿）", "架构设计 · 数据库 · 核心 Service"],
    ["前端开发", "（姓名：＿＿＿）", "25+ 页面 · 35 组件 · 设计系统"],
    ["接口 · 安全", "（姓名：＿＿＿）", "Controller · JWT 权限 · Excel 导出"],
    ["测试 · 文档", "（姓名：＿＿＿）", "冒烟脚本 · 开发手册 · 答辩材料"],
  ];
  div.forEach((d, i) => {
    const y = 2.3 + i * 0.98;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: M + 0.28, y: y + 0.08, w: 0.24, h: 0.24, fill: { color: i === 0 ? ACCENT : PRIMARY }, rectRadius: 0.06 });
    s.addText(d[0], { x: M + 0.64, y: y - 0.02, w: 1.9, h: 0.38, ...F, fontSize: 13.5, bold: true, color: TEXT, margin: 0 });
    s.addText(d[1], { x: M + 2.55, y: y, w: 1.5, h: 0.34, ...F, fontSize: 12, color: MUTED, margin: 0 });
    s.addText(d[2], { x: M + 0.64, y: y + 0.36, w: 5.0, h: 0.5, ...F, fontSize: 11.5, color: MUTED, margin: 0 });
  });
  s.addText("分工按“强项 × 工作量 × 学习目标”协商确定，交叉 review", { x: M + 0.28, y: 6.12, w: 5.4, h: 0.36, ...F, fontSize: 11.5, italic: true, color: MUTED, margin: 0 });
  card(s, 6.73, 1.5, 6.1, 5.05, BG, false, LINE);
  s.addText("高效协作机制", { x: 7.0, y: 1.72, w: 5.6, h: 0.42, ...F, fontSize: 15.5, bold: true, color: PRIMARY_DK, margin: 0 });
  const coop = [
    ["Git 分支协作", "feature 分支 → 相互 review → 合并 main，24 次提交留痕"],
    ["接口契约先行", "先定 Swagger 契约再并行开发，同一事实源编程"],
    ["文档知识共享", "开发手册 + 踩坑记录全员共享，经验不沉淀个人"],
    ["例会 + 看板", "每周同步进度与风险，任务到人、到截止日"],
  ];
  coop.forEach((c, i) => {
    const y = 2.3 + i * 0.94;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 7.0, y: y + 0.07, w: 0.26, h: 0.26, fill: { color: ACCENT }, rectRadius: 0.06 });
    s.addText(c[0], { x: 7.4, y: y + 0.02, w: 5.3, h: 0.34, ...F, fontSize: 13.5, bold: true, color: TEXT, margin: 0 });
    s.addText(c[1], { x: 7.4, y: y + 0.36, w: 5.25, h: 0.52, ...F, fontSize: 11.5, color: MUTED, margin: 0 });
  });
  s.addText("典型事例：接口契约修改 → 站会同步 → 24 小时内前后端上线", { x: 7.0, y: 6.15, w: 5.6, h: 0.34, ...F, fontSize: 11.5, italic: true, color: MUTED, margin: 0 });
}

// ============================================================ 16 · project management
{
  const s = pres.addSlide();
  s.background = { color: BG };
  header(s, "06 · 项目管理（16%）", "13 周迭代 · 进度可控 · 效益可见", 16);
  // timeline
  s.addShape(pres.shapes.LINE, { x: M, y: 2.9, w: 12.33, h: 0, line: { color: PRIMARY, width: 2 } });
  const tl = [
    ["6月中旬–6月底", "需求调研与设计", "问卷访谈 · 竞品分析 · 技术选型"],
    ["7月上旬", "框架与数据库", "前后端骨架 · 8 表模型 · Docker 环境"],
    ["7月中–8月", "核心功能迭代", "13 次功能提交 · 每周一个可演示版本"],
    ["9月初", "社区化大版本", "TeamUp 组队社区 · 测试 · 文档沉淀"],
  ];
  tl.forEach((t, i) => {
    const x = M + i * 3.12;
    s.addShape(pres.shapes.OVAL, { x: x + 0.55, y: 2.78, w: 0.24, h: 0.24, fill: { color: i === 3 ? ACCENT : PRIMARY } });
    s.addText(t[0], { x, y: 1.62, w: 2.9, h: 0.38, ...F, fontSize: 13, bold: true, color: i === 3 ? ACCENT : PRIMARY, margin: 0 });
    s.addText(t[1], { x, y: 2.0, w: 2.9, h: 0.4, ...F, fontSize: 14.5, bold: true, color: TEXT, margin: 0 });
    s.addText(t[2], { x, y: 3.15, w: 2.9, h: 0.85, ...F, fontSize: 11.5, color: MUTED, margin: 0 });
  });
  card(s, M, 4.35, 6.0, 2.3, SURFACE, true);
  s.addText("管理工具", { x: M + 0.28, y: 4.55, w: 5.4, h: 0.4, ...F, fontSize: 15, bold: true, color: PRIMARY_DK, margin: 0 });
  const mgr = [
    ["Git 版本管理", "分支策略 + 提交规范，版本可回溯"],
    ["Docker 环境标准化", "一键搭建 MySQL，消除环境差异"],
    ["Swagger 契约", "接口单一事实源，前后端并行"],
    ["冒烟回归脚本", "每版本发布前自动验证核心链路"],
  ];
  mgr.forEach((m, i) => {
    const y = 5.02 + i * 0.4;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: M + 0.28, y: y + 0.07, w: 0.18, h: 0.18, fill: { color: PRIMARY }, rectRadius: 0.05 });
    s.addText(m[0], { x: M + 0.56, y: y, w: 2.2, h: 0.32, ...F, fontSize: 12, bold: true, color: TEXT, margin: 0 });
    s.addText(m[1], { x: M + 2.72, y: y, w: 3.2, h: 0.34, ...F, fontSize: 11.5, color: MUTED, margin: 0 });
  });
  card(s, 6.83, 4.35, 6.0, 2.3, BG, false, LINE);
  s.addText("范围控制 · 效益分析", { x: 7.1, y: 4.55, w: 5.5, h: 0.4, ...F, fontSize: 15, bold: true, color: PRIMARY_DK, margin: 0 });
  const bens = [
    ["功能分级防蔓延", "必须 / 期望两级，先保核心链路"],
    ["进度滞后预案", "先交付可演示核心，再补细节"],
    ["社会与经济效益", "降低组织成本 · 沉淀数据资产 · 可复制"],
  ];
  bens.forEach((b, i) => {
    const y = 5.02 + i * 0.55;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 7.1, y: y + 0.07, w: 0.18, h: 0.18, fill: { color: i === 2 ? ACCENT : PRIMARY }, rectRadius: 0.05 });
    s.addText(b[0], { x: 7.4, y: y - 0.02, w: 1.8, h: 0.32, ...F, fontSize: 12, bold: true, color: TEXT, margin: 0 });
    s.addText(b[1], { x: 9.2, y: y, w: 3.5, h: 0.34, ...F, fontSize: 11.5, color: MUTED, margin: 0 });
  });
  s.addText("依据 Git 提交历史：第 1 次提交 2026-06-12 → 最新提交 2026-09-07，共 24 次版本化提交", { x: M, y: 6.85, w: 12.3, h: 0.35, ...F, fontSize: 12, italic: true, color: MUTED, margin: 0 });
}

// ============================================================ 17 · difficulties
{
  const s = pres.addSlide();
  s.background = { color: BG };
  header(s, "06 · 难点攻关与经验", "三个真实难题与解法", 17);
  const probs = [
    ["JSON 字段前端白屏", "awards / attachments 是 MySQL JSON 字符串，前端 .map() 直接崩溃", "后端自定义 getter 反序列化为数组，前端再加 JSON.parse 兜底，双保险"],
    ["审核状态级联一致", "审核团队后，所有成员的报名记录需同步状态与意见，易漏写", "Service 层单事务内级联更新全成员记录，保持数据一致"],
    ["前后端参数契约不一致", "批量接口前端传 {ids}，后端期望裸数组，调用即 400", "以 Swagger 契约为准统一修正；教训：接口契约先行，避免各写各的"],
  ];
  probs.forEach((p, i) => {
    const y = 1.5 + i * 1.66;
    s.addText(String(i + 1), { x: M, y: y + 0.02, w: 0.85, h: 0.7, ...F, fontSize: 28, bold: true, color: i % 2 ? ACCENT : PRIMARY, margin: 0 });
    card(s, M + 0.95, y, 4.35, 1.46, "FEF3E2", false, "FDBA74");
    s.addText("问题", { x: M + 1.2, y: y + 0.14, w: 1, h: 0.32, ...F, fontSize: 12, bold: true, color: "C2570F", margin: 0 });
    s.addText(p[0], { x: M + 1.2, y: y + 0.44, w: 3.9, h: 0.38, ...F, fontSize: 14.5, bold: true, color: "9A3412", margin: 0 });
    s.addText(p[1], { x: M + 1.2, y: y + 0.86, w: 3.95, h: 0.58, ...F, fontSize: 11.5, color: MUTED, margin: 0 });
    card(s, M + 5.5, y, 7.33, 1.46, "EDF2FF", false, "A5B4FC");
    s.addText("解决", { x: M + 5.75, y: y + 0.14, w: 1, h: 0.32, ...F, fontSize: 12, bold: true, color: "4338CA", margin: 0 });
    s.addText(p[2], { x: M + 5.75, y: y + 0.5, w: 6.9, h: 0.85, ...F, fontSize: 12.5, color: TEXT, margin: 0 });
  });
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: M, y: 6.55, w: 12.33, h: 0.52, fill: { color: INK }, rectRadius: 0.07 });
  s.addText("联调经验：异常与状态码全局统一 · 问题沉淀进踩坑文档 · 先定契约再编码 —— 可直接回答答辩问题 17", { x: M + 0.25, y: 6.56, w: 11.9, h: 0.5, ...F, fontSize: 13, bold: true, color: "C7D2FE", align: "center", valign: "middle", margin: 0 });
}

// ============================================================ 18 · summary & outlook
{
  const s = pres.addSlide();
  s.background = { color: BG };
  header(s, "06 · 总结与展望", "成果一览 · 不足与下一步", 18);
  const nums = [
    ["13.9k", "前端代码行"], ["5.1k", "后端代码行"], ["79", "API 端点"],
    ["8", "数据表"], ["35", "通用组件"], ["13 周", "按期交付"],
  ];
  nums.forEach((n, i) => {
    const col = i % 3, row = Math.floor(i / 3);
    const x = M + col * 4.2, y = 1.55 + row * 1.75;
    card(s, x, y, 3.94, 1.52, SURFACE, true);
    s.addText(n[0], { x: x + 0.25, y: y + 0.16, w: 3.4, h: 0.72, ...F, fontSize: 32, bold: true, color: i % 2 ? ACCENT : PRIMARY, margin: 0 });
    s.addText(n[1], { x: x + 0.25, y: y + 0.96, w: 3.4, h: 0.38, ...F, fontSize: 13, color: MUTED, margin: 0 });
  });
  card(s, M, 5.2, 12.33, 1.62, TINT, false, "D6D9F7");
  s.addText("功能完成度：需求分析阶段 5 大模块全部实现并上线可演示；对照“功能是否全部实现”——是，含需求评审时的附加功能", { x: M + 0.3, y: 5.34, w: 11.7, h: 0.38, ...F, fontSize: 13, bold: true, color: PRIMARY_DK, margin: 0 });
  s.addText("不足与展望：① 单元测试 / E2E 覆盖待补齐　② 消息实时性升级为 WebSocket 推送　③ 技能标签驱动的智能组队推荐　④ 移动端适配", { x: M + 0.3, y: 5.8, w: 11.7, h: 0.42, ...F, fontSize: 12.5, color: TEXT, margin: 0 });
  s.addText("诚实呈现不足，同时给出明确的改进路线 —— 对应答辩问题 11 / 12 / 16", { x: M + 0.3, y: 6.32, w: 11.7, h: 0.35, ...F, fontSize: 12, italic: true, color: MUTED, margin: 0 });
}

// ============================================================ 19 · closing
{
  const s = pres.addSlide();
  s.background = { color: INK };
  s.addShape(pres.shapes.OVAL, { x: -2.0, y: -2.2, w: 5.2, h: 5.2, fill: { color: PRIMARY, transparency: 80 } });
  s.addShape(pres.shapes.OVAL, { x: 11.2, y: 4.4, w: 4.4, h: 4.4, fill: { color: ACCENT, transparency: 78 } });
  s.addText("感谢聆听", { x: 0, y: 2.35, w: W, h: 1.1, ...F, fontSize: 54, bold: true, color: "FFFFFF", align: "center", margin: 0 });
  s.addText("恳请各位老师批评指正", { x: 0, y: 3.5, w: W, h: 0.6, ...F, fontSize: 20, color: ON_DARK, align: "center", margin: 0 });
  s.addText("赛友 TeamUp —— 让每一场竞赛，都有可靠的队友", { x: 0, y: 4.35, w: W, h: 0.5, ...F, fontSize: 15, color: "94A3B8", align: "center", margin: 0 });
  s.addText("第 ＿ 组 · 2026 年 9 月", { x: 0, y: 6.4, w: W, h: 0.4, ...F, fontSize: 13, color: DIM, align: "center", margin: 0 });
}

const out = path.join(__dirname, "赛友TeamUp-答辩PPT.pptx");
pres.writeFile({ fileName: out }).then(() => console.log("written:", out)).catch(e => { console.error(e); process.exit(1); });