# Changelog

Methodology and application build versions are tracked separately. Entries below are limited to changes verified in the available source and project records.

## Current repository copy — positioning update (2026-09-25)

- Reworded the first screen in EN/PL/RU to establish the delegation problem, intended user, and diagnostic outcome before the method explanation.
- Added public documentation and issue templates.
- Methodology remains `ARWT Algorithm v1.0-rc5.1`; validation schema remains `ARWT_VALIDATION_V1`. The application constant remains `ARWT v1.0-rc5.1-validation.1`; this entry identifies a copy/documentation revision, not a new algorithm.

## Validation transport update (2026-09-25)

- Routed optional validation submissions through a same-origin Netlify Function to the existing Google Apps Script receiver. The upstream URL is configured privately as `ARWT_VALIDATION_ENDPOINT` in Netlify.
- Kept the frozen methodology, questions, result classification, consent rules, payload schema, and application version constant unchanged.

## ARWT v1.0-rc5.1-validation.1 (2026-09-23)

- Separate validation build of the rc5.1 methodology. Adds optional, consent-gated session and milestone records, optional feedback and separate contact capture, EN/PL/RU validation UI, and Google Apps Script receiver for four sheets.
- The reference rc5.1 HTML remained separate.

## ARWT Algorithm v1.0-rc5.1 (2026-09-22)

- Copy-only correction to the six structural delegation pattern descriptions in English, Polish, and Russian. Descriptions no longer infer Legibility from a pattern selected by effective Judgment and Reversibility.
- Scoring and classifications were unchanged.

## Earlier releases

Earlier iteration history is not reconstructed here; details without a verifiable release artifact would be speculative.
