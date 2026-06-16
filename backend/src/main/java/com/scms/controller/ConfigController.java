package com.scms.controller;

import com.scms.common.Result;
import com.scms.service.SystemService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@Tag(name = "系统配置")
@RestController
@RequestMapping("/config")
@RequiredArgsConstructor
public class ConfigController {

    private final SystemService systemService;

    @Operation(summary = "配置列表")
    @GetMapping("/list")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<?> list() {
        return systemService.listConfigs();
    }

    @Operation(summary = "更新配置")
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<?> update(@PathVariable Long id, @RequestParam String configValue) {
        return systemService.updateConfig(id, configValue);
    }
}
