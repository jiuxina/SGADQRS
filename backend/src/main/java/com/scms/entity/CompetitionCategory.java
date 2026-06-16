package com.scms.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("competition_category")
public class CompetitionCategory {

    @TableId(type = IdType.AUTO)
    private Long id;

    private String categoryName;
    private String categoryCode;
    private String description;
    private Integer sortOrder;
    private Integer status;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;
}
