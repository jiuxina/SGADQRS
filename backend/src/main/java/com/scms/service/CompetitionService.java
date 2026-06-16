package com.scms.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.scms.common.PageResult;
import com.scms.common.Result;
import com.scms.dto.CompetitionDTO;
import com.scms.entity.*;
import com.scms.mapper.*;
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
    private final CompetitionCategoryMapper categoryMapper;
    private final CompetitionAttachmentMapper attachmentMapper;
    private final CompetitionRegistrationMapper registrationMapper;
    private final CompetitionFavoriteMapper favoriteMapper;
    private final UserMapper userMapper;

    public Result<?> listCompetitions(int current, int size, String keyword, Long categoryId,
                                       Integer status, Long publisherId, Long currentUserId) {
        Page<Competition> page = new Page<>(current, size);
        LambdaQueryWrapper<Competition> wrapper = new LambdaQueryWrapper<>();
        if (StringUtils.hasText(keyword)) {
            wrapper.like(Competition::getCompetitionName, keyword);
        }
        if (categoryId != null) wrapper.eq(Competition::getCategoryId, categoryId);
        if (status != null) wrapper.eq(Competition::getStatus, status);
        if (publisherId != null) wrapper.eq(Competition::getPublisherId, publisherId);
        // 学生只能看到已发布的竞赛
        wrapper.orderByDesc(Competition::getCreateTime);

        Page<Competition> result = competitionMapper.selectPage(page, wrapper);
        result.getRecords().forEach(c -> fillCompetitionInfo(c, currentUserId));
        return Result.success(new PageResult<>(result));
    }

    public Result<?> getCompetitionById(Long id, Long currentUserId) {
        Competition comp = competitionMapper.selectById(id);
        if (comp == null) return Result.error("竞赛不存在");

        // 增加浏览量
        comp.setViewCount(comp.getViewCount() + 1);
        competitionMapper.updateById(comp);

        fillCompetitionInfo(comp, currentUserId);

        // 加载附件
        List<CompetitionAttachment> attachments = attachmentMapper.selectList(
                new LambdaQueryWrapper<CompetitionAttachment>().eq(CompetitionAttachment::getCompetitionId, id)
        );
        comp.setAttachments(attachments);

        return Result.success(comp);
    }

    @Transactional
    public Result<?> createCompetition(CompetitionDTO dto, Long publisherId) {
        Competition comp = new Competition();
        comp.setCompetitionName(dto.getCompetitionName());
        comp.setCategoryId(dto.getCategoryId());
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
        comp.setMaxTeams(dto.getMaxTeams());
        comp.setStatus(dto.getStatus());
        comp.setViewCount(0);
        competitionMapper.insert(comp);
        return Result.success("创建成功", comp);
    }

    @Transactional
    public Result<?> updateCompetition(CompetitionDTO dto) {
        Competition comp = competitionMapper.selectById(dto.getId());
        if (comp == null) return Result.error("竞赛不存在");

        if (StringUtils.hasText(dto.getCompetitionName())) comp.setCompetitionName(dto.getCompetitionName());
        if (dto.getCategoryId() != null) comp.setCategoryId(dto.getCategoryId());
        if (dto.getOrganizer() != null) comp.setOrganizer(dto.getOrganizer());
        if (dto.getDescription() != null) comp.setDescription(dto.getDescription());
        if (dto.getRules() != null) comp.setRules(dto.getRules());
        if (dto.getRegistrationStart() != null) comp.setRegistrationStart(dto.getRegistrationStart());
        if (dto.getRegistrationEnd() != null) comp.setRegistrationEnd(dto.getRegistrationEnd());
        if (dto.getCompetitionStart() != null) comp.setCompetitionStart(dto.getCompetitionStart());
        if (dto.getCompetitionEnd() != null) comp.setCompetitionEnd(dto.getCompetitionEnd());
        if (dto.getLocation() != null) comp.setLocation(dto.getLocation());
        if (dto.getMaxMembers() != null) comp.setMaxMembers(dto.getMaxMembers());
        if (dto.getMaxTeams() != null) comp.setMaxTeams(dto.getMaxTeams());
        if (dto.getStatus() != null) comp.setStatus(dto.getStatus());

        competitionMapper.updateById(comp);
        return Result.success("更新成功", null);
    }

    @Transactional
    public Result<?> auditCompetition(Long id, Integer status, String remark) {
        Competition comp = competitionMapper.selectById(id);
        if (comp == null) return Result.error("竞赛不存在");
        comp.setStatus(status);
        competitionMapper.updateById(comp);
        return Result.success(status == 2 ? "审核通过" : "已驳回", null);
    }

    @Transactional
    public Result<?> deleteCompetition(Long id) {
        competitionMapper.deleteById(id);
        attachmentMapper.delete(new LambdaQueryWrapper<CompetitionAttachment>().eq(CompetitionAttachment::getCompetitionId, id));
        registrationMapper.delete(new LambdaQueryWrapper<CompetitionRegistration>().eq(CompetitionRegistration::getCompetitionId, id));
        return Result.success("删除成功", null);
    }

    public Result<?> getCategories() {
        List<CompetitionCategory> categories = categoryMapper.selectList(
                new LambdaQueryWrapper<CompetitionCategory>().eq(CompetitionCategory::getStatus, 1).orderByAsc(CompetitionCategory::getSortOrder)
        );
        return Result.success(categories);
    }

    @Transactional
    public Result<?> toggleFavorite(Long userId, Long competitionId) {
        CompetitionFavorite existing = favoriteMapper.selectOne(
                new LambdaQueryWrapper<CompetitionFavorite>()
                        .eq(CompetitionFavorite::getUserId, userId)
                        .eq(CompetitionFavorite::getCompetitionId, competitionId)
        );
        if (existing != null) {
            favoriteMapper.deleteById(existing.getId());
            return Result.success("已取消收藏", false);
        } else {
            CompetitionFavorite fav = new CompetitionFavorite();
            fav.setUserId(userId);
            fav.setCompetitionId(competitionId);
            favoriteMapper.insert(fav);
            return Result.success("已收藏", true);
        }
    }

    public Result<?> getDashboardStats(Long userId, String role) {
        java.util.Map<String, Object> stats = new java.util.HashMap<>();

        if ("admin".equals(role)) {
            stats.put("totalUsers", userMapper.selectCount(null));
            stats.put("totalCompetitions", competitionMapper.selectCount(null));
            stats.put("totalRegistrations", registrationMapper.selectCount(null));
            stats.put("pendingAudit", competitionMapper.selectCount(
                    new LambdaQueryWrapper<Competition>().eq(Competition::getStatus, 1)));
        } else if ("teacher".equals(role)) {
            stats.put("myCompetitions", competitionMapper.selectCount(
                    new LambdaQueryWrapper<Competition>().eq(Competition::getPublisherId, userId)));
            stats.put("totalRegistrations", registrationMapper.selectCount(
                    new LambdaQueryWrapper<CompetitionRegistration>().inSql(CompetitionRegistration::getCompetitionId,
                            "SELECT id FROM competition WHERE publisher_id = " + userId)));
            stats.put("pendingAudit", registrationMapper.selectCount(
                    new LambdaQueryWrapper<CompetitionRegistration>().eq(CompetitionRegistration::getStatus, 0)
                            .inSql(CompetitionRegistration::getCompetitionId,
                                    "SELECT id FROM competition WHERE publisher_id = " + userId)));
        } else {
            stats.put("myRegistrations", registrationMapper.selectCount(
                    new LambdaQueryWrapper<CompetitionRegistration>().eq(CompetitionRegistration::getStudentId, userId)));
            stats.put("availableCompetitions", competitionMapper.selectCount(
                    new LambdaQueryWrapper<Competition>().eq(Competition::getStatus, 2)));
            stats.put("myFavorites", favoriteMapper.selectCount(
                    new LambdaQueryWrapper<CompetitionFavorite>().eq(CompetitionFavorite::getUserId, userId)));
        }

        return Result.success(stats);
    }

    private void fillCompetitionInfo(Competition c, Long currentUserId) {
        // 分类名称
        if (c.getCategoryId() != null) {
            CompetitionCategory cat = categoryMapper.selectById(c.getCategoryId());
            if (cat != null) c.setCategoryName(cat.getCategoryName());
        }
        // 发布人姓名
        if (c.getPublisherId() != null) {
            User publisher = userMapper.selectById(c.getPublisherId());
            if (publisher != null) c.setPublisherName(publisher.getRealName());
        }
        // 报名人数
        c.setRegistrationCount(registrationMapper.selectCount(
                new LambdaQueryWrapper<CompetitionRegistration>().eq(CompetitionRegistration::getCompetitionId, c.getId())
        ).intValue());
        // 是否已报名
        if (currentUserId != null) {
            c.setHasRegistered(registrationMapper.selectCount(
                    new LambdaQueryWrapper<CompetitionRegistration>()
                            .eq(CompetitionRegistration::getCompetitionId, c.getId())
                            .eq(CompetitionRegistration::getStudentId, currentUserId)
            ) > 0);
            // 是否已收藏
            c.setHasFavorited(favoriteMapper.selectCount(
                    new LambdaQueryWrapper<CompetitionFavorite>()
                            .eq(CompetitionFavorite::getCompetitionId, c.getId())
                            .eq(CompetitionFavorite::getUserId, currentUserId)
            ) > 0);
        }
        // 自动判断竞赛状态
        autoUpdateStatus(c);
    }

    private void autoUpdateStatus(Competition c) {
        if (c.getStatus() >= 2) {
            LocalDateTime now = LocalDateTime.now();
            if (c.getStatus() == 2 && now.isAfter(c.getCompetitionStart())) {
                c.setStatus(3);
            } else if (c.getStatus() == 3 && now.isAfter(c.getCompetitionEnd())) {
                c.setStatus(4);
            }
        }
    }
}
