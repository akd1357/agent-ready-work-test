# ARWT methodology — Algorithm v1.0-rc5.1

This documents the frozen implementation in `index.html`. The application code is the operational reference. This description makes no new scoring decisions.

## Conceptual model

ARWT assesses one bounded unit of work using three visible dimensions:

- **Legibility:** independent reconstruction and verification from examples, records, systems, artifacts, and explicit rules.
- **Judgment:** how often rules and formal information do not determine one clear action and contextual interpretation or discretion is required.
- **Reversibility:** controls that already exist to detect, undo, restore, contain, and approve plausible mistakes.

Two further items assess **Observability**: whether correctness can be verified and wrong outcomes become visible soon enough. It is used for an autonomy constraint and is not shown as a fourth score.

This is a work-structure diagnostic. It does not test the capability of any AI model.

## Operational scoring

There are 23 questions: L1–L7, J1–J7, R1–R7, O1–O2. Each takes an integer answer 0–3. L/J/R raw totals range from 0 to 21; the displayed percentage is `round(raw / 21 × 100)`. Higher L means better independent verification, higher J means more contextual judgment, and higher R means more recoverable or controlled errors. O is classified from its two responses.

### Legibility status

| Condition, evaluated in order | Status |
| --- | --- |
| Raw L ≤ 10, or L3 = 0, or L4 = 0 | `CLARIFY_FIRST` |
| Otherwise raw L ≤ 14; or any of L1, L2, L5, L6, L7 = 0; or L3 = 1; or L4 = 1 | `PARTIALLY_DEFINED` |
| Otherwise | `PASS` |

All users continue the full assessment regardless of Legibility status. A status other than `PASS` makes the structural pattern conditional and adds a separate Legibility constraint. `CLARIFY_FIRST` warns against treating the pattern as handover or unattended-execution readiness. `PARTIALLY_DEFINED` calls for active supervision while gaps are addressed.

### Judgment and Reversibility bands

Both raw totals use the same cutoffs: 0–6 `LOW`, 7–13 `MEDIUM`, 14–21 `HIGH`.

- **J7 override:** a raw `LOW` Judgment band becomes effective `MEDIUM` when J7 = 3. Otherwise the effective band equals the raw band.
- **Consequence override:** a raw `HIGH` Reversibility band becomes effective `MEDIUM` if R5 = 0, R6 = 0, or both R5 ≤ 1 and R6 ≤ 1. Other bands are unchanged.

These overrides affect the structural pattern but do not alter raw totals or displayed percentages.

### Observability

`LOW` if O1 = 0 or O2 = 0; otherwise `MEDIUM` if O1 + O2 ≤ 4; otherwise `HIGH`.

| Observability | Autonomy constraint |
| --- | --- |
| `HIGH` | None |
| `MEDIUM` | `MONITORING_REQUIRED` |
| `LOW` | `VERIFICATION_REQUIRED` before unattended execution |

## Structural delegation patterns

Only **effective Judgment × effective Reversibility** selects this pattern. Legibility does not enter the matrix.

| Effective Judgment \ Effective Reversibility | HIGH | MEDIUM | LOW |
| --- | --- | --- | --- |
| LOW | `LOW_SUPERVISION` | `GUARDRAILED` | `GUARDRAILED` |
| MEDIUM | `CONTROLLED_COLLABORATION` | `HUMAN_APPROVAL` | `HUMAN_APPROVAL` |
| HIGH | `HUMAN_JUDGMENT_DELEGATED_EXECUTION` | `HUMAN_DECISION_OWNERSHIP` | `HUMAN_DECISION_OWNERSHIP` |

Descriptions refer only to Judgment and Reversibility. The resulting pattern is marked **conditional** if Legibility is not `PASS`. This is not a readiness approval.

## Issues, priorities, and recommendations

The implementation defines structural rules for L1–L7, R1–R7, O1–O2 and judgment rules for J1–J7, each with a fixed priority and recommendation. Structural answer 0 is `Critical`, 1 is `High`, 2 is `Low`, and 3 produces no issue. Judgment answer 3 is `High`, 2 is `Medium`, and 0–1 produce no issue.

Composite rules are applied before issue selection:

- Effective Judgment `HIGH` with effective Reversibility below `HIGH` adds a high-consequence judgment issue (priority 6). It replaces other judgment issues in the candidate list.
- R5 ≤ 1 and R6 ≤ 1 replace their separate issues with a `Critical` consequential-control issue (priority 6).
- R1 ≤ 1 and O2 ≤ 1 replace their separate issues with a combined feedback/error-detection issue (priority 6; more severe of the two).
- Observability `LOW` together with R2, R3, R4, or R7 ≤ 1 replaces selected recovery/detection issues with a `Critical` detection-and-recovery issue (priority 7). This may supersede the preceding R1/O2 composite.

Candidates are ordered by severity (`Critical`, `High`, `Medium`, `Low`), then descending rule priority, then ID. At most three issues are shown, with at most one judgment issue. If Legibility is not `PASS` and the selected issues contain no L issue, the highest-ranked available L issue is inserted, replacing the last issue if necessary. Up to three next actions are derived from the selected issues, with duplicate recommendation text removed. The rule texts and priorities themselves are in `BLOCKER_RULES` and `JUDGMENT_RULES` in the source.

## Consistency and boundary checks

R1 = 0 and O2 = 3 triggers a review screen for those answers before finalizing the result. It does not rewrite an answer.

For each answer, boundary sensitivity checks valid one-step changes (±1 within 0–3). A counterfactual that would trigger consistency review is excluded. It reports `LEGIBILITY` if the Legibility status changes, `JUDGMENT` if a J perturbation changes the pattern, `REVERSIBILITY` if an R perturbation changes the pattern or effective R band, and `FEEDBACK` if an O perturbation changes the autonomy constraint. This warning does not change the underlying classification.

## Validation instrumentation

The separate validation layer records optional assessment telemetry under `ARWT_VALIDATION_V1` only with assessment contribution consent. Result feedback and contact submissions have separate optional actions. The instrumented build calculates and renders results before queuing network submissions. Validation code does not change the methodology. The repository source has an unconfigured endpoint.

## Known limitations

- Answers are self-reported and can depend on the assessor's access to actual work evidence. Different assessors may disagree.
- Thresholds, priorities, and patterns are design rules under validation, not calibrated probabilities of failure or proof of safety.
- The unit of work and its boundaries matter; combining unlike work into one assessment can conceal exceptions.
- A one-step warning covers local answer perturbations, not all uncertainty or interacting changes.
- This assessment does not establish model capability, cybersecurity, privacy, legal compliance, economic feasibility, or a particular worker's competence.
