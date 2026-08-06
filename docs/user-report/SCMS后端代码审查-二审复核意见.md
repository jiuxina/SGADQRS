## SCMS 后端代码审查报告 — 二审复核意见

**审核对象：** 一审《SCMS后端代码审查报告》  
**审核方式：** 逐项回查源码 + 扩展扫描（事务、并发、数据校验、DTO映射）  
**日期：** 2026-06-15

---

## 一、一审结论复核

### 1.1 事实准确性：全部成立

一审报告中的每项结论均已回查源码确认，无误判。具体核实情况：

| 一审结论 | 核实结果 | 关键代码 |
|---------|---------|---------|
| LoginUser.isEnabled()恒为true | 确认，第45行 `return true` | LoginUser.java:45 |
| 凭据明文硬编码 | 确认，root/root + JWT secret | application.yml:15-16,41 |
| 文件上传无类型校验 | 确认，仅提取后缀直接使用 | FileController.java:44-52 |
| StdOutImpl日志 | 确认 | application.yml:31 |
| N+1查询(5个Service) | 确认，实测每页10条产生30-40次额外查询 | CompetitionService:44,147-167 等 |
| 魔法数字60+处 | 确认，全项目零枚举零常量类 | 散布10个文件 |
| 角色映射重复3处 | 确认 | AuthService:43-47, UserService:61, UserDetailsServiceImpl:28-32 |
| ExcelUtil未使用 | 确认，全项目零引用 | util/ExcelUtil.java |
| hutool-all未使用 | 确认，零import | pom.xml:86-90 |
| exportUsers()不可达 | 确认，ExportController无对应端点 | ExportService.java:164 |
| @EnableAsync无@Async方法 | 确认 | ScmsApplication.java:9 |
| CORS重复配置 | 确认，两处配置完全相同 | SecurityConfig:70-80, WebMvcConfig:12-19 |
| ObjectMapper逐次创建 | 确认 | ResultService.java:139 |
| 异常被静默吞掉 | 确认，`catch (Exception ignored) {}` | ResultService.java:151-152 |
| NPE风险 | 确认，`reg.getStudentId().equals(...)` | RegistrationService.java:124 |

### 1.2 严重性评级评估

一审的严重性评级基本合理，但有几处需要调整：

**应上调的：**
- "魔法数字泛滥"从高级上调为**高级偏严重**——不仅影响可读性，更导致状态转换逻辑分散在switch表达式中（ExportService:255-306有5个独立的switch），任何新增状态值都极易漏改
- "无自定义业务异常"从高级上调为**严重**——所有业务错误以HTTP 200返回，前端无法通过HTTP层统一拦截错误，这对前后端协作是根本性障碍

**应下调的：**
- "@EnableAsync无@Async方法"从低级调整为**信息级**——功能上无害，只是多加载了一个BeanPostProcessor
- "通配符导入"维持低级——在此项目规模下（56个文件）不会造成实际冲突

---

## 二、一审遗漏的重大问题

二审扩展扫描发现了7个一审未覆盖的问题，其中3个达到严重级别：

### 2.1 [严重] User.password字段在API响应中泄露

`User` 实体的 `password` 字段没有 `@JsonIgnore` 注解。以下端点会将BCrypt哈希密码返回给客户端：

- `UserService.getUserById()` — 直接 `return Result.success(user)`
- `UserService.listUsers()` — `PageResult<User>` 包含完整实体
- `UserService.createUser()` — `return Result.success("创建成功", user)`

全项目没有任何 `@JsonIgnore` 注解。`AuthService.getUserInfo()` 手动构建了安全的Map返回（过滤了password），但UserService完全没有这层保护。

**修复方案：** 在 `User.java` 的 `password` 字段上添加 `@JsonIgnore`，或在UserService层构建VO返回。

### 2.2 [严重] 并发竞态条件——无锁保护

整个代码库没有任何并发控制手段（无 `synchronized`、无 `@Version` 乐观锁、无 `SELECT ... FOR UPDATE`、无数据库唯一约束），导致多个先读后写的业务操作存在竞态风险：

| 场景 | 位置 | 后果 |
|------|------|------|
| 重复报名 | RegistrationService:62-67 | 同一学生并发提交两次报名都通过 selectCount 检查 |
| 用户名重复 | AuthService:60-65 | 并发注册相同用户名都通过 selectOne 检查 |
| 团队人数超限 | RegistrationService:167-188 | 根本没查 maxMembers，而且即使查了也无锁 |
| 并发审核 | RegistrationService:84-93 | 两个管理员同时审核同一条记录，最后写入者覆盖前者 |

