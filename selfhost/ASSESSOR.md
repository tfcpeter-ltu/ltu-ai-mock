# 免費本機作文與口說評閱

本階段以使用者指定的「沒有長期主機，先在這台電腦安裝與驗證」為界線。沒有開外網端口、穿透隧道、開機常駐或付費 AI 服務。正式網站不會直接連到學生電腦的 127.0.0.1。

## 本機教師驗證台

使用 PowerShell 7，在本目錄執行：

```powershell
./install-assessor.ps1 -Model 8B
./start-assessor.ps1 -Model 8B
```

開啟 http://127.0.0.1:8782/ 。模型為 Qwen3 8B Q4_K_M，llama.cpp b11827 Vulkan；引擎只監聽 127.0.0.1:8783，另有私密金鑰保護。金鑰、模型、日誌及執行中 PID 記錄留在 `%LOCALAPPDATA%\LTU\Assessor`，不要放入 OneDrive 或 Git。原始碼、安裝腳本與依賴鎖定檔留在專案。

14B 模型可另外以 `./install-assessor.ps1 -Model 14B` 安裝，再停止既有服務並以 `./start-assessor.ps1 -Model 14B` 啟動。約 9 GB 模型權重，採部分 GPU、部分 CPU 運算。此設定需要較長評閱時間，不是已驗證的學生即時服務。

停止使用 `./stop-assessor.ps1`；腳本核對程序命令再停止，不刪模型與成果。關機後需重新啟動。安裝腳本下載官方固定版本並核對 SHA256。Node.js 必須可用；亦會嘗試沿用本機 LanguageTool 清單中已核對的 Node 路徑。

## 評分流程與限制

作文按四項規準分別評閱，回饋必須引用當篇原句並提供修訂任務。圖表題目前尚未建立圖表資料核對流程，整類拒絕自動評分。規則檢查的錯誤數、字數與段落數不會直接變成 Band。雅思規準與 EPT 題庫的難度不同，單篇估計不是完整 Writing 或四科 Overall。

原始候選分數只出現在教師本機驗證台，學生版輸出會移除候選分數。只有與模型及規準版本相符、通過獨立樣本驗證的設定，才可產生練習估計分數。本專案暫定發布門檻為至少 20 篇獨立評分樣本、平均絕對誤差不超過 0.5、95% 的差距不超過 1 分；這是本站的工程發布門檻，並非 IELTS 官方認證程序。公開樣本可能已存在於模型訓練資料，不能宣稱獨立驗證。

口說可錄音／選檔、回放、下載、Whisper 本機轉寫、核對逐字稿、按文字取得三項規準草稿。文字模型沒有聽見原音，因此不產生發音或完整口說 Band。低能量區間、音量、削波及每分鐘字數只是收音及練習觀察，不能用來推定口音、猶豫原因或發音能力。

教師台可聆聽完整 Part 1–3 原音，填四項分數、原音證據與改善任務，再匯出清楚標記 `provider: human` 的練習評閱。JSON 包含原音 SHA256 以便對應音檔。教師台目前不自動寫入雲端；不要把手動填表結果稱為自動 AI 評分。

## 學生頁面

學生每個題組可分 Part 保存回答與音檔。原音使用以帳號命名空間及作答 ID 區分的 IndexedDB，在原瀏覽器保存；文字、評論及錄音索引沿用原有 Convex 帳號快照同步。跨裝置不會帶走音檔，介面會明確提示原音是否存在。請下載需要保留的原音；瀏覽器清除儲存空間後無法從文字快照還原錄音。

Whisper Tiny English（Transformers.js 3.8.1）在 WASM worker 中運算，模型版本固定，首次下載模型後使用瀏覽器快取。沒有使用瀏覽器的雲端 SpeechRecognition 來冒充本機轉寫。支援英文，辨識仍可能出錯或省略贅詞；先核對原音再評閱。

