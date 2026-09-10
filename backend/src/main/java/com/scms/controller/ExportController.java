package com.scms.controller;

import com.scms.security.LoginUser;
import com.scms.service.ExportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;

@Tag(name = "数据导出")
@RestController
@RequestMapping("/export")
@RequiredArgsConstructor
public class ExportController {

    private final ExportService exportService;

    @Operation(summary = "导出竞赛列表（教师仅限本人发布的）")
    @GetMapping("/competitions")
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    public void exportCompetitions(
            @RequestParam(required = false) Integer status,
            @RequestParam(required = false) String keyword,
            @AuthenticationPrincipal LoginUser loginUser,
            HttpServletResponse response) throws IOException {
        Long publisherId = "teacher".equals(loginUser.getRoleCode()) ? loginUser.getUserId() : null;
        exportService.exportCompetitions(response, status, keyword, publisherId);
    }

    @Operation(summary = "导出参赛队伍列表（教师仅限本人发布的竞赛）")
    @GetMapping("/teams")
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    public void exportTeams(
            @RequestParam(required = false) Long competitionId,
            @RequestParam(required = false) Integer status,
            @AuthenticationPrincipal LoginUser loginUser,
            HttpServletResponse response) throws IOException {
        Long publisherId = "teacher".equals(loginUser.getRoleCode()) ? loginUser.getUserId() : null;
        exportService.exportTeams(response, competitionId, status, publisherId);
    }

    @Operation(summary = "导出成绩列表（教师仅限本人发布的竞赛）")
    @GetMapping("/results")
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    public void exportResults(
            @RequestParam(required = false) Long competitionId,
            @RequestParam(required = false) Integer awardLevel,
            @RequestParam(required = false) Integer isPublished,
            @AuthenticationPrincipal LoginUser loginUser,
            HttpServletResponse response) throws IOException {
        Long publisherId = "teacher".equals(loginUser.getRoleCode()) ? loginUser.getUserId() : null;
        exportService.exportResults(response, competitionId, awardLevel, isPublished, publisherId);
    }

    @Operation(summary = "导出用户列表（管理员）")
    @GetMapping("/users")
    @PreAuthorize("hasRole('ADMIN')")
    public void exportUsers(
            @RequestParam(required = false) Integer userType,
            @RequestParam(required = false) String keyword,
            HttpServletResponse response) throws IOException {
        exportService.exportUsers(response, userType, keyword);
    }

    @Operation(summary = "导出学生成绩单")
    @GetMapping("/student-transcript")
    public void exportStudentTranscript(
            @AuthenticationPrincipal LoginUser loginUser,
            HttpServletResponse response) throws IOException {
        exportService.exportStudentTranscript(response, loginUser.getUserId());
    }
}
