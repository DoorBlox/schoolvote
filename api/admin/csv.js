import { getRedis } from '../_lib/redis.js';
import { requireAdmin } from '../_lib/auth.js';

export default async function handler(req, res) {
  if (!requireAdmin(req,res)) return;
  try {
    const redis = await getRedis();
    const list = await redis.lRange('votes', 0, -1);
    const rows = list.map(x => JSON.parse(x));

    const header = ['timestamp','token','role','male_vote','female_vote'];
    const lines = [header.join(',')];
    for (const v of rows) {
      const cols = [
        new Date(v.timestamp).toISOString(),
        v.token,
        v.role,
        v.male || '',
        v.female || ''
      ].map(s => '"' + String(s).replaceAll('"','""') + '"');
      lines.push(cols.join(','));
    }
    const csv = lines.join('\n');
    res.setHeader('content-type','text/csv; charset=utf-8');
    const now = new Date();
    const fname = `Votes-${now.toTimeString().split(' ')[0].replaceAll(':','')}-${now.toISOString().slice(0,10)}.csv`;
    res.setHeader('content-disposition',`attachment; filename="${fname}"`);
    res.status(200).end(csv);
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok:false, error:'Server error' });
  }
}
