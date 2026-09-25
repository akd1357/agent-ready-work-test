const SCHEMA_VERSION = 'ARWT_VALIDATION_V1';
const METHODOLOGY_VERSION = 'ARWT Algorithm v1.0-rc5.1';
const BUILD_VERSION = 'ARWT v1.0-rc5.1-validation.1';

// Leave this placeholder unchanged when the script is bound to the target spreadsheet.
// For a standalone Apps Script project, paste the target spreadsheet ID here.
const SPREADSHEET_ID = 'PASTE_GOOGLE_SPREADSHEET_ID_HERE';

const SESSION_HEADERS = [
  'schema_version', 'methodology_version', 'build_version',
  'session_id', 'case_id',
  'started_at', 'completed_at', 'duration_seconds',
  'language_start', 'language_result', 'language_switch_count',
  'perspective',
  'work', 'scope',
  'viewport_class',
  'L1', 'L2', 'L3', 'L4', 'L5', 'L6', 'L7',
  'J1', 'J2', 'J3', 'J4', 'J5', 'J6', 'J7',
  'R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7',
  'O1', 'O2',
  'L1_changes', 'L2_changes', 'L3_changes', 'L4_changes', 'L5_changes', 'L6_changes', 'L7_changes',
  'J1_changes', 'J2_changes', 'J3_changes', 'J4_changes', 'J5_changes', 'J6_changes', 'J7_changes',
  'R1_changes', 'R2_changes', 'R3_changes', 'R4_changes', 'R5_changes', 'R6_changes', 'R7_changes',
  'O1_changes', 'O2_changes',
  'legibility_seconds', 'judgment_seconds', 'reversibility_seconds', 'feedback_loop_seconds',
  'back_count', 'consistency_review_count',
  'legibility_raw', 'legibility_percent', 'legibility_status',
  'judgment_raw', 'judgment_percent', 'judgment_band', 'effective_judgment',
  'reversibility_raw', 'reversibility_percent', 'reversibility_band', 'effective_reversibility',
  'observability',
  'structural_pattern',
  'legibility_constraint', 'autonomy_constraint',
  'issue_1_id', 'issue_1_type', 'issue_1_severity',
  'issue_2_id', 'issue_2_type', 'issue_2_severity',
  'issue_3_id', 'issue_3_type', 'issue_3_severity',
  'boundary_sensitive', 'boundary_dimensions'
];

const EVENT_HEADERS = [
  'event_id', 'session_id', 'case_id', 'occurred_at', 'build_version', 'language', 'event_type'
];

const FEEDBACK_HEADERS = [
  'feedback_id', 'session_id', 'case_id', 'submitted_at', 'result_fit', 'value_reaction', 'wrong_or_missing'
];

const CONTACT_HEADERS = [
  'contact_id', 'created_at', 'email', 'research_contact_consent', 'testimonial_contact_consent', 'feedback_session_id'
];

const SHEETS = {
  SESSION: { name: 'SESSIONS', headers: SESSION_HEADERS, primaryKey: 'session_id' },
  EVENT: { name: 'EVENTS', headers: EVENT_HEADERS, primaryKey: 'event_id' },
  FEEDBACK: { name: 'FEEDBACK', headers: FEEDBACK_HEADERS, primaryKey: 'feedback_id' },
  CONTACT: { name: 'CONTACTS', headers: CONTACT_HEADERS, primaryKey: 'contact_id' }
};

const ANSWER_IDS = ['L1', 'L2', 'L3', 'L4', 'L5', 'L6', 'L7', 'J1', 'J2', 'J3', 'J4', 'J5', 'J6', 'J7', 'R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7', 'O1', 'O2'];
const CHANGE_IDS = ANSWER_IDS.map(function (id) { return id + '_changes'; });
const EVENT_TYPES = ['TEST_STARTED', 'LEGIBILITY_STARTED', 'LEGIBILITY_COMPLETED', 'JUDGMENT_STARTED', 'JUDGMENT_COMPLETED', 'REVERSIBILITY_STARTED', 'REVERSIBILITY_COMPLETED', 'FEEDBACK_LOOP_STARTED', 'FEEDBACK_LOOP_COMPLETED', 'RESULT_VIEWED', 'FEEDBACK_SUBMITTED', 'CONTACT_SUBMITTED'];
const PATTERNS = ['LOW_SUPERVISION', 'GUARDRAILED', 'CONTROLLED_COLLABORATION', 'HUMAN_APPROVAL', 'HUMAN_JUDGMENT_DELEGATED_EXECUTION', 'HUMAN_DECISION_OWNERSHIP'];
const ISSUE_IDS = ANSWER_IDS.concat(['J_COMPOSITE_HIGH_CONSEQUENCE', 'R_COMPOSITE_CONSEQUENTIAL', 'RO_DEDUP_FEEDBACK', 'RO_COMPOSITE_DETECTION_RECOVERY']);

