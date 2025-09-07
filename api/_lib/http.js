/** Safely get JSON body (works whether req.body exists or not) */
export async function getJson(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  const text = await new Promise((resolve) => {
    let buf = '';
    req.on('data', (c) => (buf += c));
    req.on('end', () => resolve(buf || ''));
  });
  try { return JSON.parse(text || '{}'); } catch { return {}; }
}
