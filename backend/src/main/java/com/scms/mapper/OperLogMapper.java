package com.scms.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.scms.entity.OperLog;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface OperLogMapper extends BaseMapper<OperLog> {
}
