package com.scms.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.scms.common.PageResult;
import com.scms.common.Pages;
import com.scms.common.Result;
import com.scms.dto.CommunityRequestDTO;
import com.scms.entity.*;
import com.scms.mapper.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * 社区请求全链路：入队申请(2) / 入队邀请(3)，均可附备注（message，常写联系方式）便于快速沟通。
 * 同意后由 RegistrationService 完成入队；资料互看(1)已下线，存量 type=1 数据仅作历史、列表不再暴露。
 */
@Service
@RequiredArgsConstructor
public class CommunityService {

    private final CommunityRequestMapper requestMapper;
    private final RecruitPostMapper recruitPostMapper;
    private final CompetitionTeamMapper teamMapper;
    private final CompetitionTeamMemberMapper teamMemberMapper;
    private final CompetitionMapper competitionMapper;
    private final UserMapper userMapper;
    private final CardService cardService;
    private final RegistrationService registrationService;
    private final NotificationService notificationService;

    @Transactional
    public Result<?> createRequest(CommunityRequestDTO dto, Long meId) {
        if (dto.getType() == null || dto.getType() < 2 || dto.getType() > 3) return Result.error("请求类型无效");
        String message = dto.getMessage();
        // 列宽 VARCHAR(500)：超长须在应用层结构化拒绝，避免落到 DB 报 500
        if (message != null && message.length() > 500) return Result.error("留言不能超过 500 字");

        // type=2/3 均基于招募帖
        if (dto.getPostId() == null) return Result.error("请指定招募帖");
        RecruitPost post = recruitPostMapper.selectById(dto.getPostId());
        if (post == null || post.getStatus() != 1) return Result.error("招募帖不存在或已关闭");

        CommunityRequest req;
        if (dto.getType() == 2) {
            // 入队申请：申请人 → 帖子发布者（须为该竞赛招募帖）
            if (post.getType() != 1) return Result.error("该帖子是求组帖，不能申请加入");
            Long leader = post.getUserId();
            if (leader.equals(meId)) return Result.error("不能申请加入自己的队伍");
            Long teamId = post.getTeamId();
            if (teamId == null) return Result.error("该招募未关联队伍");
            if (isInTeam(teamId, meId)) return Result.error("你已在队伍中");
            if (hasPendingRequest(meId, 2, teamId, post.getId())) return Result.error("已有待处理的申请，请等待队长处理，勿重复提交");
            String preErr = precheckJoinable(teamId, meId, true);
            if (preErr != null) return Result.error(preErr);

            req = build(meId, leader, message, post.getId(), teamId, 2);
            requestMapper.insert(req);
            User me = userMapper.selectById(meId);
            notificationService.send(leader, "interaction", "收到新的入队申请",
                    cardService.displayName(me) + " 申请加入你的队伍，去组队中心处理。",
                    "request", req.getId());
        } else {
            // 入队邀请：队长 → 求组帖发布者
            if (post.getType() != 2) return Result.error("该帖子是招募帖，无需邀请");
            Long teamId = dto.getTeamId();
            if (teamId == null) return Result.error("请选择要邀请对方加入的队伍");
            CompetitionTeam team = teamMapper.selectById(teamId);
            if (team == null) return Result.error("队伍不存在");
            if (!meId.equals(team.getLeaderId())) return Result.error("只有队长可以发起入队邀请");
            if (!team.getCompetitionId().equals(post.getCompetitionId())) return Result.error("队伍与该竞赛不匹配");
            Long invitee = post.getUserId();
            if (invitee.equals(meId)) return Result.error("不能邀请自己");
            if (isInTeam(teamId, invitee)) return Result.error("对方已在队伍中");
            if (hasPendingRequest(meId, 3, teamId, post.getId())) return Result.error("已向对方发出待处理的邀请，勿重复发送");
            String preErr = precheckJoinable(teamId, invitee, false);
            if (preErr != null) return Result.error(preErr);

            req = build(meId, invitee, message, post.getId(), teamId, 3);
            requestMapper.insert(req);
            User me = userMapper.selectById(meId);
            notificationService.send(invitee, "interaction", "收到入队邀请",
                    cardService.displayName(me) + " 邀请你加入「" + team.getTeamName() + "」，去组队中心处理。",
                    "request", req.getId());
        }
        return Result.success("已发送", req);
    }

