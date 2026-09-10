package com.scms.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.scms.common.PageResult;
import com.scms.common.Pages;
import com.scms.common.Result;
import com.scms.dto.CompetitionDTO;
import com.scms.entity.Competition;
import com.scms.entity.CompetitionTeam;
import com.scms.entity.CompetitionTeamMember;
import com.scms.entity.CompetitionResult;
import com.scms.entity.CommunityRequest;
import com.scms.entity.Notification;
import com.scms.entity.RecruitPost;
import com.scms.entity.User;
import com.scms.mapper.CompetitionMapper;
import com.scms.mapper.CompetitionResultMapper;
import com.scms.mapper.CompetitionTeamMapper;
import com.scms.mapper.CompetitionTeamMemberMapper;
import com.scms.mapper.CommunityRequestMapper;
import com.scms.mapper.NotificationMapper;
import com.scms.mapper.RecruitPostMapper;
import com.scms.mapper.UserMapper;
import com.scms.security.LoginUser;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CompetitionService {

    private final CompetitionMapper competitionMapper;
    private final CompetitionTeamMapper teamMapper;
    private final CompetitionTeamMemberMapper teamMemberMapper;
    private final RecruitPostMapper recruitPostMapper;
    private final CompetitionResultMapper resultMapper;
    private final UserMapper userMapper;
    private final CommunityRequestMapper requestMapper;
    private final NotificationMapper notificationMapper;

    public Result<?> listCompetitions(int current, int size, String keyword,
                                       Integer status, Long publisherId, Long currentUserId) {
        Page<Competition> page = Pages.of(current, size);
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
        // 草稿仅发布者与管理员可见：与详情口径一致，非管理员的列表不得出现他人草稿行
        if (!isAdminUser(currentUserId)) {
            wrapper.and(w -> w.ne(Competition::getStatus, 0)
                    .or().eq(Competition::getPublisherId, currentUserId));
        }
        wrapper.orderByDesc(Competition::getCreateTime);

        Page<Competition> result = competitionMapper.selectPage(page, wrapper);
        result.getRecords().forEach(c -> fillCompetitionInfo(c, currentUserId));
        return Result.success(new PageResult<>(result));
    }

    /** 管理员 userType=3 */
    private boolean isAdminUser(Long userId) {
        if (userId == null) return false;
        User u = userMapper.selectById(userId);
        return u != null && u.getUserType() != null && u.getUserType() == 3;
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
        Result<?> valid = validateCompetition(dto);
        if (valid != null) return valid;
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
        comp.setMaxMembers(dto.getMaxMembers() != null ? dto.getMaxMembers() : 1);
        comp.setAwards(dto.getAwards());
        comp.setAttachments(dto.getAttachments());
        // 发布即生效：未显式指定状态时直接发布
        comp.setStatus(dto.getStatus() != null ? dto.getStatus() : 2);
        competitionMapper.insert(comp);
        return Result.success("创建成功", comp);
    }

    /** 边界校验：各阶段起止顺序、每队人数范围、字段长度（与列宽一致，防 DB 约束 500）；通过返回 null，否则返回错误 */
    private Result<?> validateCompetition(CompetitionDTO dto) {
        if (dto.getCompetitionName() != null && dto.getCompetitionName().length() > 100) return Result.error("竞赛名称不能超过 100 字");
        if (dto.getOrganizer() != null && dto.getOrganizer().length() > 100) return Result.error("主办方不能超过 100 字");
        if (dto.getLocation() != null && dto.getLocation().length() > 200) return Result.error("地点不能超过 200 字");
        if (dto.getRegistrationStart() != null && dto.getRegistrationEnd() != null
                && dto.getRegistrationEnd().isBefore(dto.getRegistrationStart())) {
            return Result.error("报名截止时间不能早于报名开始时间");
        }
        if (dto.getCompetitionStart() != null && dto.getCompetitionEnd() != null
                && dto.getCompetitionEnd().isBefore(dto.getCompetitionStart())) {
            return Result.error("比赛结束时间不能早于比赛开始时间");
        }
        if (dto.getRegistrationEnd() != null && dto.getCompetitionStart() != null
                && dto.getCompetitionStart().isBefore(dto.getRegistrationEnd())) {
            return Result.error("比赛开始时间不能早于报名截止时间");
        }
        if (dto.getMaxMembers() != null && (dto.getMaxMembers() < 1 || dto.getMaxMembers() > 99)) {
            return Result.error("每队人数须在 1 ~ 99 之间");
        }
        // 写入域：仅允许 草稿(0)/已发布(2)/进行中(3)/已结束(4)；1/5 为历史遗留态不接受新写入
        if (dto.getStatus() != null) {
            int s = dto.getStatus();
            if (s != 0 && s != 2 && s != 3 && s != 4) return Result.error("状态值无效");
        }
        return null;
    }

    @Transactional
    public Result<?> updateCompetition(CompetitionDTO dto, Long userId, String role) {
        Competition comp = competitionMapper.selectById(dto.getId());
        if (comp == null) return Result.error("竞赛不存在");
        // 边界：教师只能编辑自己发布的竞赛，管理员不限
        if ("teacher".equals(role) && !userId.equals(comp.getPublisherId())) {
            return Result.error("只能编辑自己发布的竞赛");
        }
        Result<?> valid = validateCompetition(dto);
        if (valid != null) return valid;
        // 收缩守卫：每队上限不得低于任一现有队伍实际人数，防止队伍进入永久拒入的非法容量态
        if (dto.getMaxMembers() != null) {
            List<CompetitionTeamMember> members = teamMemberMapper.selectList(
                    new LambdaQueryWrapper<CompetitionTeamMember>()
                            .eq(CompetitionTeamMember::getCompetitionId, comp.getId()));
            java.util.Map<Long, Long> perTeam = new java.util.HashMap<>();
            for (CompetitionTeamMember m : members) {
                perTeam.merge(m.getTeamId(), 1L, Long::sum);
            }
            long maxNow = perTeam.values().stream().mapToLong(Long::longValue).max().orElse(0);
            if (dto.getMaxMembers() < maxNow) {
                return Result.error("每队人数上限不能小于现有队伍人数（当前最多 " + maxNow + " 人）");
            }
        }

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
    public Result<?> deleteCompetition(Long id, Long userId, String role) {
        Competition comp = competitionMapper.selectById(id);
        if (comp == null) return Result.error("竞赛不存在");
        // 边界：教师只能删除自己发布的竞赛，管理员不限
        if ("teacher".equals(role) && !userId.equals(comp.getPublisherId())) {
            return Result.error("只能删除自己发布的竞赛");
        }
        // 级联清理：队伍成员、队伍、招募帖、成绩、关联的入队申请/邀请及其站内通知，避免悬空引用
        List<CompetitionTeam> teams = teamMapper.selectList(
                new LambdaQueryWrapper<CompetitionTeam>().eq(CompetitionTeam::getCompetitionId, id));
        List<Long> teamIds = new ArrayList<>();
        for (CompetitionTeam team : teams) {
            teamMemberMapper.delete(new LambdaQueryWrapper<CompetitionTeamMember>()
                    .eq(CompetitionTeamMember::getTeamId, team.getId()));
            teamIds.add(team.getId());
        }
        List<RecruitPost> posts = recruitPostMapper.selectList(
                new LambdaQueryWrapper<RecruitPost>().eq(RecruitPost::getCompetitionId, id));
        List<Long> postIds = new ArrayList<>();
        posts.forEach(p -> postIds.add(p.getId()));

        if (!teamIds.isEmpty() || !postIds.isEmpty()) {
            LambdaQueryWrapper<CommunityRequest> rw = new LambdaQueryWrapper<>();
            if (!teamIds.isEmpty() && !postIds.isEmpty()) {
                rw.in(CommunityRequest::getTeamId, teamIds).or().in(CommunityRequest::getPostId, postIds);
            } else if (!teamIds.isEmpty()) {
                rw.in(CommunityRequest::getTeamId, teamIds);
            } else {
                rw.in(CommunityRequest::getPostId, postIds);
            }
            List<Long> reqIds = new ArrayList<>();
            requestMapper.selectList(rw).forEach(r -> reqIds.add(r.getId()));
            if (!reqIds.isEmpty()) {
                notificationMapper.delete(new LambdaQueryWrapper<Notification>()
                        .eq(Notification::getRefType, "request").in(Notification::getRefId, reqIds));
                requestMapper.deleteBatchIds(reqIds);
            }
        }
        if (!teamIds.isEmpty()) {
            notificationMapper.delete(new LambdaQueryWrapper<Notification>()
                    .eq(Notification::getRefType, "team").in(Notification::getRefId, teamIds));
        }
        teamMapper.delete(new LambdaQueryWrapper<CompetitionTeam>().eq(CompetitionTeam::getCompetitionId, id));
        recruitPostMapper.delete(new LambdaQueryWrapper<RecruitPost>().eq(RecruitPost::getCompetitionId, id));
        resultMapper.delete(new LambdaQueryWrapper<CompetitionResult>().eq(CompetitionResult::getCompetitionId, id));
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
            // 可用竞赛=当前正处于报名窗口的竞赛（时间派生口径，避免把已结束/未开赛的库存 status=2 计入）
            LocalDateTime now = LocalDateTime.now();
            stats.put("availableCompetitions", competitionMapper.selectCount(
                    new LambdaQueryWrapper<Competition>()
                            .in(Competition::getStatus, 2, 3)
                            .le(Competition::getRegistrationStart, now)
                            .ge(Competition::getRegistrationEnd, now)));
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
            // 完全按时间双向派生，与列表筛选/统计口径一致：未开赛=报名中(2)，已开赛未结束=进行中(3)，已过结束=已结束(4)。
            // 必须向下修正：库存 status=3 的行在竞赛尚未开赛前仍处报名窗口，徽章若沿用库存值会与筛选结果矛盾。
            if (c.getCompetitionEnd() != null && now.isAfter(c.getCompetitionEnd())) {
                c.setStatus(4);
            } else if (c.getCompetitionStart() != null && now.isAfter(c.getCompetitionStart())) {
                c.setStatus(3);
            } else {
                c.setStatus(2);
            }
        }
    }
}
