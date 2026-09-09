package com.scms.service;

import com.scms.entity.User;
import com.scms.mapper.UserMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

/**
 * 社区资料卡。资料互看机制已下线：卡片对所有登录用户开放基础资料，
 * 真实姓名/完整简介/获奖记录经 /user/public 下发；手机号、邮箱等隐私不入库。
 */
@Service
@RequiredArgsConstructor
public class CardService {

    private final UserMapper userMapper;

    /** 展示名：优先昵称，无昵称用真实姓名 */
    public String displayName(User u) {
        if (u == null) return "已注销用户";
        if (u.getNickname() != null && !u.getNickname().isBlank()) return u.getNickname();
        return u.getRealName() != null && !u.getRealName().isBlank() ? u.getRealName() : "匿名用户";
    }

    /** 资料卡（招募帖作者、社区请求收发双方等嵌入场景） */
    public Map<String, Object> card(Long targetId, Long viewerId) {
        User u = userMapper.selectById(targetId);
        Map<String, Object> card = new HashMap<>();
        if (u == null) return card;
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
