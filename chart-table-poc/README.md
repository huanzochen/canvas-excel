# Chart Table PoC

這是一個使用 HTML5 Canvas 實作的資料表格 (Data Grid) 概念驗證 (Proof of Concept)。

## 開發與修改說明

這個資料夾內包含三個檔案：
- `index.html`: 負責網頁結構與載入 JavaScript
- `table.ts`: TypeScript 原始碼，負責 Canvas 繪圖核心邏輯 (包含 `drawTextBox` 等)
- `table.js`: 編譯後的 JavaScript 檔案，會由 `index.html` 直接載入

---

### 如果你修改了 `table.ts`，要怎麼讓修改生效？

由於瀏覽器無法直接讀懂 `.ts` 檔案，當你更新了 `table.ts` 裡面的程式碼後，必須先把它「編譯」成 `.js` 檔案。

請跟著以下**最簡單的步驟**：

1. 打開你的 Terminal (終端機)。如果你是用 VS Code，可以按下快捷鍵 `Ctrl + \``，或是從上方選單選擇 `Terminal` -> `New Terminal`。
2. 確認你的終端機路徑是在專案的「根目錄」(也就是 `canvas-excel` 資料夾)。
3. 複製並貼上以下指令，然後按下 Enter 鍵：

```bash
npx -y -p typescript tsc chart-table-poc/table.ts
```

4. 如果指令跑完且沒有出現任何紅色的錯誤訊息，就代表編譯成功了！你的 `table.js` 已經被更新。
5. 回到瀏覽器，**重新整理** (Refresh) 網頁，就能看到你最新修改的結果。

---

### 💡 進階技巧：開啟「自動編譯」模式 (Watch Mode)

如果你覺得每次修改完都要手動輸入指令很麻煩，你可以改用這個「監視」指令：

```bash
npx -y -p typescript tsc --watch chart-table-poc/table.ts
```

這個指令跑下去之後，終端機就不會結束。接下來**只要你在 VS Code 裡面修改 `table.ts` 並「存檔」**，它就會立刻在背後幫你自動編譯成 `table.js`！你只需要切到瀏覽器重新整理就能看見結果。
(要離開這個模式，只要在終端機按下 `Ctrl + C` 即可)
