export function weddingDayState(env, now = Date.now()) {
  const startValue = env.WEDDING_DAY_START || '2026-10-20T00:00:00+07:00';
  const endValue = env.WEDDING_DAY_END || '2026-10-21T06:00:00+07:00';
  const start = Date.parse(startValue);
  const end = Date.parse(endValue);
  const configured = Number.isFinite(start) && Number.isFinite(end) && end > start;
  return {
    configured,
    active: configured && now >= start && now <= end,
    start: configured ? new Date(start).toISOString() : '',
    end: configured ? new Date(end).toISOString() : '',
  };
}