function doPost(e) {
  try {
    if (!e || !e.postData || typeof e.postData.contents !== 'string') throw new Error('Missing request body.');
    const envelope = JSON.parse(e.postData.contents);
    assertPlainObject_(envelope, 'request');
    assertExactFields_(envelope, ['schema_version', 'record_type', 'payload'], 'request');
    if (envelope.schema_version !== SCHEMA_VERSION) throw new Error('Unsupported schema_version.');
    if (!Object.prototype.hasOwnProperty.call(SHEETS, envelope.record_type)) throw new Error('Unsupported record_type.');

    const recordType = envelope.record_type;
    const config = SHEETS[recordType];
    assertPlainObject_(envelope.payload, 'payload');
    assertExactFields_(envelope.payload, config.headers, recordType + ' payload');
    validateRecord_(recordType, envelope.payload);

    const lock = LockService.getScriptLock();
    lock.waitLock(30000);
    try {
      const sheet = getOrCreateSheet_(config.name, config.headers);
      const primaryId = envelope.payload[config.primaryKey];
      if (hasPrimaryId_(sheet, config.headers, config.primaryKey, primaryId)) {
        return jsonResponse_({ ok: true, duplicate: true, record_type: recordType });
      }
      const row = config.headers.map(function (header) { return safeCell_(envelope.payload[header]); });
      sheet.appendRow(row);
      return jsonResponse_({ ok: true, duplicate: false, record_type: recordType });
    } finally {
      lock.releaseLock();
    }
  } catch (error) {
    return jsonResponse_({ ok: false, error: String(error && error.message ? error.message : error) });
  }
}

function validateRecord_(recordType, payload) {
  if (recordType === 'SESSION') validateSession_(payload);
  else if (recordType === 'EVENT') validateEvent_(payload);
  else if (recordType === 'FEEDBACK') validateFeedback_(payload);
  else if (recordType === 'CONTACT') validateContact_(payload);
}

