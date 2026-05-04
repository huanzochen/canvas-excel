interface FontConfig {
  fontSize: number;
  fontFamily: string;
  fontWeight: string | number;
}

interface TableStyleConfig {
  cornerHeader: FontConfig & { backgroundColor?: string; textColor?: string };
  columnHeader: FontConfig & { backgroundColor?: string; textColor?: string };
  rowHeader: FontConfig & { backgroundColor?: string; textColor?: string };
  dataCell: FontConfig & { backgroundColor?: string; textColor?: string };
}

class TableLayout {
  private rowMap: Map<string, Record<string, string | number>>;
  private ctx: CanvasRenderingContext2D;
  private metrics: string[];
  private uniqueKeys: string[];
  private data: Array<Record<string, string | number>>;
  private layoutConfig: {
    bbox: { topLeft: { x: number; y: number }; bottomRight: { x: number; y: number } };
    firstColWidth: number;
    headerHeight: number;
    cellHeight: number;
  };
  private styleConfig: TableStyleConfig;

  constructor({
    ctx,
    metrics,
    uniqueKeys,
    data,
    layoutConfig,
    styleConfig,
  }: {
    ctx: CanvasRenderingContext2D;
    metrics: string[];
    uniqueKeys: string[];
    data: Array<Record<string, string | number>>;
    layoutConfig: {
      bbox: { topLeft: { x: number; y: number }; bottomRight: { x: number; y: number } };
      firstColWidth: number;
      headerHeight: number;
      cellHeight: number;
    };
    styleConfig: TableStyleConfig;
  }) {
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

  private getFontString(config: FontConfig): string {
    return `${config.fontWeight} ${config.fontSize}px ${config.fontFamily}`;
  }

  // 計算文字是否過長，並加上 "..."
  private truncateText(text: string, maxWidth: number, font: string): string {
    this.ctx.save();
    this.ctx.font = font;
    let width = this.ctx.measureText(text).width;

    if (width <= maxWidth) {
      this.ctx.restore();
      return text;
    }

    const ellipsis = '...';
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
  public generateCells(): TextBoxParams[] {
    const cells: TextBoxParams[] = [];
    const { bbox, firstColWidth, headerHeight, cellHeight } = this.layoutConfig;
    const styles = this.styleConfig;

    const startX = bbox.topLeft.x;
    const startY = bbox.topLeft.y;
    const totalWidth = bbox.bottomRight.x - bbox.topLeft.x;
    const totalHeight = bbox.bottomRight.y - bbox.topLeft.y;

    // 為了極端情況，如果 uniqueKeys 為空或計算出負數，保護一下
    const validKeyCount = Math.max(1, this.uniqueKeys.length);
    const cellWidth = Math.max(10, (totalWidth - firstColWidth) / validKeyCount);

    const padding = 10; // 左右預留 padding 空間

    // --- 1. 左上角 Header ---
    cells.push({
      text: 'Metrics \\ Keys',
      bbox: {
        topLeft: { x: startX, y: startY },
        bottomRight: { x: startX + firstColWidth, y: startY + headerHeight },
      },
      fontSize: styles.cornerHeader.fontSize,
      fontFamily: styles.cornerHeader.fontFamily,
      fontWeight: styles.cornerHeader.fontWeight,
      backgroundColor: styles.cornerHeader.backgroundColor || '#e6e6e6',
      textColor: styles.cornerHeader.textColor || '#333333',
    });

    // --- 2. 繪上方 Headers (X 軸 Unique Keys) ---
    const columnHeaderFont = this.getFontString(styles.columnHeader);
    this.uniqueKeys.forEach((key, colIndex) => {
      const leftX = startX + firstColWidth + colIndex * cellWidth;
      const rightX = leftX + cellWidth;

      cells.push({
        text: this.truncateText(key, Math.max(0, cellWidth - padding), columnHeaderFont),
        bbox: {
          topLeft: { x: leftX, y: startY },
          bottomRight: { x: rightX, y: startY + headerHeight },
        },
        fontSize: styles.columnHeader.fontSize,
        fontFamily: styles.columnHeader.fontFamily,
        fontWeight: styles.columnHeader.fontWeight,
        backgroundColor: styles.columnHeader.backgroundColor || '#f0f0f0',
        textColor: styles.columnHeader.textColor || '#333333',
      });
    });

    // --- 3. 繪製左方 Metrics 與內部資料格 ---
    const rowHeaderFont = this.getFontString(styles.rowHeader);
    const dataCellFont = this.getFontString(styles.dataCell);

    const availableHeight = totalHeight - headerHeight;
    const maxPossibleRows = Math.floor(availableHeight / cellHeight);

    let displayMetrics = this.metrics;
    let isTruncated = false;

    // 如果列數超過可容納的數量，保留最後一列顯示 "..."
    if (this.metrics.length > maxPossibleRows) {
      isTruncated = true;
      // 如果連一列都放不下，就只留 0，至少不要當掉；通常 maxPossibleRows 至少大於 1
      const visibleRowCount = Math.max(0, maxPossibleRows - 1);
      displayMetrics = this.metrics.slice(0, visibleRowCount);
    }

    displayMetrics.forEach((metric, rowIndex) => {
      const topY = startY + headerHeight + rowIndex * cellHeight;
      const bottomY = topY + cellHeight;

      // 左側 Metric Header
      cells.push({
        text: this.truncateText(metric, Math.max(0, firstColWidth - padding), rowHeaderFont),
        bbox: {
          topLeft: { x: startX, y: topY },
          bottomRight: { x: startX + firstColWidth, y: bottomY },
        },
        fontSize: styles.rowHeader.fontSize,
        fontFamily: styles.rowHeader.fontFamily,
        fontWeight: styles.rowHeader.fontWeight,
        backgroundColor: styles.rowHeader.backgroundColor || '#fafafa',
        textColor: styles.rowHeader.textColor || '#333333',
      });

      // 內部資料格
      this.uniqueKeys.forEach((key, colIndex) => {
        const leftX = startX + firstColWidth + colIndex * cellWidth;
        const rightX = leftX + cellWidth;

        // 從建立好的 rowMap 取值
        const row = this.rowMap.get(key);
        const rawVal = row && row[metric] !== undefined ? row[metric] : '-';
        const val = String(rawVal);

        cells.push({
          text: this.truncateText(val, Math.max(0, cellWidth - padding), dataCellFont),
          bbox: {
            topLeft: { x: leftX, y: topY },
            bottomRight: { x: rightX, y: bottomY },
          },
          fontSize: styles.dataCell.fontSize,
          fontFamily: styles.dataCell.fontFamily,
          fontWeight: styles.dataCell.fontWeight,
          backgroundColor: styles.dataCell.backgroundColor || '#ffffff',
          textColor: styles.dataCell.textColor || '#333333',
        });
      });
    });

    // 繪製最後一列的截斷提示 "⋮" (vertical ellipsis)
    if (isTruncated && maxPossibleRows > 0) {
      const topY = startY + headerHeight + displayMetrics.length * cellHeight;
      const bottomY = topY + cellHeight;

      cells.push({
        text: '⋮',
        bbox: {
          topLeft: { x: startX, y: topY },
          bottomRight: { x: startX + totalWidth, y: bottomY },
        },
        fontSize: styles.rowHeader.fontSize, // 沿用 rowHeader 字體大小
        fontFamily: styles.rowHeader.fontFamily,
        fontWeight: 'bold',
        backgroundColor: '#ffffff', // 或自訂背景色
        textColor: '#999999', // 用灰色表示省略
      });
    }

    return cells;
  }
}
