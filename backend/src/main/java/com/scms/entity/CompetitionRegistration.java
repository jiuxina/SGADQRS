package com.scms.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("competition_registration")
public class CompetitionRegistration {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long competitionId;
    private Long teamId;
    private Long studentId;
    /** 是否队长：0-否 1-是 */
    private Integer isTeamLeader;
    private String contactPhone;
    private String remark;
    private String attachmentUrl;

    /** 状态：0-待审核 1-已通过 2-已拒绝 */
    private Integer status;

    private String auditRemark;
    private LocalDateTime auditTime;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    /** 竞赛名称（非数据库字段） */
    @TableField(exist = false)
    private String competitionName;

    /** 学生姓名（非数据库字段） */
    @TableField(exist = false)
    private String studentName;

    /** 团队名称（非数据库字段） */
    @TableField(exist = false)
    private String teamName;
}
