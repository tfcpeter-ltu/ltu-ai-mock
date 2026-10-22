# LTU EPT AI Mock

正式網址：https://ltuaimock.uwetw.com

目前架構：
- GitHub Pages：公開前端
- Convex Production：學生帳號與雲端資料
- Convex Auth：Email / Password
- `legacy.html`：原 v9 EPT 學習功能頁
- `index.html`：正式登入、會員狀態、雲端 Dashboard 與跨裝置同步入口

會員方案：NT$5,000 / 30 天。

Convex Production 後端包含：profiles、cloudState、mockAttempts、answers、weaknesses、vocabulary、writingRecords、speakingRecords、assignments。

2026-10-22 更新：寫作預設免費本機檢查，可選 WebLLM 本機 GPU 評閱草稿（未校準模型分數不列入成績）；不啟用付費 AI API。口說保存文字回答，人工／AI 評論稍後提供。詳見 `writing-method.html` 與 `RELEASE-20261022.md`。

作答與登入入口統一使用 `ltuEPT:<studentCode>`；`saveCloudState` 需要 `expectedUpdatedAt`，遇到其他裝置更新時返回衝突，前端保留本機資料並讓使用者選擇版本。變更時儲存，無變更不重送。Convex 部署為 `dashing-quail-760`；所屬帳號、區域與方案須在管理後台另行核實。

原始碼、相依清單、鎖定檔與必要音檔保留 OneDrive；安裝與建置在 OneDrive 外的工作副本執行，勿把 node_modules 放入同步資料夾。

驗證：`node frontend/build.mjs`、`node tests/assessment.test.cjs`、`node tests/free-writing-sync.test.cjs`、`node tests/cloud-client.test.cjs`；後端使用 Convex CLI 產生型別後以 `tsc --noEmit -p convex/tsconfig.json` 核對。

2026-10-23：新增 LanguageTool 自架文法接線、個別學生快取與限流、文法待確認弱點及 Cambridge 免費練習入口。LanguageTool 已在本機實測；公開主機尚待指定，未配置 HTTPS 入口時不向學生宣稱已連線。安裝與資料流詳見 `selfhost/README.md`，執行環境只安裝於目前電腦的 LocalAppData，不在 OneDrive。
