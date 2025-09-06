import { getRedis } from '../_lib/redis.js';
import { requireAdmin } from '../_lib/auth.js';

async function delPattern(redis, pattern) {
  let cursor = 0;
  do {
    const [next, keys] = await redis.scan(cursor, { MATCH: pattern, COUNT: 500 });
    cursor = Number(next);
    if (keys.length) await redis.del(...keys);
  } while (cursor !== 0);
}

export default async function handler(req, res) {
  if (!requireAdmin(req,res)) return;
  if (req.method !== 'POST') return res.status(405).json({ok:false,error:'Method not allowed'});
  try {
    const redis = await getRedis();
    await delPattern(redis, 'token:*');
    await delPattern(redis, 'count:m:*');
    await delPattern(redis, 'count:f:*');
    await delPattern(redis, 'count:t:*');
    await redis.del(['tokens:all','tokens:role:male','tokens:role:female','tokens:role:teacher','votes']);
    res.status(200).json({ ok:true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok:false, error:'Server error' });
  }
}