package com.scms.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@TableName("competition_result")
public class CompetitionResult {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long competitionId;
    private Long registrationId;
    private Long studentId;
    private Long teamId;
    private BigDecimal score;
    private Integer ranking;

    /** 奖项：1-特等奖 2-一等奖 3-二等奖 4-三等奖 5-优秀奖 */
    private Integer awardLevel;
    private String awardName;
    private String remark;

    /** 证书附件URL（老师上传） */
    private String certificateUrl;

    /** 是否发布：0-否 1-是 */
    private Integer isPublished;
    private LocalDateTime publishTime;

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
