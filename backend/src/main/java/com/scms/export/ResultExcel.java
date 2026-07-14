package com.scms.export;

import com.alibaba.excel.annotation.ExcelProperty;
import com.alibaba.excel.annotation.write.style.ColumnWidth;
import lombok.Data;

@Data
public class ResultExcel {

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

    @ExcelProperty("分数")
    @ColumnWidth(10)
    private String score;

    @ExcelProperty("排名")
    @ColumnWidth(8)
    private String ranking;

    @ExcelProperty("奖项名称")
    @ColumnWidth(15)
    private String awardName;

    @ExcelProperty("备注")
    @ColumnWidth(20)
    private String remark;

    @ExcelProperty("是否发布")
    @ColumnWidth(10)
    private String isPublishedText;

    @ExcelProperty("发布时间")
    @ColumnWidth(20)
    private String publishTime;
}
