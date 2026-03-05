import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { getSourceStats } from '../../../lib/db';

export async function GET() {
  const cwd = process.cwd();
  const dataDir = path.join(cwd, 'data');

  const seedFiles: Record<string, string> = {};
  for (const f of ['seed-quran.json', 'seed-torah.json', 'seed-bible.json', 'seed-secular.json']) {
    const fp = path.join(dataDir, f);
    seedFiles[f] = fs.existsSync(fp)
      ? Math.round(fs.statSync(fp).size / 1024) + 'KB'
      : 'MISSING';
  }

  const stats = getSourceStats();
  const totalSources = stats.reduce((sum, s) => sum + s.count, 0);

  return NextResponse.json({
    cwd,
    dataDir,
    dataExists: fs.existsSync(dataDir),
    dataFiles: fs.existsSync(dataDir) ? fs.readdirSync(dataDir) : [],
    seedFiles,
    totalSources,
    sourcesByCategory: stats,
  });
}
