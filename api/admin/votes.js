import { getRedis } from '../_lib/redis.js';
import { requireAdmin } from '../_lib/auth.js';

export default async function handler(req, res) {
  if (!requireAdmin(req,res)) return;
  if (req.method !== 'GET') return res.status(405).json({ok:false,error:'Method not allowed'});
  try {
    const redis = await getRedis();
    const n = Math.min(5000, Number(req.query?.limit || 200));
    const list = await redis.lRange('votes', -n, -1);
    const rows = list.map(x => JSON.parse(x));
    res.status(200).json({ ok:true, rows });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok:false, error:'Server error' });
  }
}
