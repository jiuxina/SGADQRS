package com.scms.export;

import com.alibaba.excel.annotation.ExcelProperty;
import com.alibaba.excel.annotation.write.style.ColumnWidth;
import lombok.Data;

@Data
public class TeamExcel {

    @ExcelProperty("ID")
    @ColumnWidth(8)
    private Long id;

    @ExcelProperty("团队名称")
    @ColumnWidth(20)
    private String teamName;

    @ExcelProperty("团队口号")
    @ColumnWidth(25)
    private String teamSlogan;

    @ExcelProperty("竞赛名称")
    @ColumnWidth(30)
    private String competitionName;

    @ExcelProperty("队长")
    @ColumnWidth(12)
    private String leaderName;

    @ExcelProperty("成员数")
    @ColumnWidth(10)
    private Integer memberCount;

    @ExcelProperty("状态")
    @ColumnWidth(10)
    private String statusText;

    @ExcelProperty("创建时间")
    @ColumnWidth(20)
    private String createTime;
}
