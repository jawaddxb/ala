import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

export async function GET() {
  const cwd = process.cwd();
  const dataDir = path.join(cwd, 'data');
  const files = fs.existsSync(dataDir) ? fs.readdirSync(dataDir) : [];
  
  const seedFiles: Record<string, number | string> = {};
  for (const f of ['seed-quran.json','seed-torah.json','seed-bible.json','seed-secular.json']) {
    const fp = path.join(dataDir, f);
    if (fs.existsSync(fp)) {
      seedFiles[f] = Math.round(fs.statSync(fp).size / 1024) + 'KB';
    } else {
      seedFiles[f] = 'MISSING';
    }
  }
  
  return NextResponse.json({
    cwd,
    dataDir,
    dataExists: fs.existsSync(dataDir),
    files,
    seedFiles,
  });
}
