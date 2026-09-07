package com.scms.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.time.LocalDateTime;

@Data
public class CompetitionDTO {

    private Long id;

    @NotBlank(message = "竞赛名称不能为空")
    private String competitionName;

    @NotBlank(message = "主办方不能为空")
    private String organizer;
    private String coverImage;
    private String description;
    private String rules;

    @NotNull(message = "报名开始时间不能为空")
    private LocalDateTime registrationStart;

    @NotNull(message = "报名截止时间不能为空")
    private LocalDateTime registrationEnd;

    @NotNull(message = "竞赛开始时间不能为空")
    private LocalDateTime competitionStart;

    @NotNull(message = "竞赛结束时间不能为空")
    private LocalDateTime competitionEnd;

    private String location;
    // 不能给默认值：PUT 省略字段时 Jackson 保留初始值，会把库中值静默重置
    private Integer maxMembers;
    private String awards;
    private String attachments;
    private Integer status;
}
