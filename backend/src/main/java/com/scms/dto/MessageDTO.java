package com.scms.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.List;

/**
 * 消息发送DTO
 * targetType: user-指定用户 role-按角色 dept-按院系 all-全员
 */
@Data
public class MessageDTO {

    @NotBlank(message = "消息标题不能为空")
    private String title;

    @NotBlank(message = "消息内容不能为空")
    private String content;

    /** 发送目标类型：user / role / dept / all */
    @NotBlank(message = "发送目标类型不能为空")
    private String targetType;

    /** 目标用户ID列表（targetType=user时必填） */
    private List<Long> userIds;

    /** 目标角色：1-学生 2-教师（targetType=role时必填） */
    private Integer userType;

    /** 目标院系ID（targetType=dept时必填） */
    private Long deptId;
}
