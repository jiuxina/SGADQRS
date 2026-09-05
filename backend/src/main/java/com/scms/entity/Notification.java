package com.scms.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("sys_notification")
public class Notification {

    @TableId(type = IdType.AUTO)
    private Long id;

    /** 接收者用户ID，0-全员公告 */
    private Long userId;

    /** 类型：announcement-公告 interaction-互动 system-系统 */
    private String type;
    private String title;
    private String content;

    /** 关联对象类型：request/recruit/user/notice */
    private String refType;
    private Long refId;

    /** 0-未读 1-已读（公告不跟踪已读） */
    private Integer isRead;

    /** 公告置顶 */
    private Integer isTop;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;
}
