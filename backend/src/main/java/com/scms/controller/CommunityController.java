package com.scms.controller;

import com.scms.common.Result;
import com.scms.dto.CommunityRequestDTO;
import com.scms.dto.RequestHandleDTO;
import com.scms.security.LoginUser;
import com.scms.service.CommunityService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@Tag(name = "社区请求（互看/申请/邀请）")
@RestController
@RequestMapping("/community")
@RequiredArgsConstructor
public class CommunityController {

    private final CommunityService communityService;

    @Operation(summary = "发起请求：1-资料互看 2-入队申请 3-入队邀请")
    @PostMapping("/request")
    @PreAuthorize("hasAnyRole('STUDENT', 'ADMIN')")
    public Result<?> create(@RequestBody CommunityRequestDTO dto,
                            @AuthenticationPrincipal LoginUser loginUser) {
        return communityService.createRequest(dto, loginUser.getUserId());
    }

    @Operation(summary = "处理请求：1-同意 2-拒绝")
    @PutMapping("/request/{id}/handle")
    @PreAuthorize("hasAnyRole('STUDENT', 'ADMIN')")
    public Result<?> handle(@PathVariable Long id,
                            @RequestBody RequestHandleDTO dto,
                            @AuthenticationPrincipal LoginUser loginUser) {
        return communityService.handle(id, dto.getStatus(), loginUser.getUserId());
    }

    @Operation(summary = "收到的请求")
    @GetMapping("/request/received")
    @PreAuthorize("hasAnyRole('STUDENT', 'ADMIN')")
    public Result<?> received(@RequestParam(defaultValue = "1") int current,
                              @RequestParam(defaultValue = "10") int size,
                              @RequestParam(required = false) Integer type,
                              @RequestParam(required = false) Integer status,
                              @AuthenticationPrincipal LoginUser loginUser) {
        return communityService.received(current, size, type, status, loginUser.getUserId());
    }

    @Operation(summary = "我发出的请求")
    @GetMapping("/request/sent")
    @PreAuthorize("hasAnyRole('STUDENT', 'ADMIN')")
    public Result<?> sent(@RequestParam(defaultValue = "1") int current,
                          @RequestParam(defaultValue = "10") int size,
                          @RequestParam(required = false) Integer type,
                          @RequestParam(required = false) Integer status,
                          @AuthenticationPrincipal LoginUser loginUser) {
        return communityService.sent(current, size, type, status, loginUser.getUserId());
    }
}
