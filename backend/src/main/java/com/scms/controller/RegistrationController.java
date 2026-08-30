package com.scms.controller;

import com.scms.common.Result;
import com.scms.dto.AuditDTO;
import com.scms.dto.BatchAuditDTO;
import com.scms.dto.RegistrationDTO;
import com.scms.dto.TeamDTO;
import com.scms.security.LoginUser;
import com.scms.service.RegistrationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@Tag(name = "报名管理")
@RestController
@RequestMapping("/registration")
@RequiredArgsConstructor
public class RegistrationController {

    private final RegistrationService registrationService;

    @Operation(summary = "报名列表")
    @GetMapping("/list")
    public Result<?> list(@RequestParam(defaultValue = "1") int current,
                          @RequestParam(defaultValue = "10") int size,
                          @RequestParam(required = false) Long competitionId,
                          @RequestParam(required = false) Long studentId,
                          @RequestParam(required = false) Integer status,
                          @RequestParam(required = false) Long publisherId,
                          @RequestParam(required = false) String keyword) {
        return registrationService.listRegistrations(current, size, competitionId, studentId, status, publisherId, keyword);
    }

    @Operation(summary = "学生报名")
    @PostMapping
    @PreAuthorize("hasRole('STUDENT')")
    public Result<?> register(@Valid @RequestBody RegistrationDTO dto,
                              @AuthenticationPrincipal LoginUser loginUser) {
        return registrationService.register(dto, loginUser.getUserId());
    }

    @Operation(summary = "审核报名")
    @PutMapping("/{id}/audit")
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    public Result<?> audit(@PathVariable Long id, @RequestBody AuditDTO dto) {
        return registrationService.auditRegistration(id, dto);
    }

    @Operation(summary = "批量审核报名")
    @PutMapping("/batch-audit")
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    public Result<?> batchAudit(@Valid @RequestBody BatchAuditDTO dto) {
        return registrationService.batchAuditRegistration(dto);
    }

    @Operation(summary = "取消报名")
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('STUDENT')")
    public Result<?> cancel(@PathVariable Long id,
                            @AuthenticationPrincipal LoginUser loginUser) {
        return registrationService.cancelRegistration(id, loginUser.getUserId());
    }

    // ===== 团队管理 =====

    @Operation(summary = "团队列表")
    @GetMapping("/teams")
    public Result<?> teamList(@RequestParam(defaultValue = "1") int current,
                              @RequestParam(defaultValue = "10") int size,
                              @RequestParam(required = false) Long competitionId,
                              @RequestParam(required = false) Integer status,
                              @RequestParam(required = false) Long teacherId,
                              @AuthenticationPrincipal LoginUser loginUser) {
        Long publisherId = "teacher".equals(loginUser.getRoleCode()) && teacherId == null ? loginUser.getUserId() : null;
        return registrationService.listTeams(current, size, competitionId, status, publisherId, teacherId);
    }

    @Operation(summary = "创建团队")
    @PostMapping("/team")
    @PreAuthorize("hasRole('STUDENT')")
    public Result<?> createTeam(@Valid @RequestBody TeamDTO dto,
                                @AuthenticationPrincipal LoginUser loginUser) {
        return registrationService.createTeam(dto, loginUser.getUserId());
    }

    @Operation(summary = "加入团队")
    @PostMapping("/team/{teamId}/join")
    @PreAuthorize("hasRole('STUDENT')")
    public Result<?> joinTeam(@PathVariable Long teamId,
                              @AuthenticationPrincipal LoginUser loginUser) {
        return registrationService.joinTeam(teamId, loginUser.getUserId());
    }

    @Operation(summary = "审核团队")
    @PutMapping("/team/{id}/audit")
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    public Result<?> auditTeam(@PathVariable Long id,
                               @RequestParam Integer status,
                               @RequestParam(required = false) String auditRemark) {
        return registrationService.auditTeam(id, status, auditRemark);
    }

    // ===== 指导老师操作 =====

    @Operation(summary = "接受指导邀请")
    @PutMapping("/team/{teamId}/advisor/accept")
    @PreAuthorize("hasRole('TEACHER')")
    public Result<?> acceptAdvisor(@PathVariable Long teamId,
                                   @AuthenticationPrincipal LoginUser loginUser) {
        return registrationService.acceptAdvisor(teamId, loginUser.getUserId());
    }

    @Operation(summary = "拒绝指导邀请")
    @PutMapping("/team/{teamId}/advisor/reject")
    @PreAuthorize("hasRole('TEACHER')")
    public Result<?> rejectAdvisor(@PathVariable Long teamId,
                                   @AuthenticationPrincipal LoginUser loginUser) {
        return registrationService.rejectAdvisor(teamId, loginUser.getUserId());
    }

    @Operation(summary = "审核入队请求")
    @PutMapping("/team/{teamId}/member/{memberId}/audit")
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    public Result<?> auditJoinRequest(@PathVariable Long teamId,
                                      @PathVariable Long memberId,
                                      @RequestParam Integer status) {
        return registrationService.auditJoinRequest(teamId, memberId, status);
    }

    @Operation(summary = "获取待审核入队申请")
    @GetMapping("/team/{teamId}/member/pending")
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    public Result<?> listPendingJoinRequests(@PathVariable Long teamId) {
        return registrationService.listPendingJoinRequests(teamId);
    }
}
