// api/_lib/redis.js
import { createClient } from 'redis';

let clientPromise;

export async function getRedis() {
  if (!clientPromise) {
    const url = process.env.REDIS_URL;
    if (!url) throw new Error('REDIS_URL not set');
    const tls = url.startsWith('rediss://');
    const client = createClient({ url, socket: tls ? { tls: true } : {} });
    client.on('error', (e) => console.error('Redis error', e));
    clientPromise = client.connect().then(() => client);
  }
  return clientPromise;
}