function validateSession_(p) {
  requireExact_(p.schema_version, SCHEMA_VERSION, 'schema_version');
  requireExact_(p.methodology_version, METHODOLOGY_VERSION, 'methodology_version');
  requireExact_(p.build_version, BUILD_VERSION, 'build_version');
  requireId_(p.session_id, 'session_id');
  optionalCaseId_(p.case_id);
  requireIsoDate_(p.started_at, 'started_at');
  requireIsoDate_(p.completed_at, 'completed_at');
  requireNumber_(p.duration_seconds, 'duration_seconds', 0, 604800);
  requireEnum_(p.language_start, ['en', 'pl', 'ru'], 'language_start');
  requireEnum_(p.language_result, ['en', 'pl', 'ru'], 'language_result');
  requireInteger_(p.language_switch_count, 'language_switch_count', 0, 10000);
  requireEnum_(p.perspective, ['PERFORMER', 'MANAGER_OWNER', 'BOTH', 'OTHER'], 'perspective');
  requireString_(p.work, 'work', 1, 240);
  requireString_(p.scope, 'scope', 1, 600);
  requireEnum_(p.viewport_class, ['MOBILE', 'TABLET', 'DESKTOP'], 'viewport_class');

  ANSWER_IDS.forEach(function (id) { requireInteger_(p[id], id, 0, 3); });
  CHANGE_IDS.forEach(function (id) { requireInteger_(p[id], id, 0, 10000); });
  ['legibility_seconds', 'judgment_seconds', 'reversibility_seconds', 'feedback_loop_seconds'].forEach(function (id) { requireNumber_(p[id], id, 0, 604800); });
  requireInteger_(p.back_count, 'back_count', 0, 10000);
  requireInteger_(p.consistency_review_count, 'consistency_review_count', 0, 10000);
  requireInteger_(p.legibility_raw, 'legibility_raw', 0, 21);
  requireInteger_(p.legibility_percent, 'legibility_percent', 0, 100);
  requireEnum_(p.legibility_status, ['CLARIFY_FIRST', 'PARTIALLY_DEFINED', 'PASS'], 'legibility_status');
  requireInteger_(p.judgment_raw, 'judgment_raw', 0, 21);
  requireInteger_(p.judgment_percent, 'judgment_percent', 0, 100);
  requireEnum_(p.judgment_band, ['LOW', 'MEDIUM', 'HIGH'], 'judgment_band');
  requireEnum_(p.effective_judgment, ['LOW', 'MEDIUM', 'HIGH'], 'effective_judgment');
  requireInteger_(p.reversibility_raw, 'reversibility_raw', 0, 21);
  requireInteger_(p.reversibility_percent, 'reversibility_percent', 0, 100);
  requireEnum_(p.reversibility_band, ['LOW', 'MEDIUM', 'HIGH'], 'reversibility_band');
  requireEnum_(p.effective_reversibility, ['LOW', 'MEDIUM', 'HIGH'], 'effective_reversibility');
  requireEnum_(p.observability, ['LOW', 'MEDIUM', 'HIGH'], 'observability');
  requireEnum_(p.structural_pattern, PATTERNS, 'structural_pattern');
  requireEnum_(p.legibility_constraint, ['', 'CLARIFY_FIRST', 'PARTIALLY_DEFINED'], 'legibility_constraint');
  requireEnum_(p.autonomy_constraint, ['', 'MONITORING_REQUIRED', 'VERIFICATION_REQUIRED'], 'autonomy_constraint');

  [1, 2, 3].forEach(function (number) {
    const id = p['issue_' + number + '_id'];
    const type = p['issue_' + number + '_type'];
    const severity = p['issue_' + number + '_severity'];
    requireEnum_(id, [''].concat(ISSUE_IDS), 'issue_' + number + '_id');
    requireEnum_(type, ['', 'structural', 'judgment'], 'issue_' + number + '_type');
    requireEnum_(severity, ['', 'Critical', 'High', 'Medium', 'Low'], 'issue_' + number + '_severity');
    if ((id === '') !== (type === '' && severity === '')) throw new Error('Incomplete issue_' + number + ' fields.');
  });

  requireBoolean_(p.boundary_sensitive, 'boundary_sensitive');
  validateBoundaryDimensions_(p.boundary_dimensions, p.boundary_sensitive);
}

function validateEvent_(p) {
  requireId_(p.event_id, 'event_id');
  requireId_(p.session_id, 'session_id');
  optionalCaseId_(p.case_id);
  requireIsoDate_(p.occurred_at, 'occurred_at');
  requireExact_(p.build_version, BUILD_VERSION, 'build_version');
  requireEnum_(p.language, ['en', 'pl', 'ru'], 'language');
  requireEnum_(p.event_type, EVENT_TYPES, 'event_type');
}

function validateFeedback_(p) {
  requireId_(p.feedback_id, 'feedback_id');
  requireId_(p.session_id, 'session_id');
  optionalCaseId_(p.case_id);
  requireIsoDate_(p.submitted_at, 'submitted_at');
  requireEnum_(p.result_fit, ['VERY_WELL', 'MOSTLY', 'PARTLY', 'POORLY', 'UNSURE'], 'result_fit');
  requireEnum_(p.value_reaction, ['NEW_INSIGHT', 'RETHOUGHT_WORK', 'CONFIRMED_EXISTING_VIEW', 'NOT_USEFUL'], 'value_reaction');
  requireString_(p.wrong_or_missing, 'wrong_or_missing', 0, 400);
}

function validateContact_(p) {
  requireId_(p.contact_id, 'contact_id');
  requireIsoDate_(p.created_at, 'created_at');
  requireString_(p.email, 'email', 3, 254);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email)) throw new Error('Invalid email.');
  requireBoolean_(p.research_contact_consent, 'research_contact_consent');
  requireBoolean_(p.testimonial_contact_consent, 'testimonial_contact_consent');
  if (!p.research_contact_consent && !p.testimonial_contact_consent) throw new Error('At least one contact consent is required.');
  requireString_(p.feedback_session_id, 'feedback_session_id', 0, 128);
  if (!p.testimonial_contact_consent && p.feedback_session_id !== '') throw new Error('feedback_session_id requires testimonial contact consent.');
}

