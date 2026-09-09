package com.scms.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("community_request")
public class CommunityRequest {

    @TableId(type = IdType.AUTO)
    private Long id;

    /** 2-入队申请 3-入队邀请（1-资料互看已下线，存量数据仅作历史） */
    private Integer type;

    /** 关联招募帖 */
    private Long postId;

    /** 关联队伍 */
    private Long teamId;

    private Long fromUserId;
    private Long toUserId;
    private String message;

    /** 0-待处理 1-已同意 2-已拒绝 */
    private Integer status;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    private LocalDateTime handleTime;

    // ===== 非数据库字段 =====

    /** 发起人脱敏卡片 */
    @TableField(exist = false)
    private java.util.Map<String, Object> fromUser;

    /** 接收人脱敏卡片 */
    @TableField(exist = false)
    private java.util.Map<String, Object> toUser;

    @TableField(exist = false)
    private String postTitle;

    @TableField(exist = false)
    private String teamName;

    @TableField(exist = false)
    private String competitionName;
}
