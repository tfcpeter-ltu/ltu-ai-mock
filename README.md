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

下一步：完成 Production Convex Auth 的 JWT_PRIVATE_KEY / JWKS / SITE_URL 初始化，並上傳 `assets/ltu-ept-ai-cover.jpg`、`assets/ltu-logo.jpg` 視覺資產。
