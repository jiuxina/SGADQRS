package com.scms.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserStatsDTO {
    private long totalCount;
    private long studentCount;
    private long teacherCount;
    private long adminCount;
}
