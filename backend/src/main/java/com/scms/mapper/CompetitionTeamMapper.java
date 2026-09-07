package com.scms.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.scms.entity.CompetitionTeam;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

@Mapper
public interface CompetitionTeamMapper extends BaseMapper<CompetitionTeam> {

    /** 悲观锁：容量检查+插入必须串行化，防并发入队超员（须在事务内调用） */
    @Select("select * from competition_team where id = #{id} for update")
    CompetitionTeam selectByIdForUpdate(Long id);
}
