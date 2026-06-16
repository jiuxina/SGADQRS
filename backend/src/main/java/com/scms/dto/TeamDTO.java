package com.scms.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class TeamDTO {

    private Long id;

    @NotNull(message = "竞赛ID不能为空")
    private Long competitionId;

    @NotBlank(message = "团队名称不能为空")
    private String teamName;

    private String teamSlogan;
}
