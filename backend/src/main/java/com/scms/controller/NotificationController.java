package com.scms.controller;

import com.scms.common.Result;
import com.scms.security.LoginUser;
import com.scms.service.NotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@Tag(name = "站内通知")
@RestController
@RequestMapping("/notification")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @Operation(summary = "我的通知列表")
    @GetMapping("/list")
    public Result<?> list(@RequestParam(defaultValue = "1") int current,
                          @RequestParam(defaultValue = "10") int size,
                          @RequestParam(required = false) Boolean unreadOnly,
                          @AuthenticationPrincipal LoginUser loginUser) {
        return notificationService.list(current, size, unreadOnly, loginUser.getUserId());
    }

    @Operation(summary = "全员公告列表")
    @GetMapping("/announcements")
    public Result<?> announcements(@RequestParam(defaultValue = "1") int current,
                                   @RequestParam(defaultValue = "10") int size) {
        return notificationService.announcements(current, size);
    }

    @Operation(summary = "未读数")
    @GetMapping("/unread-count")
    public Result<?> unreadCount(@AuthenticationPrincipal LoginUser loginUser) {
        return notificationService.unreadCount(loginUser.getUserId());
    }

    @Operation(summary = "标记已读")
    @PutMapping("/read/{id}")
    public Result<?> markRead(@PathVariable Long id,
                              @AuthenticationPrincipal LoginUser loginUser) {
        return notificationService.markRead(id, loginUser.getUserId());
    }

    @Operation(summary = "全部已读")
    @PutMapping("/read-all")
    public Result<?> markAllRead(@AuthenticationPrincipal LoginUser loginUser) {
        return notificationService.markAllRead(loginUser.getUserId());
    }
}
