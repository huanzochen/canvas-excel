"use strict";
const canvas = document.getElementById('chart-table-canvas');
const ctx = canvas.getContext('2d');
function drawTextBox({ text, bbox, fontSize, fontFamily, fontWeight, backgroundColor = '#ffffff', textColor = '#333333' }) {
    const width = bbox.bottomRight.x - bbox.topLeft.x;
    const height = bbox.bottomRight.y - bbox.topLeft.y;
    const x = bbox.topLeft.x;
    const y = bbox.topLeft.y;
    // 1. 畫背景
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(x, y, width, height);
    // 2. 畫邊框
    ctx.strokeStyle = '#cccccc';
    ctx.lineWidth = 1;
    // 加上 0.5 確保 1px 線條清晰
    ctx.strokeRect(x + 0.5, y + 0.5, width, height);
    // 3. 畫文字
    ctx.fillStyle = textColor;
    ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    // 使用 clip 避免文字超出框框
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, width, height);
    ctx.clip();
    // 將文字放在正中間
    ctx.fillText(text, x + width / 2, y + height / 2);
    ctx.restore();
}
function init() {
    // 支援高解析度螢幕 (Retina)
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    // 根據你描述的規格: 左方 Metric，上方 Unique Keys
    const metrics = ['N', 'Mean', 'Min', 'Max', 'Avg'];
    const uniqueKeys = [];
    // 模擬 27 個 Unique Keys (像是 BKM xGroup 組合)
    for (let i = 0; i < 27; i++) {
        uniqueKeys.push(`Key-${i + 1}`);
    }
    const firstColWidth = 100;
    const cellWidth = 80;
    const headerHeight = 60; // 預留較高空間給未來實作「多層 header」合併儲存格
    const cellHeight = 30;
    // 繪製左上角空白/說明格
    drawTextBox({
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
    // 繪製上方 Headers (X 軸 Unique Keys)
    uniqueKeys.forEach((key, colIndex) => {
        drawTextBox({
            text: key,
            bbox: {
                topLeft: { x: firstColWidth + colIndex * cellWidth, y: 0 },
                bottomRight: { x: firstColWidth + (colIndex + 1) * cellWidth, y: headerHeight }
            },
            fontSize: 12,
            fontFamily: 'sans-serif',
            fontWeight: 'bold',
            backgroundColor: '#f0f0f0'
        });
    });
    // 繪製左方 Metrics 與內部資料格
    metrics.forEach((metric, rowIndex) => {
        const rowY = headerHeight + rowIndex * cellHeight;
        // 畫左側 Metric Header
        drawTextBox({
            text: metric,
            bbox: {
                topLeft: { x: 0, y: rowY },
                bottomRight: { x: firstColWidth, y: rowY + cellHeight }
            },
            fontSize: 12,
            fontFamily: 'sans-serif',
            fontWeight: 'bold',
            backgroundColor: '#fafafa'
        });
        // 畫資料格
        uniqueKeys.forEach((_, colIndex) => {
            const colX = firstColWidth + colIndex * cellWidth;
            // 隨機產生一些數值來 mock
            const mockValue = (Math.random() * 100).toFixed(2);
            drawTextBox({
                text: mockValue,
                bbox: {
                    topLeft: { x: colX, y: rowY },
                    bottomRight: { x: colX + cellWidth, y: rowY + cellHeight }
                },
                fontSize: 12,
                fontFamily: 'monospace',
                fontWeight: 'normal'
            });
        });
    });
}
// 確保 DOM 載入後執行
window.onload = init;
