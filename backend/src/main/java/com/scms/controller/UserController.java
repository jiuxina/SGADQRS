package com.scms.controller;

import com.scms.common.Result;
import com.scms.dto.BatchUserDTO;
import com.scms.dto.ProfileDTO;
import com.scms.dto.UserDTO;
import com.scms.dto.UserStatsDTO;
import com.scms.security.LoginUser;
import com.scms.service.UserService;
import java.util.List;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
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

    @Operation(summary = "用户统计")
    @GetMapping("/stats")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<UserStatsDTO> stats() {
        return userService.getUserStats();
    }

    @Operation(summary = "用户详情")
    @GetMapping("/{id}")
    public Result<?> getById(@PathVariable Long id) {
        return userService.getUserById(id);
    }

    @Operation(summary = "社区公开资料（未解锁仅脱敏卡）")
    @GetMapping("/public/{id}")
    public Result<?> publicProfile(@PathVariable Long id,
                                   @AuthenticationPrincipal LoginUser loginUser) {
        return userService.getPublicProfile(id, loginUser.getUserId(), "admin".equals(loginUser.getRoleCode()));
    }

    @Operation(summary = "本人更新社区资料")
    @PutMapping("/profile")
    public Result<?> updateProfile(@RequestBody ProfileDTO dto,
                                   @AuthenticationPrincipal LoginUser loginUser) {
        return userService.updateProfile(dto, loginUser.getUserId());
    }

    @Operation(summary = "本人修改密码")
    @PutMapping("/password")
    public Result<?> changePassword(@RequestBody java.util.Map<String, String> body,
                                    @AuthenticationPrincipal LoginUser loginUser) {
        return userService.changePassword(body.get("oldPassword"), body.get("newPassword"), loginUser.getUserId());
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

    @Operation(summary = "批量删除用户")
    @PostMapping("/batch-delete")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<?> batchDelete(@RequestBody List<Long> ids) {
        return userService.batchDeleteUsers(ids);
    }

    @Operation(summary = "禁用/启用用户")
    @PutMapping("/disable/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<?> toggleStatus(@PathVariable Long id, @RequestBody java.util.Map<String, Integer> body) {
        Integer status = body.get("status");
        return userService.toggleUserStatus(id, status);
    }

    @Operation(summary = "批量禁用/启用用户")
    @PostMapping("/batch-disable")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<?> batchToggleStatus(@RequestBody BatchUserDTO dto) {
        return userService.batchToggleUserStatus(dto);
    }

    @Operation(summary = "重置密码")
    @PutMapping("/reset-password/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<?> resetPassword(@PathVariable Long id) {
        return userService.resetPassword(id);
    }
}
