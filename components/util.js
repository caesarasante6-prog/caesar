export const fd = (x) => (x ? new Date(x).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'Never');
export const H = { 'Content-Type': 'application/json' };
