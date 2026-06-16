package com.scms.common;

import lombok.Data;

@Data
public class PageResult<T> {
    private java.util.List<T> records;
    private long total;
    private long current;
    private long size;
    private long pages;

    public PageResult(com.baomidou.mybatisplus.extension.plugins.pagination.Page<T> page) {
        this.records = page.getRecords();
        this.total = page.getTotal();
        this.current = page.getCurrent();
        this.size = page.getSize();
        this.pages = page.getPages();
    }
}
