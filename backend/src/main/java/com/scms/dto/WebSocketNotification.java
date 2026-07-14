package com.scms.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

/**
 * WebSocket 实时通知消息体
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class WebSocketNotification {

    /**
     * 通知类型: message(新消息), audit(审核结果), grade(成绩发布), notice(公告)
     */
    private String type;

    /**
     * 通知标题
     */
    private String title;

    /**
     * 通知内容摘要
     */
    private String content;

    /**
     * 附加数据（可选）— 如关联ID、跳转路径等
     */
    private Map<String, Object> data;

    public WebSocketNotification(String type, String title, String content) {
        this.type = type;
        this.title = title;
        this.content = content;
    }
}
