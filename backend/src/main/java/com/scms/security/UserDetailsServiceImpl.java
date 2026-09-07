package com.scms.security;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.scms.entity.User;
import com.scms.mapper.UserMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserDetailsServiceImpl implements UserDetailsService {

    private final UserMapper userMapper;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        User user = userMapper.selectOne(
                new LambdaQueryWrapper<User>().eq(User::getUsername, username)
        );
        if (user == null) {
            throw new UsernameNotFoundException("用户不存在: " + username);
        }
        // 边界：被禁用的账号即使持有未过期 token 也立即失效
        if (user.getStatus() != null && user.getStatus() != 1) {
            throw new UsernameNotFoundException("账号已被禁用: " + username);
        }

        // 根据 userType 映射角色
        String roleCode = switch (user.getUserType()) {
            case 3 -> "admin";
            case 2 -> "teacher";
            default -> "student";
        };

        return new LoginUser(
                user.getId(),
                user.getUsername(),
                user.getPassword(),
                user.getRealName(),
                roleCode,
                user.getUserType(),
                user.getAvatar()
        );
    }
}
