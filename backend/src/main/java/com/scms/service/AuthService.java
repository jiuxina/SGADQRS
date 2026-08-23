package com.scms.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.scms.common.Result;
import com.scms.dto.LoginDTO;
import com.scms.entity.User;
import com.scms.mapper.UserMapper;
import com.scms.security.JwtTokenUtil;
import com.scms.security.LoginUser;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenUtil jwtTokenUtil;

    public Result<?> login(LoginDTO dto) {
        User user = userMapper.selectOne(
                new LambdaQueryWrapper<User>().eq(User::getUsername, dto.getUsername())
        );
        if (user == null) {
            return Result.error("账号或密码错误");
        }

        if (!passwordEncoder.matches(dto.getPassword(), user.getPassword())) {
            return Result.error("账号或密码错误");
        }

        // 更新登录时间
        user.setLastLoginTime(LocalDateTime.now());
        userMapper.updateById(user);

        // 根据 userType 映射角色
        String roleCode = switch (user.getUserType()) {
            case 3 -> "admin";
            case 2 -> "teacher";
            default -> "student";
        };

        // 校验前端选择的身份是否与实际角色一致
        if (dto.getRole() != null && !dto.getRole().isEmpty() && !dto.getRole().equals(roleCode)) {
            return Result.error("账号或密码错误");
        }

        String token = jwtTokenUtil.generateToken(user.getId(), user.getUsername(), roleCode);

        Map<String, Object> result = new HashMap<>();
        result.put("token", token);
        result.put("user", getUserInfo(user, roleCode));

        return Result.success("登录成功", result);
    }

    public Result<?> register(LoginDTO dto) {
        // 检查用户名是否已存在
        User existing = userMapper.selectOne(
                new LambdaQueryWrapper<User>().eq(User::getUsername, dto.getUsername())
        );
        if (existing != null) {
            return Result.error("用户名已存在");
        }

        User user = new User();
        user.setUsername(dto.getUsername());
        user.setPassword(passwordEncoder.encode(dto.getPassword()));
        user.setRealName(dto.getUsername());
        user.setUserType("teacher".equals(dto.getRole()) ? 2 : 1);
        user.setRole(dto.getRole() != null ? dto.getRole() : "student");

        userMapper.insert(user);

        return Result.success("注册成功", null);
    }

    public Result<?> getUserInfo(Long userId) {
        User user = userMapper.selectById(userId);
        if (user == null) return Result.error("用户不存在");

        String roleCode = switch (user.getUserType()) {
            case 3 -> "admin";
            case 2 -> "teacher";
            default -> "student";
        };
        return Result.success(getUserInfo(user, roleCode));
    }

    private Map<String, Object> getUserInfo(User user, String roleCode) {
        Map<String, Object> info = new HashMap<>();
        info.put("id", user.getId());
        info.put("username", user.getUsername());
        info.put("realName", user.getRealName());
        info.put("avatar", user.getAvatar());
        info.put("role", roleCode);
        info.put("userType", user.getUserType());
        info.put("gender", user.getGender());
        info.put("deptName", user.getDeptName());
        info.put("majorName", user.getMajorName());
        info.put("className", user.getClassName());
        return info;
    }
}
