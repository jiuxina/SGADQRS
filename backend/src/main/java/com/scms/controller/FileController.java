package com.scms.controller;

import com.scms.common.Result;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Tag(name = "文件上传")
@RestController
@RequestMapping("/file")
@RequiredArgsConstructor
public class FileController {

    /** 边界：扩展名白名单——图片（不含可携带脚本的 svg）+ 常用文档/压缩包 */
    private static final Set<String> ALLOWED_EXTENSIONS = Set.of(
            "jpg", "jpeg", "png", "gif", "webp", "bmp", "ico",
            "pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "md", "zip"
    );

    @Value("${file.upload-path:./uploads/}")
    private String uploadPath;

    @Operation(summary = "上传文件")
    @PostMapping("/upload")
    public Result<?> upload(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return Result.error("请选择文件");
        }

        String originalFilename = file.getOriginalFilename();
        String ext = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            ext = originalFilename.substring(originalFilename.lastIndexOf(".") + 1).toLowerCase();
        }
        // 边界：拒绝无扩展名与白名单之外的文件，防止上传 html/svg 等可执行内容形成存储型 XSS
        if (ext.isBlank() || !ALLOWED_EXTENSIONS.contains(ext)) {
            return Result.error("不支持的文件类型，仅允许图片、PDF、Office 文档、文本与 zip");
        }

        try {
            String datePath = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy/MM/dd"));
            String dir = uploadPath + datePath;
            File dirFile = new File(dir);
            if (!dirFile.exists()) dirFile.mkdirs();

            String newFilename = UUID.randomUUID().toString().replace("-", "") + "." + ext;

            Path filePath = Paths.get(dir, newFilename);
            Files.write(filePath, file.getBytes());

            String url = "/uploads/" + datePath + "/" + newFilename;

            Map<String, Object> result = new HashMap<>();
            result.put("url", url);
            result.put("fileName", originalFilename);
            result.put("fileSize", file.getSize());
            result.put("fileType", file.getContentType());

            return Result.success("上传成功", result);
        } catch (IOException e) {
            return Result.error("上传失败: " + e.getMessage());
        }
    }
}
