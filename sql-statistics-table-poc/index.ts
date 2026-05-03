// 定義從 DuckDB 拿回來的長表資料結構
export interface LongTableRow {
  uniqueId: string;
  metric_key: string;   // e.g., 'Total_MIN', 'Total_MAX'
  metric_value: number;
  [key: string]: any;   // 其他可能保留的維度欄位
}

// ============================================================================
// 任務 1：實作 buildFetchStatsSql 函式 (動態組裝 DuckDB SQL)
// ============================================================================
export function buildFetchStatsSql(
  xAxesAndGroups: string[],
  numericalYs: string[],
  statisticMetrics: string[],
  whereClause: string = '1=1'
): string {
  // 1. 生成 uniqueId (使用 DuckDB 的 concat_ws)
  const uniqueIdExpr = `concat_ws('-', ${xAxesAndGroups.map(col => `"${col}"`).join(', ')})`;
  
  // GROUP BY 欄位
  const groupByCols = xAxesAndGroups.map(col => `"${col}"`).join(', ');

  // 2. 多個 Y 欄位合併計算
  // 例如：COALESCE(MIN("Revenue"), 0) + COALESCE(MIN("Profit"), 0) AS "Total_MIN"
  const combinedAggSelects = statisticMetrics.map(metric => {
    const sumExpr = numericalYs
      .map(y => `COALESCE(${metric}("${y}"), 0)`)
      .join(' + ');
    return `${sumExpr} AS "Total_${metric}"`;
  }).join(',\n    ');

  // 3. 組裝 SQL，並使用 UNPIVOT 轉成長表
  const sql = `
WITH base_stats AS (
  SELECT
    ${uniqueIdExpr} AS uniqueId,
    ${groupByCols},
    ${combinedAggSelects}
  FROM "sortedTable"
  WHERE ${whereClause}
  GROUP BY ${groupByCols}
)
-- 轉成長表給前端畫圖
UNPIVOT base_stats
ON COLUMNS(* EXCLUDE (uniqueId, ${groupByCols}))
INTO
  NAME metric_key
  VALUE metric_value;
`.trim();

  return sql;
}

// ============================================================================
// 任務 2：實作 transformToChartConfig 函式 (長表轉圖表結構)
// ============================================================================
export interface ChartConfig {
  xAxis: string[];
  series: {
    name: string;
    data: (number | null)[];
  }[];
}

export function transformToChartConfig(rawData: LongTableRow[]): ChartConfig {
  // 1. 萃取 X 軸：從 rawData 中取出所有不重複的 uniqueId
  const xAxis = Array.from(new Set(rawData.map(row => row.uniqueId)));

  // 2. 動態對齊 Series 資料
  const seriesMap: Record<string, (number | null)[]> = {};

  rawData.forEach(row => {
    // 如果這個指標還沒建立過，初始化一個長度等於 xAxis 的陣列，預設為 null
    if (!seriesMap[row.metric_key]) {
      seriesMap[row.metric_key] = new Array(xAxis.length).fill(null);
    }

    // 找到此 uniqueId 在 xAxis 中的位置
    const xIndex = xAxis.indexOf(row.uniqueId);

    if (xIndex !== -1) {
      // 塞入數值
      seriesMap[row.metric_key][xIndex] = row.metric_value;
    }
  });

  // 將 Map 轉為 series 陣列
  const series = Object.keys(seriesMap).map(key => ({
    name: key,
    data: seriesMap[key]
  }));

  return {
    xAxis,
    series
  };
}

// ============================================================================
// 測試與驗證區
// ============================================================================

// 測試 Task 1
const xAxesAndGroups = ["Region", "Category"];
const numericalYs = ["Revenue", "Profit"];
const statisticMetrics = ["COUNT", "MIN", "MAX", "STDDEV"];

console.log("========== Task 1: Generated SQL ==========");
const sql = buildFetchStatsSql(xAxesAndGroups, numericalYs, statisticMetrics);
console.log(sql);
console.log("\n");

// 測試 Task 2 (使用 mock data)
const mockData: LongTableRow[] = [
  { uniqueId: 'Asia-Phones', metric_key: 'Total_MIN', metric_value: 15.5 },
  { uniqueId: 'US-Phones', metric_key: 'Total_MIN', metric_value: 22.0 },
  { uniqueId: 'Asia-Phones', metric_key: 'Total_MAX', metric_value: 1600.0 },
  { uniqueId: 'US-Phones', metric_key: 'Total_MAX', metric_value: 2100.0 },
  { uniqueId: 'Europe-Tablets', metric_key: 'Total_MAX', metric_value: 1800.0 }
];

console.log("========== Task 2: Chart Config ==========");
const chartConfig = transformToChartConfig(mockData);
console.log(JSON.stringify(chartConfig, null, 2));
