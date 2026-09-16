# Assessment implementation status

Updated 2026-09-16. Reference answers are AI source deductions, not official keys.

- Reading: all 29 sets reviewed; 1,159 usable reference answers. Mock 22 question 34 has contradictory wording and no supported option.
- Listening: 26 complete sets, plus 35/40 in Mock 18, 26/40 in Mock 27 and 34/40 in Mock 28 (1,135 total).
- Combined: 2,295 source-review records, with 2,294 usable reference answers out of 2,320 questions. Medium-confidence records still require review; coverage is not certainty.

## Unresolved items (26 questions)

| Set | Listening questions | Missing source |
| --- | --- | --- |
| Mock 22 (Reading) | 34 | Question says lower chance, source says more likely; no supported option |
| Mock 18 | 16–20 | Map with A–H labels |
| Mock 27 | 27–40 | Original audio ends at 18:36, during the question 27 lead-in |
| Mock 28 | 25–30 | Lighting cross-section diagram with A–H labels |

These questions display their specific source limitation and never count as incorrect. Incomplete sets do not display a whole-test IELTS table comparison.

## Marking

Accepted synonyms, evidence and confidence are shown per question, with timestamps for original recordings. Unordered answer groups allow changed order while preventing duplicate credit. Shared table prompts preserve question-specific keys. Malformed extracted question text is repaired from its source. Over-limit or unrecognised free-text responses require review. IELTS estimates are broad uncalibrated raw-score table comparisons, not official results.

## Remaining limitations

- Writing/Speaking remote assessment is not connected. No fabricated fallback scores or four-skill overall score.
- Source recordings were machine-transcribed and can contain recognition errors; the original audio remains authoritative.
- Student cross-device cloud synchronization is outside this change and has not been reverified.

## Verification

`node tests/assessment.test.cjs` checks every reference plus unordered answers, duplicate aliases, word/number limits, missing source handling and non-fabricated writing scores. Both derivation scripts validate provenance; listening clip bounds are checked against MP3 durations.
