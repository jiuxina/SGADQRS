package com.scms.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.scms.common.PageResult;
import com.scms.common.Pages;
import com.scms.common.Result;
import com.scms.dto.NoticeDTO;
import com.scms.entity.Notification;
import com.scms.mapper.NotificationMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.LinkedHashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class SystemService {

    private final NotificationMapper notificationMapper;

    // ===== 公告管理（公告即 sys_notification 中 user_id=0 的行，兼容旧 /notice 接口形状） =====

    public Result<?> listNotices(int current, int size, Integer noticeType, Integer status, String keyword) {
        Page<Notification> page = Pages.of(current, size);
        LambdaQueryWrapper<Notification> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Notification::getUserId, 0L);
        // 旧 noticeType：1-通知 2-公告
        if (noticeType != null && noticeType == 1) wrapper.eq(Notification::getType, "system");
        if (noticeType != null && noticeType == 2) wrapper.eq(Notification::getType, "announcement");
        // 发布状态：全局公告行复用 is_read 存状态（0=已发布，1=草稿），前端 status 1=已发布 0=草稿
        if (status != null) wrapper.eq(Notification::getIsRead, status == 0 ? 1 : 0);
        // 前端管理页搜索框传 keyword：标题/内容模糊匹配（原参数被静默丢弃）
        if (StringUtils.hasText(keyword)) {
            wrapper.and(w -> w.like(Notification::getTitle, keyword)
                    .or().like(Notification::getContent, keyword));
        }
        wrapper.orderByDesc(Notification::getIsTop).orderByDesc(Notification::getCreateTime);
        Page<Notification> result = notificationMapper.selectPage(page, wrapper);

        Page<Map<String, Object>> mapped = Pages.of(current, size);
        mapped.setTotal(result.getTotal());
        mapped.setRecords(result.getRecords().stream().map(SystemService::toLegacyNotice).toList());
        return Result.success(new PageResult<>(mapped));
    }

    /** 公告列宽守卫：title VARCHAR(100)、content VARCHAR(500)，超长须结构化拒绝而非撞 DB 约束 500 */
    private Result<?> noticeLengthCheck(NoticeDTO dto) {
        if (dto.getNoticeTitle() != null && dto.getNoticeTitle().length() > 100) return Result.error("公告标题不能超过 100 字");
        if (dto.getNoticeContent() != null && dto.getNoticeContent().length() > 500) return Result.error("公告内容不能超过 500 字");
        return null;
    }

    @org.springframework.transaction.annotation.Transactional
    public Result<?> createNotice(NoticeDTO dto) {
        Result<?> tooLong = noticeLengthCheck(dto);
        if (tooLong != null) return tooLong;
        Notification n = new Notification();
        n.setUserId(0L);
        n.setType(dto.getNoticeType() != null && dto.getNoticeType() == 1 ? "system" : "announcement");
        n.setTitle(dto.getNoticeTitle());
        n.setContent(dto.getNoticeContent());
        n.setRefType("notice");
        // 草稿(0)落库为 is_read=1，发布(1)为 is_read=0
        n.setIsRead(dto.getStatus() != null && dto.getStatus() == 0 ? 1 : 0);
        n.setIsTop(0);
        notificationMapper.insert(n);
        return Result.success(dto.getStatus() != null && dto.getStatus() == 0 ? "草稿已保存" : "发布成功", toLegacyNotice(n));
    }

    @org.springframework.transaction.annotation.Transactional
    public Result<?> updateNotice(NoticeDTO dto) {
        Result<?> tooLong = noticeLengthCheck(dto);
        if (tooLong != null) return tooLong;
        Notification n = notificationMapper.selectById(dto.getId());
        if (n == null || n.getUserId() == null || n.getUserId() != 0L) return Result.error("公告不存在");
        if (StringUtils.hasText(dto.getNoticeTitle())) n.setTitle(dto.getNoticeTitle());
        if (StringUtils.hasText(dto.getNoticeContent())) n.setContent(dto.getNoticeContent());
        if (dto.getNoticeType() != null) n.setType(dto.getNoticeType() == 1 ? "system" : "announcement");
        if (dto.getStatus() != null) n.setIsRead(dto.getStatus() == 0 ? 1 : 0);
        notificationMapper.updateById(n);
        return Result.success("更新成功", null);
    }

    @org.springframework.transaction.annotation.Transactional
    public Result<?> deleteNotice(Long id) {
        Notification n = notificationMapper.selectById(id);
        if (n == null || n.getUserId() == null || n.getUserId() != 0L) return Result.error("公告不存在");
        notificationMapper.deleteById(id);
        return Result.success("删除成功", null);
    }

    @org.springframework.transaction.annotation.Transactional
    public Result<?> toggleNoticeTop(Long id) {
        Notification n = notificationMapper.selectById(id);
        if (n == null || n.getUserId() == null || n.getUserId() != 0L) return Result.error("公告不存在");
        n.setIsTop(n.getIsTop() != null && n.getIsTop() == 1 ? 0 : 1);
        notificationMapper.updateById(n);
        return Result.success(n.getIsTop() == 1 ? "已置顶" : "已取消置顶", null);
    }

    /** 转换成旧 sys_notice 的字段形状，前端管理页无需改动 */
    private static Map<String, Object> toLegacyNotice(Notification n) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", n.getId());
        m.put("noticeTitle", n.getTitle());
        m.put("noticeContent", n.getContent());
        m.put("noticeType", "system".equals(n.getType()) ? 1 : 2);
        m.put("isTop", n.getIsTop());
        m.put("status", n.getIsRead() != null && n.getIsRead() == 1 ? 0 : 1);
        m.put("publishTime", n.getCreateTime());
        m.put("createTime", n.getCreateTime());
        return m;
    }
}
