package com.scms.dto;

import lombok.Data;

/**
 * 用户自助资料编辑（本人，不含角色/状态/真实姓名等敏感字段）
 */
@Data
public class ProfileDTO {

    private String nickname;
    private String avatar;
    private Integer gender;
    private String bio;

    /** 技能标签(逗号分隔) */
    private String skills;
    private String deptName;
    private String majorName;
    private String className;
}
