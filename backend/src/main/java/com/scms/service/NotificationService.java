package com.scms.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.scms.common.PageResult;
import com.scms.common.Pages;
import com.scms.common.Result;
import com.scms.entity.Notification;
import com.scms.mapper.NotificationMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationMapper notificationMapper;

    /**
     * 发送个人通知：尽力而为。通知是业务动作的附属品，其插入失败（超长/瞬时故障）不得回滚
     * 已完成的审核/入队/发布等业务；失败记 error 日志便于排查。
     */
    public void send(Long userId, String type, String title, String content, String refType, Long refId) {
        try {
            Notification n = new Notification();
            n.setUserId(userId);
            n.setType(type);
            n.setTitle(title != null && title.length() > 100 ? title.substring(0, 100) : title);
            n.setContent(content != null && content.length() > 500 ? content.substring(0, 500) : content);
            n.setRefType(refType);
            n.setRefId(refId);
            n.setIsRead(0);
            n.setIsTop(0);
            notificationMapper.insert(n);
        } catch (Exception e) {
            org.slf4j.LoggerFactory.getLogger(NotificationService.class)
                    .error("站内通知发送失败(userId={}, refType={}, refId={})", userId, refType, refId, e);
        }
    }

    /** 我的收件箱（公告在 announcements 接口单独拉取） */
    public Result<?> list(int current, int size, Boolean unreadOnly, Long meId) {
        Page<Notification> page = Pages.of(current, size);
        LambdaQueryWrapper<Notification> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Notification::getUserId, meId);
        if (Boolean.TRUE.equals(unreadOnly)) wrapper.eq(Notification::getIsRead, 0);
        wrapper.orderByDesc(Notification::getCreateTime);
        return Result.success(new PageResult<>(notificationMapper.selectPage(page, wrapper)));
    }

    /** 全员公告 */
    public Result<?> announcements(int current, int size) {
        Page<Notification> page = Pages.of(current, size);
        LambdaQueryWrapper<Notification> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Notification::getUserId, 0L);
        wrapper.eq(Notification::getType, "announcement");
        wrapper.eq(Notification::getIsRead, 0); // 草稿不下发给学生
        wrapper.orderByDesc(Notification::getIsTop).orderByDesc(Notification::getCreateTime);
        return Result.success(new PageResult<>(notificationMapper.selectPage(page, wrapper)));
    }

    public Result<?> unreadCount(Long meId) {
        Long count = notificationMapper.selectCount(
                new LambdaQueryWrapper<Notification>()
                        .eq(Notification::getUserId, meId)
                        .eq(Notification::getIsRead, 0)
        );
        Map<String, Object> data = new HashMap<>();
        data.put("count", count == null ? 0 : count);
        return Result.success(data);
    }

    public Result<?> markRead(Long id, Long meId) {
        notificationMapper.update(null, new LambdaUpdateWrapper<Notification>()
                .eq(Notification::getId, id)
                .eq(Notification::getUserId, meId)
                .set(Notification::getIsRead, 1));
        return Result.success("已读", null);
    }

    public Result<?> markAllRead(Long meId) {
        notificationMapper.update(null, new LambdaUpdateWrapper<Notification>()
                .eq(Notification::getUserId, meId)
                .eq(Notification::getIsRead, 0)
                .set(Notification::getIsRead, 1));
        return Result.success("全部已读", null);
    }
}
