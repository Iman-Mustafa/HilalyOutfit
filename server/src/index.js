import { env, assertEnv } from './config/env.js';
import { connectDB, disconnectDB } from './config/db.js';
import { cloudinaryEnabled } from './config/cloudinary.js';
import { ensureSeed } from './seed/ensure.js';
import app from './app.js';

let server = null;
let shuttingDown = false;

async function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`\n[server] ${signal} - inazima...`);
  const forceExit = setTimeout(() => process.exit(1), 10000);
  forceExit.unref();
  if (server) await new Promise((resolve) => server.close(resolve));
  await disconnectDB();
  process.exit(0);
}

async function main() {
  await assertEnv();
  await connectDB();
  await ensureSeed({ log: (line) => console.log(`[seed] ${line}`) });

  server = app.listen(env.PORT, () => {
    console.log(`[server] Hilaly Outfit API inasikiliza: http://localhost:${env.PORT}/api  (${env.NODE_ENV})`);
    console.log(`[server] Malipo: ${env.PAYMENT_DRIVER} | Cloudinary: ${cloudinaryEnabled ? 'imewashwa' : 'haijasanidiwa (tumia kiungo cha picha)'}`);
  });
  server.on('error', async (err) => {
    if (err.code === 'EADDRINUSE') console.error(`[server] Port ${env.PORT} inatumika tayari. Badilisha PORT kwenye server/.env au zima programu inayoitumia.`);
    else console.error('[server] Hitilafu ya server:', err);
    await disconnectDB();
    process.exit(1);
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('unhandledRejection', (reason) => console.error('[server] unhandledRejection:', reason));

main().catch(async (err) => {
  console.error(`\n[server] Imeshindwa kuwaka:\n${err.message}\n`);
  await disconnectDB();
  process.exit(1);
});
