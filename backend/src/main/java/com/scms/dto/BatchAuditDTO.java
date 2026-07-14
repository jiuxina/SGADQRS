package com.scms.dto;

import lombok.Data;
import java.util.List;

@Data
public class BatchAuditDTO {

    private List<Long> ids;
    private Integer status;
    private String auditRemark;
}
