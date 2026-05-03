const canvas = document.getElementById('chart-table-canvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;

function init() {
    // 支援高解析度螢幕 (Retina)
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    // 定義規格
    const metrics = ['N', 'Mean', 'Min', 'Max', 'Avg'];
    const uniqueKeys: string[] = [];
    for (let i = 0; i < 27; i++) {
        uniqueKeys.push(`Key-${i+1}`);
    }

    // 1. 模擬 Call SQL 拿到的超大 Object
    const sqlResultMock: Record<string, Record<string, string>> = {};
    uniqueKeys.forEach((key) => {
        sqlResultMock[key] = {};
        metrics.forEach((metric) => {
            // 隨機產生一個很長的小數點數值來測試 truncate (e.g. "200.235123123")
            const mockValue = (Math.random() * 1000).toString();
            sqlResultMock[key][metric] = mockValue;
        });
    });

    // 2. 初始化 TableLayout 進行排版與截斷運算
    const layoutConfig = {
        totalWidth: rect.width,
        firstColWidth: 100,
        headerHeight: 60,
        cellHeight: 30
    };

    // 由外部決定字體樣式配置
    const styleConfig = {
        cornerHeader: {
            fontSize: 12,
            fontFamily: 'sans-serif',
            fontWeight: 'bold',
            backgroundColor: '#e6e6e6'
        },
        columnHeader: {
            fontSize: 12,
            fontFamily: 'sans-serif',
            fontWeight: 'bold',
            backgroundColor: '#f0f0f0'
        },
        rowHeader: {
            fontSize: 12,
            fontFamily: 'sans-serif',
            fontWeight: 'bold',
            backgroundColor: '#fafafa'
        },
        dataCell: {
            fontSize: 12,
            fontFamily: 'monospace',
            fontWeight: 'normal',
            backgroundColor: '#ffffff'
        }
    };

    const layouter = new TableLayout(
        ctx,
        metrics,
        uniqueKeys,
        sqlResultMock,
        layoutConfig,
        styleConfig
    );

    // 3. 取得計算過後的 cells 陣列
    const cellsToDraw = layouter.generateCells();

    // 4. 將所有算好的格子畫到 Canvas 上
    cellsToDraw.forEach(cell => {
        drawTextBox(ctx, cell);
    });
}

// 確保 DOM 載入後執行
window.onload = init;
