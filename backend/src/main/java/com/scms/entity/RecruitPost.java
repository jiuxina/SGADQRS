package com.scms.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("recruit_post")
public class RecruitPost {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long competitionId;
    private Long userId;

    /** 1-组队招募 2-求组 */
    private Integer type;
    private String title;
    private String content;

    /** 关联队伍（招募帖） */
    private Long teamId;

    /** 方向标签(逗号分隔) */
    private String tags;

    /** 组队截止时间 */
    private LocalDateTime deadline;

    /** 1-招募中 0-已关闭 */
    private Integer status;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;

    // ===== 非数据库字段（列表/详情填充） =====

    /** 竞赛名称 */
    @TableField(exist = false)
    private String competitionName;

    /** 发布者脱敏卡片 */
    @TableField(exist = false)
    private java.util.Map<String, Object> author;

    /** 关联队伍信息：teamName/currentMembers/maxMembers */
    @TableField(exist = false)
    private java.util.Map<String, Object> team;
}
