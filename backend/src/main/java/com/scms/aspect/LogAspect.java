package com.scms.aspect;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.scms.annotation.LogOperation;
import com.scms.entity.OperLog;
import com.scms.mapper.OperLogMapper;
import com.scms.security.LoginUser;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;

/**
 * 操作日志切面，拦截带有 {@link LogOperation} 注解的方法，
 * 自动记录操作日志到 sys_oper_log 表。
 */
@Slf4j
@Aspect
@Component
@RequiredArgsConstructor
public class LogAspect {

    private final OperLogMapper operLogMapper;
    private final HttpServletRequest request;
    private final ObjectMapper objectMapper;

    /** 需要脱敏的敏感字段名 */
    private static final Set<String> SENSITIVE_FIELDS = new HashSet<>(
            Arrays.asList("password", "token", "oldPassword", "newPassword", "confirmPassword")
    );

    @Around("@annotation(logOperation)")
    public Object around(ProceedingJoinPoint joinPoint, LogOperation logOperation) throws Throwable {
        long startTime = System.currentTimeMillis();

        OperLog operLog = new OperLog();
        operLog.setOperation(logOperation.value());
        operLog.setMethod(joinPoint.getSignature().toShortString());
        operLog.setRequestUrl(request.getRequestURI());
        operLog.setIpAddress(getClientIp(request));

        // 设置请求参数（脱敏后）
        operLog.setRequestParams(desensitize(serializeParams(joinPoint.getArgs())));

        // 设置当前用户信息
        setCurrentUser(operLog);

        Object result;
        try {
            result = joinPoint.proceed();
            operLog.setStatus(1);
        } catch (Throwable ex) {
            operLog.setStatus(0);
            operLog.setErrorMsg(truncate(ex.getMessage(), 2000));
            throw ex;
        } finally {
            operLog.setSpendTime((int) (System.currentTimeMillis() - startTime));
            asyncSaveLog(operLog);
        }
        return result;
    }

    /**
     * 异步保存操作日志，避免阻塞请求线程。
     */
    @org.springframework.scheduling.annotation.Async
    public void asyncSaveLog(OperLog operLog) {
        try {
            operLogMapper.insert(operLog);
        } catch (Exception e) {
            log.error("保存操作日志失败: {}", e.getMessage(), e);
        }
    }

    /**
     * 从 SecurityContextHolder 获取当前登录用户信息。
     */
    private void setCurrentUser(OperLog operLog) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication != null && authentication.getPrincipal() instanceof LoginUser loginUser) {
                operLog.setUserId(loginUser.getUserId());
                operLog.setUsername(loginUser.getUsername());
            }
        } catch (Exception e) {
            log.debug("获取当前用户信息失败: {}", e.getMessage());
        }
    }

    /**
     * 将方法参数序列化为 JSON 字符串。
     */
    private String serializeParams(Object[] args) {
        if (args == null || args.length == 0) {
            return "[]";
        }
        try {
            // 过滤掉 HttpServletRequest/Response 等不可序列化的参数
            Object[] filtered = Arrays.stream(args)
                    .filter(arg -> arg != null && isSerializable(arg))
                    .toArray();
            return objectMapper.writeValueAsString(filtered);
        } catch (Exception e) {
            log.debug("序列化请求参数失败: {}", e.getMessage());
            return "[]";
        }
    }

    /**
     * 判断参数是否可序列化（排除 Servlet 相关对象）。
     */
    private boolean isSerializable(Object arg) {
        String className = arg.getClass().getName();
        return !className.startsWith("jakarta.servlet.")
                && !className.startsWith("org.springframework.web.")
                && !className.startsWith("org.springframework.security.");
    }

    /**
     * 敏感字段脱敏：将 password、token 等字段值替换为 ***。
     */
    private String desensitize(String json) {
        if (json == null || json.isBlank() || "[]".equals(json)) {
            return json;
        }
        try {
            ObjectNode node = objectMapper.readValue(json, ObjectNode.class);
            desensitizeNode(node);
            return objectMapper.writeValueAsString(node);
        } catch (Exception e) {
            // 如果不是标准 JSON 对象，直接返回原文
            return json;
        }
    }

    /**
     * 递归遍历 JSON 节点，脱敏敏感字段。
     */
    private void desensitizeNode(ObjectNode node) {
        node.fieldNames().forEachRemaining(fieldName -> {
            if (SENSITIVE_FIELDS.contains(fieldName)) {
                node.put(fieldName, "***");
            } else if (node.get(fieldName).isObject()) {
                desensitizeNode((ObjectNode) node.get(fieldName));
            }
        });
    }

    /**
     * 获取客户端真实 IP 地址。
     */
    private String getClientIp(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("Proxy-Client-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("WL-Proxy-Client-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }
        // 多级代理时取第一个 IP
        if (ip != null && ip.contains(",")) {
            ip = ip.split(",")[0].trim();
        }
        return ip;
    }

    /**
     * 截断字符串到指定最大长度。
     */
    private String truncate(String str, int maxLength) {
        if (str == null) {
            return null;
        }
        return str.length() > maxLength ? str.substring(0, maxLength) : str;
    }
}
