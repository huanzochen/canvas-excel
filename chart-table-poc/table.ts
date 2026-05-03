const canvas = document.getElementById('chart-table-canvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;

class TableLayout {
    constructor(
        private ctx: CanvasRenderingContext2D,
        private metrics: string[],
        private uniqueKeys: string[],
        private data: Record<string, Record<string, string>>,
        private layoutConfig: {
            totalWidth: number;
            firstColWidth: number;
            headerHeight: number;
            cellHeight: number;
        }
    ) {}

    // 計算文字是否過長，並加上 "..."
    private truncateText(text: string, maxWidth: number, font: string): string {
        this.ctx.save();
        this.ctx.font = font;
        let width = this.ctx.measureText(text).width;
        
        if (width <= maxWidth) {
            this.ctx.restore();
            return text;
        }
        
        const ellipsis = "...";
        const ellipsisWidth = this.ctx.measureText(ellipsis).width;
        let truncatedText = text;
        
        while (truncatedText.length > 0) {
            truncatedText = truncatedText.slice(0, -1);
            if (this.ctx.measureText(truncatedText).width + ellipsisWidth <= maxWidth) {
                this.ctx.restore();
                return truncatedText + ellipsis;
            }
        }
        
        this.ctx.restore();
        return ellipsis;
    }

    // 將資料轉為繪圖所需的 BBox 與 Text
    public generateCells(): any[] { // 使用 any 或自定義 interface 避開編譯問題
        const cells: any[] = [];
        const { totalWidth, firstColWidth, headerHeight, cellHeight } = this.layoutConfig;
        
        // 為了極端情況，如果 uniqueKeys 為空或計算出負數，保護一下
        const validKeyCount = Math.max(1, this.uniqueKeys.length);
        const cellWidth = Math.max(10, (totalWidth - firstColWidth) / validKeyCount);

        // --- 1. 左上角 Header ---
        cells.push({
            text: 'Metrics \\ Keys',
            bbox: {
                topLeft: { x: 0, y: 0 },
                bottomRight: { x: firstColWidth, y: headerHeight }
            },
            fontSize: 12,
            fontFamily: 'sans-serif',
            fontWeight: 'bold',
            backgroundColor: '#e6e6e6'
        });

        // --- 2. 繪上方 Headers (X 軸 Unique Keys) ---
        const headerFont = 'bold 12px sans-serif';
        this.uniqueKeys.forEach((key, colIndex) => {
            const x1 = firstColWidth + colIndex * cellWidth;
            const x2 = x1 + cellWidth;
            const padding = 10; // 左右預留 padding 空間

            cells.push({
                text: this.truncateText(key, Math.max(0, cellWidth - padding), headerFont),
                bbox: {
                    topLeft: { x: x1, y: 0 },
                    bottomRight: { x: x2, y: headerHeight }
                },
                fontSize: 12,
                fontFamily: 'sans-serif',
                fontWeight: 'bold',
                backgroundColor: '#f0f0f0'
            });
        });

        // --- 3. 繪製左方 Metrics 與內部資料格 ---
        const metricFont = 'bold 12px sans-serif';
        const dataFont = 'normal 12px monospace';

        this.metrics.forEach((metric, rowIndex) => {
            const y1 = headerHeight + rowIndex * cellHeight;
            const y2 = y1 + cellHeight;
            const padding = 10;

            // 左側 Metric Header
            cells.push({
                text: this.truncateText(metric, Math.max(0, firstColWidth - padding), metricFont),
                bbox: {
                    topLeft: { x: 0, y: y1 },
                    bottomRight: { x: firstColWidth, y: y2 }
                },
                fontSize: 12,
                fontFamily: 'sans-serif',
                fontWeight: 'bold',
                backgroundColor: '#fafafa'
            });

            // 內部資料格
            this.uniqueKeys.forEach((key, colIndex) => {
                const x1 = firstColWidth + colIndex * cellWidth;
                const x2 = x1 + cellWidth;
                
                // 從 Mock 的 Object 取值
                const val = this.data[key] && this.data[key][metric] ? this.data[key][metric] : '-';
                
                cells.push({
                    text: this.truncateText(val, Math.max(0, cellWidth - padding), dataFont),
                    bbox: {
                        topLeft: { x: x1, y: y1 },
                        bottomRight: { x: x2, y: y2 }
                    },
                    fontSize: 12,
                    fontFamily: 'monospace',
                    fontWeight: 'normal'
                });
            });
        });

        return cells;
    }
}

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

    const layouter = new TableLayout(
        ctx,
        metrics,
        uniqueKeys,
        sqlResultMock,
        layoutConfig
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
