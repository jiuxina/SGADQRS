package com.scms.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("sys_major")
public class Major {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long deptId;
    private String majorName;
    private String majorCode;
    private Integer status;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;
}
