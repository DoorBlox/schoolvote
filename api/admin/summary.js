import { getRedis } from '../_lib/redis.js';
import { requireAdmin } from '../_lib/auth.js';
import { maleCandidates, femaleCandidates } from '../_lib/config.js';

async function counters(redis, prefix, names) {
  const out = {};
  for (const name of names) {
    const n = await redis.get(`${prefix}:${name}`);
    out[name] = Number(n||0);
  }
  return out;
}

export default async function handler(req, res) {
  if (!requireAdmin(req,res)) return;
  if (req.method !== 'GET') return res.status(405).json({ok:false,error:'Method not allowed'});
  try {
    const redis = await getRedis();
    const totals = {
      male: await counters(redis, 'count:m', maleCandidates),
      female: await counters(redis, 'count:f', femaleCandidates)
    };
    const tokensTotal = await redis.sCard('tokens:all');

    // compute unused
    let unused = 0;
    const tokens = await redis.sMembers('tokens:all');
    if (tokens.length) {
      const raws = await redis.mGet(tokens.map(t=>`token:${t}`));
      for (const r of raws) {
        if (!r) continue;
        const rec = JSON.parse(r);
        if (!rec.used) unused++;
      }
    }
    res.status(200).json({ ok:true, totals, tokens_total: tokensTotal, tokens_unused: unused });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok:false, error:'Server error' });
  }
}
