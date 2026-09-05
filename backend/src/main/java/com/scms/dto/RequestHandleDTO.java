package com.scms.dto;

import lombok.Data;

@Data
public class RequestHandleDTO {

    /** 1-同意 2-拒绝 */
    private Integer status;
}
