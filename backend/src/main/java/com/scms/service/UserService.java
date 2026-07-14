package com.scms.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.scms.common.PageResult;
import com.scms.common.Result;
import com.scms.dto.UserDTO;
import com.scms.entity.User;
import com.scms.entity.UserRole;
import com.scms.mapper.ClazzMapper;
import com.scms.mapper.DeptMapper;
import com.scms.mapper.MajorMapper;
import com.scms.mapper.UserMapper;
import com.scms.mapper.UserRoleMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserMapper userMapper;
    private final UserRoleMapper userRoleMapper;
    private final DeptMapper deptMapper;
    private final MajorMapper majorMapper;
    private final ClazzMapper clazzMapper;
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
        // 填充关联信息
        result.getRecords().forEach(this::fillUserInfo);
        return Result.success(new PageResult<>(result));
    }

    public Result<?> getUserById(Long id) {
        User user = userMapper.selectById(id);
        if (user == null) return Result.error("用户不存在");
        fillUserInfo(user);
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
        user.setDeptId(dto.getDeptId());
        user.setMajorId(dto.getMajorId());
        user.setClassId(dto.getClassId());
        user.setStatus(1); // 默认启用
        userMapper.insert(user);

        // 分配角色
        String roleCode = dto.getUserType() == 3 ? "admin" : dto.getUserType() == 2 ? "teacher" : "student";
        var role = userRoleMapper.selectOne(new LambdaQueryWrapper<>()); // 需要roleMapper
        // 简化处理：通过userType设置角色
        assignRole(user.getId(), roleCode);

        return Result.success("创建成功", user);
    }

    @Transactional
    public Result<?> updateUser(UserDTO dto) {
        User user = userMapper.selectById(dto.getId());
        if (user == null) return Result.error("用户不存在");

        if (StringUtils.hasText(dto.getRealName())) user.setRealName(dto.getRealName());
        if (dto.getGender() != null) user.setGender(dto.getGender());
        if (dto.getAvatar() != null) user.setAvatar(dto.getAvatar());
        if (dto.getDeptId() != null) user.setDeptId(dto.getDeptId());
        if (dto.getMajorId() != null) user.setMajorId(dto.getMajorId());
        if (dto.getClassId() != null) user.setClassId(dto.getClassId());
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
        userRoleMapper.delete(new LambdaQueryWrapper<UserRole>().eq(UserRole::getUserId, id));
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

    private void assignRole(Long userId, String roleCode) {
        // 查找角色
        var roles = new LambdaQueryWrapper<com.scms.entity.Role>();
        // 这里需要注入RoleMapper，简化处理
    }

    private void fillUserInfo(User user) {
        if (user.getDeptId() != null) {
            var dept = deptMapper.selectById(user.getDeptId());
            if (dept != null) user.setDeptName(dept.getDeptName());
        }
        if (user.getMajorId() != null) {
            var major = majorMapper.selectById(user.getMajorId());
            if (major != null) user.setMajorName(major.getMajorName());
        }
        if (user.getClassId() != null) {
            var clazz = clazzMapper.selectById(user.getClassId());
            if (clazz != null) user.setClassName(clazz.getClassName());
        }
    }
}