对于高校竞赛系统，报名截止前的高并发报名是最典型的场景。

**修复方案（按优先级）：**
1. 数据库层：`competition_registration` 表添加 `UNIQUE(competition_id, student_id)` 约束
2. 数据库层：`sys_user` 表的 `username` 列添加 `UNIQUE` 约束
3. 代码层：关键实体添加 `@Version` 字段启用乐观锁
4. 代码层：`joinTeam()` 补充 maxMembers 校验

### 2.3 [严重] 竞赛级联删除不完整

`CompetitionService.deleteCompetition()` 只删除了竞赛本身和报名记录，但遗留了三张关联表的孤儿数据：

```
competition (删除了)
  ├── competition_registration (删除了)
  ├── competition_team (未删除 — 孤儿数据)
  ├── competition_team_member (未删除 — 孤儿数据)
  └── competition_result (未删除 — 孤儿数据)
```

### 2.4 [高级] autoUpdateStatus修改了状态但未持久化

`CompetitionService.autoUpdateStatus()` 在内存中将竞赛状态从"已发布"(2)推进到"进行中"(3)或"已结束"(4)，但从未调用 `updateById()` 写回数据库。状态变更仅存在于当次API响应中，下次查询从数据库读出的仍是旧状态。

这还产生了一个连锁效应：由于数据库中状态永远是2（即使竞赛已结束），报名接口的 `comp.getStatus() != 2` 检查永远不会拦截过期竞赛——幸好时间窗口检查提供了第二道防线，但这属于"碰巧没出事"。

### 2.5 [高级] AuthService.register()缺少@Transactional

注册操作执行了 selectOne（查重）+ insert（插入），但方法上没有 `@Transactional`。虽然只是单条insert，但读-写不是原子的，加剧了2.2中提到的竞态问题。

### 2.6 [高级] 教师可绕过审核直接发布竞赛

`CompetitionService.createCompetition()` 直接从DTO复制status字段到实体。教师可以在请求体中传 `status=2`（已发布），跳过管理员审核流程。

**修复方案：** 服务端强制 `comp.setStatus(0)`（草稿），忽略DTO中的status值。

### 2.7 [中级] 成绩录入不校验报名关系

`ResultService.saveResult()` 接受 `registrationId` 但不验证该报名记录是否存在、是否已审批通过、是否与给定的 `studentId` / `competitionId` 匹配。教师可以为不存在的报名关系录入成绩。

### 2.8 [中级] CompetitionDTO时间范围无交叉校验

四个时间字段（报名开始/结束、竞赛开始/结束）各自有 `@NotNull`，但无逻辑校验确保 `registrationStart < registrationEnd < competitionStart < competitionEnd`。可以创建出"报名结束时间晚于竞赛结束时间"的荒谬竞赛。

### 2.9 [中级] maxTeams从未被检查

`Competition.maxTeams` 字段存在，但创建团队和报名时从未检查当前团队数是否已达上限。

### 2.10 [中级] 逻辑删除配置空转导致物理删除

一审提到了逻辑删除配置空转，但遗漏了其实际影响：所有 `deleteById()` 调用（UserService:88, CompetitionService:114, SystemService:62）执行的是**物理删除**，因为没有实体的 `deleted` 字段和 `@TableLogic` 注解。管理员的"删除"操作不可恢复。

---

## 三、一审结论中需要补充说明的部分

### 3.1 @Transactional覆盖情况

一审未提及事务管理。实际情况是：所有Service的写操作方法都正确标注了 `@Transactional`（共23处），但 `AuthService.register()` 是一个例外——这个方法也应该有事务注解。

另外，所有 `@Transactional` 都使用默认配置（无 `rollbackFor`），Spring默认只对 `RuntimeException` 回滚。当前代码中不涉及受检异常，暂时安全，但属于隐患。

### 3.2 分页缺少上限保护

所有一审未提及。所有分页接口的 `size` 参数无上限约束，客户端可传 `size=1000000` 导致数据库全表扫描。

---

## 四、修订后的问题优先级路线图

在一审P0-P3基础上，纳入二审新发现，重新排序：

