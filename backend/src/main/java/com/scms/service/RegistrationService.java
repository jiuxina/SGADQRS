package com.scms.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.scms.common.PageResult;
import com.scms.common.Pages;
import com.scms.common.Result;
import com.scms.dto.TeamDTO;
import com.scms.entity.*;
import com.scms.mapper.*;
import com.scms.security.LoginUser;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 参赛队伍（参赛单位）服务：报名与队伍合一。
 * 审核链：队长建队(0组建中) → 提交审核(1) → 管理员审(2通过/3拒绝)，被驳回(3)可修改后重新提交(1)；单人赛=1人队，创建即提交。
 * 指导老师由队长指定，老师只读不审批。
 */
@Service
@RequiredArgsConstructor
public class RegistrationService {

    private final CompetitionTeamMapper teamMapper;
    private final CompetitionTeamMemberMapper teamMemberMapper;
    private final CompetitionMapper competitionMapper;
    private final UserMapper userMapper;
    private final RecruitPostMapper recruitPostMapper;
    private final NotificationService notificationService;

    public Result<?> listTeams(int current, int size, Long competitionId, Integer status, Long publisherId, Long teacherId, Long memberId, String keyword) {
        Page<CompetitionTeam> page = Pages.of(current, size);
        LambdaQueryWrapper<CompetitionTeam> wrapper = new LambdaQueryWrapper<>();
        if (competitionId != null) wrapper.eq(CompetitionTeam::getCompetitionId, competitionId);
        if (status != null) wrapper.eq(CompetitionTeam::getStatus, status);
        if (StringUtils.hasText(keyword)) wrapper.like(CompetitionTeam::getTeamName, keyword);
        if (publisherId != null) {
            wrapper.apply("competition_id IN (SELECT id FROM competition WHERE publisher_id = {0})", publisherId);
        }
        if (teacherId != null) wrapper.eq(CompetitionTeam::getTeacherId, teacherId);
        if (memberId != null) {
            wrapper.apply("id IN (SELECT team_id FROM competition_team_member WHERE student_id = {0})", memberId);
        }
        wrapper.orderByDesc(CompetitionTeam::getCreateTime);

        Page<CompetitionTeam> result = teamMapper.selectPage(page, wrapper);
        result.getRecords().forEach(this::fillTeamInfo);
        return Result.success(new PageResult<>(result));
    }

    /** 某竞赛的参赛者名单（已通过队伍的全部在队成员，含1人队），供成绩录入使用 */
    public Result<?> listParticipants(Long competitionId) {
        if (competitionId == null) return Result.error("请指定竞赛");
        List<CompetitionTeam> teams = teamMapper.selectList(
                new LambdaQueryWrapper<CompetitionTeam>()
                        .eq(CompetitionTeam::getCompetitionId, competitionId)
                        .eq(CompetitionTeam::getStatus, 2)
        );
        List<Map<String, Object>> rows = new ArrayList<>();
        for (CompetitionTeam team : teams) {
            List<CompetitionTeamMember> members = teamMemberMapper.selectList(
                    new LambdaQueryWrapper<CompetitionTeamMember>()
                            .eq(CompetitionTeamMember::getTeamId, team.getId())
            );
            for (CompetitionTeamMember m : members) {
                User u = userMapper.selectById(m.getStudentId());
                Map<String, Object> row = new HashMap<>();
                row.put("teamId", team.getId());
                row.put("teamName", team.getTeamName());
                row.put("studentId", m.getStudentId());
                row.put("studentName", u != null ? u.getRealName() : null);
                rows.add(row);
            }
        }
        return Result.success(rows);
    }

    /** 创建参赛队伍；单人赛自动建1人队并直接进入"已提交" */
    @Transactional
    public Result<?> createTeam(TeamDTO dto, Long leaderId) {
        Competition comp = competitionMapper.selectById(dto.getCompetitionId());
        if (comp == null) return Result.error("竞赛不存在");
        if (comp.getStatus() != 2 && comp.getStatus() != 3) return Result.error("该竞赛当前不可参赛");
        // 边界：字段长度与库表一致，防止超长直接撞 DB 约束变 500
        if (dto.getTeamName() != null && dto.getTeamName().length() > 50) return Result.error("团队名称不能超过 50 字");
        if (dto.getTeamSlogan() != null && dto.getTeamSlogan().length() > 200) return Result.error("团队口号不能超过 200 字");
        // 边界：指导老师须存在且为教师（与 changeTeacher 校验一致）
        if (dto.getTeacherId() != null) {
            User teacher = userMapper.selectById(dto.getTeacherId());
            if (teacher == null || teacher.getUserType() == null || teacher.getUserType() != 2) {
                return Result.error("指导老师不存在");
            }
        }
        // 边界：同一学生同一竞赛只能有一支队伍（建队或入队均算）
        Long joined = teamMemberMapper.selectCount(new LambdaQueryWrapper<CompetitionTeamMember>()
                .eq(CompetitionTeamMember::getStudentId, leaderId)
                .apply("team_id IN (SELECT id FROM competition_team WHERE competition_id = {0})", dto.getCompetitionId()));
        if (joined != null && joined > 0) return Result.error("你已参加了该竞赛的队伍，不可重复报名");

        CompetitionTeam team = new CompetitionTeam();
        team.setCompetitionId(dto.getCompetitionId());
        team.setTeamName(dto.getTeamName());
        team.setLeaderId(leaderId);
        team.setTeacherId(dto.getTeacherId());
        team.setTeamSlogan(dto.getTeamSlogan());
        boolean solo = comp.getMaxMembers() != null && comp.getMaxMembers() == 1;
        team.setStatus(solo ? 1 : 0);
        teamMapper.insert(team);

        CompetitionTeamMember member = new CompetitionTeamMember();
        member.setTeamId(team.getId());
        member.setStudentId(leaderId);
        teamMemberMapper.insert(member);

        return Result.success(solo ? "报名成功" : "创建队伍成功", team);
    }

