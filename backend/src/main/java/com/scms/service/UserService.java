package com.scms.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.scms.common.PageResult;
import com.scms.common.Result;
import com.scms.dto.UserDTO;
import com.scms.entity.User;
import com.scms.mapper.UserMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;

    public Result<?> listUsers(int current, int size, String keyword, Integer userType) {
        Page<User> page = new Page<>(current, size);
        LambdaQueryWrapper<User> wrapper = new LambdaQueryWrapper<>();
        if (StringUtils.hasText(keyword)) {
            wrapper.and(w -> w.like(User::getUsername, keyword)
                    .or().like(User::getRealName, keyword));
        }
        if (userType != null) wrapper.eq(User::getUserType, userType);
        wrapper.orderByDesc(User::getCreateTime);

        Page<User> result = userMapper.selectPage(page, wrapper);
        return Result.success(new PageResult<>(result));
    }

    public Result<?> getUserById(Long id) {
        User user = userMapper.selectById(id);
        if (user == null) return Result.error("用户不存在");
        return Result.success(user);
    }

    @Transactional
    public Result<?> createUser(UserDTO dto) {
        User existing = userMapper.selectOne(
                new LambdaQueryWrapper<User>().eq(User::getUsername, dto.getUsername())
        );
        if (existing != null) return Result.error("用户名已存在");

        User user = new User();
        user.setUsername(dto.getUsername());
        user.setPassword(passwordEncoder.encode(dto.getPassword() != null ? dto.getPassword() : "123456"));
        user.setRealName(dto.getRealName());
        user.setAvatar(dto.getAvatar());
        user.setGender(dto.getGender());
        user.setUserType(dto.getUserType());
        user.setDeptName(dto.getDeptName());
        user.setMajorName(dto.getMajorName());
        user.setClassName(dto.getClassName());
        user.setStatus(1); // 默认启用
        user.setRole(dto.getUserType() == 3 ? "admin" : dto.getUserType() == 2 ? "teacher" : "student");
        userMapper.insert(user);

        return Result.success("创建成功", user);
    }

    @Transactional
    public Result<?> updateUser(UserDTO dto) {
        User user = userMapper.selectById(dto.getId());
        if (user == null) return Result.error("用户不存在");

        if (StringUtils.hasText(dto.getRealName())) user.setRealName(dto.getRealName());
        if (dto.getGender() != null) user.setGender(dto.getGender());
        if (dto.getAvatar() != null) user.setAvatar(dto.getAvatar());
        if (dto.getDeptName() != null) user.setDeptName(dto.getDeptName());
        if (dto.getMajorName() != null) user.setMajorName(dto.getMajorName());
        if (dto.getClassName() != null) user.setClassName(dto.getClassName());
        if (dto.getUserType() != null) user.setUserType(dto.getUserType());
        if (StringUtils.hasText(dto.getPassword())) {
            user.setPassword(passwordEncoder.encode(dto.getPassword()));
        }
        userMapper.updateById(user);
        return Result.success("更新成功", null);
    }

    @Transactional
    public Result<?> deleteUser(Long id) {
        userMapper.deleteById(id);
        return Result.success("删除成功", null);
    }

    @Transactional
    public Result<?> toggleUserStatus(Long id, Integer status) {
        User user = userMapper.selectById(id);
        if (user == null) return Result.error("用户不存在");
        user.setStatus(status);
        userMapper.updateById(user);
        return Result.success(status == 1 ? "启用成功" : "禁用成功", null);
    }

    @Transactional
    public Result<?> resetPassword(Long id) {
        User user = userMapper.selectById(id);
        if (user == null) return Result.error("用户不存在");
        user.setPassword(passwordEncoder.encode("123456"));
        userMapper.updateById(user);
        return Result.success("密码重置成功，新密码为 123456", null);
    }

}
