package com.scms.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class RecruitPostDTO {

    private Long id;

    /** 1-组队招募 2-求组 */
    private Integer type;
    private Long competitionId;

    /** 关联队伍（已有队招人时传入） */
    private Long teamId;
    private String title;
    private String content;

    /** 方向标签(逗号分隔) */
    private String tags;
    private LocalDateTime deadline;
}