    /** 队长提交审核（0组建中/3已拒绝 → 1待审核；被驳回后可修改再重新提交） */
    @Transactional
    public Result<?> submitTeam(Long teamId, Long leaderId) {
        CompetitionTeam team = teamMapper.selectById(teamId);
        if (team == null) return Result.error("队伍不存在");
        if (!leaderId.equals(team.getLeaderId())) return Result.error("只有队长可以提交审核");
        Integer st = team.getStatus();
        if (st == null || (st != 0 && st != 3)) return Result.error("当前状态不可提交");
        team.setStatus(1);
        teamMapper.updateById(team);
        return Result.success("已提交审核", null);
    }

    /** 队长更换指导老师（teacherId 传空表示取消指定） */
    @Transactional
    public Result<?> changeTeacher(Long teamId, Long leaderId, Long teacherId) {
        CompetitionTeam team = teamMapper.selectById(teamId);
        if (team == null) return Result.error("队伍不存在");
        if (!leaderId.equals(team.getLeaderId())) return Result.error("只有队长可以指定指导老师");
        if (teacherId != null) {
            User teacher = userMapper.selectById(teacherId);
            if (teacher == null || teacher.getUserType() == null || teacher.getUserType() != 2) {
                return Result.error("指导老师不存在");
            }
        }
        team.setTeacherId(teacherId);
        teamMapper.updateById(team);
        return Result.success(teacherId != null ? "指导老师已更新" : "已取消指导老师", null);
    }

    /** 管理员审核参赛队伍（1已提交 → 2通过/3拒绝） */
    /** 解散队伍：队长本人操作，组建中(0)/待审核(1)/已拒绝(3)可解散；已通过(2)需联系管理员 */
    @Transactional
    public Result<?> disbandTeam(Long id, Long meId) {
        CompetitionTeam team = teamMapper.selectById(id);
        if (team == null) return Result.error("队伍不存在");
        if (!meId.equals(team.getLeaderId())) return Result.error("只有队长可以解散队伍");
        if (team.getStatus() != null && team.getStatus() == 2) {
            return Result.error("已通过审核的队伍不能解散，如有需要请联系管理员");
        }
        // 下架关联招募帖（status 1 招募中 → 0 已关闭）
        recruitPostMapper.selectList(new LambdaQueryWrapper<RecruitPost>()
                        .eq(RecruitPost::getTeamId, id))
                .forEach(post -> {
                    post.setStatus(0);
                    recruitPostMapper.updateById(post);
                });
        teamMemberMapper.delete(new LambdaQueryWrapper<CompetitionTeamMember>()
                .eq(CompetitionTeamMember::getTeamId, id));
        teamMapper.deleteById(id);
        return Result.success("队伍已解散", null);
    }

    @Transactional
    public Result<?> auditTeam(Long id, Integer status, String auditRemark) {
        CompetitionTeam team = teamMapper.selectById(id);
        if (team == null) return Result.error("队伍不存在");
        if (status == null || (status != 2 && status != 3)) return Result.error("无效的审核状态");
        // 边界：仅"待审核(1)"的队伍可审核，防止重复审核/审核组建中的队伍
        if (team.getStatus() == null || team.getStatus() != 1) return Result.error("该队伍当前状态不可审核（仅待审核状态可审核）");
        team.setStatus(status);
        teamMapper.updateById(team);

        // 审核结果通知全体成员
        User leader = userMapper.selectById(team.getLeaderId());
        String leaderName = leader != null ? leader.getRealName() : "";
        String title = status == 2 ? "参赛队伍审核通过" : "参赛队伍未通过审核";
        String content = (team.getTeamName() != null ? "「" + team.getTeamName() + "」" : "你的队伍")
                + (status == 2 ? " 已通过参赛审核。" : " 未通过参赛审核。")
                + (auditRemark != null && !auditRemark.isBlank() ? "备注：" + auditRemark : "");
        List<CompetitionTeamMember> members = teamMemberMapper.selectList(
                new LambdaQueryWrapper<CompetitionTeamMember>()
                        .eq(CompetitionTeamMember::getTeamId, id)
        );
        for (CompetitionTeamMember m : members) {
            notificationService.send(m.getStudentId(), "interaction", title, content, "team", team.getId());
        }
        return Result.success(status == 2 ? "审核通过" : "已拒绝", null);
    }

