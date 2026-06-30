package com.scms.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.scms.common.Result;
import com.scms.entity.*;
import com.scms.mapper.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
@RequiredArgsConstructor
public class StatsService {

    private final CompetitionMapper competitionMapper;
    private final CompetitionRegistrationMapper registrationMapper;
    private final CompetitionResultMapper resultMapper;
    private final UserMapper userMapper;

    public Result<?> getAdminStats() {
        Map<String, Object> stats = new HashMap<>();

        // 用户统计
        long totalStudents = userMapper.selectCount(new LambdaQueryWrapper<User>().eq(User::getUserType, 1));
        long totalTeachers = userMapper.selectCount(new LambdaQueryWrapper<User>().eq(User::getUserType, 2));
        stats.put("totalStudents", totalStudents);
        stats.put("totalTeachers", totalTeachers);
        stats.put("totalUsers", totalStudents + totalTeachers);

        // 竞赛统计
        long totalCompetitions = competitionMapper.selectCount(null);
        long publishedCompetitions = competitionMapper.selectCount(new LambdaQueryWrapper<Competition>().eq(Competition::getStatus, 2));
        long ongoingCompetitions = competitionMapper.selectCount(new LambdaQueryWrapper<Competition>().eq(Competition::getStatus, 3));
        stats.put("totalCompetitions", totalCompetitions);
        stats.put("publishedCompetitions", publishedCompetitions);
        stats.put("ongoingCompetitions", ongoingCompetitions);

        // 报名统计
        stats.put("totalRegistrations", registrationMapper.selectCount(null));

        // 获奖分布
        Map<String, Long> awardDistribution = new LinkedHashMap<>();
        String[] awardNames = {"特等奖", "一等奖", "二等奖", "三等奖", "优秀奖"};
        for (int i = 1; i <= 5; i++) {
            awardDistribution.put(awardNames[i - 1], resultMapper.selectCount(
                    new LambdaQueryWrapper<CompetitionResult>().eq(CompetitionResult::getAwardLevel, i)
            ));
        }
        stats.put("awardDistribution", awardDistribution);

        return Result.success(stats);
    }
}
