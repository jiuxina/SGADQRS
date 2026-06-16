package com.scms.controller;

import com.scms.common.Result;
import com.scms.dto.LoginDTO;
import com.scms.security.LoginUser;
import com.scms.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@Tag(name = "认证管理")
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @Operation(summary = "用户登录")
    @PostMapping("/login")
    public Result<?> login(@Valid @RequestBody LoginDTO dto) {
        return authService.login(dto);
    }

    @Operation(summary = "用户注册")
    @PostMapping("/register")
    public Result<?> register(@Valid @RequestBody LoginDTO dto) {
        return authService.register(dto);
    }

    @Operation(summary = "获取当前用户信息")
    @GetMapping("/info")
    public Result<?> getUserInfo(@AuthenticationPrincipal LoginUser loginUser) {
        return authService.getUserInfo(loginUser.getUserId());
    }
}
