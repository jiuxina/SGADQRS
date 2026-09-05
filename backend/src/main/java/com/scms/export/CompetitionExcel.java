package com.scms.export;

import com.alibaba.excel.annotation.ExcelProperty;
import com.alibaba.excel.annotation.write.style.ColumnWidth;
import lombok.Data;

@Data
public class CompetitionExcel {

    @ExcelProperty("ID")
    @ColumnWidth(8)
    private Long id;

    @ExcelProperty("竞赛名称")
    @ColumnWidth(30)
    private String competitionName;

    @ExcelProperty("主办方")
    @ColumnWidth(20)
    private String organizer;

    @ExcelProperty("发布者")
    @ColumnWidth(12)
    private String publisherName;

    @ExcelProperty("报名开始时间")
    @ColumnWidth(20)
    private String registrationStart;

    @ExcelProperty("报名结束时间")
    @ColumnWidth(20)
    private String registrationEnd;

    @ExcelProperty("比赛开始时间")
    @ColumnWidth(20)
    private String competitionStart;

    @ExcelProperty("比赛结束时间")
    @ColumnWidth(20)
    private String competitionEnd;

    @ExcelProperty("地点")
    @ColumnWidth(15)
    private String location;

    @ExcelProperty("每队人数")
    @ColumnWidth(10)
    private Integer maxMembers;

    @ExcelProperty("报名人数")
    @ColumnWidth(10)
    private Integer registrationCount;

    @ExcelProperty("状态")
    @ColumnWidth(10)
    private String statusText;
}
