// Consistent 'YYYY-MM-DD' date string helpers (UTC-based to avoid server timezone drift)
function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function daysBetween(dateStrA, dateStrB) {
  const a = new Date(dateStrA + 'T00:00:00.000Z');
  const b = new Date(dateStrB + 'T00:00:00.000Z');
  const diffMs = b.getTime() - a.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

module.exports = { todayStr, daysBetween };
