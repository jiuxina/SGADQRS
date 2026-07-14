package com.scms.controller;

import com.scms.common.Result;
import com.scms.dto.UserDTO;
import com.scms.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@Tag(name = "用户管理")
@RestController
@RequestMapping("/user")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @Operation(summary = "用户列表")
    @GetMapping("/list")
    public Result<?> list(@RequestParam(defaultValue = "1") int current,
                          @RequestParam(defaultValue = "10") int size,
                          @RequestParam(required = false) String keyword,
                          @RequestParam(required = false) Integer userType) {
        return userService.listUsers(current, size, keyword, userType);
    }

    @Operation(summary = "用户详情")
    @GetMapping("/{id}")
    public Result<?> getById(@PathVariable Long id) {
        return userService.getUserById(id);
    }

    @Operation(summary = "创建用户")
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public Result<?> create(@Valid @RequestBody UserDTO dto) {
        return userService.createUser(dto);
    }

    @Operation(summary = "更新用户")
    @PutMapping
    @PreAuthorize("hasRole('ADMIN')")
    public Result<?> update(@RequestBody UserDTO dto) {
        return userService.updateUser(dto);
    }

    @Operation(summary = "删除用户")
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<?> delete(@PathVariable Long id) {
        return userService.deleteUser(id);
    }

    @Operation(summary = "禁用/启用用户")
    @PutMapping("/disable/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<?> toggleStatus(@PathVariable Long id, @RequestBody java.util.Map<String, Integer> body) {
        Integer status = body.get("status");
        return userService.toggleUserStatus(id, status);
    }

    @Operation(summary = "重置密码")
    @PutMapping("/reset-password/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<?> resetPassword(@PathVariable Long id) {
        return userService.resetPassword(id);
    }
}
