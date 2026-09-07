package com.scms.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.scms.common.PageResult;
import com.scms.common.Pages;
import com.scms.common.Result;
import com.scms.dto.BatchResultDTO;
import com.scms.dto.ResultDTO;
import com.scms.entity.*;
import com.scms.mapper.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

@Service
@RequiredArgsConstructor
public class ResultService {

    private final CompetitionResultMapper resultMapper;
    private final CompetitionMapper competitionMapper;
    private final UserMapper userMapper;
    private final CompetitionTeamMapper teamMapper;
    private final com.scms.service.NotificationService notificationService;

    public Result<?> listResults(int current, int size, Long competitionId, Long studentId,
                                  Integer awardLevel, Integer isPublished, Long publisherId, String keyword) {
        Page<CompetitionResult> page = Pages.of(current, size);
        LambdaQueryWrapper<CompetitionResult> wrapper = new LambdaQueryWrapper<>();
        if (competitionId != null) wrapper.eq(CompetitionResult::getCompetitionId, competitionId);
        if (studentId != null) wrapper.eq(CompetitionResult::getStudentId, studentId);
        if (awardLevel != null) wrapper.eq(CompetitionResult::getAwardLevel, awardLevel);
        if (isPublished != null) wrapper.eq(CompetitionResult::getIsPublished, isPublished);
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
        wrapper.orderByDesc(CompetitionResult::getCreateTime);

        Page<CompetitionResult> result = resultMapper.selectPage(page, wrapper);
        result.getRecords().forEach(this::fillResultInfo);
        return Result.success(new PageResult<>(result));
    }

    /** 边界校验：竞赛存在、分数/名次范围、同竞赛同人（或同队）不重复录入；通过返回 null */
    private Result<?> validateResult(Long competitionId, Long studentId, Long teamId,
                                     BigDecimal score, Integer ranking, Long excludeId) {
        if (competitionId == null) return Result.error("请指定竞赛");
        if (competitionMapper.selectById(competitionId) == null) return Result.error("竞赛不存在");
        if (score != null && score.compareTo(BigDecimal.ZERO) < 0) return Result.error("分数不能为负数");
        if (score != null && score.compareTo(BigDecimal.valueOf(100000)) > 0) return Result.error("分数超出合理范围");
        if (ranking != null && ranking < 1) return Result.error("名次不能小于 1");
        if (studentId == null && teamId == null) return Result.error("请指定获奖学生或队伍");
        // 边界：学生/队伍必须真实存在，防止孤儿成绩与发布时向不存在用户发通知
        if (studentId != null && userMapper.selectById(studentId) == null) return Result.error("学生不存在");
        if (teamId != null && teamMapper.selectById(teamId) == null) return Result.error("团队不存在");
        long dup;
        if (studentId != null) {
            dup = resultMapper.selectCount(new LambdaQueryWrapper<CompetitionResult>()
                    .eq(CompetitionResult::getCompetitionId, competitionId)
                    .eq(CompetitionResult::getStudentId, studentId)
                    .ne(excludeId != null, CompetitionResult::getId, excludeId));
        } else {
            dup = resultMapper.selectCount(new LambdaQueryWrapper<CompetitionResult>()
                    .eq(CompetitionResult::getCompetitionId, competitionId)
                    .eq(CompetitionResult::getTeamId, teamId)
                    .ne(excludeId != null, CompetitionResult::getId, excludeId));
        }
        if (dup > 0) return Result.error("该竞赛下已存在相同学生/队伍的成绩记录，请直接编辑原记录");
        return null;
    }

