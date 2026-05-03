// ============================================================================
// 任務 1：實作 buildFetchStatsSql 函式 (動態組裝 DuckDB SQL - 寬表版)
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
  const combinedAggSelects = statisticMetrics.map(metric => {
    const sumExpr = numericalYs
      .map(y => `COALESCE(${metric}("${y}"), 0)`)
      .join(' + ');
    // 產出例如：COALESCE(MIN("Revenue"), 0) + COALESCE(MIN("Profit"), 0) AS "Total_MIN"
    return `${sumExpr} AS "${metric}"`; // 直接使用 Metric 名稱，方便對齊 Canvas 的 Key
  }).join(',\n    ');

  // 3. 組裝 SQL (直接產出寬表，不使用 UNPIVOT)
  const sql = `
SELECT
  ${uniqueIdExpr} AS uniqueId,
  ${combinedAggSelects}
FROM "sortedTable"
WHERE ${whereClause}
GROUP BY ${groupByCols};
`.trim();

  return sql;
}

// ============================================================================
// 任務 2：轉換為 Canvas 渲染所需的 Dictionary 格式
// ============================================================================
export interface WideTableRow {
  uniqueId: string;
  [metricKey: string]: any; // 其他包含的數值欄位，例如 MIN, MAX, SUM 等
}

export function transformToCanvasDictionary(rawData: WideTableRow[]): Record<string, string> {
  return rawData.reduce((acc, row) => {
    const { uniqueId, ...metrics } = row;
    
    // 將每個 metric 轉為 ${uniqueId}_${metricKey} 的形式
    Object.keys(metrics).forEach(metricKey => {
      acc[`${uniqueId}_${metricKey}`] = metrics[metricKey]?.toString() || "0";
    });
    
    return acc;
  }, {} as Record<string, string>);
}

// ============================================================================
// 測試與驗證區
// ============================================================================

const xAxesAndGroups = ["Region", "Category"];
const numericalYs = ["Revenue", "Profit"];
const statisticMetrics = ["MIN", "MAX", "AVG"];

console.log("========== Task 1: Generated SQL (Wide Table) ==========");
const sql = buildFetchStatsSql(xAxesAndGroups, numericalYs, statisticMetrics);
console.log(sql);
console.log("\n");

// 模擬 DuckDB 回傳的「寬表」結果
const mockWideData: WideTableRow[] = [
  { uniqueId: 'Asia-Phones', MIN: 15.5, MAX: 1600.0, AVG: 800.2 },
  { uniqueId: 'US-Phones', MIN: 22.0, MAX: 2100.0, AVG: 1050.5 },
  { uniqueId: 'Europe-Tablets', MIN: 12.0, MAX: 1800.0, AVG: 900.0 }
];

console.log("========== Task 2: Canvas Dictionary Object ==========");
const canvasDict = transformToCanvasDictionary(mockWideData);
console.log(JSON.stringify(canvasDict, null, 2));
