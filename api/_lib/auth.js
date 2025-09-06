/** Return provided admin key from ?admin_key= or Authorization: Bearer */
export function providedAdminKey(req) {
  const fromQuery = (req.query?.admin_key || '').toString().trim();
  const auth = req.headers?.authorization || '';
  if (fromQuery) return fromQuery;
  if (/^Bearer\s+/i.test(auth)) return auth.replace(/^Bearer\s+/i, '').trim();
  return '';
}

export function requireAdmin(req, res) {
  const expected = (process.env.ADMIN_KEY || '').trim();
  const got = providedAdminKey(req);
  if (!expected || got !== expected) {
    res.status(401).json({ ok:false, error:'Unauthorized' });
    return false;
  }
  return true;
}