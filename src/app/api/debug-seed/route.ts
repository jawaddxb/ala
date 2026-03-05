import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import db, { seedScriptureIfEmpty } from '../../../lib/db';

export async function GET() {
  const cwd = process.cwd();
  const dataDir = path.join(cwd, 'data');

  console.log(`[DEBUG-SEED] CWD: ${cwd}`);
  console.log(`[DEBUG-SEED] Data Dir: ${dataDir}`);
  console.log(`[DEBUG-SEED] Data Dir Exists: ${fs.existsSync(dataDir)}`);

  if (fs.existsSync(dataDir)) {
    console.log(`[DEBUG-SEED] Data Dir Contents: ${fs.readdirSync(dataDir).join(', ')}`);
  } else {
    console.log('[DEBUG-SEED] Data directory does NOT exist.');
  }

  seedScriptureIfEmpty();

  const currentSourcesCount = (db.prepare('SELECT COUNT(*) as c FROM sources').get() as { c: number }).c;

  const seedFiles: Record<string, string> = {};
  for (const f of ['seed-quran.json', 'seed-torah.json', 'seed-bible.json', 'seed-secular.json']) {
    const fp = path.join(dataDir, f);
    seedFiles[f] = fs.existsSync(fp)
      ? Math.round(fs.statSync(fp).size / 1024) + 'KB'
      : 'MISSING';
  }

  return NextResponse.json({
    cwd,
    dataDir,
    dataExists: fs.existsSync(dataDir),
    seedFiles,
    currentSourcesCount,
    seedInvoked: true,
  });
}
