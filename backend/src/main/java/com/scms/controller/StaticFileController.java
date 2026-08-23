package com.scms.controller;

import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Map;

/**
 * 静态文件控制器
 * 显式处理 /public/** 路径下的文件请求，解决 Spring 内置 ResourceHandler
 * 处理中文文件名时在 Windows 上的编码异常问题
 */
@RestController
public class StaticFileController {

    private static final Map<String, String> CONTENT_TYPES = Map.of(
            ".png", "image/png",
            ".jpg", "image/jpeg",
            ".jpeg", "image/jpeg",
            ".gif", "image/gif",
            ".webp", "image/webp",
            ".svg", "image/svg+xml",
            ".ico", "image/x-icon"
    );

    /** 应用根目录：优先使用 user.dir，回退到 JAR 所在目录 */
    private static final Path APP_ROOT = resolveAppRoot();

    private static Path resolveAppRoot() {
        // 优先使用 user.dir（即启动目录）
        Path cwd = Paths.get(System.getProperty("user.dir"));
        if (Files.isDirectory(cwd.resolve("public"))) {
            return cwd;
        }
        // 回退：从 JAR 或 class 文件位置推导
        try {
            String location = StaticFileController.class.getProtectionDomain()
                    .getCodeSource().getLocation().toExternalForm();
            // 处理 Spring Boot nested JAR 格式: jar:nested:/path/to/app.jar/!BOOT-INF/classes/!/
            if (location.startsWith("jar:")) {
                location = location.substring(4);
            }
            if (location.startsWith("nested:")) {
                location = location.substring(7);
                // 截取 ! 之前的部分（JAR 文件路径）
                int bangIdx = location.indexOf('!');
                if (bangIdx > 0) location = location.substring(0, bangIdx);
            } else {
                if (location.startsWith("file:")) {
                    location = location.substring(5);
                }
                if (location.endsWith("!/")) {
                    location = location.substring(0, location.length() - 2);
                }
            }
            // Windows 路径处理：去掉开头的 / 如 /F:/...
            if (location.length() > 2 && location.charAt(0) == '/' && location.charAt(2) == ':') {
                location = location.substring(1);
            }
            // 去掉末尾的斜杠，避免 Paths.get 将 JAR 文件误判为目录
            while (location.endsWith("/") || location.endsWith("\\")) {
                location = location.substring(0, location.length() - 1);
            }
            Path jarFile = Paths.get(location);
            Path base = Files.isRegularFile(jarFile) ? jarFile.getParent() : jarFile;
            // 依次检查候选目录：JAR 同级、JAR 上一级（Maven target/ 场景）、IDE classes 场景
            if (base != null) {
                if (Files.isDirectory(base.resolve("public"))) {
                    return base;
                }
                Path parent = base.getParent();
                if (parent != null && Files.isDirectory(parent.resolve("public"))) {
                    return parent;
                }
            }
        } catch (Exception ignored) {}
        return cwd;
    }

    @GetMapping("/public/{filename}")
    public ResponseEntity<Resource> servePublicFile(@PathVariable String filename) throws Exception {
        String decodedName = URLDecoder.decode(filename, StandardCharsets.UTF_8);

        // 防止路径穿越攻击
        if (decodedName.contains("..") || decodedName.contains("/") || decodedName.contains("\\")) {
            return ResponseEntity.badRequest().build();
        }

        Path filePath = APP_ROOT.resolve("public").resolve(decodedName).normalize();
        if (!Files.exists(filePath)) {
            return ResponseEntity.notFound().build();
        }

        String contentType = CONTENT_TYPES.getOrDefault(
                getFileExtension(decodedName).toLowerCase(), "application/octet-stream");

        Resource resource = new FileSystemResource(filePath);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .body(resource);
    }

    private static String getFileExtension(String filename) {
        int dotIndex = filename.lastIndexOf('.');
        return dotIndex >= 0 ? filename.substring(dotIndex) : "";
    }
}
