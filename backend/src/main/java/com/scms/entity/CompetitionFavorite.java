package com.scms.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("competition_favorite")
public class CompetitionFavorite {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long userId;
    private Long competitionId;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;
}
