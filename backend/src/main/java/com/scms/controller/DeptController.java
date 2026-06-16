package com.scms.controller;

import com.scms.common.Result;
import com.scms.service.SystemService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@Tag(name = "组织架构")
@RestController
@RequestMapping("/dept")
@RequiredArgsConstructor
public class DeptController {

    private final SystemService systemService;

    @Operation(summary = "学院列表")
    @GetMapping("/list")
    public Result<?> listDepts() {
        return systemService.listDepts();
    }

    @Operation(summary = "专业列表")
    @GetMapping("/major/list")
    public Result<?> listMajors(@RequestParam(required = false) Long deptId) {
        return systemService.listMajors(deptId);
    }

    @Operation(summary = "班级列表")
    @GetMapping("/class/list")
    public Result<?> listClasses(@RequestParam(required = false) Long majorId) {
        return systemService.listClasses(majorId);
    }
}
