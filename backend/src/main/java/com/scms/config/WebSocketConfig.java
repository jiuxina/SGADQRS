package com.scms.config;

import com.scms.security.JwtTokenUtil;
import com.scms.security.UserDetailsServiceImpl;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

/**
 * WebSocket 配置 — 基于 STOMP 协议，支持 SockJS 降级。
 * <p>
 * 端点: /ws（SockJS）
 * 客户端订阅: /user/queue/notifications（用户私有通知）
 * 服务端推送: /topic/broadcast（全局广播）
 * </p>
 */
@Slf4j
@Configuration
@EnableWebSocketMessageBroker
@RequiredArgsConstructor
@Order(Ordered.HIGHEST_PRECEDENCE + 99)
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final JwtTokenUtil jwtTokenUtil;
    private final UserDetailsServiceImpl userDetailsService;

    /**
     * 配置消息代理
     */
    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // 客户端订阅前缀 — 服务端向客户端推送的目的地前缀
        registry.enableSimpleBroker("/topic", "/queue");
        // 客户端发送消息的目的地前缀
        registry.setApplicationDestinationPrefixes("/app");
        // 用户目标前缀 — /user/xxx 会被自动路由到对应用户的 session
        registry.setUserDestinationPrefix("/user");
    }

    /**
     * 注册 STOMP 端点
     */
    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*")
                .withSockJS();
    }

    /**
     * 配置客户端入站通道 — 注入 JWT 认证拦截器
     */
    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(new JwtChannelInterceptor());
    }

    /**
     * STOMP CONNECT 帧 JWT 认证拦截器。
     * <p>
     * 客户端连接时在 STOMP headers 中携带:
     * Authorization: Bearer <token>
     * </p>
     */
    @RequiredArgsConstructor
    private class JwtChannelInterceptor implements ChannelInterceptor {

        @Override
        public Message<?> preSend(Message<?> message, MessageChannel channel) {
            StompHeaderAccessor accessor =
                    MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

            if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {
                String authHeader = accessor.getFirstNativeHeader("Authorization");

                if (authHeader != null && authHeader.startsWith("Bearer ")) {
                    String token = authHeader.substring(7);

                    try {
                        if (jwtTokenUtil.validateToken(token)) {
                            String username = jwtTokenUtil.getUsernameFromToken(token);
                            UserDetails userDetails = userDetailsService.loadUserByUsername(username);

                            UsernamePasswordAuthenticationToken authentication =
                                    new UsernamePasswordAuthenticationToken(
                                            userDetails, null, userDetails.getAuthorities());

                            accessor.setUser(authentication);
                            log.info("WebSocket 认证成功: user={}", username);
                        } else {
                            log.warn("WebSocket 认证失败: token 无效或已过期");
                        }
                    } catch (Exception e) {
                        log.warn("WebSocket 认证异常: {}", e.getMessage());
                    }
                } else {
                    log.warn("WebSocket 连接缺少 Authorization header");
                }
            }

            return message;
        }
    }
}
