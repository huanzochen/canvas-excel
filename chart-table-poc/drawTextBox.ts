type BBox = { topLeft: { x: number; y: number }, bottomRight: { x: number; y: number } };

interface TextBoxParams {
    text: string;
    bbox: BBox;
    fontSize: number;
    fontFamily: string;
    fontWeight: number | string;
    backgroundColor?: string;
    textColor?: string;
}

function drawTextBox(
    ctx: CanvasRenderingContext2D,
    {
        text,
        bbox,
        fontSize,
        fontFamily,
        fontWeight,
        backgroundColor = '#ffffff',
        textColor = '#333333'
    }: TextBoxParams
) {
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