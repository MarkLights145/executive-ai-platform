/**
 * Phase 4: Role policy — USER is restricted to status/ETA/progress; off-script triggers escalation.
 * No secret values.
 */

const USER_ALLOWED_PATTERNS = [
  /\bstatus\b/i,
  /\beta\b/i,
  /\bprogress\b/i,
  /\bhow\s+long\b/i,
  /\bwhen\s+will\b/i,
  /\bwhen\s+can\b/i,
  /\bestimate\b/i,
  /\bcompletion\b/i,
  /\bdone\b/i,
  /\bupdate\b/i,
  /\bwhere\s+(is|are)\b/i,
];

/**
 * Returns true if the message is allowed for a USER role (status/ETA/progress style).
 * ADMIN is not restricted (checked by caller).
 */
export function isAllowedUserMessage(messageText: string): boolean {
  const t = (messageText || "").trim();
  if (!t) return false;
  return USER_ALLOWED_PATTERNS.some((re) => re.test(t));
}