    @Transactional
    public Result<?> handle(Long id, Integer status, Long meId) {
        if (status == null || (status != 1 && status != 2)) return Result.error("无效的处理结果");
        CommunityRequest req = requestMapper.selectById(id);
        if (req == null) return Result.error("请求不存在");
        if (!meId.equals(req.getToUserId())) return Result.error("无权处理该请求");
        if (req.getStatus() != 0) return Result.error("该请求已处理");

        String meName = cardService.displayName(userMapper.selectById(meId));

        if (req.getType() == 2) {
            // 入队申请：我（队长）处理 from_user 的申请
            if (status == 1) {
                Result<?> joinResult = registrationService.addMemberToTeam(req.getTeamId(), req.getFromUserId());
                if (joinResult.getCode() != 200) return joinResult;
                req.setStatus(1);
                req.setHandleTime(LocalDateTime.now());
                requestMapper.updateById(req);
                CompetitionTeam team = teamMapper.selectById(req.getTeamId());
                notificationService.send(req.getFromUserId(), "interaction", "入队申请已通过",
                        (team != null ? "你已加入「" + team.getTeamName() + "」。" : "入队成功。") + joinResult.getMessage(),
                        "request", req.getId());
                closePostIfFull(req.getTeamId());
                return Result.success("已同意加入", null);
            }
            req.setStatus(2);
            req.setHandleTime(LocalDateTime.now());
            requestMapper.updateById(req);
            notificationService.send(req.getFromUserId(), "interaction", "入队申请被拒绝",
                    meName + " 拒绝了你的入队申请。", "request", req.getId());
            return Result.success("已拒绝", null);
        }

        // type=3 入队邀请：我（被邀请人）处理
        if (status == 1) {
            Result<?> joinResult = registrationService.addMemberToTeam(req.getTeamId(), meId);
            if (joinResult.getCode() != 200) return joinResult;
            req.setStatus(1);
            req.setHandleTime(LocalDateTime.now());
            requestMapper.updateById(req);
            CompetitionTeam team = teamMapper.selectById(req.getTeamId());
            notificationService.send(req.getFromUserId(), "interaction", "入队邀请已接受",
                    meName + " 接受了你的邀请，已加入「" + (team != null ? team.getTeamName() : "队伍") + "」。",
                    "request", req.getId());
            closePostIfFull(req.getTeamId());
            return Result.success("已接受邀请", null);
        }
        req.setStatus(2);
        req.setHandleTime(LocalDateTime.now());
        requestMapper.updateById(req);
        notificationService.send(req.getFromUserId(), "interaction", "入队邀请被拒绝",
                meName + " 拒绝了你的入队邀请。", "request", req.getId());
        return Result.success("已拒绝", null);
    }

    /** 收到的请求（待处理优先展示；type=1 资料互看已下线，历史数据不暴露） */
    public Result<?> received(int current, int size, Integer type, Integer status, Long meId) {
        Page<CommunityRequest> page = Pages.of(current, size);
        LambdaQueryWrapper<CommunityRequest> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(CommunityRequest::getToUserId, meId);
        wrapper.ne(CommunityRequest::getType, 1);
        if (type != null) wrapper.eq(CommunityRequest::getType, type);
        if (status != null) wrapper.eq(CommunityRequest::getStatus, status);
        wrapper.orderByAsc(CommunityRequest::getStatus).orderByDesc(CommunityRequest::getCreateTime);
        Page<CommunityRequest> result = requestMapper.selectPage(page, wrapper);
        result.getRecords().forEach(this::fillRequest);
        return Result.success(new PageResult<>(result));
    }

    /** 我发出的请求（type=1 资料互看已下线，历史数据不暴露） */
    public Result<?> sent(int current, int size, Integer type, Integer status, Long meId) {
        Page<CommunityRequest> page = Pages.of(current, size);
        LambdaQueryWrapper<CommunityRequest> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(CommunityRequest::getFromUserId, meId);
        wrapper.ne(CommunityRequest::getType, 1);
        if (type != null) wrapper.eq(CommunityRequest::getType, type);
        if (status != null) wrapper.eq(CommunityRequest::getStatus, status);
        wrapper.orderByDesc(CommunityRequest::getCreateTime);
        Page<CommunityRequest> result = requestMapper.selectPage(page, wrapper);
        result.getRecords().forEach(this::fillRequest);
        return Result.success(new PageResult<>(result));
    }

    private CommunityRequest build(Long from, Long to, String message, Long postId, Long teamId, int type) {
        CommunityRequest req = new CommunityRequest();
        req.setType(type);
        req.setFromUserId(from);
        req.setToUserId(to);
        req.setMessage(message);
        req.setPostId(postId);
        req.setTeamId(teamId);
        req.setStatus(0);
        return req;
    }

