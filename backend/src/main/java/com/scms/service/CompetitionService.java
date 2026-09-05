package com.scms.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.scms.common.PageResult;
import com.scms.common.Result;
import com.scms.dto.CompetitionDTO;
import com.scms.entity.Competition;
import com.scms.entity.CompetitionTeam;
import com.scms.entity.CompetitionTeamMember;
import com.scms.entity.User;
import com.scms.mapper.CompetitionMapper;
import com.scms.mapper.CompetitionTeamMapper;
import com.scms.mapper.CompetitionTeamMemberMapper;
import com.scms.mapper.UserMapper;
import com.scms.security.LoginUser;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CompetitionService {

    private final CompetitionMapper competitionMapper;
    private final CompetitionTeamMapper teamMapper;
    private final CompetitionTeamMemberMapper teamMemberMapper;
    private final UserMapper userMapper;

    public Result<?> listCompetitions(int current, int size, String keyword,
                                       Integer status, Long publisherId, Long currentUserId) {
        Page<Competition> page = new Page<>(current, size);
        LambdaQueryWrapper<Competition> wrapper = new LambdaQueryWrapper<>();
        if (StringUtils.hasText(keyword)) {
            wrapper.like(Competition::getCompetitionName, keyword);
        }
        // 状态筛选按"派生状态"匹配：库存 2(已发布)/3(进行中) 的行会按日期派生为 报名中/进行中/已结束
        LocalDateTime now = LocalDateTime.now();
        if (status != null) {
            if (status == 2) {
                // 报名中：已发布且尚未开赛
                wrapper.in(Competition::getStatus, 2, 3).ge(Competition::getCompetitionStart, now);
            } else if (status == 3) {
                // 进行中：已开赛且未结束
                wrapper.in(Competition::getStatus, 2, 3).lt(Competition::getCompetitionStart, now)
                        .ge(Competition::getCompetitionEnd, now);
            } else if (status == 4) {
                // 已结束：库存已结束，或已过结束时间
                wrapper.and(w -> w.eq(Competition::getStatus, 4)
                        .or(o -> o.in(Competition::getStatus, 2, 3).lt(Competition::getCompetitionEnd, now)));
            } else {
                wrapper.eq(Competition::getStatus, status);
            }
        }
        if (publisherId != null) wrapper.eq(Competition::getPublisherId, publisherId);
        // 学生只能看到已发布的竞赛（草稿仅发布者/管理员可见）
        if (isStudent(currentUserId)) wrapper.ne(Competition::getStatus, 0);
        wrapper.orderByDesc(Competition::getCreateTime);

        Page<Competition> result = competitionMapper.selectPage(page, wrapper);
        result.getRecords().forEach(c -> fillCompetitionInfo(c, currentUserId));
        return Result.success(new PageResult<>(result));
    }

    /** 学生 userType=1 */
    private boolean isStudent(Long userId) {
        if (userId == null) return false;
        User u = userMapper.selectById(userId);
        return u != null && u.getUserType() != null && u.getUserType() == 1;
    }

    public Result<?> getCompetitionById(Long id, Long currentUserId) {
        Competition comp = competitionMapper.selectById(id);
        if (comp == null) return Result.error("竞赛不存在");
        // 草稿仅发布者与管理员可见
        if (comp.getStatus() != null && comp.getStatus() == 0 && !isStudentAllowedDraft(comp, currentUserId)) {
            return Result.error("竞赛不存在");
        }

        fillCompetitionInfo(comp, currentUserId);

        return Result.success(comp);
    }

    private boolean isStudentAllowedDraft(Competition comp, Long userId) {
        if (userId == null) return false;
        if (userId.equals(comp.getPublisherId())) return true;
        User u = userMapper.selectById(userId);
        return u != null && u.getUserType() != null && u.getUserType() == 3;
    }

    @Transactional
    public Result<?> createCompetition(CompetitionDTO dto, Long publisherId) {
        Competition comp = new Competition();
        comp.setCompetitionName(dto.getCompetitionName());
        comp.setOrganizer(dto.getOrganizer());
        comp.setPublisherId(publisherId);
        comp.setCoverImage(dto.getCoverImage());
        comp.setDescription(dto.getDescription());
        comp.setRules(dto.getRules());
        comp.setRegistrationStart(dto.getRegistrationStart());
        comp.setRegistrationEnd(dto.getRegistrationEnd());
        comp.setCompetitionStart(dto.getCompetitionStart());
        comp.setCompetitionEnd(dto.getCompetitionEnd());
        comp.setLocation(dto.getLocation());
        comp.setMaxMembers(dto.getMaxMembers());
        comp.setAwards(dto.getAwards());
        comp.setAttachments(dto.getAttachments());
        // 发布即生效：未显式指定状态时直接发布
        comp.setStatus(dto.getStatus() != null ? dto.getStatus() : 2);
        competitionMapper.insert(comp);
        return Result.success("创建成功", comp);
    }

    @Transactional
    public Result<?> updateCompetition(CompetitionDTO dto) {
        Competition comp = competitionMapper.selectById(dto.getId());
        if (comp == null) return Result.error("竞赛不存在");

        if (StringUtils.hasText(dto.getCompetitionName())) comp.setCompetitionName(dto.getCompetitionName());
        if (dto.getOrganizer() != null) comp.setOrganizer(dto.getOrganizer());
        if (dto.getCoverImage() != null) comp.setCoverImage(dto.getCoverImage());
        if (dto.getDescription() != null) comp.setDescription(dto.getDescription());
        if (dto.getRules() != null) comp.setRules(dto.getRules());
        if (dto.getRegistrationStart() != null) comp.setRegistrationStart(dto.getRegistrationStart());
        if (dto.getRegistrationEnd() != null) comp.setRegistrationEnd(dto.getRegistrationEnd());
        if (dto.getCompetitionStart() != null) comp.setCompetitionStart(dto.getCompetitionStart());
        if (dto.getCompetitionEnd() != null) comp.setCompetitionEnd(dto.getCompetitionEnd());
        if (dto.getLocation() != null) comp.setLocation(dto.getLocation());
        if (dto.getMaxMembers() != null) comp.setMaxMembers(dto.getMaxMembers());
        if (dto.getAwards() != null) comp.setAwards(dto.getAwards());
        if (dto.getAttachments() != null) comp.setAttachments(dto.getAttachments());
        if (dto.getStatus() != null) comp.setStatus(dto.getStatus());

        competitionMapper.updateById(comp);
        return Result.success("更新成功", null);
    }

    @Transactional
    public Result<?> deleteCompetition(Long id) {
        // 级联删除参赛队伍与成员
        List<CompetitionTeam> teams = teamMapper.selectList(
                new LambdaQueryWrapper<CompetitionTeam>().eq(CompetitionTeam::getCompetitionId, id));
        for (CompetitionTeam team : teams) {
            teamMemberMapper.delete(new LambdaQueryWrapper<CompetitionTeamMember>()
                    .eq(CompetitionTeamMember::getTeamId, team.getId()));
        }
        teamMapper.delete(new LambdaQueryWrapper<CompetitionTeam>().eq(CompetitionTeam::getCompetitionId, id));
        competitionMapper.deleteById(id);
        return Result.success("删除成功", null);
    }

    public Result<?> getDashboardStats(Long userId, String role) {
        java.util.Map<String, Object> stats = new java.util.HashMap<>();

        if ("admin".equals(role)) {
            stats.put("totalUsers", userMapper.selectCount(null));
            stats.put("totalCompetitions", competitionMapper.selectCount(null));
            stats.put("totalRegistrations", teamMapper.selectCount(null)); // 参赛队伍数
        } else if ("teacher".equals(role)) {
            stats.put("myCompetitions", competitionMapper.selectCount(
                    new LambdaQueryWrapper<Competition>().eq(Competition::getPublisherId, userId)));
            stats.put("totalRegistrations", teamMapper.selectCount(
                    new LambdaQueryWrapper<CompetitionTeam>().apply(
                            "competition_id IN (SELECT id FROM competition WHERE publisher_id = {0})", userId)));
        } else {
            stats.put("myRegistrations", teamMemberMapper.selectCount(
                    new LambdaQueryWrapper<CompetitionTeamMember>()
                            .eq(CompetitionTeamMember::getStudentId, userId)));
            stats.put("availableCompetitions", competitionMapper.selectCount(
                    new LambdaQueryWrapper<Competition>().eq(Competition::getStatus, 2)));
        }

        return Result.success(stats);
    }

    private void fillCompetitionInfo(Competition c, Long currentUserId) {
        // 发布人姓名
        if (c.getPublisherId() != null) {
            User publisher = userMapper.selectById(c.getPublisherId());
            if (publisher != null) c.setPublisherName(publisher.getRealName());
        }
        // 参赛队伍数
        c.setRegistrationCount(teamMapper.selectCount(
                new LambdaQueryWrapper<CompetitionTeam>().eq(CompetitionTeam::getCompetitionId, c.getId())
        ).intValue());
        // 是否已参赛（在该竞赛的任一队伍中）
        if (currentUserId != null) {
            c.setHasRegistered(teamMapper.selectCount(
                    new LambdaQueryWrapper<CompetitionTeam>()
                            .eq(CompetitionTeam::getCompetitionId, c.getId())
                            .apply("id IN (SELECT team_id FROM competition_team_member WHERE student_id = {0})", currentUserId)
            ) > 0);
        }
        // 自动判断竞赛状态
        autoUpdateStatus(c);
    }

    private void autoUpdateStatus(Competition c) {
        if (c.getStatus() != null && c.getStatus() >= 2 && c.getStatus() <= 3) {
            LocalDateTime now = LocalDateTime.now();
            // 顺序派生：已发布→进行中→已结束（链式判断，跨过结束时间的行直接落到已结束）
            if (c.getStatus() == 2 && now.isAfter(c.getCompetitionStart())) {
                c.setStatus(3);
            }
            if (c.getStatus() == 3 && now.isAfter(c.getCompetitionEnd())) {
                c.setStatus(4);
            }
        }
    }
}
