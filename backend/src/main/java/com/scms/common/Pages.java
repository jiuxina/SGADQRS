package com.scms.common;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;

/**
 * 分页参数边界规范化：页码下探到 1（防止负偏移 SQL 异常），
 * 条数限制在 1~200（防止 size 超大导致的全表拉取）。
 */
public final class Pages {

    private static final int MAX_SIZE = 200;

    private Pages() {}

    public static <T> Page<T> of(int current, int size) {
        int cur = Math.max(current, 1);
        int sz = Math.min(Math.max(size, 1), MAX_SIZE);
        return new Page<>(cur, sz);
    }
}
