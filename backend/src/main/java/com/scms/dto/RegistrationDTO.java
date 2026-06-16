package com.scms.dto;

import lombok.Data;

@Data
public class RegistrationDTO {

    private Long competitionId;
    private Long teamId;
    private String contactPhone;
    private String remark;
    private String attachmentUrl;
}