    /**
     * 将学生加入队伍（社区申请/邀请同意后走此入口）：校验容量与防重，成员直接生效。
     * 边界：对队伍行加悲观锁（FOR UPDATE），容量检查与插入串行化，防并发同意导致超员；须在事务内调用。
     */
    @Transactional
    public Result<?> addMemberToTeam(Long teamId, Long studentId) {
        CompetitionTeam team = teamMapper.selectByIdForUpdate(teamId);
        if (team == null) return Result.error("团队不存在");
        Competition comp = competitionMapper.selectById(team.getCompetitionId());
        if (comp == null) return Result.error("所属竞赛不存在");

        // 当前读(FOR UPDATE)：REPEATABLE READ 下普通 count 走事务旧快照，拿锁后仍看不见并发已提交的插入
        long activeCount = teamMemberMapper.selectCount(
                new LambdaQueryWrapper<CompetitionTeamMember>()
                        .eq(CompetitionTeamMember::getTeamId, teamId)
                        .last("for update")
        );
        if (comp.getMaxMembers() != null && activeCount >= comp.getMaxMembers()) {
            return Result.error("队伍人数已满");
        }

        long count = teamMemberMapper.selectCount(
                new LambdaQueryWrapper<CompetitionTeamMember>()
                        .eq(CompetitionTeamMember::getTeamId, teamId)
                        .eq(CompetitionTeamMember::getStudentId, studentId)
        );
        if (count > 0) return Result.error("您已在该团队中");
        // 边界：同一学生同一竞赛只能有一支队伍
        Long joinedOther = teamMemberMapper.selectCount(new LambdaQueryWrapper<CompetitionTeamMember>()
                .eq(CompetitionTeamMember::getStudentId, studentId)
                .ne(CompetitionTeamMember::getTeamId, teamId)
                .apply("team_id IN (SELECT id FROM competition_team WHERE competition_id = {0})", team.getCompetitionId()));
        if (joinedOther != null && joinedOther > 0) return Result.error("该同学已参加了此竞赛的其他队伍");

        CompetitionTeamMember member = new CompetitionTeamMember();
        member.setTeamId(teamId);
        member.setStudentId(studentId);
        teamMemberMapper.insert(member);

        return Result.success("加入团队成功", null);
    }

    /** 队伍详情：管理员、指导老师/竞赛发布教师、队伍成员（含队长）可见 */
    public Result<?> getTeamDetail(Long id, LoginUser loginUser) {
        CompetitionTeam team = teamMapper.selectById(id);
        if (team == null) return Result.error("队伍不存在");
        String role = loginUser.getRoleCode();
        Long meId = loginUser.getUserId();
        boolean allowed = "admin".equals(role);
        if (!allowed && "teacher".equals(role)) {
            if (meId.equals(team.getTeacherId())) {
                allowed = true;
            } else if (team.getCompetitionId() != null) {
                Competition comp = competitionMapper.selectById(team.getCompetitionId());
                allowed = comp != null && meId.equals(comp.getPublisherId());
            }
        }
        if (!allowed && "student".equals(role)) {
            Long count = teamMemberMapper.selectCount(new LambdaQueryWrapper<CompetitionTeamMember>()
                    .eq(CompetitionTeamMember::getTeamId, id)
                    .eq(CompetitionTeamMember::getStudentId, meId));
            allowed = count != null && count > 0;
        }
        if (!allowed) return Result.error("无权查看该队伍");
        fillTeamInfo(team);
        return Result.success(team);
    }

    private void fillTeamInfo(CompetitionTeam team) {
        if (team.getLeaderId() != null) {
            User leader = userMapper.selectById(team.getLeaderId());
            if (leader != null) team.setLeaderName(leader.getRealName());
        }
        if (team.getTeacherId() != null) {
            User teacher = userMapper.selectById(team.getTeacherId());
            if (teacher != null) team.setTeacherName(teacher.getRealName());
        }
        if (team.getCompetitionId() != null) {
            Competition comp = competitionMapper.selectById(team.getCompetitionId());
            if (comp != null) team.setCompetitionName(comp.getCompetitionName());
        }
        // 加载成员
        List<CompetitionTeamMember> members = teamMemberMapper.selectList(
                new LambdaQueryWrapper<CompetitionTeamMember>()
                        .eq(CompetitionTeamMember::getTeamId, team.getId())
        );
        members.forEach(m -> {
            User user = userMapper.selectById(m.getStudentId());
            if (user != null) {
                m.setStudentName(user.getRealName());
                m.setStudentUsername(user.getUsername());
            }
        });
        team.setMembers(members);
    }
}
