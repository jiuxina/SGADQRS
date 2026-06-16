package com.scms.controller;

import com.scms.common.Result;
import com.scms.dto.ResultDTO;
import com.scms.security.LoginUser;
import com.scms.service.ResultService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@Tag(name = "成绩管理")
@RestController
@RequestMapping("/result")
@RequiredArgsConstructor
public class ResultController {

    private final ResultService resultService;

    @Operation(summary = "成绩列表")
    @GetMapping("/list")
    public Result<?> list(@RequestParam(defaultValue = "1") int current,
                          @RequestParam(defaultValue = "10") int size,
                          @RequestParam(required = false) Long competitionId,
                          @RequestParam(required = false) Long studentId,
                          @RequestParam(required = false) Integer awardLevel,
                          @RequestParam(required = false) Integer isPublished,
                          @AuthenticationPrincipal LoginUser loginUser) {
        Long publisherId = "teacher".equals(loginUser.getRoleCode()) ? loginUser.getUserId() : null;
        return resultService.listResults(current, size, competitionId, studentId, awardLevel, isPublished, publisherId);
    }

    @Operation(summary = "录入成绩")
    @PostMapping
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    public Result<?> save(@RequestBody ResultDTO dto) {
        return resultService.saveResult(dto);
    }

    @Operation(summary = "更新成绩")
    @PutMapping
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    public Result<?> update(@RequestBody ResultDTO dto) {
        return resultService.updateResult(dto);
    }

    @Operation(summary = "发布成绩")
    @PostMapping("/publish/{competitionId}")
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    public Result<?> publish(@PathVariable Long competitionId) {
        return resultService.publishResults(competitionId);
    }

    @Operation(summary = "学生成绩统计")
    @GetMapping("/student/stats")
    @PreAuthorize("hasRole('STUDENT')")
    public Result<?> studentStats(@AuthenticationPrincipal LoginUser loginUser) {
        return resultService.getStudentStats(loginUser.getUserId());
    }
}
