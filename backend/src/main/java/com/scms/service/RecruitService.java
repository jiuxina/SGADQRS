package com.scms.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.scms.common.PageResult;
import com.scms.common.Pages;
import com.scms.common.Result;
import com.scms.dto.RecruitPostDTO;
import com.scms.entity.*;
import com.scms.mapper.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class RecruitService {

    private final RecruitPostMapper recruitPostMapper;
    private final CompetitionMapper competitionMapper;
    private final CompetitionTeamMapper teamMapper;
    private final CompetitionTeamMemberMapper teamMemberMapper;
    private final UserMapper userMapper;
    private final CardService cardService;

    @Transactional
    public Result<?> create(RecruitPostDTO dto, Long meId) {
        if (dto.getType() == null || (dto.getType() != 1 && dto.getType() != 2)) return Result.error("帖子类型无效");
        if (dto.getCompetitionId() == null) return Result.error("请选择竞赛");
        if (dto.getTitle() == null || dto.getTitle().isBlank()) return Result.error("请填写标题");

        Competition comp = competitionMapper.selectById(dto.getCompetitionId());
        if (comp == null) return Result.error("竞赛不存在");
        if (comp.getStatus() != 2 && comp.getStatus() != 3) return Result.error("该竞赛当前不可组队");

        // 每人每竞赛仅一条招募中帖子
        Long active = recruitPostMapper.selectCount(
                new LambdaQueryWrapper<RecruitPost>()
                        .eq(RecruitPost::getUserId, meId)
                        .eq(RecruitPost::getCompetitionId, dto.getCompetitionId())
                        .eq(RecruitPost::getStatus, 1)
        );
        if (active != null && active > 0) return Result.error("你已在该竞赛下发布过帖子，请先关闭原帖");

        RecruitPost post = new RecruitPost();
        post.setCompetitionId(dto.getCompetitionId());
        post.setUserId(meId);
        post.setType(dto.getType());
        post.setTitle(dto.getTitle().trim());
        post.setContent(dto.getContent());
        post.setTags(dto.getTags());
        post.setDeadline(dto.getDeadline());
        post.setStatus(1);

        if (dto.getType() == 1) {
            // 招募帖：必须关联本人任队长、且属于该竞赛的队伍（不再隐式建队）
            if (dto.getTeamId() == null) {
                return Result.error("请先在组队中心创建队伍再发布招募，或改用「求组」类型发帖");
            }
            CompetitionTeam team = teamMapper.selectById(dto.getTeamId());
            if (team == null) return Result.error("关联队伍不存在");
            if (!meId.equals(team.getLeaderId())) return Result.error("只有队长可以为队伍发布招募");
            if (!dto.getCompetitionId().equals(team.getCompetitionId())) return Result.error("关联队伍不属于该竞赛");
            post.setTeamId(dto.getTeamId());
        } else {
            post.setTeamId(null);
        }

        recruitPostMapper.insert(post);
        return Result.success("发布成功", post);
    }

    public Result<?> list(int current, int size, Long competitionId, Integer type, Integer status,
                          String keyword, Long meId) {
        Page<RecruitPost> page = Pages.of(current, size);
        LambdaQueryWrapper<RecruitPost> wrapper = new LambdaQueryWrapper<>();
        if (competitionId != null) wrapper.eq(RecruitPost::getCompetitionId, competitionId);
        if (type != null) wrapper.eq(RecruitPost::getType, type);
        if (status != null) wrapper.eq(RecruitPost::getStatus, status);
        if (keyword != null && !keyword.isBlank()) {
            wrapper.and(w -> w.like(RecruitPost::getTitle, keyword)
                    .or().like(RecruitPost::getContent, keyword)
                    .or().like(RecruitPost::getTags, keyword));
        }
        wrapper.orderByDesc(RecruitPost::getCreateTime);

        Page<RecruitPost> result = recruitPostMapper.selectPage(page, wrapper);
        result.getRecords().forEach(p -> fillPost(p, meId));
        return Result.success(new PageResult<>(result));
    }

    public Result<?> detail(Long id, Long meId) {
        RecruitPost post = recruitPostMapper.selectById(id);
        if (post == null) return Result.error("帖子不存在");
        fillPost(post, meId);
        return Result.success(post);
    }

    public Result<?> mine(Long meId) {
        List<RecruitPost> posts = recruitPostMapper.selectList(
                new LambdaQueryWrapper<RecruitPost>()
                        .eq(RecruitPost::getUserId, meId)
                        .orderByDesc(RecruitPost::getCreateTime)
        );
        posts.forEach(p -> fillPost(p, meId));
        return Result.success(posts);
    }

    @Transactional
    public Result<?> update(Long id, RecruitPostDTO dto, Long meId) {
        RecruitPost post = recruitPostMapper.selectById(id);
        if (post == null) return Result.error("帖子不存在");
        if (!meId.equals(post.getUserId())) return Result.error("只能编辑自己的帖子");
        if (dto.getTitle() != null && !dto.getTitle().isBlank()) post.setTitle(dto.getTitle().trim());
        if (dto.getContent() != null) post.setContent(dto.getContent());
        if (dto.getTags() != null) post.setTags(dto.getTags());
        if (dto.getDeadline() != null) post.setDeadline(dto.getDeadline());
        recruitPostMapper.updateById(post);
        return Result.success("更新成功", post);
    }

    /** 关闭帖子（发布者本人或管理员） */
    @Transactional
    public Result<?> close(Long id, Long meId, boolean isAdmin) {
        RecruitPost post = recruitPostMapper.selectById(id);
        if (post == null) return Result.error("帖子不存在");
        if (!isAdmin && !meId.equals(post.getUserId())) return Result.error("无权操作");
        post.setStatus(0);
        recruitPostMapper.updateById(post);
        return Result.success("已关闭", null);
    }

    private void fillPost(RecruitPost post, Long viewerId) {
        Competition comp = competitionMapper.selectById(post.getCompetitionId());
        if (comp != null) post.setCompetitionName(comp.getCompetitionName());
        post.setAuthor(cardService.card(post.getUserId(), viewerId));
        if (post.getTeamId() != null) {
            CompetitionTeam team = teamMapper.selectById(post.getTeamId());
            if (team != null) {
                Map<String, Object> teamInfo = new HashMap<>();
                teamInfo.put("id", team.getId());
                teamInfo.put("teamName", team.getTeamName());
                teamInfo.put("slogan", team.getTeamSlogan());
                long members = teamMemberMapper.selectCount(
                        new LambdaQueryWrapper<CompetitionTeamMember>()
                                .eq(CompetitionTeamMember::getTeamId, team.getId())
                );
                teamInfo.put("currentMembers", members);
                teamInfo.put("maxMembers", comp != null ? comp.getMaxMembers() : null);
                post.setTeam(teamInfo);
            }
        }
    }
}