    @Transactional
    public Result<?> saveResult(ResultDTO dto) {
        Result<?> invalid = validateResult(dto.getCompetitionId(), dto.getStudentId(), dto.getTeamId(),
                dto.getScore(), dto.getRanking(), null);
        if (invalid != null) return invalid;
        CompetitionResult result = new CompetitionResult();
        result.setCompetitionId(dto.getCompetitionId());
        result.setStudentId(dto.getStudentId());
        result.setTeamId(dto.getTeamId());
        result.setScore(dto.getScore());
        result.setRanking(dto.getRanking());
        result.setAwardLevel(dto.getAwardLevel());
        // 从竞赛的自定义奖项中查找awardName
        result.setAwardName(resolveAwardName(dto.getCompetitionId(), dto.getAwardLevel(), dto.getAwardName()));
        result.setRemark(dto.getRemark());
        result.setIsPublished(0);
        resultMapper.insert(result);
        return Result.success("保存成功", result);
    }

    @Transactional
    public Result<?> saveBatchResults(BatchResultDTO dto) {
        if (dto.getCompetitionId() == null) {
            return Result.error("竞赛ID不能为空");
        }
        if (dto.getResults() == null || dto.getResults().isEmpty()) {
            return Result.error("成绩列表不能为空");
        }

        List<CompetitionResult> saved = new ArrayList<>();
        for (BatchResultDTO.Item item : dto.getResults()) {
            Result<?> invalid = validateResult(dto.getCompetitionId(), item.getStudentId(), item.getTeamId(),
                    item.getScore(), item.getRanking(), null);
            if (invalid != null) return invalid;
            CompetitionResult result = new CompetitionResult();
            result.setCompetitionId(dto.getCompetitionId());
            result.setStudentId(item.getStudentId());
            result.setTeamId(item.getTeamId());
            result.setScore(item.getScore());
            result.setRanking(item.getRanking());
            result.setAwardLevel(item.getAwardLevel());
            result.setAwardName(resolveAwardName(dto.getCompetitionId(), item.getAwardLevel(), null));
            result.setIsPublished(0);
            resultMapper.insert(result);
            saved.add(result);
        }
        return Result.success("批量录入成功，共 " + saved.size() + " 条", saved);
    }

    @Transactional
    public Result<?> updateResult(ResultDTO dto) {
        CompetitionResult result = resultMapper.selectById(dto.getId());
        if (result == null) return Result.error("成绩记录不存在");
        if (dto.getScore() != null && (dto.getScore().compareTo(BigDecimal.ZERO) < 0 || dto.getScore().compareTo(BigDecimal.valueOf(100000)) > 0)) return Result.error("分数超出合理范围");
        if (dto.getRanking() != null && dto.getRanking() < 1) return Result.error("名次不能小于 1");

        if (dto.getScore() != null) result.setScore(dto.getScore());
        if (dto.getRanking() != null) result.setRanking(dto.getRanking());
        if (dto.getAwardLevel() != null) {
            result.setAwardLevel(dto.getAwardLevel());
            // 从竞赛的自定义奖项中查找awardName
            result.setAwardName(resolveAwardName(result.getCompetitionId(), dto.getAwardLevel(), dto.getAwardName()));
        } else if (dto.getAwardName() != null) {
            result.setAwardName(dto.getAwardName());
        }
        if (dto.getRemark() != null) result.setRemark(dto.getRemark());
        resultMapper.updateById(result);
        return Result.success("更新成功", null);
    }

