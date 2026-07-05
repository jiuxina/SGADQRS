package com.scms.annotation;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * 操作日志注解，用于标记需要记录操作日志的方法。
 *
 * <p>被此注解标记的方法将由 {@code LogAspect} 拦截，
 * 自动记录操作描述、执行时间、操作人等信息到日志表。</p>
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface LogOperation {

    /**
     * 操作描述，如"新增用户"、"修改配置"等。
     *
     * @return 操作描述字符串
     */
    String value() default "";
}
