import { createClient } from 'redis';

let _clientPromise;

/** Get a shared Redis client across invocations */
export async function getRedis() {
  if (!_clientPromise) {
    const url = process.env.REDIS_URL;
    if (!url) throw new Error('REDIS_URL not set');
    const client = createClient({ url });
    client.on('error', (e) => console.error('Redis error', e));
    _clientPromise = client.connect().then(() => client);
  }
  return _clientPromise;
}