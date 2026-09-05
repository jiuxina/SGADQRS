package com.scms.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.scms.entity.CommunityRequest;
import com.scms.entity.User;
import com.scms.mapper.CommunityRequestMapper;
import com.scms.mapper.UserMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

/**
 * 社区脱敏资料卡与解锁关系。
 * 未解锁只暴露：昵称(无昵称则打码)、头像、学院、专业、班级、技能标签、简介摘要；
 * 真实姓名/联系方式/完整简介/获奖记录须经互看同意后由 /user/public 下发。
 */
@Service
@RequiredArgsConstructor
public class CardService {

    private final UserMapper userMapper;
    private final CommunityRequestMapper communityRequestMapper;

    /** 双方是否已互看解锁 */
    public boolean unlocked(Long a, Long b) {
        if (a == null || b == null) return false;
        Long count = communityRequestMapper.selectCount(
                new LambdaQueryWrapper<CommunityRequest>()
                        .eq(CommunityRequest::getType, 1)
                        .eq(CommunityRequest::getStatus, 1)
                        .and(w -> w
                                .and(w1 -> w1.eq(CommunityRequest::getFromUserId, a).eq(CommunityRequest::getToUserId, b))
                                .or(w2 -> w2.eq(CommunityRequest::getFromUserId, b).eq(CommunityRequest::getToUserId, a)))
        );
        return count != null && count > 0;
    }

    /** 存在待处理的互看请求 */
    public boolean hasPendingUnlock(Long from, Long to) {
        Long count = communityRequestMapper.selectCount(
                new LambdaQueryWrapper<CommunityRequest>()
                        .eq(CommunityRequest::getType, 1)
                        .eq(CommunityRequest::getStatus, 0)
                        .eq(CommunityRequest::getFromUserId, from)
                        .eq(CommunityRequest::getToUserId, to)
        );
        return count != null && count > 0;
    }

    /** 展示名：优先昵称，无昵称打码真实姓名 */
    public String displayName(User u) {
        if (u == null) return "已注销用户";
        if (u.getNickname() != null && !u.getNickname().isBlank()) return u.getNickname();
        return maskName(u.getRealName());
    }

    /** 王明 → 王*；欧阳娜娜 → 欧阳** */
    public String maskName(String realName) {
        if (realName == null || realName.isBlank()) return "匿名用户";
        if (realName.length() == 1) return realName;
        if (realName.length() == 2) return realName.charAt(0) + "*";
        return realName.substring(0, realName.length() - 1) + "*";
    }

    /** 脱敏资料卡 */
    public Map<String, Object> card(Long targetId, Long viewerId) {
        User u = userMapper.selectById(targetId);
        Map<String, Object> card = new HashMap<>();
        if (u == null) return card;
        boolean self = viewerId != null && viewerId.equals(targetId);
        boolean unlocked = self || unlocked(viewerId, targetId);
        card.put("id", u.getId());
        card.put("displayName", displayName(u));
        card.put("avatar", u.getAvatar());
        card.put("gender", u.getGender());
        card.put("deptName", u.getDeptName());
        card.put("majorName", u.getMajorName());
        card.put("className", u.getClassName());
        card.put("skills", u.getSkills());
        String bio = u.getBio();
        if (bio != null && bio.length() > 60) bio = bio.substring(0, 60) + "…";
        card.put("bioBrief", bio);
        card.put("userType", u.getUserType());
        card.put("role", roleCode(u.getUserType()));
        card.put("unlocked", unlocked);
        return card;
    }

    public String roleCode(Integer userType) {
        if (userType == null) return "student";
        return switch (userType) {
            case 3 -> "admin";
            case 2 -> "teacher";
            default -> "student";
        };
    }
}
