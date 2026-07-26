package com.scms.service;

import com.alibaba.excel.EasyExcel;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.scms.entity.Competition;
import com.scms.entity.CompetitionRegistration;
import com.scms.entity.CompetitionResult;
import com.scms.entity.CompetitionTeam;
import com.scms.entity.CompetitionTeamMember;
import com.scms.entity.User;
import com.scms.export.*;
import com.scms.mapper.CompetitionMapper;
import com.scms.mapper.CompetitionRegistrationMapper;
import com.scms.mapper.CompetitionResultMapper;
import com.scms.mapper.CompetitionTeamMapper;
import com.scms.mapper.CompetitionTeamMemberMapper;
import com.scms.mapper.UserMapper;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ExportService {

    private static final DateTimeFormatter DT_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");
    private static final DateTimeFormatter D_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    private final CompetitionMapper competitionMapper;
    private final CompetitionRegistrationMapper registrationMapper;
    private final CompetitionTeamMapper teamMapper;
    private final CompetitionTeamMemberMapper teamMemberMapper;
    private final CompetitionResultMapper resultMapper;
    private final UserMapper userMapper;

    // ===== 竞赛导出 =====
    public void exportCompetitions(HttpServletResponse response, Integer status, String keyword) throws IOException {
        LambdaQueryWrapper<Competition> wrapper = new LambdaQueryWrapper<>();
        if (status != null) wrapper.eq(Competition::getStatus, status);
        if (keyword != null && !keyword.isBlank()) wrapper.like(Competition::getCompetitionName, keyword);
        wrapper.orderByDesc(Competition::getCreateTime);

        List<Competition> list = competitionMapper.selectList(wrapper);
        List<CompetitionExcel> excelList = new ArrayList<>();
        for (Competition c : list) {
            CompetitionExcel e = new CompetitionExcel();
            e.setId(c.getId());
            e.setCompetitionName(c.getCompetitionName());
            e.setOrganizer(c.getOrganizer());
            e.setPublisherName(getUserName(c.getPublisherId()));
            e.setRegistrationStart(fmtDt(c.getRegistrationStart()));
            e.setRegistrationEnd(fmtDt(c.getRegistrationEnd()));
            e.setCompetitionStart(fmtDt(c.getCompetitionStart()));
            e.setCompetitionEnd(fmtDt(c.getCompetitionEnd()));
            e.setLocation(c.getLocation());
            e.setMaxTeams(c.getMaxTeams());
            e.setMaxMembers(c.getMaxMembers());
            e.setRegistrationCount(registrationMapper.selectCount(
                    new LambdaQueryWrapper<CompetitionRegistration>().eq(CompetitionRegistration::getCompetitionId, c.getId())
            ).intValue());
            e.setStatusText(competitionStatusText(c.getStatus()));
            excelList.add(e);
        }

        setResponseHeader(response, "竞赛列表");
        EasyExcel.write(response.getOutputStream(), CompetitionExcel.class).sheet("竞赛列表").doWrite(excelList);
    }

    // ===== 报名导出 =====
    public void exportRegistrations(HttpServletResponse response, Long competitionId, Integer status) throws IOException {
        LambdaQueryWrapper<CompetitionRegistration> wrapper = new LambdaQueryWrapper<>();
        if (competitionId != null) wrapper.eq(CompetitionRegistration::getCompetitionId, competitionId);
        if (status != null) wrapper.eq(CompetitionRegistration::getStatus, status);
        wrapper.orderByDesc(CompetitionRegistration::getCreateTime);

        List<CompetitionRegistration> list = registrationMapper.selectList(wrapper);
        List<RegistrationExcel> excelList = new ArrayList<>();
        for (CompetitionRegistration r : list) {
            RegistrationExcel e = new RegistrationExcel();
            e.setId(r.getId());
            e.setCompetitionName(getCompetitionName(r.getCompetitionId()));
            e.setStudentName(getUserName(r.getStudentId()));
            e.setTeamName(getTeamName(r.getTeamId()));
            e.setIsTeamLeaderText(r.getIsTeamLeader() != null && r.getIsTeamLeader() == 1 ? "是" : "否");
            e.setContactPhone(r.getContactPhone());
            e.setRemark(r.getRemark());
            e.setStatusText(registrationStatusText(r.getStatus()));
            e.setAuditRemark(r.getAuditRemark());
            e.setCreateTime(fmtDt(r.getCreateTime()));
            excelList.add(e);
        }

        setResponseHeader(response, "报名列表");
        EasyExcel.write(response.getOutputStream(), RegistrationExcel.class).sheet("报名列表").doWrite(excelList);
    }

    // ===== 团队导出 =====
    public void exportTeams(HttpServletResponse response, Long competitionId, Integer status) throws IOException {
        LambdaQueryWrapper<CompetitionTeam> wrapper = new LambdaQueryWrapper<>();
        if (competitionId != null) wrapper.eq(CompetitionTeam::getCompetitionId, competitionId);
        if (status != null) wrapper.eq(CompetitionTeam::getStatus, status);
        wrapper.orderByDesc(CompetitionTeam::getCreateTime);

        List<CompetitionTeam> list = teamMapper.selectList(wrapper);
        List<TeamExcel> excelList = new ArrayList<>();
        for (CompetitionTeam t : list) {
            TeamExcel e = new TeamExcel();
            e.setId(t.getId());
            e.setTeamName(t.getTeamName());
            e.setTeamSlogan(t.getTeamSlogan());
            e.setCompetitionName(getCompetitionName(t.getCompetitionId()));
            e.setLeaderName(getUserName(t.getLeaderId()));
            e.setMemberCount(teamMemberMapper.selectCount(
                    new LambdaQueryWrapper<CompetitionTeamMember>()
                            .eq(CompetitionTeamMember::getTeamId, t.getId())
                            .eq(CompetitionTeamMember::getStatus, 1)
            ).intValue());
            e.setStatusText(teamStatusText(t.getStatus()));
            e.setCreateTime(fmtDt(t.getCreateTime()));
            excelList.add(e);
        }

        setResponseHeader(response, "团队列表");
        EasyExcel.write(response.getOutputStream(), TeamExcel.class).sheet("团队列表").doWrite(excelList);
    }

    // ===== 成绩导出 =====
    public void exportResults(HttpServletResponse response, Long competitionId, Integer awardLevel, Integer isPublished) throws IOException {
        LambdaQueryWrapper<CompetitionResult> wrapper = new LambdaQueryWrapper<>();
        if (competitionId != null) wrapper.eq(CompetitionResult::getCompetitionId, competitionId);
        if (awardLevel != null) wrapper.eq(CompetitionResult::getAwardLevel, awardLevel);
        if (isPublished != null) wrapper.eq(CompetitionResult::getIsPublished, isPublished);
        wrapper.orderByDesc(CompetitionResult::getCreateTime);

        List<CompetitionResult> list = resultMapper.selectList(wrapper);
        List<ResultExcel> excelList = new ArrayList<>();
        for (CompetitionResult r : list) {
            ResultExcel e = new ResultExcel();
            e.setId(r.getId());
            e.setCompetitionName(getCompetitionName(r.getCompetitionId()));
            e.setStudentName(getUserName(r.getStudentId()));
            e.setTeamName(getTeamName(r.getTeamId()));
            e.setScore(r.getScore() != null ? r.getScore().toPlainString() : "");
            e.setRanking(r.getRanking() != null ? String.valueOf(r.getRanking()) : "");
            e.setAwardName(r.getAwardName());
            e.setRemark(r.getRemark());
            e.setIsPublishedText(r.getIsPublished() != null && r.getIsPublished() == 1 ? "已发布" : "未发布");
            e.setPublishTime(fmtDt(r.getPublishTime()));
            excelList.add(e);
        }

        setResponseHeader(response, "成绩列表");
        EasyExcel.write(response.getOutputStream(), ResultExcel.class).sheet("成绩列表").doWrite(excelList);
    }

    // ===== 用户导出 =====
    public void exportUsers(HttpServletResponse response, Integer userType, String keyword) throws IOException {
        LambdaQueryWrapper<User> wrapper = new LambdaQueryWrapper<>();
        if (userType != null) wrapper.eq(User::getUserType, userType);
        if (keyword != null && !keyword.isBlank()) {
            wrapper.and(w -> w.like(User::getUsername, keyword).or().like(User::getRealName, keyword));
        }
        wrapper.orderByDesc(User::getCreateTime);

        List<User> list = userMapper.selectList(wrapper);
        List<UserExcel> excelList = new ArrayList<>();
        for (User u : list) {
            UserExcel e = new UserExcel();
            e.setId(u.getId());
            e.setUsername(u.getUsername());
            e.setRealName(u.getRealName());
            e.setUserTypeText(userTypeText(u.getUserType()));
            e.setGenderText(genderText(u.getGender()));
            e.setDeptName(u.getDeptName() != null ? u.getDeptName() : "");
            e.setMajorName(u.getMajorName() != null ? u.getMajorName() : "");
            e.setClassName(u.getClassName() != null ? u.getClassName() : "");
            e.setStatusText(u.getStatus() != null && u.getStatus() == 1 ? "启用" : "禁用");
            e.setCreateTime(fmtDt(u.getCreateTime()));
            excelList.add(e);
        }

        setResponseHeader(response, "用户列表");
        EasyExcel.write(response.getOutputStream(), UserExcel.class).sheet("用户列表").doWrite(excelList);
    }

    // ===== 学生成绩单导出 =====
    public void exportStudentTranscript(HttpServletResponse response, Long studentId) throws IOException {
        User student = userMapper.selectById(studentId);
        String studentName = student != null ? student.getRealName() : "未知";

        LambdaQueryWrapper<CompetitionResult> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(CompetitionResult::getStudentId, studentId);
        wrapper.eq(CompetitionResult::getIsPublished, 1);
        wrapper.orderByDesc(CompetitionResult::getCreateTime);

        List<CompetitionResult> list = resultMapper.selectList(wrapper);
        List<ResultExcel> excelList = new ArrayList<>();
        for (CompetitionResult r : list) {
            ResultExcel e = new ResultExcel();
            e.setId(r.getId());
            e.setCompetitionName(getCompetitionName(r.getCompetitionId()));
            e.setStudentName(studentName);
            e.setTeamName(getTeamName(r.getTeamId()));
            e.setScore(r.getScore() != null ? r.getScore().toPlainString() : "");
            e.setRanking(r.getRanking() != null ? String.valueOf(r.getRanking()) : "");
            e.setAwardName(r.getAwardName());
            e.setRemark(r.getRemark());
            e.setIsPublishedText("已发布");
            e.setPublishTime(fmtDt(r.getPublishTime()));
            excelList.add(e);
        }

        setResponseHeader(response, "成绩单_" + studentName);
        EasyExcel.write(response.getOutputStream(), ResultExcel.class).sheet("成绩单").doWrite(excelList);
    }

    // ===== 工具方法 =====

    private void setResponseHeader(HttpServletResponse response, String fileName) throws IOException {
        response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        response.setCharacterEncoding("utf-8");
        String encodedFileName = URLEncoder.encode(fileName, StandardCharsets.UTF_8).replaceAll("\\+", "%20");
        response.setHeader("Content-Disposition", "attachment;filename*=utf-8''" + encodedFileName + ".xlsx");
    }

    private String fmtDt(java.time.LocalDateTime dt) {
        return dt != null ? dt.format(DT_FMT) : "";
    }

    private String getUserName(Long userId) {
        if (userId == null) return "";
        User u = userMapper.selectById(userId);
        return u != null ? u.getRealName() : "";
    }

    private String getCompetitionName(Long compId) {
        if (compId == null) return "";
        Competition c = competitionMapper.selectById(compId);
        return c != null ? c.getCompetitionName() : "";
    }

    private String getTeamName(Long teamId) {
        if (teamId == null) return "";
        CompetitionTeam t = teamMapper.selectById(teamId);
        return t != null ? t.getTeamName() : "";
    }

    private String competitionStatusText(Integer status) {
        if (status == null) return "未知";
        return switch (status) {
            case 0 -> "草稿";
            case 1 -> "待审核";
            case 2 -> "已发布";
            case 3 -> "进行中";
            case 4 -> "已结束";
            case 5 -> "已驳回";
            default -> "未知";
        };
    }

    private String registrationStatusText(Integer status) {
        if (status == null) return "未知";
        return switch (status) {
            case 0 -> "待审核";
            case 1 -> "已通过";
            case 2 -> "已拒绝";
            default -> "未知";
        };
    }

    private String teamStatusText(Integer status) {
        if (status == null) return "未知";
        return switch (status) {
            case 0 -> "组建中";
            case 1 -> "已提交";
            case 2 -> "已通过";
            case 3 -> "已拒绝";
            default -> "未知";
        };
    }

    private String userTypeText(Integer type) {
        if (type == null) return "未知";
        return switch (type) {
            case 1 -> "学生";
            case 2 -> "教师";
            case 3 -> "管理员";
            default -> "未知";
        };
    }

    private String genderText(Integer gender) {
        if (gender == null) return "-";
        return switch (gender) {
            case 1 -> "男";
            case 2 -> "女";
            default -> "-";
        };
    }
}
