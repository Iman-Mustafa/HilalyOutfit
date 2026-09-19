// `npm run seed` - does explicitly what the server does on every boot. Never deletes data.
import { assertEnv } from '../config/env.js';
import { connectDB, disconnectDB } from '../config/db.js';
import { ensureSeed } from './ensure.js';

try {
  await assertEnv();
  await connectDB();
  const result = await ensureSeed({ log: (line) => console.log(`[seed] ${line}`) });
  console.log(`[seed] Imekamilika: bidhaa zilizoongezwa = ${result.productsInserted}, admin = ${result.admin}.`);
  await disconnectDB();
  process.exit(0);
} catch (err) {
  console.error(`[seed] Imeshindikana:\n${err.message}`);
  await disconnectDB();
  process.exit(1);
}
