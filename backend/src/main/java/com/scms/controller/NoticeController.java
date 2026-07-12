package com.scms.controller;

import com.scms.common.Result;
import com.scms.dto.NoticeDTO;
import com.scms.service.SystemService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@Tag(name = "公告管理")
@RestController
@RequestMapping("/notice")
@RequiredArgsConstructor
public class NoticeController {

    private final SystemService systemService;

    @Operation(summary = "公告列表")
    @GetMapping("/list")
    public Result<?> list(@RequestParam(defaultValue = "1") int current,
                          @RequestParam(defaultValue = "10") int size,
                          @RequestParam(required = false) Integer noticeType,
                          @RequestParam(required = false) Integer status) {
        return systemService.listNotices(current, size, noticeType, status);
    }

    @Operation(summary = "发布公告")
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public Result<?> create(@Valid @RequestBody NoticeDTO dto) {
        return systemService.createNotice(dto);
    }

    @Operation(summary = "更新公告")
    @PutMapping
    @PreAuthorize("hasRole('ADMIN')")
    public Result<?> update(@RequestBody NoticeDTO dto) {
        return systemService.updateNotice(dto);
    }

    @Operation(summary = "删除公告")
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<?> delete(@PathVariable Long id) {
        return systemService.deleteNotice(id);
    }

    @Operation(summary = "置顶/取消置顶公告")
    @PutMapping("/{id}/top")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<?> toggleTop(@PathVariable Long id) {
        return systemService.toggleNoticeTop(id);
    }
}
