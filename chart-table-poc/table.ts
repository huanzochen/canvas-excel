enum StatisticsMetrics {
  Mean = 'Mean',
  Median = 'Median',
  Range = 'Range',
  Max = 'Max',
  Min = 'Min',
  Q1Q3 = 'Q1Q3',
  StdDev = 'StdDev',
  Count = 'Count',
  Sum = 'Sum',
  Percentile = 'Percentile',
}

// 為了 POC 方便，這裡先複製一份 RenderKeys 的定義。
// 在實際專案中，會將 StatisticsMetrics 與 RenderKeys 拆分到獨立的 types.ts 供前後端共用
enum RenderKeys {
  Q1 = 'Q1',
  Q3 = 'Q3',
  p99 = 'p99',
  p95 = 'p95',
}

const canvas = document.getElementById('chart-table-canvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;

function init() {
  // 支援高解析度螢幕 (Retina)
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();

  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);

  // 定義 user 選的規格
  const userSelectedMetrics = [
    StatisticsMetrics.Count,
    StatisticsMetrics.Mean,
    StatisticsMetrics.Q1Q3,
    StatisticsMetrics.Min,
    StatisticsMetrics.Max,
  ];

  // 攤平: 將需要展開的 metrics (如 Q1Q3) 轉換成實際在表格與 SQL 中對應的 keys
  // 使用 string 陣列以相容 RenderKeys 與 StatisticsMetrics
  const metrics: string[] = userSelectedMetrics.flatMap((metric) => {
    if (metric === StatisticsMetrics.Q1Q3) {
      return [RenderKeys.Q1, RenderKeys.Q3];
    }
    if (metric === StatisticsMetrics.Percentile) {
      return [RenderKeys.p95, RenderKeys.p99];
    }
    return [metric as string];
  });

  const uniqueKeys: string[] = [];
  for (let i = 0; i < 6; i++) {
    uniqueKeys.push(`Key-${i + 1}`);
  }

  // 1. 模擬 Call SQL 拿到的寬表陣列 (Wide Table)
  const mockWideData: Array<Record<string, string | number>> = [];
  uniqueKeys.forEach((key) => {
    const rowData: Record<string, string | number> = { uniqueId: key };
    metrics.forEach((metric) => {
      // 隨機產生一個很長的小數點數值來測試 truncate (e.g. "200.235123123")
      rowData[metric] = (Math.random() * 1000).toString();
    });
    mockWideData.push(rowData);
  });

  // 2. 初始化 TableLayout 進行排版與截斷運算
  // 假設外部算好的 bbox
  // 這裡我們故意設定一個比較小的 bottom Y 來測試行數截斷功能
  const bbox = { topLeft: { x: 100, y: 50 }, bottomRight: { x: 800, y: 350 } };

  const layoutConfig = {
    bbox: bbox,
    firstColWidth: 100,
    headerHeight: 60,
    cellHeight: 50,
    showRowHeader: true, // 可以透過設定為 false 來隱藏左側的 Row Header
  };

  // 由外部決定字體樣式配置
  const styleConfig = {
    cornerHeader: {
      fontSize: 12,
      fontFamily: 'sans-serif',
      fontWeight: 'bold',
      backgroundColor: '#e6e6e6',
    },
    columnHeader: {
      fontSize: 12,
      fontFamily: 'sans-serif',
      fontWeight: 'bold',
      backgroundColor: '#f0f0f0',
    },
    rowHeader: {
      fontSize: 12,
      fontFamily: 'sans-serif',
      fontWeight: 'bold',
      backgroundColor: '#fafafa',
    },
    dataCell: {
      fontSize: 12,
      fontFamily: 'monospace',
      fontWeight: 'normal',
      backgroundColor: '#ffffff',
    },
  };

  const layouter = new TableLayout({
    ctx,
    metrics,
    uniqueKeys,
    data: mockWideData,
    layoutConfig,
    styleConfig,
  });

  // 3. 取得計算過後的 cells 陣列
  const cellsToDraw = layouter.generateCells();
  // 4. 將所有算好的格子畫到 Canvas 上
  cellsToDraw.forEach((cell) => {
    drawTextBox(ctx, cell);
  });
}

// 確保 DOM 載入後執行
window.onload = init;
