import { getRedis } from '../_lib/redis.js';
import { maleCandidates, femaleCandidates } from '../_lib/config.js';
import { getJson } from '../_lib/http.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ok:false,error:'Method not allowed'});
  try {
    const { token, male, female } = await getJson(req);
    if (!token) return res.status(400).json({ ok:false, error:'Missing token'});
    const redis = await getRedis();
    const key = `token:${token}`;
    const raw = await redis.get(key);
    if (!raw) return res.status(404).json({ ok:false, error:'Invalid token'});
    const rec = JSON.parse(raw);
    if (rec.used) return res.status(409).json({ ok:false, error:'Token already used' });

    if (rec.role === 'male') {
      if (!male || !maleCandidates.includes(male)) return res.status(400).json({ ok:false, error:'Pick exactly one male candidate' });
    } else if (rec.role === 'female') {
      if (!female || !femaleCandidates.includes(female)) return res.status(400).json({ ok:false, error:'Pick exactly one female candidate' });
    } else if (rec.role === 'teacher') {
      if (!male || !female || !maleCandidates.includes(male) || !femaleCandidates.includes(female)) {
        return res.status(400).json({ ok:false, error:'Pick one male and one female candidate' });
      }
    } else {
      return res.status(400).json({ ok:false, error:'Unknown role' });
    }

    const now = Date.now();
    rec.used = true;
    rec.timestamp = now;
    if (male) rec.male = male;
    if (female) rec.female = female;
    await redis.set(key, JSON.stringify(rec));
    if (male) await redis.incr(`count:m:${male}`);
    if (female) await redis.incr(`count:f:${female}`);
    await redis.rPush('votes', JSON.stringify({ token, role: rec.role, timestamp: now, male, female }));

    res.status(200).json({ ok:true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok:false, error:'Server error' });
  }
}
