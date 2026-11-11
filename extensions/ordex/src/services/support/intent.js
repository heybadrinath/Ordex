export function isReturnPolicyQuestion(value) {
  const text = String(value || '').toLowerCase();
  if (/\b(?:start|submit|initiate|create)\s+(?:a\s+)?return\b/.test(text))
    return false;
  return (
    /\breturn\s+(?:window|period|policy|process|procedure|steps)\b/.test(text) ||
    /\b(?:steps|process|procedure)\b.{0,50}\breturn\b/.test(text) ||
    /\bhow\s+(?:do|can|long|many)\b.{0,45}\breturn\b/.test(text) ||
    /\bwhat\b.{0,45}\breturn\b.{0,50}\b(?:steps|process|procedure|window|period)\b/.test(text)
  );
}
