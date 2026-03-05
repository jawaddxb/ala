import { NextRequest, NextResponse } from 'next/server';
import db, { Source } from '@/lib/db';

export interface KnowledgeResponse {
  sources: Source[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  stats: {
    source: string;
    count: number;
    label: string;
  }[];
  books: string[];
}

const SOURCE_LABELS: Record<string, string> = {
  quran: 'Quran',
  bible: 'Bible (KJV)',
  torah: 'Torah/Tanakh',
  hadith_bukhari: 'Sahih al-Bukhari',
  hadith_muslim: 'Sahih Muslim',
};

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const source = searchParams.get('source') || 'all';
    const book = searchParams.get('book') || '';
    const chapter = searchParams.get('chapter') || '';
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Build query
    let whereClause = '1=1';
    const params: (string | number)[] = [];

    if (source && source !== 'all') {
      whereClause += ' AND source = ?';
      params.push(source);
    }

    if (book) {
      whereClause += ' AND book = ?';
      params.push(book);
    }

    if (chapter) {
      whereClause += ' AND chapter = ?';
      params.push(parseInt(chapter));
    }

    if (search) {
      const terms = search.trim().split(/\s+/).filter(Boolean);
      for (const term of terms) {
        whereClause += ' AND (text LIKE ? OR reference LIKE ?)';
        params.push(`%${term}%`, `%${term}%`);
      }
    }

    // Get total count
    const countStmt = db.prepare(`SELECT COUNT(*) as count FROM sources WHERE ${whereClause}`);
    const { count } = countStmt.get(...params) as { count: number };

    // Get paginated results
    const offset = (page - 1) * limit;
    const orderBy = source === 'hadith_bukhari' || source === 'hadith_muslim'
      ? 'number ASC'
      : 'chapter ASC, verse ASC';
    
    const stmt = db.prepare(`SELECT * FROM sources WHERE ${whereClause} ORDER BY ${orderBy} LIMIT ? OFFSET ?`);
    const sources = stmt.all(...params, limit, offset) as Source[];

    // Get stats
    const statsStmt = db.prepare('SELECT source, COUNT(*) as count FROM sources GROUP BY source ORDER BY count DESC');
    const rawStats = statsStmt.all() as { source: string; count: number }[];
    const stats = rawStats.map(s => ({
      ...s,
      label: SOURCE_LABELS[s.source] || s.source,
    }));

    // Get books for selected source
    let books: string[] = [];
    if (source && source !== 'all') {
      const booksStmt = db.prepare('SELECT DISTINCT book FROM sources WHERE source = ? AND book IS NOT NULL ORDER BY book');
      books = (booksStmt.all(source) as { book: string }[]).map(b => b.book);
    }

    const totalPages = Math.ceil(count / limit);

    return NextResponse.json({
      sources,
      total: count,
      page,
      limit,
      totalPages,
      stats,
      books,
    } as KnowledgeResponse);
  } catch (error) {
    console.error('Knowledge API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sources' },
      { status: 500 }
    );
  }
}
