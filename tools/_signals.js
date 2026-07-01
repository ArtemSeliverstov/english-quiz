/**
 * _signals.js — shared helpers for coach_notes.recent_session_signals.
 *
 * The single-session capture buffer (cap 20) and its promotion lifecycle live
 * here so every writer shares one implementation:
 *   - update_coach_notes.js  (manual patches)
 *   - log_exercise.js        (auto-fold on CC exercise write — closes the leak
 *                             where CC sessions wrote the exercise row but not
 *                             the signals buffer, so 2nd occurrences never
 *                             reached the promotion gate)
 *   - promote_signals.js     (daily count>=2 promotion sweep)
 *
 * See references/coach-notes-schema.md "recent_session_signals".
 */

const RECENT_SESSION_SIGNALS_CAP = 20;

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

// A pattern_id that looks like a lexical swap ("awkward → natural [tag]") is
// handled by phrase_tracker, not this buffer — skip it. Grammar slugs are
// snake_case with no arrow / bracket.
function isLexicalSlug(s) {
  return /→|->|\[.*\]/.test(s);
}

// Map canonical exercise types to the source_mode label convention already in
// the buffer (article_drill_live, error_correction_drill, ...). Falls back to
// "<type>_cc" for anything unmapped so the mode is never blank.
const SOURCE_MODE_BY_TYPE = {
  article_drill:    'article_drill_live',
  error_correction: 'error_correction_drill',
  translation:      'translation_drill',
  transform:        'transform_drill',
  particle_sort:    'particle_sort_drill',
  dictation:        'dictation_drill',
  conversation:     'conversation',
  free_write:       'free_write',
};

/**
 * Apply add / promote / remove operations to the signals buffer, in that
 * order. Unlike the pre-2026-06 version this does NOT early-return after the
 * first matching op — a single patch may combine remove + promote + add (the
 * promotion sweep adds a durable label to weak_patterns AND drops the promoted
 * entry from the buffer in one write). Single-op callers are unaffected.
 */
function applyRecentSessionSignalsPatch(current, patch) {
  let signals = (current || []).map(s => Object.assign({}, s,
    s.session_ids ? { session_ids: [...s.session_ids] } : {},
    s.source_modes ? { source_modes: [...s.source_modes] } : {}));

  // remove: drop entries by pattern_id (obsolete / already-promoted)
  if (Array.isArray(patch.recent_session_signals_remove)) {
    const removeSet = new Set(patch.recent_session_signals_remove);
    signals = signals.filter(s => !removeSet.has(s.pattern_id));
  }

  // promote: drop entries that the caller has appended to weak_patterns
  if (Array.isArray(patch.recent_session_signals_promote)) {
    const promoteSet = new Set(patch.recent_session_signals_promote);
    signals = signals.filter(s => !promoteSet.has(s.pattern_id));
  }

  // add: merge captures by pattern_id (bump count + session_ids if it exists)
  if (Array.isArray(patch.recent_session_signals_add)) {
    for (const capture of patch.recent_session_signals_add) {
      if (!capture || typeof capture.pattern_id !== 'string' || !capture.pattern_id.trim()) continue;
      const key = capture.pattern_id.trim();
      const existing = signals.find(s => s.pattern_id === key);
      if (existing) {
        const sids = capture.session_ids || (capture.session_id ? [capture.session_id] : []);
        existing.session_ids = existing.session_ids || [];
        for (const sid of sids) {
          if (sid && !existing.session_ids.includes(sid)) existing.session_ids.push(sid);
        }
        existing.count = existing.session_ids.length;
        if (capture.last_seen) existing.last_seen = capture.last_seen;
        if (capture.source_modes) {
          existing.source_modes = existing.source_modes || [];
          for (const m of capture.source_modes) {
            if (m && !existing.source_modes.includes(m)) existing.source_modes.push(m);
          }
        }
        if (capture.category && !existing.category) existing.category = capture.category;
      } else {
        const sids = capture.session_ids || (capture.session_id ? [capture.session_id] : []);
        signals.push({
          pattern_id: key,
          session_ids: [...sids],
          count: sids.length,
          first_seen: capture.first_seen || todayISO(),
          last_seen: capture.last_seen || todayISO(),
          category: capture.category || null,
          source_modes: capture.source_modes || [],
        });
      }
    }
  }

  // Priority-weighted eviction if over cap: lowest count + oldest last_seen
  // first (singletons before multi-evidence entries — protects accumulating
  // signals from being churned out before they hit the promotion threshold).
  while (signals.length > RECENT_SESSION_SIGNALS_CAP) {
    signals.sort((a, b) => {
      if (a.count !== b.count) return a.count - b.count;
      return String(a.last_seen || '').localeCompare(String(b.last_seen || ''));
    });
    signals.shift();
  }
  return signals;
}

/**
 * Derive recent_session_signals_add entries from a logged exercise's wrong
 * items. One entry per distinct matched_pattern_id on a wrong item. Lexical
 * slugs are skipped (phrase_tracker owns those). Returns [] for sparse-legacy
 * rows (no items[]).
 */
function deriveSignalsFromExercise(exercise, sessionId) {
  if (!exercise || !Array.isArray(exercise.items)) return [];
  const sourceMode = SOURCE_MODE_BY_TYPE[exercise.exercise] || `${exercise.exercise}_cc`;
  const category = (Array.isArray(exercise.categories) && exercise.categories[0]) || null;
  const lastSeen = exercise.date || todayISO();
  const seen = new Set();
  const out = [];
  for (const it of exercise.items) {
    if (!it || it.correct === true) continue;
    const pid = it.matched_pattern_id;
    if (!pid || typeof pid !== 'string' || !pid.trim()) continue;
    const key = pid.trim();
    if (isLexicalSlug(key) || seen.has(key)) continue;
    seen.add(key);
    out.push({
      pattern_id: key,
      session_id: sessionId,
      last_seen: lastSeen,
      source_modes: [sourceMode],
      category,
    });
  }
  return out;
}

module.exports = {
  RECENT_SESSION_SIGNALS_CAP,
  todayISO,
  isLexicalSlug,
  SOURCE_MODE_BY_TYPE,
  applyRecentSessionSignalsPatch,
  deriveSignalsFromExercise,
};
