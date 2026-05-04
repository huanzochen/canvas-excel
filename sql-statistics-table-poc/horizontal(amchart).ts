enum StatisticMetrics {
  Mean = "Mean",
  Median = "Median",
  Range = "Range",
  Max = "Max",
  Min = "Min",
  Q1Q3 = "Q1Q3",
  StdDev = "StdDev",
  Count = "Count",
  Sum = "Sum",
  Percentile = "Percentile"
}


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

  // 2. 根據 Metric 產生對應的 SELECT 語句
  // 這裡回傳陣列，因為一個 Metric 可能會展開成多個欄位 (例如 Q1&Q3)
  const combinedAggSelects = statisticMetrics.flatMap(metric => {
    if (metric === StatisticMetrics.Q1Q3) {
      // 1對多：展開成 Q1 與 Q3 兩個顯示欄位
      const q1Expr = numericalYs
        .map(y => `COALESCE(quantile_cont("${y}", 0.25), 0)`)
        .join(' + ');
      const q3Expr = numericalYs
        .map(y => `COALESCE(quantile_cont("${y}", 0.75), 0)`)
        .join(' + ');
      return [
        `${q1Expr} AS "Q1"`,
        `${q3Expr} AS "Q3"`
      ];
    }

    if (metric === StatisticMetrics.Range) {
      // 特別運算：MAX - MIN
      const sumExpr = numericalYs
        .map(y => `COALESCE(MAX("${y}") - MIN("${y}"), 0)`)
        .join(' + ');
      return [`${sumExpr} AS "${metric}"`];
    }

    if (metric === StatisticMetrics.Count) {
      // 如果有多個 Y，通常 Count 是把每個欄位的 Count 加總，或是算總筆數
      // 這裡以範例的 COUNT(1) 來說，如果是加總 Y：
      const sumExpr = numericalYs
        .map(y => `COALESCE(COUNT("${y}"), 0)`)
        .join(' + ');
      return [`${sumExpr} AS "${metric}"`];
    }

    if (metric === StatisticMetrics.Sum) {
      const sumExpr = numericalYs
        .map(y => `COALESCE(SUM("${y}"), 0)`)
        .join(' + ');
      return [`${sumExpr} AS "${metric}"`];
    }

    // 預設 1:1 轉換，例如 Mean, Min, Max 等
    const metricToSqlFunc: Record<string, string> = {
      [StatisticMetrics.Mean]: 'AVG',
      [StatisticMetrics.Max]: 'MAX',
      [StatisticMetrics.Min]: 'MIN',
      [StatisticMetrics.Median]: 'MEDIAN',
    };
    
    const sqlFunc = metricToSqlFunc[metric] || metric.toUpperCase();
    const sumExpr = numericalYs
      .map(y => `COALESCE(${sqlFunc}("${y}"), 0)`)
      .join(' + ');
    
    return [`${sumExpr} AS "${metric}"`];
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

// No Need
// console.log("========== Task 2: Canvas Dictionary Object ==========");
// const canvasDict = transformToCanvasDictionary(mockWideData);
// console.log(JSON.stringify(canvasDict, null, 2));
