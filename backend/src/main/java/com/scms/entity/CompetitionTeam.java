package com.scms.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("competition_team")
public class CompetitionTeam {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long competitionId;
    private String teamName;
    private Long leaderId;
    private Long teacherId;
    private String teamSlogan;

    /** 状态：0-组建中 1-已提交 2-已通过 3-已拒绝 */
    private Integer status;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    /** 队长姓名（非数据库字段） */
    @TableField(exist = false)
    private String leaderName;

    /** 指导老师姓名（非数据库字段） */
    @TableField(exist = false)
    private String teacherName;

    /** 竞赛名称（非数据库字段） */
    @TableField(exist = false)
    private String competitionName;

    /** 成员列表（非数据库字段） */
    @TableField(exist = false)
    private java.util.List<CompetitionTeamMember> members;
}
