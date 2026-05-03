# SQL Statistics Table POC

這個資料夾包含了兩種不同圖表/表格資料結構的 DuckDB SQL 生成與資料轉換概念驗證 (POC)。

## 檔案說明

1. `horizontal(amchart).ts`: 寬表結構，通常適用於 amCharts 或一般表格渲染。它將各項統計指標轉為欄位。
2. `vertical(chartJs).ts`: 長表結構，通常適用於 Chart.js。它透過 `UNPIVOT` 將統計指標轉為 `metric_key` 與 `metric_value`。

## 執行與測試指令

我們可以使用 `ts-node` 或 `tsx` 來直接執行這兩個 TypeScript 檔案，觀察 `console.log` 輸出的 SQL 以及轉換後的結構。

### 方法 1: 使用 `npx tsx` (推薦，速度快且支援較新語法)

```bash
# 測試寬表結構 (amCharts)
npx tsx "horizontal(amchart).ts"

# 測試長表結構 (Chart.js)
npx tsx "vertical(chartJs).ts"
```

### 方法 2: 使用 `npx ts-node`

```bash
# 測試寬表結構 (amCharts)
npx ts-node "horizontal(amchart).ts"

# 測試長表結構 (Chart.js)
npx ts-node "vertical(chartJs).ts"
```

## 預期輸出結果

執行後，你會在終端機看到兩個主要部分：
1. **Task 1: Generated SQL** - 根據設定動態生成的 DuckDB SQL 語法。
2. **Task 2: Canvas Dictionary / Chart Config** - 將模擬的資料結果轉換為前端圖表或 Canvas 表格所需的資料結構。
