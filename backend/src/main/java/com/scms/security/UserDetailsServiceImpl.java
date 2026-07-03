package com.scms.security;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.scms.entity.User;
import com.scms.entity.UserRole;
import com.scms.mapper.RoleMapper;
import com.scms.mapper.UserMapper;
import com.scms.mapper.UserRoleMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserDetailsServiceImpl implements UserDetailsService {

    private final UserMapper userMapper;
    private final UserRoleMapper userRoleMapper;
    private final RoleMapper roleMapper;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        User user = userMapper.selectOne(
                new LambdaQueryWrapper<User>().eq(User::getUsername, username)
        );
        if (user == null) {
            throw new UsernameNotFoundException("用户不存在: " + username);
        }

        // 查询用户角色
        UserRole userRole = userRoleMapper.selectOne(
                new LambdaQueryWrapper<UserRole>().eq(UserRole::getUserId, user.getId())
        );
        String roleCode = "student";
        if (userRole != null) {
            var role = roleMapper.selectById(userRole.getRoleId());
            if (role != null) {
                roleCode = role.getRoleCode();
            }
        }

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
