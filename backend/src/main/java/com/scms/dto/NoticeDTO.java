package com.scms.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class NoticeDTO {

    private Long id;

    @NotBlank(message = "公告标题不能为空")
    private String noticeTitle;

    @NotBlank(message = "公告内容不能为空")
    private String noticeContent;

    private Integer noticeType = 2;
}
