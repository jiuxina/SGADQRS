package com.scms.controller;

import com.scms.common.Result;
import com.scms.dto.MessageDTO;
import com.scms.security.LoginUser;
import com.scms.service.SystemService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@Tag(name = "消息管理")
@RestController
@RequestMapping("/message")
@RequiredArgsConstructor
public class MessageController {

    private final SystemService systemService;

    @Operation(summary = "消息列表")
    @GetMapping("/list")
    public Result<?> list(@RequestParam(defaultValue = "1") int current,
                          @RequestParam(defaultValue = "10") int size,
                          @RequestParam(required = false) Integer isRead,
                          @AuthenticationPrincipal LoginUser loginUser) {
        return systemService.listMessages(current, size, loginUser.getUserId(), isRead);
    }

    @Operation(summary = "发送消息")
    @PostMapping("/send")
    public Result<?> send(@Valid @RequestBody MessageDTO dto,
                          @AuthenticationPrincipal LoginUser loginUser) {
        return systemService.sendMessageToTarget(dto, loginUser.getUserId());
    }

    @Operation(summary = "标记已读")
    @PutMapping("/{id}/read")
    public Result<?> markRead(@PathVariable Long id) {
        return systemService.markMessageRead(id);
    }

    @Operation(summary = "全部标记已读")
    @PutMapping("/readAll")
    public Result<?> markAllRead(@AuthenticationPrincipal LoginUser loginUser) {
        return systemService.markAllMessagesRead(loginUser.getUserId());
    }

    @Operation(summary = "未读消息数")
    @GetMapping("/unread")
    public Result<?> unreadCount(@AuthenticationPrincipal LoginUser loginUser) {
        return systemService.getUnreadCount(loginUser.getUserId());
    }
}
