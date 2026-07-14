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

    @Operation(summary = "导出竞赛列表")
    @GetMapping("/competitions")
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    public void exportCompetitions(
            @RequestParam(required = false) Integer status,
            @RequestParam(required = false) String keyword,
            HttpServletResponse response) throws IOException {
        exportService.exportCompetitions(response, status, keyword);
    }

    @Operation(summary = "导出报名列表")
    @GetMapping("/registrations")
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    public void exportRegistrations(
            @RequestParam(required = false) Long competitionId,
            @RequestParam(required = false) Integer status,
            HttpServletResponse response) throws IOException {
        exportService.exportRegistrations(response, competitionId, status);
    }

    @Operation(summary = "导出团队列表")
    @GetMapping("/teams")
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    public void exportTeams(
            @RequestParam(required = false) Long competitionId,
            @RequestParam(required = false) Integer status,
            HttpServletResponse response) throws IOException {
        exportService.exportTeams(response, competitionId, status);
    }

    @Operation(summary = "导出成绩列表")
    @GetMapping("/results")
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    public void exportResults(
            @RequestParam(required = false) Long competitionId,
            @RequestParam(required = false) Integer awardLevel,
            @RequestParam(required = false) Integer isPublished,
            HttpServletResponse response) throws IOException {
        exportService.exportResults(response, competitionId, awardLevel, isPublished);
    }

    @Operation(summary = "导出用户列表")
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
