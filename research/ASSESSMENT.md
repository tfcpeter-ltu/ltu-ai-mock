# AI reference assessment

These answers are AI deductions from the supplied reading passages and original recordings, not official keys. All evidence spans are validated against their associated source before the asset is generated. Reuse requires identical question and instruction text; listening reuse additionally requires the same original recording. NOT GIVEN reading reuse requires the whole relevant passage to match. Explicitly inspected wording variants are separate records.

Rebuild in order:

    python research/derive-reference-keys.py
    python research/derive-listening-keys.py

The latter requires `research/transcripts/*.json`. Transcripts are machine-generated using faster-whisper small.en and may contain recognition errors. Their timestamps point to original source audio. They are source material, not answer keys.

`assets/ai-reference-keys.js` is the browser data. `research/ai-reference-coverage.json` records actual per-mock coverage. The question bank displays coverage so unfinished sets are not represented as complete.

Only high-confidence, exact accepted variants are auto-credited. Unrecognised free text and medium-confidence questions are pending review, not automatically wrong. Closed-option mismatches may be marked incorrect. Over-limit wording is sent for review. Missing references never count as wrong. Cached historical heuristic solutions no longer drive the answer UI.

The IELTS table display is an uncalibrated raw-score comparison, not a validated EPT equivalence. It uses only official published anchor values (Listening 16/23/30/35 and Academic Reading 15/23/30/35 for Bands 5/6/7/8). It displays wide ranges, only when all 40 reference records exist; uncertainty in unresolved answers widens the range. No overall score is computed without four valid skill assessments. Writing and Speaking live model integration remains unavailable.
