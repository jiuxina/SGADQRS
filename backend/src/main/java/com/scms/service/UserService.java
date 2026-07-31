package com.scms.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.scms.common.PageResult;
import com.scms.common.Result;
import com.scms.dto.UserDTO;
import com.scms.dto.BatchUserDTO;
import com.scms.dto.UserStatsDTO;
import com.scms.entity.User;
import com.scms.mapper.UserMapper;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Slf4j
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
    public Result<?> batchDeleteUsers(List<Long> ids) {
        if (ids == null || ids.isEmpty()) return Result.error("用户ID列表不能为空");
        userMapper.deleteBatchIds(ids);
        return Result.success("批量删除成功", null);
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
    public Result<?> batchToggleUserStatus(BatchUserDTO dto) {
        List<Long> ids = dto.getIds();
        Integer status = dto.getStatus();
        if (ids == null || ids.isEmpty()) return Result.error("用户ID列表不能为空");
        if (status == null) return Result.error("状态不能为空");

        List<User> users = userMapper.selectBatchIds(ids);
        if (users.isEmpty()) return Result.error("未找到指定用户");

        for (User user : users) {
            user.setStatus(status);
        }
        users.forEach(userMapper::updateById);
        return Result.success(status == 1 ? "批量启用成功" : "批量禁用成功", null);
    }

    @Transactional
    public Result<?> resetPassword(Long id) {
        User user = userMapper.selectById(id);
        if (user == null) return Result.error("用户不存在");
        user.setPassword(passwordEncoder.encode("123456"));
        userMapper.updateById(user);
        return Result.success("密码重置成功，新密码为 123456", null);
    }

    public Result<UserStatsDTO> getUserStats() {
        try {
            List<Map<String, Object>> counts = userMapper.countByUserType();
            
            long totalCount = 0;
            long studentCount = 0;
            long teacherCount = 0;
            long adminCount = 0;
            
            for (Map<String, Object> row : counts) {
                Integer userType = (Integer) row.get("userType");
                Long count = (Long) row.get("count");
                totalCount += count;
                
                if (userType == 1) studentCount = count;
                else if (userType == 2) teacherCount = count;
                else if (userType == 3) adminCount = count;
            }
            
            // 验证数据一致性
            long calculatedTotal = studentCount + teacherCount + adminCount;
            if (totalCount != calculatedTotal) {
                log.warn("用户统计数据不一致: totalCount={}, calculatedTotal={}", totalCount, calculatedTotal);
                totalCount = calculatedTotal;
            }
            
            log.debug("用户统计查询完成: total={}, student={}, teacher={}, admin={}", 
                    totalCount, studentCount, teacherCount, adminCount);
            
            return Result.success(new UserStatsDTO(totalCount, studentCount, teacherCount, adminCount));
        } catch (Exception e) {
            log.error("获取用户统计失败", e);
            return Result.error("获取用户统计失败: " + e.getMessage());
        }
    }

}
