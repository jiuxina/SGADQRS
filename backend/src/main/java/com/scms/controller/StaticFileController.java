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

    @GetMapping("/public/{filename}")
    public ResponseEntity<Resource> servePublicFile(@PathVariable String filename) throws Exception {
        String decodedName = URLDecoder.decode(filename, StandardCharsets.UTF_8);

        // 防止路径穿越攻击
        if (decodedName.contains("..") || decodedName.contains("/") || decodedName.contains("\\")) {
            return ResponseEntity.badRequest().build();
        }

        Path filePath = Paths.get("public", decodedName).toAbsolutePath().normalize();
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
