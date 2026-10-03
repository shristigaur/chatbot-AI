export function toText(value) {
  if (typeof value === 'string') return value;
  if (value === null || value === undefined) return '';
  if (Array.isArray(value)) return value.map(toText).filter(Boolean).join('');
  if (typeof value === 'object') {
    if (typeof value.text === 'string') return value.text;
    if (value.content !== undefined) return toText(value.content);
    if (value.error?.message !== undefined) return toText(value.error.message);
    try { return JSON.stringify(value); } catch { return ''; }
  }
  return String(value);
}