學生端可選 Phi 3.5 Mini WebGPU 文字評論，為未校準草稿，不輸出 Band。首次下載可能數 GB，不支援的裝置可保留作答等待教師處理。運算使用學生裝置，不是免費的遠端算力；硬體、電力、網路與 Convex 免費額度仍有限。

## 重現官方樣本驗證

把本目錄的 `package.json` 和 `package-lock.json` 複製到 OneDrive 外的本機驗證目錄，在該目錄執行 `npm ci`。不要在 OneDrive 專案安裝 node_modules。

```powershell
node ./prepare-official-rubric.mjs '<本機驗證目錄>' "$env:LOCALAPPDATA/LTU/Assessor"
```

重新啟動評閱台後執行：

```powershell
node ./benchmark-official.mjs '<本機驗證目錄>'
```

腳本只下載公開官方 PDF，在記憶體擷取學生作答，不把考官評論或參考分數送入模型；題目為同意／不同意未來健康趨勢的改寫。完整官方規準及分析用樣本留本機，沒有重新發布到學生網站。輸出的比較指標與來源連結可保存到專案報告。

來源：

- [IELTS 官方作文樣本與考官評語](https://ielts.org/cdn/computer-delivered-sample-tests-academic-writing/ielts-academic-writing-example-responses-to-parts-1-and-2-with-band-scores-and-examiner-comments.pdf)
- [IELTS Writing 規準](https://ielts.org/cdn/ielts-guides/ielts-writing-band-descriptors.pdf)
- [IELTS Speaking 規準](https://ielts.org/cdn/ielts-guides/ielts-speaking-band-descriptors.pdf)
- [Qwen3 官方執行參數](https://huggingface.co/Qwen/Qwen3-8B)
- [Transformers.js 音訊管線](https://huggingface.co/docs/transformers.js/api/pipelines)
# 雲端取件與教師評論（2026-10-23）

新增 `assessment-worker.mjs`：從本站 Convex 私人排程向外取件，呼叫已啟動的 127.0.0.1:8782 本機模型，再以有期限的租約回傳。沒有公開本機連接埠或自動啟動；電腦離線時學生看到等待狀態。

工作金鑰設定尚未執行：自動核准審查要求使用者明確同意金鑰用途與目的地。核准後才可將專用隨機金鑰放在 `%LOCALAPPDATA%/LTU/Assessor/worker-token.txt`、本站 GitHub repository 的加密 `ASSESSOR_WORKER_TOKEN` secret，及 Convex 同名環境變數。金鑰可取回待評文字並提交評論，須保密；不可放在 OneDrive、前端或 Git。`start-worker.ps1` 必須有私人設定才會啟動；`stop-worker.ps1` 核對 PID 後停止。

`install-assessor.ps1 -Model 3.5-9B` 與 `start-assessor.ps1 -Model 3.5-9B` 支援固定 revision 的 Qwen3.5 9B Unsloth Q4_K_M，下載後核對 SHA-256。兩篇官方開發樣本結果為 5.5/6.0（考官 5.5/7.5），MAE 0.75、最大誤差 1.5；未通過正式採分門檻。8B 為 6/6，MAE 1.0。不得將同一批調整用公開樣本稱為獨立校準。

學生評閱中心支援三部分原音提交、草稿失敗續傳、私人播放及完整教師評論。每段上限 8 MiB，總預留上限 200 MiB，不自動刪除。授權教師須聆聽三段原音，填四項規準評語與三部分時間證據。正式教師身份仍待擁有者指定、核對現有帳號後以內部操作授權；不可依未驗證 Email 自動提升權限。

後端自動分數預設隱藏。只有管理員登錄同一模型／規準版本／題型的獨立驗證政策才可開啟，工程門檻為至少 20 件、MAE ≤0.5、誤差不超過 1 Band 比例 ≥95%；這是本站發布門檻，不是 IELTS 官方認證標準。逐字稿 AI 永不提供完整口說或發音 Band。

