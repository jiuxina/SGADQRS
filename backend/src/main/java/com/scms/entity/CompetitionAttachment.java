package com.scms.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("competition_attachment")
public class CompetitionAttachment {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long competitionId;
    private String fileName;
    private String fileUrl;
    private Long fileSize;
    private String fileType;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;
}
