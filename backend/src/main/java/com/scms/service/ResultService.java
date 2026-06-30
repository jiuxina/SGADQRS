package com.scms.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.scms.common.PageResult;
import com.scms.common.Result;
import com.scms.dto.ResultDTO;
import com.scms.entity.*;
import com.scms.mapper.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ResultService {

    private final CompetitionResultMapper resultMapper;
    private final CompetitionMapper competitionMapper;
    private final UserMapper userMapper;
    private final CompetitionTeamMapper teamMapper;

    public Result<?> listResults(int current, int size, Long competitionId, Long studentId,
                                  Integer awardLevel, Integer isPublished, Long publisherId) {
        Page<CompetitionResult> page = new Page<>(current, size);
        LambdaQueryWrapper<CompetitionResult> wrapper = new LambdaQueryWrapper<>();
        if (competitionId != null) wrapper.eq(CompetitionResult::getCompetitionId, competitionId);
        if (studentId != null) wrapper.eq(CompetitionResult::getStudentId, studentId);
        if (awardLevel != null) wrapper.eq(CompetitionResult::getAwardLevel, awardLevel);
        if (isPublished != null) wrapper.eq(CompetitionResult::getIsPublished, isPublished);
        if (publisherId != null) {
            wrapper.inSql(CompetitionResult::getCompetitionId,
                    "SELECT id FROM competition WHERE publisher_id = " + publisherId);
        }
        wrapper.orderByDesc(CompetitionResult::getCreateTime);

        Page<CompetitionResult> result = resultMapper.selectPage(page, wrapper);
        result.getRecords().forEach(this::fillResultInfo);
        return Result.success(new PageResult<>(result));
    }

    @Transactional
    public Result<?> saveResult(ResultDTO dto) {
        CompetitionResult result = new CompetitionResult();
        result.setCompetitionId(dto.getCompetitionId());
        result.setRegistrationId(dto.getRegistrationId());
        result.setStudentId(dto.getStudentId());
        result.setTeamId(dto.getTeamId());
        result.setScore(dto.getScore());
        result.setRanking(dto.getRanking());
        result.setAwardLevel(dto.getAwardLevel());
        result.setAwardName(dto.getAwardName());
        result.setRemark(dto.getRemark());
        result.setIsPublished(0);
        resultMapper.insert(result);
        return Result.success("保存成功", result);
    }

    @Transactional
    public Result<?> updateResult(ResultDTO dto) {
        CompetitionResult result = resultMapper.selectById(dto.getId());
        if (result == null) return Result.error("成绩记录不存在");

        if (dto.getScore() != null) result.setScore(dto.getScore());
        if (dto.getRanking() != null) result.setRanking(dto.getRanking());
        if (dto.getAwardLevel() != null) result.setAwardLevel(dto.getAwardLevel());
        if (dto.getAwardName() != null) result.setAwardName(dto.getAwardName());
        if (dto.getRemark() != null) result.setRemark(dto.getRemark());
        resultMapper.updateById(result);
        return Result.success("更新成功", null);
    }

    @Transactional
    public Result<?> publishResults(Long competitionId) {
        List<CompetitionResult> results = resultMapper.selectList(
                new LambdaQueryWrapper<CompetitionResult>()
                        .eq(CompetitionResult::getCompetitionId, competitionId)
                        .eq(CompetitionResult::getIsPublished, 0)
        );
        results.forEach(r -> {
            r.setIsPublished(1);
            r.setPublishTime(LocalDateTime.now());
            resultMapper.updateById(r);
        });
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
}
