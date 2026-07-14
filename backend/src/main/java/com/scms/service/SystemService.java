package com.scms.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.scms.common.PageResult;
import com.scms.common.Result;
import com.scms.dto.MessageDTO;
import com.scms.dto.NoticeDTO;
import com.scms.entity.*;
import com.scms.mapper.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SystemService {

    private final NoticeMapper noticeMapper;
    private final MessageMapper messageMapper;
    private final OperLogMapper operLogMapper;
    private final DeptMapper deptMapper;
    private final MajorMapper majorMapper;
    private final ClazzMapper clazzMapper;
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

    // ===== 消息管理 =====

    public Result<?> listMessages(int current, int size, Long userId, Integer isRead) {
        Page<Message> page = new Page<>(current, size);
        LambdaQueryWrapper<Message> wrapper = new LambdaQueryWrapper<>();
        if (userId != null) wrapper.eq(Message::getUserId, userId);
        if (isRead != null) wrapper.eq(Message::getIsRead, isRead);
        wrapper.orderByDesc(Message::getCreateTime);
        return Result.success(new PageResult<>(messageMapper.selectPage(page, wrapper)));
    }

    @Transactional
    public Result<?> sendMessage(Long userId, String title, String content) {
        Message msg = new Message();
        msg.setUserId(userId);
        msg.setMessageTitle(title);
        msg.setMessageContent(content);
        msg.setIsRead(0);
        messageMapper.insert(msg);
        return Result.success("发送成功", null);
    }

    /**
     * 按目标类型发送消息
     * targetType: user-指定用户 role-按角色 dept-按院系 all-全员
     */
    @Transactional
    public Result<?> sendMessageToTarget(MessageDTO dto, Long senderId) {
        List<Long> targetUserIds = resolveTargetUserIds(dto);
        if (targetUserIds.isEmpty()) {
            return Result.error("未找到目标用户");
        }

        int count = 0;
        for (Long uid : targetUserIds) {
            // 不给自己发消息
            if (uid.equals(senderId)) continue;
            Message msg = new Message();
            msg.setUserId(uid);
            msg.setMessageTitle(dto.getTitle());
            msg.setMessageContent(dto.getContent());
            msg.setIsRead(0);
            messageMapper.insert(msg);
            count++;
        }
        return Result.success("发送成功，共发送 " + count + " 条", count);
    }

    private List<Long> resolveTargetUserIds(MessageDTO dto) {
        List<Long> ids = new ArrayList<>();
        switch (dto.getTargetType()) {
            case "user":
                if (dto.getUserIds() != null) ids.addAll(dto.getUserIds());
                break;
            case "role":
                if (dto.getUserType() != null) {
                    LambdaQueryWrapper<User> w = new LambdaQueryWrapper<>();
                    w.eq(User::getUserType, dto.getUserType()).eq(User::getStatus, 1);
                    userMapper.selectList(w).forEach(u -> ids.add(u.getId()));
                }
                break;
            case "dept":
                if (dto.getDeptId() != null) {
                    LambdaQueryWrapper<User> w = new LambdaQueryWrapper<>();
                    w.eq(User::getDeptId, dto.getDeptId()).eq(User::getStatus, 1);
                    userMapper.selectList(w).forEach(u -> ids.add(u.getId()));
                }
                break;
            case "all":
                userMapper.selectList(new LambdaQueryWrapper<User>().eq(User::getStatus, 1))
                        .forEach(u -> ids.add(u.getId()));
                break;
            default:
                break;
        }
        return ids;
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

    public Result<?> listLogs(int current, int size, String username, String method, Integer status,
                              LocalDateTime startDate, LocalDateTime endDate) {
        Page<OperLog> page = new Page<>(current, size);
        LambdaQueryWrapper<OperLog> wrapper = new LambdaQueryWrapper<>();
        if (StringUtils.hasText(username)) wrapper.like(OperLog::getUsername, username);
        if (StringUtils.hasText(method)) wrapper.like(OperLog::getMethod, method);
        if (status != null) wrapper.eq(OperLog::getStatus, status);
        if (startDate != null) wrapper.ge(OperLog::getCreateTime, startDate);
        if (endDate != null) wrapper.le(OperLog::getCreateTime, endDate);
        wrapper.orderByDesc(OperLog::getCreateTime);
        return Result.success(new PageResult<>(operLogMapper.selectPage(page, wrapper)));
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

    @Transactional
    public Result<?> createDept(String deptName, String deptCode, Integer sortOrder) {
        Dept dept = new Dept();
        dept.setParentId(0L);
        dept.setDeptName(deptName);
        dept.setDeptCode(deptCode);
        dept.setSortOrder(sortOrder != null ? sortOrder : 0);
        dept.setStatus(1);
        deptMapper.insert(dept);
        return Result.success("新增成功", dept);
    }

    @Transactional
    public Result<?> updateDept(Long id, String deptName, String deptCode, Integer sortOrder) {
        Dept dept = deptMapper.selectById(id);
        if (dept == null) return Result.error("院系不存在");
        if (StringUtils.hasText(deptName)) dept.setDeptName(deptName);
        if (deptCode != null) dept.setDeptCode(deptCode);
        if (sortOrder != null) dept.setSortOrder(sortOrder);
        deptMapper.updateById(dept);
        return Result.success("更新成功", dept);
    }

    @Transactional
    public Result<?> deleteDept(Long id) {
        // 检查是否有关联的专业
        long majorCount = majorMapper.selectCount(
                new LambdaQueryWrapper<Major>().eq(Major::getDeptId, id).eq(Major::getStatus, 1)
        );
        if (majorCount > 0) {
            return Result.error("该院系下存在专业，无法删除");
        }
        Dept dept = deptMapper.selectById(id);
        if (dept == null) return Result.error("院系不存在");
        dept.setStatus(0);
        deptMapper.updateById(dept);
        return Result.success("删除成功", null);
    }

    @Transactional
    public Result<?> createMajor(Long deptId, String majorName, String majorCode) {
        // 验证院系存在
        Dept dept = deptMapper.selectById(deptId);
        if (dept == null || dept.getStatus() != 1) return Result.error("院系不存在");
        Major major = new Major();
        major.setDeptId(deptId);
        major.setMajorName(majorName);
        major.setMajorCode(majorCode);
        major.setStatus(1);
        majorMapper.insert(major);
        return Result.success("新增成功", major);
    }

    @Transactional
    public Result<?> updateMajor(Long id, String majorName, String majorCode) {
        Major major = majorMapper.selectById(id);
        if (major == null) return Result.error("专业不存在");
        if (StringUtils.hasText(majorName)) major.setMajorName(majorName);
        if (majorCode != null) major.setMajorCode(majorCode);
        majorMapper.updateById(major);
        return Result.success("更新成功", major);
    }

    @Transactional
    public Result<?> deleteMajor(Long id) {
        // 检查是否有关联的班级
        long classCount = clazzMapper.selectCount(
                new LambdaQueryWrapper<Clazz>().eq(Clazz::getMajorId, id).eq(Clazz::getStatus, 1)
        );
        if (classCount > 0) {
            return Result.error("该专业下存在班级，无法删除");
        }
        Major major = majorMapper.selectById(id);
        if (major == null) return Result.error("专业不存在");
        major.setStatus(0);
        majorMapper.updateById(major);
        return Result.success("删除成功", null);
    }

    @Transactional
    public Result<?> createClass(Long majorId, String className, String grade) {
        // 验证专业存在
        Major major = majorMapper.selectById(majorId);
        if (major == null || major.getStatus() != 1) return Result.error("专业不存在");
        Clazz clazz = new Clazz();
        clazz.setMajorId(majorId);
        clazz.setClassName(className);
        clazz.setGrade(grade);
        clazz.setStatus(1);
        clazzMapper.insert(clazz);
        return Result.success("新增成功", clazz);
    }

    @Transactional
    public Result<?> updateClass(Long id, String className, String grade) {
        Clazz clazz = clazzMapper.selectById(id);
        if (clazz == null) return Result.error("班级不存在");
        if (StringUtils.hasText(className)) clazz.setClassName(className);
        if (grade != null) clazz.setGrade(grade);
        clazzMapper.updateById(clazz);
        return Result.success("更新成功", clazz);
    }

    @Transactional
    public Result<?> deleteClass(Long id) {
        Clazz clazz = clazzMapper.selectById(id);
        if (clazz == null) return Result.error("班级不存在");
        clazz.setStatus(0);
        clazzMapper.updateById(clazz);
        return Result.success("删除成功", null);
    }

}
