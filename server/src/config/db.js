import fs from 'node:fs';
import path from 'node:path';
import mongoose from 'mongoose';
import { env, SERVER_ROOT } from './env.js';

let memoryServer = null;

const HOW_TO_SET_URI = [
  '  Jinsi ya kurekebisha: fungua server/.env kisha weka MONGODB_URI, mfano:',
  '    MONGODB_URI=mongodb+srv://USER:PASS@cluster.mongodb.net/hilaly   (MongoDB Atlas - bure kwenye https://www.mongodb.com/atlas)',
  '    MONGODB_URI=mongodb://127.0.0.1:27017/hilaly                     (MongoDB iliyosakinishwa kwenye kompyuta hii)',
].join('\n');

// mongod clears `<dbPath>/_tmp` on every start and exits (code 100) when it cannot. On Windows
// that folder can stay locked by another program (antivirus, an editor's file watcher) after
// mongod was killed, which would leave the dev database unable to boot until a reboot.
function isUsableDbPath(dbPath) {
  try {
    fs.rmSync(path.join(dbPath, '_tmp'), { recursive: true, force: true });
    return true;
  } catch {
    return false;
  }
}

// Dev data lives in .data/db, or .data/db-2, db-3… when an earlier folder got locked.
// Always the highest-numbered one, so the choice stays the same from one start to the next.
function resolveDevDbPath() {
  const dataRoot = path.join(SERVER_ROOT, '.data');
  fs.mkdirSync(dataRoot, { recursive: true });

  const generations = fs.readdirSync(dataRoot)
    .map((name) => /^db(?:-(\d+))?$/.exec(name))
    .filter(Boolean)
    .map((match) => Number(match[1] || 1));
  let generation = Math.max(1, ...generations);

  let dbPath = path.join(dataRoot, generation === 1 ? 'db' : `db-${generation}`);
  if (fs.existsSync(dbPath) && !isUsableDbPath(dbPath)) {
    generation += 1;
    const lockedPath = dbPath;
    dbPath = path.join(dataRoot, `db-${generation}`);
    console.warn(
      `[db] ONYO: folda ya database ya majaribio imefungwa na programu nyingine: ${lockedPath}\n` +
        `[db] Inatumika folda mpya: ${dbPath} (data ya majaribio inaanza upya).`,
    );
  }

  fs.mkdirSync(dbPath, { recursive: true });
  return dbPath;
}

async function startMemoryServer() {
  const dbPath = resolveDevDbPath();

  const { MongoMemoryServer } = await import('mongodb-memory-server');
  // After a restart (e.g. `node --watch`) the previous mongod may need a moment to
  // release its lock on dbPath, so retry a few times before giving up.
  let lastError = null;
  for (let attempt = 1; attempt <= 4 && !memoryServer; attempt += 1) {
    try {
      memoryServer = await MongoMemoryServer.create({
        instance: { dbPath, storageEngine: 'wiredTiger', dbName: 'hilaly' },
        // Pin the mongod download here. By default the cache follows the folder the command
        // was started from, so `npm run dev:server` from the project root would download
        // the ~780 MB archive a second time.
        binary: { downloadDir: path.join(SERVER_ROOT, 'node_modules', '.cache', 'mongodb-memory-server') },
      });
    } catch (err) {
      lastError = err;
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }
  if (!memoryServer) throw lastError;

  console.warn(
    [
      '',
      '==================================================================',
      ' ONYO: MONGODB_URI haijawekwa - inatumika DATABASE YA MAJARIBIO',
      ' (mongodb-memory-server). Hii ni kwa DEVELOPMENT TU.',
      ` Data inahifadhiwa hapa: ${dbPath}`,
      ' Kwa matumizi halisi LAZIMA uweke MONGODB_URI kwenye server/.env.',
      '==================================================================',
      '',
    ].join('\n'),
  );

  return memoryServer.getUri('hilaly');
}

export async function connectDB() {
  mongoose.set('strictQuery', true);

  let uri = env.MONGODB_URI;
  let usingMemoryServer = false;

  if (!uri) {
    if (env.isProduction) {
      throw new Error(`MONGODB_URI haijawekwa. Kwenye production server haiwezi kuwaka bila database halisi.\n${HOW_TO_SET_URI}`);
    }
    try {
      console.log('[db] MONGODB_URI ni tupu - inawasha database ya majaribio (mara ya kwanza hupakua MongoDB, subiri dakika chache)...');
      uri = await startMemoryServer();
      usingMemoryServer = true;
    } catch (err) {
      throw new Error(
        `Imeshindwa kuwasha database ya majaribio (mongodb-memory-server): ${err.message}\n${HOW_TO_SET_URI}`,
      );
    }
  }

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 15000,
      // Dev database only: acknowledge a write only once it is in the on-disk journal, so
      // nothing is lost when the process is killed (Ctrl+C, `node --watch` restart, crash).
      ...(usingMemoryServer ? { w: 1, journal: true } : {}),
    });
  } catch (err) {
    throw new Error(`Imeshindwa kuunganisha MongoDB: ${err.message}\n${HOW_TO_SET_URI}`);
  }

  console.log(`[db] MongoDB imeunganishwa${usingMemoryServer ? ' (database ya majaribio)' : ''}.`);
  return { usingMemoryServer };
}

export async function disconnectDB() {
  if (memoryServer && mongoose.connection.readyState === 1) {
    // mongodb-memory-server stops mongod by killing it. Ask for a clean shutdown first so the
    // persistent dbPath is flushed; the command drops the connection, hence the ignored error.
    await mongoose.connection.db.admin().command({ shutdown: 1, force: true }).catch(() => {});
  }
  await mongoose.disconnect().catch(() => {});
  if (memoryServer) {
    // doCleanup:false keeps the persistent dbPath so local data survives restarts.
    await memoryServer.stop({ doCleanup: false, force: false }).catch(() => {});
    memoryServer = null;
  }
}