function validateBoundaryDimensions_(value, sensitive) {
  requireString_(value, 'boundary_dimensions', 0, 100);
  if (!sensitive && value !== '') throw new Error('boundary_dimensions must be empty when boundary_sensitive is false.');
  if (sensitive && value === '') throw new Error('boundary_dimensions is required when boundary_sensitive is true.');
  if (!value) return;
  const dimensions = value.split('|');
  const allowed = ['LEGIBILITY', 'JUDGMENT', 'REVERSIBILITY', 'FEEDBACK'];
  const seen = {};
  dimensions.forEach(function (dimension) {
    if (allowed.indexOf(dimension) === -1 || seen[dimension]) throw new Error('Invalid boundary_dimensions.');
    seen[dimension] = true;
  });
}

function getSpreadsheet_() {
  if (SPREADSHEET_ID && SPREADSHEET_ID !== 'PASTE_GOOGLE_SPREADSHEET_ID_HERE') return SpreadsheetApp.openById(SPREADSHEET_ID);
  const active = SpreadsheetApp.getActiveSpreadsheet();
  if (!active) throw new Error('Set SPREADSHEET_ID or bind this script to a spreadsheet.');
  return active;
}

function getOrCreateSheet_(name, headers) {
  const spreadsheet = getSpreadsheet_();
  let sheet = spreadsheet.getSheetByName(name);
  if (!sheet) sheet = spreadsheet.insertSheet(name);
  const currentWidth = Math.max(headers.length, sheet.getLastColumn());
  const current = sheet.getRange(1, 1, 1, currentWidth).getDisplayValues()[0];
  const empty = current.every(function (value) { return value === ''; });
  if (empty) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
  } else if (sheet.getLastColumn() !== headers.length || !headers.every(function (header, index) { return current[index] === header; })) {
    throw new Error('Header mismatch in ' + name + '. Existing columns were not reordered.');
  }
  return sheet;
}

function hasPrimaryId_(sheet, headers, primaryKey, value) {
  const column = headers.indexOf(primaryKey) + 1;
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return false;
  return sheet.getRange(2, column, lastRow - 1, 1).getDisplayValues().some(function (row) { return row[0] === value; });
}

function assertPlainObject_(value, label) {
  if (!value || Object.prototype.toString.call(value) !== '[object Object]') throw new Error(label + ' must be an object.');
}

function assertExactFields_(object, allowed, label) {
  const keys = Object.keys(object);
  const unknown = keys.filter(function (key) { return allowed.indexOf(key) === -1; });
  const missing = allowed.filter(function (key) { return !Object.prototype.hasOwnProperty.call(object, key); });
  if (unknown.length) throw new Error(label + ' contains unknown fields: ' + unknown.join(', '));
  if (missing.length) throw new Error(label + ' is missing fields: ' + missing.join(', '));
}

function requireString_(value, label, minLength, maxLength) {
  if (typeof value !== 'string' || value.length < minLength || value.length > maxLength) throw new Error('Invalid ' + label + '.');
}

function requireExact_(value, expected, label) {
  if (value !== expected) throw new Error('Invalid ' + label + '.');
}

function requireId_(value, label) {
  requireString_(value, label, 1, 128);
  if (!/^[A-Za-z0-9_-]+$/.test(value)) throw new Error('Invalid ' + label + '.');
}

function optionalCaseId_(value) {
  if (value === null || value === '') return;
  requireString_(value, 'case_id', 1, 80);
  if (!/^[A-Za-z0-9_-]+$/.test(value)) throw new Error('Invalid case_id.');
}

function requireIsoDate_(value, label) {
  requireString_(value, label, 20, 35);
  if (isNaN(Date.parse(value)) || !/^\d{4}-\d{2}-\d{2}T/.test(value)) throw new Error('Invalid ' + label + '.');
}

function requireInteger_(value, label, minimum, maximum) {
  if (typeof value !== 'number' || !isFinite(value) || Math.floor(value) !== value || value < minimum || value > maximum) throw new Error('Invalid ' + label + '.');
}

function requireNumber_(value, label, minimum, maximum) {
  if (typeof value !== 'number' || !isFinite(value) || value < minimum || value > maximum) throw new Error('Invalid ' + label + '.');
}

function requireBoolean_(value, label) {
  if (typeof value !== 'boolean') throw new Error('Invalid ' + label + '.');
}

function requireEnum_(value, allowed, label) {
  if (allowed.indexOf(value) === -1) throw new Error('Invalid ' + label + '.');
}

function safeCell_(value) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string' && /^[=+\-@]/.test(value)) return "'" + value;
  return value;
}

function jsonResponse_(body) {
  return ContentService.createTextOutput(JSON.stringify(body)).setMimeType(ContentService.MimeType.JSON);
}
