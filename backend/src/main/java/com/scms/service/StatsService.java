package com.scms.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.scms.common.Result;
import com.scms.entity.*;
import com.scms.mapper.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StatsService {

    private final CompetitionMapper competitionMapper;
    private final CompetitionRegistrationMapper registrationMapper;
    private final CompetitionResultMapper resultMapper;
    private final UserMapper userMapper;
    private final DeptMapper deptMapper;

    public Result<?> getAdminStats() {
        Map<String, Object> stats = new HashMap<>();

        // 用户统计
        long totalStudents = userMapper.selectCount(new LambdaQueryWrapper<User>().eq(User::getUserType, 1));
        long totalTeachers = userMapper.selectCount(new LambdaQueryWrapper<User>().eq(User::getUserType, 2));
        long disabledUsers = userMapper.selectCount(new LambdaQueryWrapper<User>().eq(User::getStatus, 0));
        stats.put("totalStudents", totalStudents);
        stats.put("totalTeachers", totalTeachers);
        stats.put("totalUsers", totalStudents + totalTeachers);
        stats.put("disabledUsers", disabledUsers);

        // 竞赛统计
        long totalCompetitions = competitionMapper.selectCount(null);
        long publishedCompetitions = competitionMapper.selectCount(new LambdaQueryWrapper<Competition>().eq(Competition::getStatus, 2));
        long ongoingCompetitions = competitionMapper.selectCount(new LambdaQueryWrapper<Competition>().eq(Competition::getStatus, 3));
        stats.put("totalCompetitions", totalCompetitions);
        stats.put("publishedCompetitions", publishedCompetitions);
        stats.put("ongoingCompetitions", ongoingCompetitions);

        // 报名统计
        stats.put("totalRegistrations", registrationMapper.selectCount(null));

        // 获奖分布（按awardName动态统计）
        List<CompetitionResult> allResults = resultMapper.selectList(
                new LambdaQueryWrapper<CompetitionResult>().isNotNull(CompetitionResult::getAwardName)
        );
        Map<String, Long> awardDistribution = allResults.stream()
                .collect(Collectors.groupingBy(CompetitionResult::getAwardName, LinkedHashMap::new, Collectors.counting()));
        stats.put("awardDistribution", awardDistribution);

        // 报名趋势（近6个月）
        stats.put("enrollmentTrends", getEnrollmentTrends());

        // 院系统计
        stats.put("collegeStats", getCollegeStats());

            // 竞赛热度排行
        stats.put("competitionRankings", getCompetitionRankings());

        // 即将截止 / 即将开始提醒
        stats.put("upcomingDeadlines", getUpcomingDeadlines());
        stats.put("upcomingStarts", getUpcomingStarts());

        return Result.success(stats);
    }

    /**
     * 获取即将截止的竞赛（报名截止或竞赛结束在7天内）
     */
    public List<Map<String, Object>> getUpcomingDeadlines() {
        List<Map<String, Object>> result = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime sevenDaysLater = now.plusDays(7);

        // 报名即将截止（已发布状态，报名结束在7天内）
        List<Competition> regDeadlines = competitionMapper.selectList(
                new LambdaQueryWrapper<Competition>()
                        .eq(Competition::getStatus, 2)
                        .between(Competition::getRegistrationEnd, now, sevenDaysLater)
                        .orderByAsc(Competition::getRegistrationEnd)
        );
        for (Competition c : regDeadlines) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("id", c.getId());
            item.put("competitionName", c.getCompetitionName());
            item.put("deadlineType", "报名截止");
            item.put("deadlineTime", c.getRegistrationEnd());
            result.add(item);
        }

        // 竞赛即将结束（进行中状态，竞赛结束在7天内）
        List<Competition> compDeadlines = competitionMapper.selectList(
                new LambdaQueryWrapper<Competition>()
                        .eq(Competition::getStatus, 3)
                        .between(Competition::getCompetitionEnd, now, sevenDaysLater)
                        .orderByAsc(Competition::getCompetitionEnd)
        );
        for (Competition c : compDeadlines) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("id", c.getId());
            item.put("competitionName", c.getCompetitionName());
            item.put("deadlineType", "竞赛结束");
            item.put("deadlineTime", c.getCompetitionEnd());
            result.add(item);
        }

        // 按截止时间排序
        result.sort(Comparator.comparing(m -> (LocalDateTime) m.get("deadlineTime")));
        return result;
    }

    /**
     * 获取即将开始的竞赛（竞赛开始在7天内）
     */
    public List<Map<String, Object>> getUpcomingStarts() {
        List<Map<String, Object>> result = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime sevenDaysLater = now.plusDays(7);

        // 竞赛即将开始（已发布状态，竞赛开始在7天内）
        List<Competition> upcomingStarts = competitionMapper.selectList(
                new LambdaQueryWrapper<Competition>()
                        .eq(Competition::getStatus, 2)
                        .between(Competition::getCompetitionStart, now, sevenDaysLater)
                        .orderByAsc(Competition::getCompetitionStart)
        );
        for (Competition c : upcomingStarts) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("id", c.getId());
            item.put("competitionName", c.getCompetitionName());
            item.put("startTime", c.getCompetitionStart());
            result.add(item);
        }

        return result;
    }

    /**
     * 获取近6个月的报名趋势数据
     */
    public List<Map<String, Object>> getEnrollmentTrends() {
        List<Map<String, Object>> trends = new ArrayList<>();
        YearMonth now = YearMonth.now();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM");

        for (int i = 5; i >= 0; i--) {
            YearMonth month = now.minusMonths(i);
            LocalDateTime start = month.atDay(1).atStartOfDay();
            LocalDateTime end = month.atEndOfMonth().atTime(23, 59, 59);

            Long count = registrationMapper.selectCount(
                    new LambdaQueryWrapper<CompetitionRegistration>()
                            .between(CompetitionRegistration::getCreateTime, start, end)
            );

            Map<String, Object> item = new LinkedHashMap<>();
            item.put("month", month.format(formatter));
            item.put("count", count);
            trends.add(item);
        }
        return trends;
    }

    /**
     * 获取各院系的报名统计
     */
    public List<Map<String, Object>> getCollegeStats() {
        // 获取所有报名记录
        List<CompetitionRegistration> registrations = registrationMapper.selectList(null);
        if (registrations.isEmpty()) {
            return Collections.emptyList();
        }

        // 获取所有学生用户（userType=1）
        List<User> students = userMapper.selectList(
                new LambdaQueryWrapper<User>().eq(User::getUserType, 1)
        );
        Map<Long, User> studentMap = students.stream()
                .collect(Collectors.toMap(User::getId, u -> u));

        // 获取所有部门
        List<Dept> depts = deptMapper.selectList(null);
        Map<Long, String> deptMap = depts.stream()
                .collect(Collectors.toMap(Dept::getId, Dept::getDeptName));

        // 统计各院系报名人数
        Map<String, Long> collegeCountMap = new LinkedHashMap<>();
        for (CompetitionRegistration reg : registrations) {
            User student = studentMap.get(reg.getStudentId());
            if (student != null && student.getDeptId() != null) {
                String deptName = deptMap.getOrDefault(student.getDeptId(), "未知院系");
                collegeCountMap.merge(deptName, 1L, Long::sum);
            }
        }

        // 转换为列表并按报名数排序
        return collegeCountMap.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .map(entry -> {
                    Map<String, Object> item = new LinkedHashMap<>();
                    item.put("name", entry.getKey());
                    item.put("count", entry.getValue());
                    return item;
                })
                .collect(Collectors.toList());
    }

    /**
     * 获取竞赛热度排行（按报名人数）
     */
    public List<Map<String, Object>> getCompetitionRankings() {
        // 获取所有报名记录
        List<CompetitionRegistration> registrations = registrationMapper.selectList(null);
        if (registrations.isEmpty()) {
            return Collections.emptyList();
        }

        // 统计各竞赛报名人数
        Map<Long, Long> compCountMap = registrations.stream()
                .collect(Collectors.groupingBy(CompetitionRegistration::getCompetitionId, Collectors.counting()));

        // 获取竞赛详情
        Set<Long> compIds = compCountMap.keySet();
        List<Competition> competitions = competitionMapper.selectBatchIds(compIds);
        Map<Long, Competition> compMap = competitions.stream()
                .collect(Collectors.toMap(Competition::getId, c -> c));

        // 按报名人数排序，取前10
        return compCountMap.entrySet().stream()
                .sorted(Map.Entry.<Long, Long>comparingByValue().reversed())
                .limit(10)
                .map(entry -> {
                    Competition comp = compMap.get(entry.getKey());
                    Map<String, Object> item = new LinkedHashMap<>();
                    item.put("id", entry.getKey());
                    item.put("name", comp != null ? comp.getCompetitionName() : "未知竞赛");
                    item.put("count", entry.getValue());
                    item.put("status", comp != null ? comp.getStatus() : 0);
                    return item;
                })
                .collect(Collectors.toList());
    }
}
