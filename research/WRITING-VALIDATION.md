# 作文評分改善與發布條件（2026-10-24）

**後續核對更新：** 本文下方 MAE 0.70 是暫定轉錄的歷史開發結果，不是目前準確率。原三篇已完成第二次視覺核對，新三篇官方題目測試仍出現最大 2–2.5 分誤差；詳見 [核對後驗證](WRITING-REVIEWED-VALIDATION.md)。正式分數維持關閉。

目前仍不符合正式開放自動分數的條件。正式學生端保持四項評論草稿，不因本次實驗開放 Band；沒有使用付費推論 API。

相同五篇、seed 42／17／91、每篇三次的短輸出比較：

| 模型 | 不同作文 | 評閱次數 | MAE | 最大誤差 | 最大重評差距 |
| --- | ---: | ---: | ---: | ---: | ---: |
| Qwen3.5 9B Q4_K_M | 5 | 15 | 1.167 | 2.0 | 1.0 |
| Qwen3 14B Q4_K_M | 5 | 15 | 0.700 | 1.5 | 0.0 |

這是同一個短輸出實驗流程的開發比較，不能與正式學生四項評語流程直接等同。三篇掃描轉錄仍屬暫定，五篇都不能作為獨立發布證據。14B 有改善但未通過 MAE ≤0.5 的要求；不選擇性剔除官方 8.5 分樣本的 1.5 分低估。14B 限額推理三篇 MAE 0.833，9B 限額推理三篇 MAE 1.5；沒有因較慢就視為更準確。完整數字見 `writing-experiments-20261024.json`。

## 本輪改進

- 增加已安裝 Qwen3 14B 的「一次只輸出四項候選分數」實驗，縮短輸出並與撰寫修訂建議分離。此研究路徑尚未取代學生取件流程。
- 比較 9B 的單次評分、先分析再評分、官方開發範例參照、限額推理；避免只以原來兩篇健康題作文調整提示。
- 納入官方 2023 樣本集的不同主題與較廣分數範圍。掃描作文採保留原錯誤的暫定人工轉錄，尚缺第二次獨立核對，因此不計入正式校準。
- `writing-validation.mjs` 驗證目標作文不帶參考分數／考官評論進推論，依正規化原文去重，同題不得跨開發／驗證組，重評不灌大樣本數，各題型分開，失敗與不穩定結果阻擋發布。
- `start-assessor.ps1 -ReasoningBudget 1024` 可限制官方 llama.cpp 的推理預算。預設仍為原來的 -1；學生路徑仍停用思考模式。未限制推理的首篇測試在 4,096 輸出 token 耗盡時未產生完整分數，後續兩篇中止，不能當作成功驗證。

## 重現

依 `selfhost/ASSESSOR.md` 沿用 OneDrive 外的既有 PDF.js 依賴與私人模型目錄；不要在同步專案安裝套件或存放全文、模型、金鑰。

```powershell
node selfhost/experiment-writing.mjs '<外部依賴目錄>' '<私人模型目錄>' development 9B 42
node selfhost/experiment-writing.mjs '<外部依賴目錄>' '<私人模型目錄>' all-score-only 14B 42
node selfhost/summarize-writing-experiments.mjs '<外部依賴目錄>' research/writing-experiments-20261024.json
node tests/writing-validation.test.mjs
```

執行前須啟動相符模型；腳本核對引擎實際回報的模型名稱。`held-out`、`thinking`、`all-score-only` 模式需要外部 `provisional-official-samples.json`；不得把此檔原文提交至公開儲存庫。健康題使用與原題同意義但尚未逐字核對的提示，不能宣稱是逐字原題驗證。模型應接收原作答與題目，評估程序另讀參考分數。

數字報告只含樣本識別、來源、候選分數、誤差、耗時與重評資訊。五篇公開開發樣本可能已存在模型訓練資料，不是獨立測試；沒有四項考官分數，不能捏造四項準確率。不同方法的樣本集不同，請以相同作文逐篇比較，不能直接把表內各列總 MAE 當模型排名。

## 仍需完成

1. 核對掃描轉錄及逐字原題，建立按題目分組、事先凍結的驗證集；之後看過誤差而用來調整的作文轉回開發組。
2. 以完全相同原文比較候選模型與提示，至少三個 seed，保留失敗、偏高／偏低及重評差距。
3. 每個擬開通題型至少 20 篇獨立評分作文；平均絕對誤差 ≤0.5，差距不超過 1 分的比例 ≥95%。新驗證工具額外要求重評完整、最大重評差距不超過 1 分。這是本站工程門檻，並非 IELTS 認證。
4. 對錯題意、離題、短文、背誦／提示注入、矛盾及錯字集中案例作抗干擾測試，再測完整學生雲端流程。達標前不更改後端校準設定。

公開官方樣本可做開發對照，但不會因把相同作文重跑 20 次，就宣稱取得 20 篇獨立樣本。沒有適合的獨立評分資料時，保留教師覆核；不靠放寬門檻或固定加分來掩蓋模型偏差。

官方來源：

- https://ielts.org/cdn/Sample-tests/ielts-academic-writing-sample-tasks-2023.pdf
- https://ielts.org/cdn/computer-delivered-sample-tests-academic-writing/ielts-academic-writing-example-responses-to-parts-1-and-2-with-band-scores-and-examiner-comments.pdf
- https://ielts.org/cdn/ielts-guides/ielts-writing-band-descriptors.pdf
- https://github.com/ggml-org/llama.cpp/blob/b11827/tools/server/README.md
