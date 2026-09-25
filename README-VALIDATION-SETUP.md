# Validation deployment setup

The diagnostic remains client-side. Optional validation submissions follow this route:

Browser → `/api/validation` → Netlify Function → Google Apps Script Web App → Google Sheets.

The Apps Script `/exec` URL belongs only in the Netlify environment variable `ARWT_VALIDATION_ENDPOINT`. It must not be placed in `index.html`, `netlify.toml`, GitHub, or a public build setting. The function forwards the same `ARWT_VALIDATION_V1` JSON envelope as `text/plain;charset=utf-8`; `Code.gs` remains the receiver and defines the four sheet schemas.

## Existing ARWT deployment

1. In Netlify, open the existing ARWT site, then **Project configuration → Environment variables**. Add `ARWT_VALIDATION_ENDPOINT` with the existing Google Apps Script Web App **`/exec` URL** as its value. Give it the **Functions** scope (or all scopes where a separate scope is unavailable) and the production deployment context. Do not put the value in GitHub or a client-side variable.
2. Deploy the repository's production branch. `netlify.toml` maps `/api/validation` to `netlify/functions/validation.mjs`; no build tooling or dependencies are required. Redeploy after adding or changing the environment variable.
3. Use synthetic inputs with **Contribute my responses to ARWT validation** checked. Confirm a completed row in `SESSIONS` and milestone rows in `EVENTS`. Optional feedback and contact can be checked separately in `FEEDBACK` and `CONTACTS`.
4. Repeat without contribution consent. No `SESSION` or `EVENT` request should be made. Feedback and contact remain independent. In `CONTACTS`, `feedback_session_id` must be blank unless testimonial **contact** consent is checked.

If the variable is missing, the function returns a configuration error and the diagnostic result remains visible. Validation data cannot reach Google Sheets until the variable is configured and the site is redeployed.

## New independent deployment

Create a Google Spreadsheet and limit access to authorized researchers. In **Extensions → Apps Script**, paste `Code.gs`. For a bound script, leave `SPREADSHEET_ID` as its placeholder; for a standalone script, set the ID only in your private Apps Script copy. Deploy as a Web App with **Execute as: Me** and **Who has access: Anyone** if your Workspace policy permits external submissions. Copy its `/exec` URL into the private Netlify variable above. Never publish a real Spreadsheet ID or URL in this repository.

The receiver validates records, creates exact headers for `SESSIONS`, `EVENTS`, `FEEDBACK`, and `CONTACTS`, locks writes, and ignores duplicate IDs. It returns JSON acknowledgements; the proxy reports success only after Apps Script acknowledges acceptance. Inspect the sheet to verify the final write. The Web App and proxy accept anonymous submissions, so syntactically valid junk remains possible; review validation data before treating it as evidence.

Removing `ARWT_VALIDATION_ENDPOINT` and redeploying stops forwarding to Apps Script. The browser still attempts optional submissions to the Netlify Function, which returns a configuration error; the assessment remains usable. The uninstrumented reference rc5.1 build has no validation transmission.
