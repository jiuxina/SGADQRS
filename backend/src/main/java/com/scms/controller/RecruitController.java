package com.scms.controller;

import com.scms.common.Result;
import com.scms.dto.RecruitPostDTO;
import com.scms.security.LoginUser;
import com.scms.service.RecruitService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@Tag(name = "组队招募")
@RestController
@RequestMapping("/recruit")
@RequiredArgsConstructor
public class RecruitController {

    private final RecruitService recruitService;

    @Operation(summary = "发布招募/求组帖")
    @PostMapping
    @PreAuthorize("hasAnyRole('STUDENT', 'ADMIN')")
    public Result<?> create(@RequestBody RecruitPostDTO dto,
                            @AuthenticationPrincipal LoginUser loginUser) {
        return recruitService.create(dto, loginUser.getUserId());
    }

    @Operation(summary = "招募广场列表")
    @GetMapping("/list")
    public Result<?> list(@RequestParam(defaultValue = "1") int current,
                          @RequestParam(defaultValue = "10") int size,
                          @RequestParam(required = false) Long competitionId,
                          @RequestParam(required = false) Integer type,
                          @RequestParam(required = false) Integer status,
                          @RequestParam(required = false) String keyword,
                          @AuthenticationPrincipal LoginUser loginUser) {
        return recruitService.list(current, size, competitionId, type, status, keyword, loginUser.getUserId());
    }

    @Operation(summary = "我的帖子")
    @GetMapping("/mine")
    @PreAuthorize("hasAnyRole('STUDENT', 'ADMIN')")
    public Result<?> mine(@AuthenticationPrincipal LoginUser loginUser) {
        return recruitService.mine(loginUser.getUserId());
    }

    @Operation(summary = "帖子详情")
    @GetMapping("/{id}")
    public Result<?> detail(@PathVariable Long id,
                            @AuthenticationPrincipal LoginUser loginUser) {
        return recruitService.detail(id, loginUser.getUserId());
    }

    @Operation(summary = "编辑帖子")
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('STUDENT', 'ADMIN')")
    public Result<?> update(@PathVariable Long id,
                            @RequestBody RecruitPostDTO dto,
                            @AuthenticationPrincipal LoginUser loginUser) {
        return recruitService.update(id, dto, loginUser.getUserId());
    }

    @Operation(summary = "关闭/删除帖子")
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('STUDENT', 'ADMIN')")
    public Result<?> close(@PathVariable Long id,
                           @AuthenticationPrincipal LoginUser loginUser) {
        return recruitService.close(id, loginUser.getUserId(), "admin".equals(loginUser.getRoleCode()));
    }
}
