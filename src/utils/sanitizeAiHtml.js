import DOMPurify from 'dompurify';

/**
 * Sanitizácia HTML z AI výstupu pred vložením do DOM (mitigácia XSS).
 * @param {string} dirty
 * @returns {string}
 */
export function sanitizeAiHtml(dirty) {
  if (dirty == null || typeof dirty !== 'string') return '';
  return DOMPurify.sanitize(dirty, {
    USE_PROFILES: { html: true },
    ADD_ATTR: ['target'],
    FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover'],
  });
}
