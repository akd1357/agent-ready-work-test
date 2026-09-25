# Validation setup (separate deployment)

The repository client is static and leaves `VALIDATION_ENDPOINT` as a placeholder. It calculates results locally but sends no records. `Code.gs` is a receiver template with `SPREADSHEET_ID` unset. The deployed public site may have separate private configuration.

1. Create a Google Spreadsheet for validation. Limit its access to authorized researchers.
2. In the spreadsheet, open **Extensions → Apps Script** and paste `Code.gs`.
3. For a script bound to that spreadsheet, leave the `SPREADSHEET_ID` placeholder. For a standalone script, set the target Spreadsheet ID in your private copy only.
4. Save, then choose **Deploy → New deployment → Web app**. To accept external anonymous submissions, use **Execute as: Me** and **Who has access: Anyone**, if permitted by your Google Workspace policy. Authorize the script. Copy the `/exec` URL.
5. Set `VALIDATION_ENDPOINT` in a private deployment copy of `index.html` to that URL. Do not commit the configured copy or the Spreadsheet ID. Host the HTML on HTTPS static hosting.
6. Complete a synthetic test with validation contribution checked. Verify one completed row in `SESSIONS` and milestones in `EVENTS`; optionally submit feedback and contact to check `FEEDBACK` and `CONTACTS`.
7. Repeat without contribution consent. No `SESSION` or `EVENT` request should be sent. Optional feedback and contact are independent submissions. In `CONTACTS`, `feedback_session_id` must be blank unless testimonial **contact** permission is checked. Publication permission is never inferred.
8. Clear `VALIDATION_ENDPOINT` to disable all validation transmissions. The diagnostic continues to work.

The receiver validates field sets and values, creates exact headers for `SESSIONS`, `EVENTS`, `FEEDBACK`, and `CONTACTS`, uses a lock, and ignores duplicate primary IDs. The client sends `text/plain` JSON envelopes with `mode: 'no-cors'`; it cannot read an acknowledgement. A resolved browser request is therefore not proof that the server accepted the record. Inspect the sheets during setup.

**Operational risk:** An Apps Script Web App open to Anyone has no participant authentication in this design. Anyone who discovers its URL could submit syntactically valid junk records. Validation and deduplication do not prevent that. Protect the sheet, monitor submissions, and do not use these records as verified evidence without review. An authorization/rate-limiting layer would require a separate design decision and is outside this frozen validation build.

The validation build transmits research data when a participant opts in, and optional feedback/contact when separately submitted. The uninstrumented reference rc5.1 build does not transmit validation records.
