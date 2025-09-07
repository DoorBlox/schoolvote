import { getRedis } from '../_lib/redis.js';
import { requireAdmin } from '../_lib/auth.js';
import { getJson } from '../_lib/http.js';

export default async function handler(req, res) {
  if (!requireAdmin(req,res)) return;
  if (req.method !== 'POST') return res.status(405).json({ok:false,error:'Method not allowed'});
  try {
    const { token } = await getJson(req);
    if (!token) return res.status(400).json({ok:false,error:'Missing token'});
    const redis = await getRedis();
    const key = `token:${token}`;
    const raw = await redis.get(key);
    if (raw) {
      const rec = JSON.parse(raw);
      await redis.sRem('tokens:all', token);
      await redis.sRem(`tokens:role:${rec.role}`, token);
      await redis.del(key);
    }
    res.status(200).json({ ok:true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok:false, error:'Server error' });
  }
}
