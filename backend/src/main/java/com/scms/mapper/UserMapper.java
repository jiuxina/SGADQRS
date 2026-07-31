package com.scms.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.scms.entity.User;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

import java.util.List;
import java.util.Map;

@Mapper
public interface UserMapper extends BaseMapper<User> {
    
    /**
     * 按用户类型统计数量
     * @return List of {userType, count}
     */
    @Select("SELECT user_type as userType, COUNT(*) as count FROM sys_user GROUP BY user_type")
    List<Map<String, Object>> countByUserType();
}
