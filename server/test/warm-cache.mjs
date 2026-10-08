// Warms the mongodb-memory-server binary cache so `npm run smoke` can run offline afterwards.
import { MongoMemoryServer } from 'mongodb-memory-server';
const s = await MongoMemoryServer.create();
console.log('READY', s.getUri());
await s.stop();
