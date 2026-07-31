package com.scms.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.scms.entity.CompetitionResult;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.Map;

@Mapper
public interface CompetitionResultMapper extends BaseMapper<CompetitionResult> {

    @Select("<script>" +
            "SELECT " +
            "  COUNT(*) AS totalCount, " +
            "  SUM(CASE WHEN score IS NOT NULL THEN 1 ELSE 0 END) AS scoredCount, " +
            "  ROUND(AVG(score), 2) AS avgScore, " +
            "  MAX(score) AS maxScore, " +
            "  MIN(score) AS minScore, " +
            "  SUM(CASE WHEN is_published = 1 THEN 1 ELSE 0 END) AS publishedCount, " +
            "  SUM(CASE WHEN is_published = 0 THEN 1 ELSE 0 END) AS unpublishedCount " +
            "FROM competition_result " +
            "WHERE competition_id = #{competitionId} " +
            "<if test='publisherId != null'>" +
            "  AND competition_id IN (SELECT id FROM competition WHERE publisher_id = #{publisherId})" +
            "</if>" +
            "</script>")
    Map<String, Object> getResultStats(@Param("competitionId") Long competitionId,
                                       @Param("publisherId") Long publisherId);
}
