# Assessment implementation status

Updated 2026-09-16. The production app supports source-derived reference answers, question evidence, original-audio excerpt playback, conservative marking, and downloadable reports. Answers are not official.

reading: 19 sets have 40 reference records. See ai-reference-coverage.json for partial sets. Reference coverage is not the same as certainty: medium-confidence records remain ungraded.

listening: 15 sets have 40 reference records. See ai-reference-coverage.json for partial sets. Reference coverage is not the same as certainty: medium-confidence records remain ungraded.

Remaining work:

- Review source passages and original recordings for sets with incomplete reference coverage. Do not fill gaps with guessed keys.
- Writing/Speaking remote assessment is not connected. No fabricated fallback scores or four-skill overall score.
- IELTS display is a broad raw-score table comparison, not validated EPT-to-IELTS equivalence.
- Verify student cloud synchronization independently before claiming cross-device persistence.

Verified in production with the demonstration account: Reading answer submission and source evidence, Listening source diagram rendering, reference modal, and original-audio timestamp playback (the tested clip loaded without error and stopped at its excerpt boundary).
