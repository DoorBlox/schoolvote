import { getRedis } from '../_lib/redis.js';
import { requireAdmin } from '../_lib/auth.js';

export default async function handler(req, res) {
  if (!requireAdmin(req,res)) return;
  if (req.method !== 'GET') return res.status(405).json({ok:false,error:'Method not allowed'});
  try {
    const redis = await getRedis();
    const role = (req.query?.role || '').toString().trim();
    const setKey = role ? `tokens:role:${role}` : 'tokens:all';
    const tokens = await redis.sMembers(setKey);
    tokens.sort();
    const keys = tokens.map(t => `token:${t}`);
    const raws = keys.length ? await redis.mGet(keys) : [];
    const items = [];
    for (let i=0;i<tokens.length;i++) {
      const rec = raws[i] ? JSON.parse(raws[i]) : null;
      if (rec) items.push({ token: rec.token, role: rec.role, used: !!rec.used });
    }
    res.status(200).json({ ok:true, items });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok:false, error:'Server error' });
  }
}
