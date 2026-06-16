package com.scms.controller;

import com.scms.common.Result;
import com.scms.service.SystemService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@Tag(name = "系统日志")
@RestController
@RequestMapping("/log")
@RequiredArgsConstructor
public class LogController {

    private final SystemService systemService;

    @Operation(summary = "操作日志列表")
    @GetMapping("/list")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<?> list(@RequestParam(defaultValue = "1") int current,
                          @RequestParam(defaultValue = "10") int size,
                          @RequestParam(required = false) String username,
                          @RequestParam(required = false) String method,
                          @RequestParam(required = false) Integer status) {
        return systemService.listLogs(current, size, username, method, status);
    }
}
