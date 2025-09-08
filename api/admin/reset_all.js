import { getRedis } from '../_lib/redis.js';
import { requireAdmin } from '../_lib/auth.js';

export default async function handler(req, res) {
  if (!requireAdmin(req,res)) return;
  if (req.method !== 'POST') return res.status(405).json({ok:false,error:'Method not allowed'});
  try {
    const redis = await getRedis();

    // Delete token docs
    const delKeys = [];
    for await (const key of redis.scanIterator({ MATCH: 'token:*', COUNT: 500 })) {
      delKeys.push(key);
      if (delKeys.length >= 1000) { await redis.del(delKeys); delKeys.length = 0; }
    }
    if (delKeys.length) await redis.del(delKeys);

    // Delete counters
    const delCnt = [];
    for await (const key of redis.scanIterator({ MATCH: 'count:*', COUNT: 500 })) {
      delCnt.push(key);
      if (delCnt.length >= 1000) { await redis.del(delCnt); delCnt.length = 0; }
    }
    if (delCnt.length) await redis.del(delCnt);

    // Delete sets+list
    await redis.del('tokens:all','tokens:role:male','tokens:role:female','tokens:role:teacher','votes');

    res.status(200).json({ ok:true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok:false, error:String(e.message||e) });
  }
}
