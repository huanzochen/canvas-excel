"use strict";
class TableLayout {
    ctx;
    metrics;
    uniqueKeys;
    data;
    layoutConfig;
    styleConfig;
    rowMap;
    constructor(ctx, metrics, uniqueKeys, data, layoutConfig, styleConfig) {
        this.ctx = ctx;
        this.metrics = metrics;
        this.uniqueKeys = uniqueKeys;
        this.data = data;
        this.layoutConfig = layoutConfig;
        this.styleConfig = styleConfig;
        this.rowMap = new Map();
        for (const row of this.data) {
            this.rowMap.set(String(row.uniqueId), row);
        }
    }
    getFontString(config) {
        return `${config.fontWeight} ${config.fontSize}px ${config.fontFamily}`;
    }
    // 計算文字是否過長，並加上 "..."
    truncateText(text, maxWidth, font) {
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
    generateCells() {
        const cells = [];
        const { totalWidth, firstColWidth, headerHeight, cellHeight } = this.layoutConfig;
        const styles = this.styleConfig;
        // 為了極端情況，如果 uniqueKeys 為空或計算出負數，保護一下
        const validKeyCount = Math.max(1, this.uniqueKeys.length);
        const cellWidth = Math.max(10, (totalWidth - firstColWidth) / validKeyCount);
        const padding = 10; // 左右預留 padding 空間
        // --- 1. 左上角 Header ---
        cells.push({
            text: 'Metrics \\ Keys',
            bbox: {
                topLeft: { x: 0, y: 0 },
                bottomRight: { x: firstColWidth, y: headerHeight }
            },
            fontSize: styles.cornerHeader.fontSize,
            fontFamily: styles.cornerHeader.fontFamily,
            fontWeight: styles.cornerHeader.fontWeight,
            backgroundColor: styles.cornerHeader.backgroundColor || '#e6e6e6',
            textColor: styles.cornerHeader.textColor || '#333333'
        });
        // --- 2. 繪上方 Headers (X 軸 Unique Keys) ---
        const columnHeaderFont = this.getFontString(styles.columnHeader);
        this.uniqueKeys.forEach((key, colIndex) => {
            const x1 = firstColWidth + colIndex * cellWidth;
            const x2 = x1 + cellWidth;
            cells.push({
                text: this.truncateText(key, Math.max(0, cellWidth - padding), columnHeaderFont),
                bbox: {
                    topLeft: { x: x1, y: 0 },
                    bottomRight: { x: x2, y: headerHeight }
                },
                fontSize: styles.columnHeader.fontSize,
                fontFamily: styles.columnHeader.fontFamily,
                fontWeight: styles.columnHeader.fontWeight,
                backgroundColor: styles.columnHeader.backgroundColor || '#f0f0f0',
                textColor: styles.columnHeader.textColor || '#333333'
            });
        });
        // --- 3. 繪製左方 Metrics 與內部資料格 ---
        const rowHeaderFont = this.getFontString(styles.rowHeader);
        const dataCellFont = this.getFontString(styles.dataCell);
        this.metrics.forEach((metric, rowIndex) => {
            const y1 = headerHeight + rowIndex * cellHeight;
            const y2 = y1 + cellHeight;
            // 左側 Metric Header
            cells.push({
                text: this.truncateText(metric, Math.max(0, firstColWidth - padding), rowHeaderFont),
                bbox: {
                    topLeft: { x: 0, y: y1 },
                    bottomRight: { x: firstColWidth, y: y2 }
                },
                fontSize: styles.rowHeader.fontSize,
                fontFamily: styles.rowHeader.fontFamily,
                fontWeight: styles.rowHeader.fontWeight,
                backgroundColor: styles.rowHeader.backgroundColor || '#fafafa',
                textColor: styles.rowHeader.textColor || '#333333'
            });
            // 內部資料格
            this.uniqueKeys.forEach((key, colIndex) => {
                const x1 = firstColWidth + colIndex * cellWidth;
                const x2 = x1 + cellWidth;
                // 從建立好的 rowMap 取值
                const row = this.rowMap.get(key);
                const rawVal = row && row[metric] !== undefined ? row[metric] : '-';
                const val = String(rawVal);
                cells.push({
                    text: this.truncateText(val, Math.max(0, cellWidth - padding), dataCellFont),
                    bbox: {
                        topLeft: { x: x1, y: y1 },
                        bottomRight: { x: x2, y: y2 }
                    },
                    fontSize: styles.dataCell.fontSize,
                    fontFamily: styles.dataCell.fontFamily,
                    fontWeight: styles.dataCell.fontWeight,
                    backgroundColor: styles.dataCell.backgroundColor || '#ffffff',
                    textColor: styles.dataCell.textColor || '#333333'
                });
            });
        });
        return cells;
    }
}
