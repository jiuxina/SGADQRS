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
import com.scms.entity.CompetitionTeam;
import com.scms.entity.CompetitionTeamMember;
import com.scms.entity.User;
import com.scms.mapper.CompetitionMapper;
import com.scms.mapper.CompetitionResultMapper;
import com.scms.mapper.CompetitionTeamMapper;
import com.scms.mapper.CompetitionTeamMemberMapper;
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
    private final CompetitionTeamMapper teamMapper;
    private final CompetitionTeamMemberMapper teamMemberMapper;

    /** 用户列表：仅管理员可全量检索；其他角色强制只返回教师行且裁剪为选导师所需字段（防止全校账号枚举） */
    public Result<?> listUsers(int current, int size, String keyword, Integer userType, String roleCode) {
        Page<User> page = Pages.of(current, size);
        LambdaQueryWrapper<User> wrapper = new LambdaQueryWrapper<>();
        boolean isAdmin = "admin".equals(roleCode);
        if (!isAdmin) userType = 2;
        if (StringUtils.hasText(keyword)) {
            wrapper.and(w -> w.like(User::getUsername, keyword)
                    .or().like(User::getRealName, keyword));
        }
        if (userType != null) wrapper.eq(User::getUserType, userType);
        wrapper.orderByDesc(User::getCreateTime);

        Page<User> result = userMapper.selectPage(page, wrapper);
        if (!isAdmin) {
            for (User u : result.getRecords()) {
                u.setStatus(null); u.setCreateTime(null); u.setUpdateTime(null);
                u.setNickname(null); u.setBio(null); u.setSkills(null);
                u.setAvatar(null); u.setGender(null);
                u.setMajorName(null); u.setClassName(null);
            }
        }
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
        // 与 createUser 同口径的长度/域/强度校验：更新路径此前缺失，超长与非法值会落到 DB 约束 500
        if (dto.getRealName() != null && dto.getRealName().length() > 50) return Result.error("姓名不能超过 50 字");
        if (dto.getUserType() != null && dto.getUserType() != 1 && dto.getUserType() != 2 && dto.getUserType() != 3) {
            return Result.error("用户类型不能为空");
        }
        if (StringUtils.hasText(dto.getPassword()) && dto.getPassword().length() < 6) return Result.error("密码至少6位");

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

    /** 删除前置守卫：不能删自己；队长/有未完成队伍的账号须先处理队伍，防止悬空 leaderId 与孤儿成员行 */
    private String deleteBlockReason(Long id) {
        Long leading = teamMapper.selectCount(new LambdaQueryWrapper<CompetitionTeam>()
                .eq(CompetitionTeam::getLeaderId, id));
        if (leading != null && leading > 0) return "该账号仍在担任队长，请先解散或转让队伍";
        List<CompetitionTeam> pendingTeams = teamMapper.selectList(new LambdaQueryWrapper<CompetitionTeam>()
                .in(CompetitionTeam::getStatus, 0, 1));
        if (!pendingTeams.isEmpty()) {
            List<Long> teamIds = new ArrayList<>();
            pendingTeams.forEach(t -> teamIds.add(t.getId()));
            Long pendingMember = teamMemberMapper.selectCount(new LambdaQueryWrapper<CompetitionTeamMember>()
                    .eq(CompetitionTeamMember::getStudentId, id)
                    .in(CompetitionTeamMember::getTeamId, teamIds));
            if (pendingMember != null && pendingMember > 0) return "该账号存在组建中/待审核的队伍，请先退出或解散";
        }
        return null;
    }

    @Transactional
    public Result<?> deleteUser(Long id, Long meId) {
        if (id == null || userMapper.selectById(id) == null) return Result.error("用户不存在");
        if (id.equals(meId)) return Result.error("不能删除当前登录账号");
        String blocked = deleteBlockReason(id);
        if (blocked != null) return Result.error(blocked);
        userMapper.deleteById(id);
        return Result.success("删除成功", null);
    }

    @Transactional
    public Result<?> batchDeleteUsers(List<Long> ids, Long meId) {
        if (ids == null || ids.isEmpty()) return Result.error("用户ID列表不能为空");
        List<Long> deletable = new ArrayList<>();
        int skippedSelf = 0;
        int skippedBusy = 0;
        for (Long id : ids) {
            if (id == null) continue;
            if (id.equals(meId)) { skippedSelf++; continue; }
            if (userMapper.selectById(id) == null) continue;
            if (deleteBlockReason(id) != null) { skippedBusy++; continue; }
            deletable.add(id);
        }
        if (deletable.isEmpty()) {
            return Result.error("没有可删除的用户（当前账号不可删除；担任队长或有未完成队伍的账号须先处理队伍）");
        }
        userMapper.deleteBatchIds(deletable);
        StringBuilder msg = new StringBuilder("已删除 " + deletable.size() + " 个用户");
        if (skippedSelf > 0) msg.append("，跳过当前登录账号 1 个");
        if (skippedBusy > 0) msg.append("，跳过仍有队伍关联的账号 ").append(skippedBusy).append(" 个");
        return Result.success(msg.toString(), null);
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
        // 与单条 toggleUserStatus 同域校验：防止写入 5 这类启用/禁用之外的非法状态
        if (status != 0 && status != 1) return Result.error("状态参数无效");

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
