package com.scms.controller;

import com.scms.common.Result;
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

import java.util.Map;

@Tag(name = "参赛队伍（报名与队伍合一）")
@RestController
@RequestMapping("/registration")
@RequiredArgsConstructor
public class RegistrationController {

    private final RegistrationService registrationService;

    @Operation(summary = "参赛队伍列表（学生=我所在的队伍；教师=我指导的队伍；管理员=全部）")
    @GetMapping("/teams")
    public Result<?> teamList(@RequestParam(defaultValue = "1") int current,
                              @RequestParam(defaultValue = "10") int size,
                              @RequestParam(required = false) Long competitionId,
                              @RequestParam(required = false) Integer status,
                              @RequestParam(required = false) Long teacherId,
                              @AuthenticationPrincipal LoginUser loginUser) {
        Long tid = null;
        Long memberId = null;
        Long publisherId = null;
        if ("teacher".equals(loginUser.getRoleCode())) {
            if (teacherId != null) {
                // 指导团队：显式按指导老师过滤
                tid = teacherId;
            } else {
                // 我发布竞赛的团队：默认限定在本人发布的竞赛范围内
                publisherId = loginUser.getUserId();
            }
        } else if ("student".equals(loginUser.getRoleCode())) {
            memberId = loginUser.getUserId();
        }
        return registrationService.listTeams(current, size, competitionId, status, publisherId, tid, memberId);
    }

    @Operation(summary = "竞赛参赛者名单（已通过队伍的全部成员，供成绩录入）")
    @GetMapping("/participants")
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    public Result<?> participants(@RequestParam Long competitionId) {
        return registrationService.listParticipants(competitionId);
    }

    @Operation(summary = "参赛队伍详情（队员、指导老师/竞赛发布教师、管理员可见）")
    @GetMapping("/team/{id}")
    public Result<?> teamDetail(@PathVariable Long id,
                                @AuthenticationPrincipal LoginUser loginUser) {
        return registrationService.getTeamDetail(id, loginUser);
    }

    @Operation(summary = "创建参赛队伍（单人赛自动1人队并直接提交）")
    @PostMapping("/team")
    @PreAuthorize("hasRole('STUDENT')")
    public Result<?> createTeam(@Valid @RequestBody TeamDTO dto,
                                @AuthenticationPrincipal LoginUser loginUser) {
        return registrationService.createTeam(dto, loginUser.getUserId());
    }

    @Operation(summary = "队长提交审核（组建中→已提交）")
    @PutMapping("/team/{id}/submit")
    @PreAuthorize("hasRole('STUDENT')")
    public Result<?> submitTeam(@PathVariable Long id,
                                @AuthenticationPrincipal LoginUser loginUser) {
        return registrationService.submitTeam(id, loginUser.getUserId());
    }

    @Operation(summary = "队长更换指导老师（teacherId 为空表示取消指定）")
    @PutMapping("/team/{id}/teacher")
    @PreAuthorize("hasRole('STUDENT')")
    public Result<?> changeTeacher(@PathVariable Long id,
                                   @RequestBody Map<String, Long> body,
                                   @AuthenticationPrincipal LoginUser loginUser) {
        return registrationService.changeTeacher(id, loginUser.getUserId(), body.get("teacherId"));
    }

    @Operation(summary = "解散队伍（队长本人，限组建中/待审核状态）")
    @DeleteMapping("/team/{id}")
    public Result<?> disband(@PathVariable Long id,
                             @AuthenticationPrincipal LoginUser loginUser) {
        return registrationService.disbandTeam(id, loginUser.getUserId());
    }

    @Operation(summary = "管理员审核参赛队伍")
    @PutMapping("/team/{id}/audit")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<?> auditTeam(@PathVariable Long id,
                               @RequestParam Integer status,
                               @RequestParam(required = false) String auditRemark) {
        return registrationService.auditTeam(id, status, auditRemark);
    }
}
