package com.scms.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.scms.entity.Message;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface MessageMapper extends BaseMapper<Message> {
}
