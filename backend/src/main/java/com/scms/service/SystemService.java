package com.scms.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.scms.common.PageResult;
import com.scms.common.Result;
import com.scms.dto.NoticeDTO;
import com.scms.entity.*;
import com.scms.mapper.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SystemService {

    private final NoticeMapper noticeMapper;
    private final MessageMapper messageMapper;
    private final OperLogMapper operLogMapper;
    private final SysConfigMapper sysConfigMapper;
    private final DeptMapper deptMapper;
    private final MajorMapper majorMapper;
    private final ClazzMapper clazzMapper;
    private final CompetitionCategoryMapper categoryMapper;

    // ===== 公告管理 =====

    public Result<?> listNotices(int current, int size, Integer noticeType, Integer status) {
        Page<Notice> page = new Page<>(current, size);
        LambdaQueryWrapper<Notice> wrapper = new LambdaQueryWrapper<>();
        if (noticeType != null) wrapper.eq(Notice::getNoticeType, noticeType);
        if (status != null) wrapper.eq(Notice::getStatus, status);
        wrapper.orderByDesc(Notice::getCreateTime);
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

    // ===== 消息管理 =====

    public Result<?> listMessages(int current, int size, Long userId, Integer messageType, Integer isRead) {
        Page<Message> page = new Page<>(current, size);
        LambdaQueryWrapper<Message> wrapper = new LambdaQueryWrapper<>();
        if (userId != null) wrapper.eq(Message::getUserId, userId);
        if (messageType != null) wrapper.eq(Message::getMessageType, messageType);
        if (isRead != null) wrapper.eq(Message::getIsRead, isRead);
        wrapper.orderByDesc(Message::getCreateTime);
        return Result.success(new PageResult<>(messageMapper.selectPage(page, wrapper)));
    }

    @Transactional
    public Result<?> sendMessage(Long userId, String title, String content, Integer type) {
        Message msg = new Message();
        msg.setUserId(userId);
        msg.setMessageTitle(title);
        msg.setMessageContent(content);
        msg.setMessageType(type);
        msg.setIsRead(0);
        messageMapper.insert(msg);
        return Result.success("发送成功", null);
    }

    @Transactional
    public Result<?> markMessageRead(Long id) {
        Message msg = messageMapper.selectById(id);
        if (msg != null) {
            msg.setIsRead(1);
            messageMapper.updateById(msg);
        }
        return Result.success("已标记已读", null);
    }

    @Transactional
    public Result<?> markAllMessagesRead(Long userId) {
        List<Message> messages = messageMapper.selectList(
                new LambdaQueryWrapper<Message>().eq(Message::getUserId, userId).eq(Message::getIsRead, 0)
        );
        messages.forEach(m -> {
            m.setIsRead(1);
            messageMapper.updateById(m);
        });
        return Result.success("全部标记已读", null);
    }

    public Result<?> getUnreadCount(Long userId) {
        long count = messageMapper.selectCount(
                new LambdaQueryWrapper<Message>().eq(Message::getUserId, userId).eq(Message::getIsRead, 0)
        );
        return Result.success(count);
    }

    // ===== 操作日志 =====

    public Result<?> listLogs(int current, int size, String username, String method, Integer status) {
        Page<OperLog> page = new Page<>(current, size);
        LambdaQueryWrapper<OperLog> wrapper = new LambdaQueryWrapper<>();
        if (StringUtils.hasText(username)) wrapper.like(OperLog::getUsername, username);
        if (StringUtils.hasText(method)) wrapper.like(OperLog::getMethod, method);
        if (status != null) wrapper.eq(OperLog::getStatus, status);
        wrapper.orderByDesc(OperLog::getCreateTime);
        return Result.success(new PageResult<>(operLogMapper.selectPage(page, wrapper)));
    }

    // ===== 系统配置 =====

    public Result<?> listConfigs() {
        return Result.success(sysConfigMapper.selectList(null));
    }

    @Transactional
    public Result<?> updateConfig(Long id, String configValue) {
        SysConfig config = sysConfigMapper.selectById(id);
        if (config == null) return Result.error("配置不存在");
        config.setConfigValue(configValue);
        sysConfigMapper.updateById(config);
        return Result.success("更新成功", null);
    }

    // ===== 组织架构 =====

    public Result<?> listDepts() {
        return Result.success(deptMapper.selectList(
                new LambdaQueryWrapper<Dept>().eq(Dept::getStatus, 1).orderByAsc(Dept::getSortOrder)
        ));
    }

    public Result<?> listMajors(Long deptId) {
        LambdaQueryWrapper<Major> wrapper = new LambdaQueryWrapper<>();
        if (deptId != null) wrapper.eq(Major::getDeptId, deptId);
        wrapper.eq(Major::getStatus, 1);
        return Result.success(majorMapper.selectList(wrapper));
    }

    public Result<?> listClasses(Long majorId) {
        LambdaQueryWrapper<Clazz> wrapper = new LambdaQueryWrapper<>();
        if (majorId != null) wrapper.eq(Clazz::getMajorId, majorId);
        wrapper.eq(Clazz::getStatus, 1);
        return Result.success(clazzMapper.selectList(wrapper));
    }

    // ===== 竞赛分类 =====

    public Result<?> listCategories() {
        return Result.success(categoryMapper.selectList(
                new LambdaQueryWrapper<CompetitionCategory>().eq(CompetitionCategory::getStatus, 1).orderByAsc(CompetitionCategory::getSortOrder)
        ));
    }
}
