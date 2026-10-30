# 第三方授權說明

本專案的原始碼採用 MIT License（見 [LICENSE](LICENSE)）。以下第三方元件保留各自的授權條款。

## 執行時期套件（會包含在建置後的網站中）

| 套件 | 版本 | 授權 | 來源 |
| --- | --- | --- | --- |
| react | 19.3.1 | MIT | https://github.com/facebook/react |
| react-dom | 19.3.1 | MIT | https://github.com/facebook/react |
| scheduler | 0.28.0 | MIT | https://github.com/facebook/react |
| @tonejs/midi | 2.0.28 | MIT | https://github.com/Tonejs/Midi |
| midi-file | 1.2.4 | MIT | https://github.com/carter-thaxton/midi-file |
| array-flatten | 3.0.0 | MIT | https://github.com/blakeembrey/array-flatten |

各套件的完整授權全文位於安裝後的 `node_modules/<套件名稱>/LICENSE`。

## 開發工具（只在開發與建置時使用，不會包含在網站中）

Vite、@vitejs/plugin-react、TypeScript、oxlint 與 @types/* 套件，授權請見各自的 `package.json` 與授權檔。

## 字型

- **JetBrains Mono**：以 SIL Open Font License 1.1 授權，網頁執行時從 Google Fonts 載入，本儲存庫沒有收錄字型檔。https://github.com/JetBrains/JetBrainsMono

## 素材

- 示範曲由 `src/engine/demoSong.ts` 在執行時產生。
- `test-assets/` 裡的 WAV、MIDI、損壞 MP3 與設定 JSON 都由本專案以程式產生，跟原始碼一樣以 MIT License 釋出。
- `docs/screenshots/` 是本專案介面的實際截圖。
- `public/favicon.svg` 為本專案原創圖示。
