package com.scms.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.scms.common.PageResult;
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

    /** 发送个人通知 */
    public void send(Long userId, String type, String title, String content, String refType, Long refId) {
        Notification n = new Notification();
        n.setUserId(userId);
        n.setType(type);
        n.setTitle(title);
        n.setContent(content);
        n.setRefType(refType);
        n.setRefId(refId);
        n.setIsRead(0);
        n.setIsTop(0);
        notificationMapper.insert(n);
    }

    /** 我的收件箱（公告在 announcements 接口单独拉取） */
    public Result<?> list(int current, int size, Boolean unreadOnly, Long meId) {
        Page<Notification> page = new Page<>(current, size);
        LambdaQueryWrapper<Notification> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Notification::getUserId, meId);
        if (Boolean.TRUE.equals(unreadOnly)) wrapper.eq(Notification::getIsRead, 0);
        wrapper.orderByDesc(Notification::getCreateTime);
        return Result.success(new PageResult<>(notificationMapper.selectPage(page, wrapper)));
    }

    /** 全员公告 */
    public Result<?> announcements(int current, int size) {
        Page<Notification> page = new Page<>(current, size);
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
