package com.scms.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class ResultDTO {

    private Long id;
    private Long competitionId;
    private Long studentId;
    private Long teamId;
    private BigDecimal score;
    private Integer ranking;
    private Integer awardLevel;
    private String awardName;
    private String remark;
}
