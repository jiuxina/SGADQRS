package com.scms.export;

import com.alibaba.excel.annotation.ExcelProperty;
import com.alibaba.excel.annotation.write.style.ColumnWidth;
import lombok.Data;

@Data
public class UserExcel {

    @ExcelProperty("ID")
    @ColumnWidth(8)
    private Long id;

    @ExcelProperty("用户名")
    @ColumnWidth(15)
    private String username;

    @ExcelProperty("真实姓名")
    @ColumnWidth(12)
    private String realName;

    @ExcelProperty("角色")
    @ColumnWidth(10)
    private String userTypeText;

    @ExcelProperty("性别")
    @ColumnWidth(8)
    private String genderText;

    @ExcelProperty("所属院系")
    @ColumnWidth(20)
    private String deptName;

    @ExcelProperty("专业")
    @ColumnWidth(20)
    private String majorName;

    @ExcelProperty("班级")
    @ColumnWidth(15)
    private String className;

    @ExcelProperty("状态")
    @ColumnWidth(10)
    private String statusText;

    @ExcelProperty("创建时间")
    @ColumnWidth(20)
    private String createTime;
}
