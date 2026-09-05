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
    private Integer maxMembers = 1;
    private String awards;
    private String attachments;
    private Integer status = 2;
}