    @Transactional
    public Result<?> publishResults(Long competitionId) {
        // 边界：发布必须针对真实存在的竞赛，防止对不存在 id 静默返回"暂无"
        if (competitionId == null) return Result.error("请指定竞赛");
        if (competitionMapper.selectById(competitionId) == null) return Result.error("竞赛不存在");
        List<CompetitionResult> results = resultMapper.selectList(
                new LambdaQueryWrapper<CompetitionResult>()
                        .eq(CompetitionResult::getCompetitionId, competitionId)
                        .eq(CompetitionResult::getIsPublished, 0)
        );
        if (results.isEmpty()) {
            return Result.success("暂无未发布的成绩，无需重复发布", null);
        }
        results.forEach(r -> {
            r.setIsPublished(1);
            r.setPublishTime(LocalDateTime.now());
            resultMapper.updateById(r);
        });

        // 通知相关学生的获奖记录已可查看
        Competition comp = competitionMapper.selectById(competitionId);
        String compName = comp != null ? comp.getCompetitionName() : "竞赛";
        java.util.Set<Long> notified = new java.util.HashSet<>();
        for (CompetitionResult r : results) {
            if (r.getStudentId() != null && notified.add(r.getStudentId())) {
                notificationService.send(r.getStudentId(), "system", "成绩已发布",
                        compName + " 的成绩已发布，快去查看你的获奖记录吧。", "user", r.getStudentId());
            }
        }
        return Result.success("发布成功，共发布 " + results.size() + " 条成绩", null);
    }

    public Result<?> getStudentStats(Long studentId) {
        java.util.Map<String, Object> stats = new java.util.HashMap<>();
        // 参赛次数
        stats.put("totalParticipations", resultMapper.selectCount(
                new LambdaQueryWrapper<CompetitionResult>()
                        .eq(CompetitionResult::getStudentId, studentId)
                        .eq(CompetitionResult::getIsPublished, 1)
        ));
        // 获奖次数
        stats.put("totalAwards", resultMapper.selectCount(
                new LambdaQueryWrapper<CompetitionResult>()
                        .eq(CompetitionResult::getStudentId, studentId)
                        .eq(CompetitionResult::getIsPublished, 1)
                        .isNotNull(CompetitionResult::getAwardLevel)
        ));
        return Result.success(stats);
    }

    public Result<?> getResultStats(Long competitionId, Long publisherId) {
        java.util.Map<String, Object> stats = resultMapper.getResultStats(competitionId, publisherId);
        // 确保所有字段都有默认值，避免前端处理null
        stats.putIfAbsent("totalCount", 0L);
        stats.putIfAbsent("scoredCount", 0L);
        stats.putIfAbsent("avgScore", 0);
        stats.putIfAbsent("maxScore", 0);
        stats.putIfAbsent("minScore", 0);
        stats.putIfAbsent("publishedCount", 0L);
        stats.putIfAbsent("unpublishedCount", 0L);
        return Result.success(stats);
    }

    private void fillResultInfo(CompetitionResult r) {
        if (r.getCompetitionId() != null) {
            Competition comp = competitionMapper.selectById(r.getCompetitionId());
            if (comp != null) r.setCompetitionName(comp.getCompetitionName());
        }
        if (r.getStudentId() != null) {
            User user = userMapper.selectById(r.getStudentId());
            if (user != null) r.setStudentName(user.getRealName());
        }
        if (r.getTeamId() != null) {
            CompetitionTeam team = teamMapper.selectById(r.getTeamId());
            if (team != null) r.setTeamName(team.getTeamName());
        }
    }

    /**
     * 从竞赛的自定义奖项中解析awardName
     */
    private String resolveAwardName(Long competitionId, Integer awardLevel, String fallbackName) {
        if (competitionId == null || awardLevel == null) return fallbackName;
        Competition comp = competitionMapper.selectById(competitionId);
        if (comp == null || comp.getAwards() == null) return fallbackName;
        try {
            ObjectMapper mapper = new ObjectMapper();
            List<java.util.Map<String, Object>> awards = mapper.readValue(
                    comp.getAwards(), new TypeReference<List<java.util.Map<String, Object>>>() {});
            for (java.util.Map<String, Object> award : awards) {
                Object levelObj = award.get("level");
                if (levelObj != null) {
                    int level = levelObj instanceof Number ? ((Number) levelObj).intValue() : Integer.parseInt(levelObj.toString());
                    if (level == awardLevel) {
                        return award.get("name") != null ? award.get("name").toString() : fallbackName;
                    }
                }
            }
        } catch (Exception ignored) {
        }
        return fallbackName;
    }
}
