package com.scms.common;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.multipart.support.MissingServletRequestPartException;
import org.springframework.web.servlet.NoHandlerFoundException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.util.stream.Collectors;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Result<Void> handleValidationException(MethodArgumentNotValidException ex) {
        String message = ex.getBindingResult().getFieldErrors().stream()
                .map(FieldError::getDefaultMessage)
                .collect(Collectors.joining(", "));
        log.warn("参数校验失败: {}", message);
        return Result.error(400, message);
    }

    /** 边界：请求了不存在的路径/接口时返回 404，而非兜底 500 */
    @ExceptionHandler({NoResourceFoundException.class, NoHandlerFoundException.class})
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public Result<Void> handleNotFound(Exception ex) {
        return Result.error(404, "接口不存在");
    }

    @ExceptionHandler(AccessDeniedException.class)
    @ResponseStatus(HttpStatus.FORBIDDEN)
    public Result<Void> handleAccessDeniedException(AccessDeniedException ex) {
        return Result.error(403, "权限不足");
    }

    /** 以下均为客户端错误：请求体不可读 / 缺参 / 类型错误 / 方法不支持 / 上传问题，返回 4xx 语义而非兜底 500 */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Result<Void> handleNotReadable(HttpMessageNotReadableException ex) {
        log.warn("请求体解析失败: {}", ex.getMessage());
        return Result.error(400, "请求体格式错误或必填参数缺失");
    }

    @ExceptionHandler(MissingServletRequestParameterException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Result<Void> handleMissingParam(MissingServletRequestParameterException ex) {
        return Result.error(400, "缺少必填参数: " + ex.getParameterName());
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Result<Void> handleTypeMismatch(MethodArgumentTypeMismatchException ex) {
        return Result.error(400, "参数类型错误: " + ex.getName());
    }

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    @ResponseStatus(HttpStatus.METHOD_NOT_ALLOWED)
    public Result<Void> handleMethodNotSupported(HttpRequestMethodNotSupportedException ex) {
        return Result.error(405, "请求方法不支持");
    }

    @ExceptionHandler(MissingServletRequestPartException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Result<Void> handleMissingPart(MissingServletRequestPartException ex) {
        return Result.error(400, "缺少上传文件");
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    @ResponseStatus(HttpStatus.PAYLOAD_TOO_LARGE)
    public Result<Void> handleMaxUpload(MaxUploadSizeExceededException ex) {
        return Result.error(413, "文件超过上传大小限制");
    }

    /**
     * 唯一键冲突（并发双击报名/注册等"查后插"窗口的 DB 兜底）：应用层预检拦不住的竞态
     * 原本落兜底 500，这里映射为结构化 400，客户端可安全提示重试。DuplicateKey 优先于父类匹配。
     */
    @ExceptionHandler(org.springframework.dao.DuplicateKeyException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Result<Void> handleDuplicateKey(org.springframework.dao.DuplicateKeyException ex) {
        log.warn("唯一键冲突: {}", ex.getMostSpecificCause().getMessage());
        return Result.error(400, "内容已被提交（并发重复操作），请刷新后确认");
    }

    /** 数据完整性错误（漏网的超长/非法值撞 DB 约束）：同样从兜底 500 收敛为 400 */
    @ExceptionHandler(org.springframework.dao.DataIntegrityViolationException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Result<Void> handleDataIntegrity(org.springframework.dao.DataIntegrityViolationException ex) {
        log.warn("数据完整性错误: {}", ex.getMostSpecificCause().getMessage());
        return Result.error(400, "提交内容不合法（字段过长或数据不完整），请检查后重试");
    }

    /** 时间字符串解析失败（未走 Jackson 包装的旁路，如纯日期 'yyyy-MM-dd'）：给 400 而非兜底 500 */
    @ExceptionHandler(java.time.format.DateTimeParseException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Result<Void> handleDateTimeParse(java.time.format.DateTimeParseException ex) {
        return Result.error(400, "时间格式不正确，请使用 yyyy-MM-dd HH:mm:ss");
    }

    @ExceptionHandler(Exception.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public Result<Void> handleException(Exception ex) {
        log.error("服务器内部异常", ex);
        return Result.error(500, "服务器内部错误");
    }
}
