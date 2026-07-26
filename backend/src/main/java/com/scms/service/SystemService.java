package com.scms.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.scms.common.PageResult;
import com.scms.common.Result;
import com.scms.dto.NoticeDTO;
import com.scms.entity.Notice;
import com.scms.mapper.NoticeMapper;
import com.scms.mapper.UserMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class SystemService {

    private final NoticeMapper noticeMapper;
    private final UserMapper userMapper;

    // ===== 公告管理 =====

    public Result<?> listNotices(int current, int size, Integer noticeType, Integer status) {
        Page<Notice> page = new Page<>(current, size);
        LambdaQueryWrapper<Notice> wrapper = new LambdaQueryWrapper<>();
        if (noticeType != null) wrapper.eq(Notice::getNoticeType, noticeType);
        if (status != null) wrapper.eq(Notice::getStatus, status);
        wrapper.orderByDesc(Notice::getIsTop).orderByDesc(Notice::getCreateTime);
        return Result.success(new PageResult<>(noticeMapper.selectPage(page, wrapper)));
    }

    @Transactional
    public Result<?> createNotice(NoticeDTO dto) {
        Notice notice = new Notice();
        notice.setNoticeTitle(dto.getNoticeTitle());
        notice.setNoticeContent(dto.getNoticeContent());
        notice.setNoticeType(dto.getNoticeType());
        notice.setStatus(1);
        notice.setIsTop(0);
        notice.setPublishTime(LocalDateTime.now());
        noticeMapper.insert(notice);
        return Result.success("发布成功", notice);
    }

    @Transactional
    public Result<?> updateNotice(NoticeDTO dto) {
        Notice notice = noticeMapper.selectById(dto.getId());
        if (notice == null) return Result.error("公告不存在");
        if (StringUtils.hasText(dto.getNoticeTitle())) notice.setNoticeTitle(dto.getNoticeTitle());
        if (StringUtils.hasText(dto.getNoticeContent())) notice.setNoticeContent(dto.getNoticeContent());
        if (dto.getNoticeType() != null) notice.setNoticeType(dto.getNoticeType());
        noticeMapper.updateById(notice);
        return Result.success("更新成功", null);
    }

    @Transactional
    public Result<?> deleteNotice(Long id) {
        noticeMapper.deleteById(id);
        return Result.success("删除成功", null);
    }

    @Transactional
    public Result<?> toggleNoticeTop(Long id) {
        Notice notice = noticeMapper.selectById(id);
        if (notice == null) return Result.error("公告不存在");
        notice.setIsTop(notice.getIsTop() != null && notice.getIsTop() == 1 ? 0 : 1);
        noticeMapper.updateById(notice);
        return Result.success(notice.getIsTop() == 1 ? "已置顶" : "已取消置顶", null);
    }

}
