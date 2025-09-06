import { getRedis } from '../_lib/redis.js';
import { requireAdmin } from '../_lib/auth.js';
import { roles } from '../_lib/config.js';
import { customAlphabet } from 'nanoid';

const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';

export default async function handler(req, res) {
  if (!requireAdmin(req,res)) return;
  if (req.method !== 'POST') return res.status(405).json({ok:false,error:'Method not allowed'});
  try {
    const redis = await getRedis();
    const { role, count=0 } = req.body || {};
    const c = Number(count) || 0;
    if (!roles.includes(role)) return res.status(400).json({ ok:false, error:'Invalid role'});
    if (c <= 0 || c > 2000) return res.status(400).json({ ok:false, error:'Count out of range'});

    const tokens = [];
    const now = Date.now();
    for (let i=0;i<c;i++) {
      const token = customAlphabet(alphabet, 8)();
      const doc = { token, role, used:false, createdAt: now };
      await redis.set(`token:${token}`, JSON.stringify(doc));
      await redis.sAdd('tokens:all', token);
      await redis.sAdd(`tokens:role:${role}`, token);
      tokens.push(token);
    }
    res.status(200).json({ ok:true, tokens });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok:false, error:'Server error' });
  }
}