    /** 同一发起人对该帖/队是否已有待处理的同类型请求（防刷屏与重复通知） */
    private boolean hasPendingRequest(Long fromUserId, int type, Long teamId, Long postId) {
        Long count = requestMapper.selectCount(new LambdaQueryWrapper<CommunityRequest>()
                .eq(CommunityRequest::getFromUserId, fromUserId)
                .eq(CommunityRequest::getType, type)
                .eq(CommunityRequest::getTeamId, teamId)
                .eq(CommunityRequest::getPostId, postId)
                .eq(CommunityRequest::getStatus, 0));
        return count != null && count > 0;
    }

    private boolean isInTeam(Long teamId, Long userId) {
        Long count = teamMemberMapper.selectCount(
                new LambdaQueryWrapper<CompetitionTeamMember>()
                        .eq(CompetitionTeamMember::getTeamId, teamId)
                        .eq(CompetitionTeamMember::getStudentId, userId)
        );
        return count != null && count > 0;
    }

    /** 发送申请/邀请前的快失败预校验：名单冻结、报名时间窗、满员、已在其他队伍（最终闸门仍在 addMemberToTeam）；返回错误文案或 null */
    private String precheckJoinable(Long teamId, Long studentId, boolean forSelf) {
        CompetitionTeam team = teamMapper.selectById(teamId);
        if (team == null) return "队伍不存在";
        Integer st = team.getStatus();
        if (st != null && st != 0 && st != 3) return "该队伍名单已提交审核，暂不接受变更";
        Competition comp = competitionMapper.selectById(team.getCompetitionId());
        if (comp == null) return "所属竞赛不存在";
        String windowErr = registrationService.checkRegistrationWindow(comp);
        if (windowErr != null) return windowErr;
        long members = teamMemberMapper.selectCount(
                new LambdaQueryWrapper<CompetitionTeamMember>()
                        .eq(CompetitionTeamMember::getTeamId, teamId)
        );
        if (comp.getMaxMembers() != null && members >= comp.getMaxMembers()) return "该队伍人数已满";
        Long joinedOther = teamMemberMapper.selectCount(
                new LambdaQueryWrapper<CompetitionTeamMember>()
                        .eq(CompetitionTeamMember::getCompetitionId, team.getCompetitionId())
                        .eq(CompetitionTeamMember::getStudentId, studentId)
                        .ne(CompetitionTeamMember::getTeamId, teamId)
        );
        if (joinedOther != null && joinedOther > 0) {
            return forSelf ? "你已参加了此竞赛的其他队伍" : "对方已参加了此竞赛的其他队伍";
        }
        return null;
    }

    /** 队伍满员后自动关闭其招募帖 */
    private void closePostIfFull(Long teamId) {
        CompetitionTeam team = teamMapper.selectById(teamId);
        if (team == null) return;
        Competition comp = competitionMapper.selectById(team.getCompetitionId());
        if (comp == null || comp.getMaxMembers() == null) return;
        long members = teamMemberMapper.selectCount(
                new LambdaQueryWrapper<CompetitionTeamMember>()
                        .eq(CompetitionTeamMember::getTeamId, teamId)
        );
        if (members >= comp.getMaxMembers()) {
            List<RecruitPost> posts = recruitPostMapper.selectList(
                    new LambdaQueryWrapper<RecruitPost>()
                            .eq(RecruitPost::getTeamId, teamId)
                            .eq(RecruitPost::getStatus, 1)
            );
            posts.forEach(p -> {
                p.setStatus(0);
                recruitPostMapper.updateById(p);
                notificationService.send(p.getUserId(), "system", "招募帖已自动关闭",
                        "「" + p.getTitle() + "」所属队伍已满员，招募帖自动关闭。",
                        "recruit", p.getId());
            });
        }
    }

    private void fillRequest(CommunityRequest req) {
        req.setFromUser(cardService.card(req.getFromUserId(), req.getToUserId()));
        req.setToUser(cardService.card(req.getToUserId(), req.getFromUserId()));
        if (req.getPostId() != null) {
            RecruitPost post = recruitPostMapper.selectById(req.getPostId());
            if (post != null) req.setPostTitle(post.getTitle());
        }
        if (req.getTeamId() != null) {
            CompetitionTeam team = teamMapper.selectById(req.getTeamId());
            if (team != null) {
                req.setTeamName(team.getTeamName());
                Competition comp = competitionMapper.selectById(team.getCompetitionId());
                if (comp != null) req.setCompetitionName(comp.getCompetitionName());
            }
        }
    }
}
