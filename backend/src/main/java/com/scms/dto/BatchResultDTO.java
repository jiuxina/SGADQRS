package com.scms.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data
public class BatchResultDTO {

    private Long competitionId;
    private List<Item> results;

    @Data
    public static class Item {
        private Long studentId;
        private Long teamId;
        private BigDecimal score;
        private Integer ranking;
        private Integer awardLevel;
    }
}
