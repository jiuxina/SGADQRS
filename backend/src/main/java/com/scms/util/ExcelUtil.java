package com.scms.util;

import com.alibaba.excel.EasyExcel;
import com.alibaba.excel.write.builder.ExcelWriterSheetBuilder;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;

import java.io.OutputStream;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;

/**
 * Excel导出工具类
 * <p>基于EasyExcel封装通用Excel导出方法</p>
 */
@Slf4j
public class ExcelUtil {

    private ExcelUtil() {
        // 工具类不允许实例化
    }

    /**
     * 导出Excel到HTTP响应流
     *
     * @param response  HTTP响应对象
     * @param fileName  文件名（不含扩展名）
     * @param sheetName 工作表名称
     * @param clazz     Excel数据模型类（带@ExcelProperty注解）
     * @param data      导出数据列表
     * @param <T>       数据类型
     */
    public static <T> void exportToResponse(HttpServletResponse response,
                                            String fileName,
                                            String sheetName,
                                            Class<T> clazz,
                                            List<T> data) {
        try {
            // 设置响应头
            response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
            response.setCharacterEncoding(StandardCharsets.UTF_8.name());

            // 文件名URL编码，处理中文和空格
            String encodedFileName = URLEncoder.encode(fileName + ".xlsx", StandardCharsets.UTF_8)
                    .replaceAll("\\+", "%20");
            response.setHeader("Content-Disposition", "attachment;filename=" + encodedFileName);

            // 写入响应输出流
            exportToStream(response.getOutputStream(), sheetName, clazz, data);
        } catch (Exception e) {
            log.error("Excel导出失败: fileName={}", fileName, e);
            throw new RuntimeException("Excel导出失败: " + e.getMessage(), e);
        }
    }

    /**
     * 导出Excel到HTTP响应流（使用默认工作表名"Sheet1"）
     *
     * @param response HTTP响应对象
     * @param fileName 文件名（不含扩展名）
     * @param clazz    Excel数据模型类
     * @param data     导出数据列表
     * @param <T>      数据类型
     */
    public static <T> void exportToResponse(HttpServletResponse response,
                                            String fileName,
                                            Class<T> clazz,
                                            List<T> data) {
        exportToResponse(response, fileName, "Sheet1", clazz, data);
    }

    /**
     * 导出Excel到输出流
     *
     * @param outputStream 输出流
     * @param sheetName    工作表名称
     * @param clazz        Excel数据模型类
     * @param data         导出数据列表
     * @param <T>          数据类型
     */
    public static <T> void exportToStream(OutputStream outputStream,
                                          String sheetName,
                                          Class<T> clazz,
                                          List<T> data) {
        ExcelWriterSheetBuilder sheetBuilder = EasyExcel.write(outputStream, clazz)
                .sheet(sheetName);
        sheetBuilder.doWrite(data);
    }

    /**
     * 导出Excel到输出流（使用默认工作表名"Sheet1"）
     *
     * @param outputStream 输出流
     * @param clazz        Excel数据模型类
     * @param data         导出数据列表
     * @param <T>          数据类型
     */
    public static <T> void exportToStream(OutputStream outputStream,
                                          Class<T> clazz,
                                          List<T> data) {
        exportToStream(outputStream, "Sheet1", clazz, data);
    }
}
