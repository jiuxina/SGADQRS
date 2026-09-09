package com.scms.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.scms.common.PageResult;
import com.scms.common.Pages;
import com.scms.common.Result;
import com.scms.dto.ProfileDTO;
import com.scms.dto.UserDTO;
import com.scms.dto.BatchUserDTO;
import com.scms.dto.UserStatsDTO;
import com.scms.entity.Competition;
import com.scms.entity.CompetitionResult;
import com.scms.entity.User;
import com.scms.mapper.CompetitionMapper;
import com.scms.mapper.CompetitionResultMapper;
import com.scms.mapper.UserMapper;
import java.util.ArrayList;
import java.util.HashMap;
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
    private final CardService cardService;
    private final CompetitionResultMapper competitionResultMapper;
    private final CompetitionMapper competitionMapper;

    public Result<?> listUsers(int current, int size, String keyword, Integer userType) {
        Page<User> page = Pages.of(current, size);
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

    /**
     * 社区公开资料：资料互看机制已下线，完整资料（真实姓名、完整简介、获奖记录、参赛统计）对所有登录用户可见。手机号、邮箱永不外露。
     */
    public Result<?> getPublicProfile(Long targetId, Long viewerId, boolean viewerIsAdmin) {
        User target = userMapper.selectById(targetId);
        if (target == null) return Result.error("用户不存在");

        Map<String, Object> data = cardService.card(targetId, viewerId);
        data.put("username", target.getUsername());
        data.put("realName", target.getRealName());
        data.put("nickname", target.getNickname());
        data.put("bio", target.getBio());

        List<Map<String, Object>> awards = new ArrayList<>();
        List<CompetitionResult> results = competitionResultMapper.selectList(
                new LambdaQueryWrapper<CompetitionResult>()
                        .eq(CompetitionResult::getStudentId, targetId)
                        .eq(CompetitionResult::getIsPublished, 1)
                        .orderByDesc(CompetitionResult::getPublishTime)
                        .orderByDesc(CompetitionResult::getCreateTime)
        );
        for (CompetitionResult r : results) {
            Map<String, Object> a = new HashMap<>();
            Competition comp = competitionMapper.selectById(r.getCompetitionId());
            a.put("competitionName", comp != null ? comp.getCompetitionName() : null);
            a.put("awardLevel", r.getAwardLevel());
            a.put("awardName", r.getAwardName());
            a.put("ranking", r.getRanking());
            a.put("score", r.getScore());
            a.put("publishTime", r.getPublishTime());
            awards.add(a);
        }
        data.put("awards", awards);

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalParticipations", awards.size());
        stats.put("totalAwards", awards.stream().filter(a -> a.get("awardLevel") != null).count());
        data.put("stats", stats);
        return Result.success(data);
    }

    /** 本人自助更新社区资料（不含角色/状态/真实姓名） */
    @Transactional
    public Result<?> updateProfile(ProfileDTO dto, Long meId) {
        User user = userMapper.selectById(meId);
        if (user == null) return Result.error("用户不存在");
        if (dto.getNickname() != null) {
            if (dto.getNickname().length() > 50) return Result.error("昵称过长");
            user.setNickname(dto.getNickname().isBlank() ? null : dto.getNickname().trim());
        }
        if (dto.getAvatar() != null) user.setAvatar(dto.getAvatar());
        if (dto.getGender() != null) user.setGender(dto.getGender());
        if (dto.getBio() != null) {
            if (dto.getBio().length() > 500) return Result.error("简介过长");
            user.setBio(dto.getBio().isBlank() ? null : dto.getBio());
        }
        if (dto.getSkills() != null) {
            if (dto.getSkills().length() > 255) return Result.error("技能标签过长");
            user.setSkills(dto.getSkills().isBlank() ? null : dto.getSkills().trim());
        }
        if (dto.getDeptName() != null) user.setDeptName(dto.getDeptName());
        if (dto.getMajorName() != null) user.setMajorName(dto.getMajorName());
        if (dto.getClassName() != null) user.setClassName(dto.getClassName());
        userMapper.updateById(user);
        return Result.success("保存成功", null);
    }

    @Transactional
    public Result<?> createUser(UserDTO dto) {
        // 边界：userType 为库表 NOT NULL 列；长度与列宽一致；密码给出最低强度 —— 全部结构化报错，勿落到 DB 约束 500
        if (dto.getUserType() == null || (dto.getUserType() != 1 && dto.getUserType() != 2 && dto.getUserType() != 3)) {
            return Result.error("用户类型不能为空");
        }
        if (dto.getUsername() != null && dto.getUsername().length() > 50) return Result.error("用户名不能超过 50 字");
        if (dto.getRealName() != null && dto.getRealName().length() > 50) return Result.error("姓名不能超过 50 字");
        if (dto.getPassword() != null && dto.getPassword().length() < 6) return Result.error("密码至少6位");
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
        if (id == null || userMapper.selectById(id) == null) return Result.error("用户不存在");
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
        // 边界：status 缺失/非法直接拆箱 NPE 变 500，须结构化拒绝
        if (status == null || (status != 0 && status != 1)) return Result.error("状态参数无效");
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

    /** 本人修改密码（校验原密码） */
    @Transactional
    public Result<?> changePassword(String oldPassword, String newPassword, Long meId) {
        User user = userMapper.selectById(meId);
        if (user == null) return Result.error("用户不存在");
        if (oldPassword == null || !passwordEncoder.matches(oldPassword, user.getPassword())) {
            return Result.error("原密码错误");
        }
        if (newPassword == null || newPassword.length() < 6) return Result.error("新密码至少6位");
        user.setPassword(passwordEncoder.encode(newPassword));
        userMapper.updateById(user);
        return Result.success("密码修改成功", null);
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
