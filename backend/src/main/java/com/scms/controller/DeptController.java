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

    @Operation(summary = "新增学院")
    @PostMapping
    public Result<?> createDept(@RequestParam String deptName,
                                @RequestParam(required = false) String deptCode,
                                @RequestParam(required = false) Integer sortOrder) {
        return systemService.createDept(deptName, deptCode, sortOrder);
    }

    @Operation(summary = "更新学院")
    @PutMapping("/{id}")
    public Result<?> updateDept(@PathVariable Long id,
                                @RequestParam(required = false) String deptName,
                                @RequestParam(required = false) String deptCode,
                                @RequestParam(required = false) Integer sortOrder) {
        return systemService.updateDept(id, deptName, deptCode, sortOrder);
    }

    @Operation(summary = "删除学院")
    @DeleteMapping("/{id}")
    public Result<?> deleteDept(@PathVariable Long id) {
        return systemService.deleteDept(id);
    }

    @Operation(summary = "专业列表")
    @GetMapping("/major/list")
    public Result<?> listMajors(@RequestParam(required = false) Long deptId) {
        return systemService.listMajors(deptId);
    }

    @Operation(summary = "新增专业")
    @PostMapping("/major")
    public Result<?> createMajor(@RequestParam Long deptId,
                                 @RequestParam String majorName,
                                 @RequestParam(required = false) String majorCode) {
        return systemService.createMajor(deptId, majorName, majorCode);
    }

    @Operation(summary = "更新专业")
    @PutMapping("/major/{id}")
    public Result<?> updateMajor(@PathVariable Long id,
                                 @RequestParam(required = false) String majorName,
                                 @RequestParam(required = false) String majorCode) {
        return systemService.updateMajor(id, majorName, majorCode);
    }

    @Operation(summary = "删除专业")
    @DeleteMapping("/major/{id}")
    public Result<?> deleteMajor(@PathVariable Long id) {
        return systemService.deleteMajor(id);
    }

    @Operation(summary = "班级列表")
    @GetMapping("/class/list")
    public Result<?> listClasses(@RequestParam(required = false) Long majorId) {
        return systemService.listClasses(majorId);
    }

    @Operation(summary = "新增班级")
    @PostMapping("/class")
    public Result<?> createClass(@RequestParam Long majorId,
                                 @RequestParam String className,
                                 @RequestParam(required = false) String grade) {
        return systemService.createClass(majorId, className, grade);
    }

    @Operation(summary = "更新班级")
    @PutMapping("/class/{id}")
    public Result<?> updateClass(@PathVariable Long id,
                                 @RequestParam(required = false) String className,
                                 @RequestParam(required = false) String grade) {
        return systemService.updateClass(id, className, grade);
    }

    @Operation(summary = "删除班级")
    @DeleteMapping("/class/{id}")
    public Result<?> deleteClass(@PathVariable Long id) {
        return systemService.deleteClass(id);
    }
}
