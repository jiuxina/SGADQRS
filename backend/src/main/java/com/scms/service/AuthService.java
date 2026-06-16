package com.scms.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.scms.common.Result;
import com.scms.dto.LoginDTO;
import com.scms.entity.User;
import com.scms.entity.UserRole;
import com.scms.mapper.RoleMapper;
import com.scms.mapper.UserMapper;
import com.scms.mapper.UserRoleMapper;
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
    private final UserRoleMapper userRoleMapper;
    private final RoleMapper roleMapper;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenUtil jwtTokenUtil;

    public Result<?> login(LoginDTO dto) {
        User user = userMapper.selectOne(
                new LambdaQueryWrapper<User>().eq(User::getUsername, dto.getUsername())
        );
        if (user == null) {
            return Result.error("用户不存在");
        }
        if (user.getStatus() == 0) {
            return Result.error("账号已被禁用");
        }

        // 验证角色
        UserRole userRole = userRoleMapper.selectOne(
                new LambdaQueryWrapper<UserRole>().eq(UserRole::getUserId, user.getId())
        );
        if (userRole != null) {
            var role = roleMapper.selectById(userRole.getRoleId());
            if (role != null && dto.getRole() != null && !role.getRoleCode().equals(dto.getRole())) {
                return Result.error("角色不匹配，请选择正确的登录身份");
            }
        }

        if (!passwordEncoder.matches(dto.getPassword(), user.getPassword())) {
            return Result.error("密码错误");
        }

        // 更新登录时间
        user.setLastLoginTime(LocalDateTime.now());
        userMapper.updateById(user);

        // 获取角色编码
        String roleCode = "student";
        if (userRole != null) {
            var role = roleMapper.selectById(userRole.getRoleId());
            if (role != null) roleCode = role.getRoleCode();
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
        user.setStatus(1);

        userMapper.insert(user);

        // 分配角色
        String roleCode = dto.getRole() != null ? dto.getRole() : "student";
        var role = roleMapper.selectOne(
                new LambdaQueryWrapper<com.scms.entity.Role>().eq(com.scms.entity.Role::getRoleCode, roleCode)
        );
        if (role != null) {
            UserRole userRole = new UserRole();
            userRole.setUserId(user.getId());
            userRole.setRoleId(role.getId());
            userRoleMapper.insert(userRole);
        }

        return Result.success("注册成功", null);
    }

    public Result<?> getUserInfo(Long userId) {
        User user = userMapper.selectById(userId);
        if (user == null) return Result.error("用户不存在");

        UserRole userRole = userRoleMapper.selectOne(
                new LambdaQueryWrapper<UserRole>().eq(UserRole::getUserId, userId)
        );
        String roleCode = "student";
        if (userRole != null) {
            var role = roleMapper.selectById(userRole.getRoleId());
            if (role != null) roleCode = role.getRoleCode();
        }
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
        info.put("phone", user.getPhone());
        info.put("email", user.getEmail());
        info.put("deptId", user.getDeptId());
        info.put("majorId", user.getMajorId());
        info.put("classId", user.getClassId());
        return info;
    }
}
