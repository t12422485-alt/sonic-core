# 參與貢獻

謝謝你願意幫忙改進音軌核心｜SONIC CORE！

## 回報問題

請到 [Issues](https://github.com/t12422485-alt/sonic-core/issues/new/choose) 選擇範本：

- **錯誤回報**：請寫下重現步驟、預期結果、實際結果，以及瀏覽器與作業系統版本。可以的話附上截圖與瀏覽器主控台（F12）的錯誤訊息。
- **功能建議**：說明想解決的問題與希望的使用方式。

請不要上傳有版權疑慮的音樂檔。需要範例時，請使用 `test-assets/` 裡的測試檔，或自行產生的音訊。

## 修改程式

1. Fork 本儲存庫並建立分支，例如 `fix/seek-on-mobile`。
2. 安裝與啟動：
   ```bash
   npm ci
   npm run dev
   ```
3. 送出前請執行並確認沒有錯誤：
   ```bash
   npm run check
   npm run build
   ```
4. 發送 Pull Request，說明改了什麼、為什麼改，以及你怎麼測試（例如在哪些瀏覽器、桌機或手機上測過）。

## 程式風格

- TypeScript + React，繪圖使用 Canvas 2D。動畫在 `src/engine/ticker.ts` 的共用迴圈中執行，每幀直接讀取設定，不要在每幀觸發 React 重新渲染。
- 音訊處理放在 `src/engine/`，外觀設定放在 `src/settings/`，繪圖放在 `src/viz/`，介面元件放在 `src/ui/`。
- 介面文字使用繁體中文，音樂專有名詞可以保留英文。
- 新增設定欄位時，請一併更新 `src/settings/schema.ts` 的預設值、範圍與 `validateSettings`，確保 JSON 匯入能驗證。
- 不要把隨機或示範資料標示成真實分析結果；示範內容請在畫面上清楚標示。

## 授權

提交的程式碼將以本專案的 [MIT License](LICENSE) 釋出。
