import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { getSourceStats, createKnowledgeDoc, getKnowledgeDocs } from '../../../lib/db';

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

export async function POST() {
  const docs: Array<{ id: string; title: string; content: string; doc_type: 'briefing'; category: string; is_approved: number }> = [
    { id: 'knowledge-iran-war-2026', title: 'The Iran-Israel-US War (March 2026)', content: "On March 1, 2026, the US and Israel began military strikes on Iran. Iran controls the Strait of Hormuz — 20% of global oil supply. Bitcoin jumped above $71,000 as war broke out. Dubai's real estate hit record highs as capital fled to stable jurisdictions.", doc_type: 'briefing', category: 'geopolitics', is_approved: 1 },
    { id: 'knowledge-btc-war-hedge', title: 'Bitcoin in Wartime: The Ultimate Hedge', content: 'Bitcoin climbed above $71,000 on March 4, 2026, surging 6%+ in 24 hours as the Iran-Israel-US war erupted. The 21 million cap is a promise that no government can break, regardless of what war they start.', doc_type: 'briefing', category: 'crypto', is_approved: 1 },
    { id: 'knowledge-oil-hormuz-2026', title: 'Strait of Hormuz Crisis 2026', content: "The 2026 Strait of Hormuz crisis is a direct consequence of the US-Israel strikes on Iran. Oil prices surged. Goldman Sachs revised its inflation forecast upward. The Fed's rate cut plans are now in jeopardy.", doc_type: 'briefing', category: 'finance', is_approved: 1 },
    { id: 'knowledge-dubai-2026', title: "Dubai's Safe Haven Moment (March 2026)", content: "As war broke out in March 2026, Dubai proved its thesis: pragmatic governance attracts capital when ideology fails. Emaar Properties hit a record high. Dubai has zero income tax and geographic distance from the conflict.", doc_type: 'briefing', category: 'geopolitics', is_approved: 1 },
    { id: 'knowledge-ai-agents-2026', title: 'The AI Agent Revolution (2026)', content: 'OpenAI crossed $25 billion in annualized revenue as of early March 2026. The next phase is autonomous AI agents: systems that plan, execute, and complete multi-step tasks without human oversight.', doc_type: 'briefing', category: 'technology', is_approved: 1 },
  ];
  const existing = getKnowledgeDocs();
  const existingIds = new Set(existing.map((d: { id: string }) => d.id));
  let inserted = 0;
  for (const doc of docs) {
    if (!existingIds.has(doc.id)) {
      createKnowledgeDoc(doc);
      inserted++;
    }
  }
  const after = getKnowledgeDocs();
  return NextResponse.json({ inserted, total: after.length, titles: after.map((d: { title: string }) => d.title) });
}
