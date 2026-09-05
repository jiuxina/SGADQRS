package com.scms.entity;

import com.baomidou.mybatisplus.annotation.*;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Map;

@Data
@TableName("competition")
public class Competition {

    @TableId(type = IdType.AUTO)
    private Long id;

    private String competitionName;
    private String organizer;
    private Long publisherId;
    private String coverImage;
    private String description;
    private String rules;
    private LocalDateTime registrationStart;
    private LocalDateTime registrationEnd;
    private LocalDateTime competitionStart;
    private LocalDateTime competitionEnd;
    private String location;
    private Integer maxMembers;

    /** 自定义奖项列表（JSON格式，原始存储） */
    @JsonIgnore
    private String awards;

    /** 奖项列表（解析后供前端使用） */
    @JsonProperty("awards")
    @SuppressWarnings("unchecked")
    public List<Map<String, Object>> getAwardList() {
        if (awards == null || awards.isBlank()) return Collections.emptyList();
        try {
            return new com.fasterxml.jackson.databind.ObjectMapper().readValue(awards, List.class);
        } catch (Exception e) {
            return Collections.emptyList();
        }
    }

    /** 附件列表（JSON格式，原始存储） */
    @JsonIgnore
    private String attachments;

    /** 附件列表（解析后供前端使用） */
    @JsonProperty("attachments")
    @SuppressWarnings("unchecked")
    public List<Map<String, Object>> getAttachmentList() {
        if (attachments == null || attachments.isBlank()) return Collections.emptyList();
        try {
            return new com.fasterxml.jackson.databind.ObjectMapper().readValue(attachments, List.class);
        } catch (Exception e) {
            return Collections.emptyList();
        }
    }

    /** 状态：0-草稿 1-待审核 2-已发布 3-进行中 4-已结束 5-已驳回 */
    private Integer status;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;

    /** 发布人姓名（非数据库字段） */
    @TableField(exist = false)
    private String publisherName;

    /** 报名人数（非数据库字段） */
    @TableField(exist = false)
    private Integer registrationCount;

    /** 当前用户是否已报名（非数据库字段） */
    @TableField(exist = false)
    private Boolean hasRegistered;

}
