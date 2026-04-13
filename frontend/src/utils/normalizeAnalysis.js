// /**
//  * normalizeAnalysis
//  *
//  * History items stored in the DB sometimes come back with array fields
//  * serialized as JSON strings (e.g. matched_skills = '["Python","React"]')
//  * instead of real arrays. This utility ensures every field is always the
//  * correct JS type before any component tries to render it.
//  *
//  * Call this on every object before passing it to analysisData state:
//  *   - fresh API response  → res.data.data
//  *   - history item loaded → item from historyList
//  */
export function normalizeAnalysis(data) {
  if (!data) return data;

  return {
    ...data,
    matched_skills:    parseArray(data.matched_skills),
    missing_skills:    parseArray(data.missing_skills),
    ats_feedback:      parseArray(data.ats_feedback),
    rewritten_bullets: parseArray(data.rewritten_bullets),
  };
}

/**
 * parseArray
 * Accepts: real array | JSON string | null | undefined
 * Returns: always a real array (empty array as fallback)
 */
function parseArray(value) {
  if (Array.isArray(value)) return value;          // already fine
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}
