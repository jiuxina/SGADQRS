package com.scms.export;

import com.alibaba.excel.annotation.ExcelProperty;
import com.alibaba.excel.annotation.write.style.ColumnWidth;
import lombok.Data;

@Data
public class RegistrationExcel {

    @ExcelProperty("ID")
    @ColumnWidth(8)
    private Long id;

    @ExcelProperty("竞赛名称")
    @ColumnWidth(30)
    private String competitionName;

    @ExcelProperty("学生姓名")
    @ColumnWidth(12)
    private String studentName;

    @ExcelProperty("团队名称")
    @ColumnWidth(15)
    private String teamName;

    @ExcelProperty("是否队长")
    @ColumnWidth(10)
    private String isTeamLeaderText;

    @ExcelProperty("联系电话")
    @ColumnWidth(15)
    private String contactPhone;

    @ExcelProperty("备注")
    @ColumnWidth(20)
    private String remark;

    @ExcelProperty("状态")
    @ColumnWidth(10)
    private String statusText;

    @ExcelProperty("审核备注")
    @ColumnWidth(20)
    private String auditRemark;

    @ExcelProperty("报名时间")
    @ColumnWidth(20)
    private String createTime;
}
