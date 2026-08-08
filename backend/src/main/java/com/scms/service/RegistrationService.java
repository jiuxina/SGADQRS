package com.scms.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.scms.common.PageResult;
import com.scms.common.Result;
import com.scms.dto.AuditDTO;
import com.scms.dto.BatchAuditDTO;
import com.scms.dto.RegistrationDTO;
import com.scms.dto.TeamDTO;
import com.scms.entity.*;
import com.scms.mapper.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class RegistrationService {

    private final CompetitionRegistrationMapper registrationMapper;
    private final CompetitionTeamMapper teamMapper;
    private final CompetitionTeamMemberMapper teamMemberMapper;
    private final CompetitionMapper competitionMapper;
    private final UserMapper userMapper;

    public Result<?> listRegistrations(int current, int size, Long competitionId,
                                        Long studentId, Integer status, Long publisherId, String keyword) {
        Page<CompetitionRegistration> page = new Page<>(current, size);
        LambdaQueryWrapper<CompetitionRegistration> wrapper = new LambdaQueryWrapper<>();

        if (competitionId != null) wrapper.eq(CompetitionRegistration::getCompetitionId, competitionId);
        if (studentId != null) wrapper.eq(CompetitionRegistration::getStudentId, studentId);
        if (status != null) wrapper.eq(CompetitionRegistration::getStatus, status);

        // 教师只能看自己发布的竞赛的报名
        if (publisherId != null) {
            wrapper.apply("competition_id IN (SELECT id FROM competition WHERE publisher_id = {0})", publisherId);
        }

        if (keyword != null && !keyword.isBlank()) {
            wrapper.and(w -> w
                .apply("student_id IN (SELECT id FROM sys_user WHERE real_name LIKE CONCAT('%', {0}, '%'))", keyword)
                .or()
                .apply("team_id IN (SELECT id FROM competition_team WHERE team_name LIKE CONCAT('%', {0}, '%'))", keyword)
                .or()
                .apply("competition_id IN (SELECT id FROM competition WHERE competition_name LIKE CONCAT('%', {0}, '%'))", keyword)
            );
        }

        wrapper.orderByDesc(CompetitionRegistration::getCreateTime);
        Page<CompetitionRegistration> result = registrationMapper.selectPage(page, wrapper);
        result.getRecords().forEach(this::fillRegistrationInfo);
        return Result.success(new PageResult<>(result));
    }

    @Transactional
    public Result<?> register(RegistrationDTO dto, Long studentId) {
        Competition comp = competitionMapper.selectById(dto.getCompetitionId());
        if (comp == null) return Result.error("竞赛不存在");
        if (comp.getStatus() != 2) return Result.error("竞赛不在报名期内");

        LocalDateTime now = LocalDateTime.now();
        if (now.isBefore(comp.getRegistrationStart()) || now.isAfter(comp.getRegistrationEnd())) {
            return Result.error("不在报名时间内");
        }

        // 检查是否已报名
        long count = registrationMapper.selectCount(
                new LambdaQueryWrapper<CompetitionRegistration>()
                        .eq(CompetitionRegistration::getCompetitionId, dto.getCompetitionId())
                        .eq(CompetitionRegistration::getStudentId, studentId)
        );
        if (count > 0) return Result.error("您已报名该竞赛");

        CompetitionRegistration reg = new CompetitionRegistration();
        reg.setCompetitionId(dto.getCompetitionId());
        reg.setStudentId(studentId);
        reg.setTeamId(dto.getTeamId());
        reg.setIsTeamLeader(dto.getTeamId() != null ? 1 : 0);
        reg.setContactPhone(dto.getContactPhone());
        reg.setRemark(dto.getRemark());
        reg.setAttachmentUrl(dto.getAttachmentUrl());
        reg.setStatus(0);
        registrationMapper.insert(reg);

        return Result.success("报名成功", reg);
    }

    @Transactional
    public Result<?> auditRegistration(Long id, AuditDTO dto) {
        CompetitionRegistration reg = registrationMapper.selectById(id);
        if (reg == null) return Result.error("报名记录不存在");

        reg.setStatus(dto.getStatus());
        reg.setAuditRemark(dto.getAuditRemark());
        reg.setAuditTime(LocalDateTime.now());
        registrationMapper.updateById(reg);
        return Result.success(dto.getStatus() == 1 ? "审核通过" : "已拒绝", null);
    }

    @Transactional
    public Result<?> batchAuditRegistration(BatchAuditDTO dto) {
        List<Long> ids = dto.getIds();
        if (ids == null || ids.isEmpty()) {
            return Result.error("请选择要审核的报名记录");
        }
        Integer status = dto.getStatus();
        if (status == null || (status != 1 && status != 2)) {
            return Result.error("审核状态无效");
        }

        LocalDateTime now = LocalDateTime.now();
        for (Long id : ids) {
            CompetitionRegistration reg = registrationMapper.selectById(id);
            if (reg == null) continue;
            reg.setStatus(status);
            reg.setAuditRemark(dto.getAuditRemark());
            reg.setAuditTime(now);
            registrationMapper.updateById(reg);
        }

        String msg = status == 1 ? "批量审核通过" : "已批量拒绝";
        return Result.success(msg, null);
    }

    @Transactional
    public Result<?> cancelRegistration(Long id, Long studentId) {
        CompetitionRegistration reg = registrationMapper.selectById(id);
        if (reg == null) return Result.error("报名记录不存在");
        if (!reg.getStudentId().equals(studentId)) return Result.error("无权操作");
        reg.setStatus(-1);
        registrationMapper.updateById(reg);
        return Result.success("已取消报名", null);
    }

    // ===== 团队管理 =====

    public Result<?> listTeams(int current, int size, Long competitionId, Integer status, Long publisherId) {
        Page<CompetitionTeam> page = new Page<>(current, size);
        LambdaQueryWrapper<CompetitionTeam> wrapper = new LambdaQueryWrapper<>();
        if (competitionId != null) wrapper.eq(CompetitionTeam::getCompetitionId, competitionId);
        if (status != null) wrapper.eq(CompetitionTeam::getStatus, status);
        if (publisherId != null) {
            wrapper.apply("competition_id IN (SELECT id FROM competition WHERE publisher_id = {0})", publisherId);
        }
        wrapper.orderByDesc(CompetitionTeam::getCreateTime);

        Page<CompetitionTeam> result = teamMapper.selectPage(page, wrapper);
        result.getRecords().forEach(this::fillTeamInfo);
        return Result.success(new PageResult<>(result));
    }

    @Transactional
    public Result<?> createTeam(TeamDTO dto, Long leaderId) {
        CompetitionTeam team = new CompetitionTeam();
        team.setCompetitionId(dto.getCompetitionId());
        team.setTeamName(dto.getTeamName());
        team.setLeaderId(leaderId);
        team.setTeamSlogan(dto.getTeamSlogan());
        team.setStatus(0);
        teamMapper.insert(team);

        // 队长自动加入
        CompetitionTeamMember member = new CompetitionTeamMember();
        member.setTeamId(team.getId());
        member.setStudentId(leaderId);
        member.setStatus(1);
        teamMemberMapper.insert(member);

        return Result.success("创建团队成功", team);
    }

    @Transactional
    public Result<?> joinTeam(Long teamId, Long studentId) {
        CompetitionTeam team = teamMapper.selectById(teamId);
        if (team == null) return Result.error("团队不存在");

        // 检查是否已在团队中
        long count = teamMemberMapper.selectCount(
                new LambdaQueryWrapper<CompetitionTeamMember>()
                        .eq(CompetitionTeamMember::getTeamId, teamId)
                        .eq(CompetitionTeamMember::getStudentId, studentId)
                        .eq(CompetitionTeamMember::getStatus, 1)
        );
        if (count > 0) return Result.error("您已在该团队中");

        CompetitionTeamMember member = new CompetitionTeamMember();
        member.setTeamId(teamId);
        member.setStudentId(studentId);
        member.setStatus(1);
        teamMemberMapper.insert(member);

        return Result.success("加入团队成功", null);
    }

    @Transactional
    public Result<?> auditTeam(Long id, Integer status, String auditRemark) {
        CompetitionTeam team = teamMapper.selectById(id);
        if (team == null) return Result.error("团队不存在");
        team.setStatus(status);
        teamMapper.updateById(team);

        // 将审核备注同步到该团队所有成员的报名记录
        LocalDateTime now = LocalDateTime.now();
        List<CompetitionRegistration> regs = registrationMapper.selectList(
                new LambdaQueryWrapper<CompetitionRegistration>()
                        .eq(CompetitionRegistration::getTeamId, id)
        );
        for (CompetitionRegistration reg : regs) {
            reg.setAuditRemark(auditRemark);
            reg.setAuditTime(now);
            registrationMapper.updateById(reg);
        }

        return Result.success(status == 2 ? "审核通过" : "已拒绝", null);
    }

    private void fillRegistrationInfo(CompetitionRegistration reg) {
        if (reg.getCompetitionId() != null) {
            Competition comp = competitionMapper.selectById(reg.getCompetitionId());
            if (comp != null) reg.setCompetitionName(comp.getCompetitionName());
        }
        if (reg.getStudentId() != null) {
            User user = userMapper.selectById(reg.getStudentId());
            if (user != null) reg.setStudentName(user.getRealName());
        }
        if (reg.getTeamId() != null) {
            CompetitionTeam team = teamMapper.selectById(reg.getTeamId());
            if (team != null) reg.setTeamName(team.getTeamName());
        }
    }

    private void fillTeamInfo(CompetitionTeam team) {
        if (team.getLeaderId() != null) {
            User leader = userMapper.selectById(team.getLeaderId());
            if (leader != null) team.setLeaderName(leader.getRealName());
        }
        if (team.getCompetitionId() != null) {
            Competition comp = competitionMapper.selectById(team.getCompetitionId());
            if (comp != null) team.setCompetitionName(comp.getCompetitionName());
        }
        // 加载成员
        List<CompetitionTeamMember> members = teamMemberMapper.selectList(
                new LambdaQueryWrapper<CompetitionTeamMember>()
                        .eq(CompetitionTeamMember::getTeamId, team.getId())
                        .eq(CompetitionTeamMember::getStatus, 1)
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