### P0 — 安全/数据泄露（必须立即修复）

| 序号 | 问题 | 修复成本 |
|------|------|---------|
| 1 | User.password泄露到API响应 | 1行代码（加@JsonIgnore） |
| 2 | LoginUser.isEnabled()始终true | 3行代码 |
| 3 | 数据库凭据+JWT密钥外部化 | 改yml + 建Profile |
| 4 | 文件上传类型白名单 | ~15行代码 |
| 5 | 关闭生产SQL日志 | 拆yml为dev/prod两份 |

### P1 — 数据完整性（尽快修复）

| 序号 | 问题 | 修复成本 |
|------|------|---------|
| 6 | 报名/用户名唯一性数据库约束 | 加UNIQUE索引 |
| 7 | 竞赛级联删除补全(team/member/result) | ~10行代码 |
| 8 | autoUpdateStatus持久化 | 加一行updateById() |
| 9 | 教师绕过审核(status强制设为0) | 1行代码 |
| 10 | 成绩录入校验报名关系 | ~10行代码 |
| 11 | AuthService.register()加@Transactional | 1行注解 |

### P2 — 性能（计划修复）

| 序号 | 问题 | 修复成本 |
|------|------|---------|
| 12 | N+1查询批量预加载改造 | 每个Service约30-50行重构 |
| 13 | publishResults()改为批量UPDATE | ~5行代码 |
| 14 | 分页size参数加上限(如max=100) | ~3行代码 |

### P3 — 代码质量（渐进改善）

| 序号 | 问题 | 修复成本 |
|------|------|---------|
| 15 | 引入状态/类型枚举，消灭魔法数字 | 新建5-6个枚举类 + 全局替换 |
| 16 | 统一角色映射到枚举 | 随#15一起完成 |
| 17 | 引入BusinessException + 规范HTTP错误码 | 新建异常类 + 改GlobalExceptionHandler |
| 18 | DTO补全校验注解(@NotNull等) | 每个DTO 3-5行 |
| 19 | Controller端点补齐@Valid | 5处各加1个注解 |
| 20 | CompetitionDTO时间交叉校验 | 自定义Validator或在Service层校验 |
| 21 | maxTeams校验 | 在createTeam()中加检查 |

### P4 — 规范化（锦上添花）

| 序号 | 问题 | 修复成本 |
|------|------|---------|
| 22 | 删除死代码(ExcelUtil/exportUsers/hutool/@EnableAsync) | 纯删除操作 |
| 23 | 合并重复CORS配置 | 删WebMvcConfig中的部分 |
| 24 | PUT路径补资源ID | 改路径+Controller签名 |
| 25 | FileController逻辑下沉到Service | 提取FileService |
| 26 | 通配符导入改显式导入 | IDE自动完成 |
| 27 | Swagger文档补@Parameter/@Schema | 每个端点2-3行注解 |
| 28 | @Transactional加rollbackFor=Exception.class | 全局替换 |

---

## 五、对一审报告的总体评价

一审报告在代码规范性和整洁度层面的审查全面且准确，4个严重问题的判定全部成立，60+处魔法数字和N+1查询的定位精准。报告的结构（严重→高→中→低分级 + 路线图）清晰实用。

不足之处在于：审查重心偏向"代码长什么样"（命名、格式、死代码），对"代码怎么运行"（并发安全、事务边界、数据校验、信息泄露）的覆盖不够。二审补充的7个问题中，password字段泄露和并发竞态条件在实际生产中的影响可能比一审中部分"严重"问题更大。

建议将两份报告合并使用：一审的代码规范检查 + 二审的运行时安全和数据完整性检查，按修订后的P0-P4路线图推进修复。

---

## 附录：量化统计修正

| 指标 | 一审数值 | 二审修正 |
|------|---------|---------|
| 严重问题 | 4个 | **7个**（+password泄露、并发竞态、级联删除不完整） |
| 高级问题 | 5类 | **8类**（+autoUpdateStatus不持久化、绕过审核、register缺事务） |
| 中级问题 | 7个 | **10个**（+成绩校验、时间校验、maxTeams、逻辑删除物理化） |
| 低级问题 | 5类 | 5类（不变） |
| @Transactional覆盖 | 未检查 | **23处有标注，1处遗漏** |
| 测试覆盖 | 0% | 0%（不变） |
| 误判数 | — | **0** |
