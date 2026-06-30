package com.scms.controller;

import com.scms.common.Result;
import com.scms.dto.CompetitionDTO;
import com.scms.security.LoginUser;
import com.scms.service.CompetitionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@Tag(name = "竞赛管理")
@RestController
@RequestMapping("/competition")
@RequiredArgsConstructor
public class CompetitionController {

    private final CompetitionService competitionService;

    @Operation(summary = "竞赛列表")
    @GetMapping("/list")
    public Result<?> list(@RequestParam(defaultValue = "1") int current,
                          @RequestParam(defaultValue = "10") int size,
                          @RequestParam(required = false) String keyword,
                          @RequestParam(required = false) Integer status,
                          @RequestParam(required = false) Long publisherId,
                          @AuthenticationPrincipal LoginUser loginUser) {
        Long userId = loginUser != null ? loginUser.getUserId() : null;
        return competitionService.listCompetitions(current, size, keyword, status, publisherId, userId);
    }

    @Operation(summary = "竞赛详情")
    @GetMapping("/{id}")
    public Result<?> getById(@PathVariable Long id,
                             @AuthenticationPrincipal LoginUser loginUser) {
        Long userId = loginUser != null ? loginUser.getUserId() : null;
        return competitionService.getCompetitionById(id, userId);
    }

    @Operation(summary = "创建竞赛")
    @PostMapping
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    public Result<?> create(@Valid @RequestBody CompetitionDTO dto,
                            @AuthenticationPrincipal LoginUser loginUser) {
        return competitionService.createCompetition(dto, loginUser.getUserId());
    }

    @Operation(summary = "更新竞赛")
    @PutMapping
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    public Result<?> update(@RequestBody CompetitionDTO dto) {
        return competitionService.updateCompetition(dto);
    }

    @Operation(summary = "审核竞赛")
    @PutMapping("/{id}/audit")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<?> audit(@PathVariable Long id,
                           @RequestParam Integer status,
                           @RequestParam(required = false) String remark) {
        return competitionService.auditCompetition(id, status, remark);
    }

    @Operation(summary = "删除竞赛")
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    public Result<?> delete(@PathVariable Long id) {
        return competitionService.deleteCompetition(id);
    }

    @Operation(summary = "仪表盘统计")
    @GetMapping("/dashboard")
    public Result<?> dashboard(@AuthenticationPrincipal LoginUser loginUser) {
        return competitionService.getDashboardStats(loginUser.getUserId(), loginUser.getRoleCode());
    }
}
