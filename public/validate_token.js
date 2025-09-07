import { getRedis } from '../_lib/redis.js';
import { maleCandidates, femaleCandidates } from '../_lib/config.js';
import { getJson } from '../_lib/http.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ok:false,error:'Method not allowed'});
  try {
    const { token } = await getJson(req);
    if (!token) return res.status(400).json({ ok:false, error:'Missing token'});
    const redis = await getRedis();
    const raw = await redis.get(`token:${token}`);
    if (!raw) return res.status(404).json({ ok:false, error:'Invalid token'});
    const rec = JSON.parse(raw);
    if (rec.used) return res.status(409).json({ ok:false, error:'Token already used' });

    let rule = 'unknown';
    if (rec.role === 'male') rule = 'vote_one_male';
    if (rec.role === 'female') rule = 'vote_one_female';
    if (rec.role === 'teacher') rule = 'vote_one_each';

    res.status(200).json({ ok:true, role: rec.role, rule, maleCandidates, femaleCandidates });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok:false, error:'Server error' });
  }
}
