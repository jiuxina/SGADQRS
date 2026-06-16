package com.scms.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@TableName("competition_certificate")
public class CompetitionCertificate {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long resultId;
    private String certificateNo;
    private String certificateUrl;
    private LocalDate issueDate;

    /** 状态：0-无效 1-有效 */
    private Integer status;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;
}
