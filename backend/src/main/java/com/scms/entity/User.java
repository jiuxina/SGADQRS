package com.scms.entity;

import com.baomidou.mybatisplus.annotation.*;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("sys_user")
public class User {

    @TableId(type = IdType.AUTO)
    private Long id;

    private String username;
    /** 边界：密码哈希绝不随实体序列化外发（任何查询接口均不回显） */
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private String password;
    private String realName;

    /** 社区昵称（脱敏卡片展示用，空则回退 realName） */
    private String nickname;
    private String avatar;
    private Integer gender;

    /** 用户类型：1-学生 2-教师 3-管理员 */
    private Integer userType;

    /** 状态：1-启用 0-禁用 */
    private Integer status;

    private String deptName;
    private String majorName;
    private String className;

    /** 个人简介 */
    private String bio;

    /** 技能标签(逗号分隔) */
    private String skills;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;

    /** 角色编码（非数据库字段，由 userType 推导） */
    @TableField(exist = false)
    private String roleCode;
}
