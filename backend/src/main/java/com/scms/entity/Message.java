package com.scms.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("sys_message")
public class Message {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long userId;
    private String messageTitle;
    private String messageContent;
    /** 类型：1-系统 2-竞赛 3-报名 4-成绩 */
    private Integer messageType;
    /** 是否已读：0-未读 1-已读 */
    private Integer isRead;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;
}
