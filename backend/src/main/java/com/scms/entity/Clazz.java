package com.scms.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("sys_class")
public class Clazz {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long majorId;
    private String className;
    private String grade;
    private Integer status;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;
}
