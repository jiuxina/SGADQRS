package com.scms.dto;

import lombok.Data;

@Data
public class CommunityRequestDTO {

    /** 1-资料互看 2-入队申请 3-入队邀请 */
    private Integer type;

    /** 关联招募帖（type=2/3 必填） */
    private Long postId;

    /** 目标队伍（type=3 必填：邀请对方加入哪支队伍） */
    private Long teamId;

    /** 接收人（type=1 必填） */
    private Long toUserId;
    private String message;
}
