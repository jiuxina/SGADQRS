package com.scms.controller;

import com.scms.common.Result;
import com.scms.service.StatsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Tag(name = "数据统计")
@RestController
@RequestMapping("/stats")
@RequiredArgsConstructor
public class StatsController {

    private final StatsService statsService;

    @Operation(summary = "管理员数据统计")
    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<?> adminStats() {
        return statsService.getAdminStats();
    }

    @Operation(summary = "报名趋势统计")
    @GetMapping("/enrollment-trends")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<?> enrollmentTrends() {
        return Result.success(statsService.getEnrollmentTrends());
    }

    @Operation(summary = "院系统计")
    @GetMapping("/college-stats")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<?> collegeStats() {
        return Result.success(statsService.getCollegeStats());
    }

    @Operation(summary = "竞赛热度排行")
    @GetMapping("/competition-rankings")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<?> competitionRankings() {
        return Result.success(statsService.getCompetitionRankings());
    }

    @Operation(summary = "即将开始/截止的竞赛提醒")
    @GetMapping("/upcoming")
    public Result<?> upcomingCompetitions() {
        Map<String, Object> result = new java.util.HashMap<>();
        result.put("upcomingDeadlines", statsService.getUpcomingDeadlines());
        result.put("upcomingStarts", statsService.getUpcomingStarts());
        return Result.success(result);
    }
}
