package com.scms.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("sys_user")
public class User {

    @TableId(type = IdType.AUTO)
    private Long id;

    private String username;
    private String password;
    private String realName;
    private String avatar;
    private Integer gender;
    private String phone;
    private String email;

    /** 用户类型：1-学生 2-教师 3-管理员 */
    private Integer userType;

    /** 状态：0-禁用 1-启用 */
    private Integer status;

    private Long deptId;
    private Long majorId;
    private Long classId;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;

    private LocalDateTime lastLoginTime;

    /** 角色编码（非数据库字段） */
    @TableField(exist = false)
    private String roleCode;

    /** 所属部门名称（非数据库字段） */
    @TableField(exist = false)
    private String deptName;

    /** 专业名称（非数据库字段） */
    @TableField(exist = false)
    private String majorName;

    /** 班级名称（非数据库字段） */
    @TableField(exist = false)
    private String className;
}
