package com.scms.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("competition_team_member")
public class CompetitionTeamMember {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long teamId;

    /** 冗余竞赛ID：承载"一人一赛一队"唯一约束（uk_tm_comp_student） */
    private Long competitionId;
    private Long studentId;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime joinTime;

    /** 学生姓名（非数据库字段） */
    @TableField(exist = false)
    private String studentName;

    /** 学号（非数据库字段） */
    @TableField(exist = false)
    private String studentUsername;
}
