package com.scms.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("sys_notice")
public class Notice {

    @TableId(type = IdType.AUTO)
    private Long id;

    private String noticeTitle;
    private String noticeContent;
    /** 类型：1-通知 2-公告 */
    private Integer noticeType;
    private Integer isTop;
    private Integer status;
    private LocalDateTime publishTime;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;
}
