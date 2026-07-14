package com.scms.service;

import com.scms.dto.WebSocketNotification;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

/**
 * WebSocket 实时通知推送服务。
 * <p>
 * 提供两种推送模式:
 * 1. sendToUser — 向指定用户推送私有通知
 * 2. broadcast  — 向所有在线用户广播通知
 * </p>
 * <p>
 * 本服务作为现有消息轮询机制的增强，不影响原有逻辑。
 * 其他 Service 在写入消息/审核/成绩后调用本服务进行实时推送。
 * </p>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class WebSocketNotificationService {

    private final SimpMessagingTemplate messagingTemplate;

    /**
     * 向指定用户推送通知
     *
     * @param userId       目标用户ID（对应 LoginUser.userId）
     * @param notification 通知内容
     */
    public void sendToUser(Long userId, WebSocketNotification notification) {
        try {
            messagingTemplate.convertAndSendToUser(
                    userId.toString(),
                    "/queue/notifications",
                    notification
            );
            log.debug("WebSocket 推送通知给用户 {}: type={}, title={}",
                    userId, notification.getType(), notification.getTitle());
        } catch (Exception e) {
            log.warn("WebSocket 推送失败 (userId={}): {}", userId, e.getMessage());
        }
    }

    /**
     * 向所有在线用户广播通知
     *
     * @param notification 通知内容
     */
    public void broadcast(WebSocketNotification notification) {
        try {
            messagingTemplate.convertAndSend("/topic/broadcast", notification);
            log.debug("WebSocket 广播通知: type={}, title={}",
                    notification.getType(), notification.getTitle());
        } catch (Exception e) {
            log.warn("WebSocket 广播失败: {}", e.getMessage());
        }
    }

    /**
     * 推送新消息通知
     */
    public void notifyNewMessage(Long userId, String title, String content) {
        sendToUser(userId, new WebSocketNotification("message", title, content));
    }

    /**
     * 推送审核结果通知
     */
    public void notifyAuditResult(Long userId, String title, String content) {
        sendToUser(userId, new WebSocketNotification("audit", title, content));
    }

    /**
     * 推送成绩发布通知
     */
    public void notifyGradePublished(Long userId, String title, String content) {
        sendToUser(userId, new WebSocketNotification("grade", title, content));
    }

    /**
     * 广播新公告
     */
    public void notifyNewNotice(String title, String content) {
        broadcast(new WebSocketNotification("notice", title, content));
    }
}
