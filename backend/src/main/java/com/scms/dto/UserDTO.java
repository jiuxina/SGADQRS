package com.scms.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class UserDTO {

    private Long id;

    @NotBlank(message = "用户名不能为空")
    private String username;

    private String password;

    @NotBlank(message = "姓名不能为空")
    private String realName;

    private String avatar;
    private Integer gender;
    private Integer userType;
    private Long deptId;
    private Long majorId;
    private Long classId;
}
