'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { 
  Book, 
  Search, 
  ChevronLeft, 
  ChevronRight,
  Sparkles,
  BookOpen,
  ScrollText,
  Library,
  Filter,
  X,
  CheckCircle,
  Info,
  ArrowLeft
} from 'lucide-react';
import type { KnowledgeResponse } from '../api/knowledge/route';
import type { Source } from '@/lib/db';

const SOURCE_CONFIG: Record<string, { 
  icon: React.ReactNode; 
  label: string; 
  color: string;
  description: string;
  verification: string;
}> = {
  quran: { 
    icon: <Book className="w-5 h-5" />, 
    label: 'Quran',
    color: 'bg-emerald-500',
    description: 'The Holy Quran - Sahih International Translation',
    verification: 'Source: Quran.com API v4 • Translation: Sahih International (widely recognized for accuracy)'
  },
  bible: { 
    icon: <BookOpen className="w-5 h-5" />, 
    label: 'Bible (KJV)',
    color: 'bg-blue-500',
    description: 'King James Version - Old & New Testament',
    verification: 'Source: Public Domain • Translation: King James Version (1611) - Standard academic reference'
  },
  torah: { 
    icon: <ScrollText className="w-5 h-5" />, 
    label: 'Torah/Tanakh',
    color: 'bg-amber-500',
    description: 'Hebrew Bible - JPS Translation',
    verification: 'Source: Sefaria.org API • Translation: JPS TANAKH Gender-Sensitive Edition (2023)'
  },
  'hadith-bukhari': { 
    icon: <Library className="w-5 h-5" />, 
    label: 'Sahih al-Bukhari',
    color: 'bg-purple-500',
    description: 'Authentic Hadith Collection by Imam Bukhari',
    verification: 'Source: Sunnah.com • Grade: Sahih (Authentic) - Most authenticated hadith collection'
  },
  'hadith-muslim': { 
    icon: <Library className="w-5 h-5" />, 
    label: 'Sahih Muslim',
    color: 'bg-pink-500',
    description: 'Authentic Hadith Collection by Imam Muslim',
    verification: 'Source: Sunnah.com • Grade: Sahih (Authentic) - Second most authenticated collection'
  },
  secular: {
    icon: <Library className="w-5 h-5" />,
    label: 'Secular Wisdom',
    color: 'bg-gray-500',
    description: 'Stoics, Austrian economists, and Bitcoin thinkers',
    verification: 'Source: Public domain works — Marcus Aurelius, Taleb, Hayek, Nakamoto, and others'
  },
};

export default function KnowledgePage() {
  const [data, setData] = useState<KnowledgeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [selectedBook, setSelectedBook] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [page, setPage] = useState(1);
  const [showInfo, setShowInfo] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('source', selectedSource);
      params.set('page', page.toString());
      params.set('limit', '50');
      if (selectedBook) params.set('book', selectedBook);
      if (debouncedSearch) params.set('search', debouncedSearch);

      const res = await fetch(`/api/knowledge?${params}`);
      const json = await res.json();
      setData(json);
    } catch (error) {
      console.error('Error fetching knowledge:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedSource, selectedBook, debouncedSearch, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Reset book when source changes
  useEffect(() => {
    setSelectedBook('');
    setPage(1);
  }, [selectedSource]);

  const formatNumber = (n: number) => n.toLocaleString();

  const renderSourceText = (source: Source) => {
    // Clean HTML from text
    const cleanText = source.text.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    return cleanText;
  };

  const getSourceBadge = (sourceType: string) => {
    const config = SOURCE_CONFIG[sourceType];
    if (!config) return null;
    return (
      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium text-white ${config.color}`}>
        {config.icon}
        {config.label}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0">
              <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors shrink-0 min-w-[44px] min-h-[44px]">
                <ArrowLeft className="w-4 h-4" />
                <img
                  src="/ala-logo.jpg"
                  alt="ALA"
                  className="hidden sm:block"
                  style={{ width: 72, height: 'auto', borderRadius: 8, display: 'block', objectFit: 'contain' }}
                />
              </Link>
              <div className="h-6 w-px bg-border hidden sm:block" />
              <div className="flex items-center gap-2 min-w-0">
                <Library className="w-5 h-5 sm:w-6 sm:h-6 text-primary shrink-0" />
                <h1 className="text-base sm:text-xl font-semibold truncate">Knowledge Library</h1>
              </div>
            </div>
            <button
              onClick={() => setShowInfo(!showInfo)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors shrink-0 min-h-[44px]"
            >
              <Info className="w-4 h-4" />
              <span className="hidden sm:inline">About Sources</span>
            </button>
          </div>
        </div>
      </header>

      {/* Info Panel */}
      {showInfo && (
        <div className="border-b border-border bg-muted/30">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold mb-1">Verified Source Material</h2>
                <p className="text-sm text-muted-foreground">
                  All texts are sourced from authoritative, academically-respected repositories.
                </p>
              </div>
              <button
                onClick={() => setShowInfo(false)}
                className="p-1 hover:bg-muted rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(SOURCE_CONFIG).map(([key, config]) => (
                <div key={key} className="p-4 bg-card rounded-lg border">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`p-2 rounded-lg ${config.color} text-white`}>
                      {config.icon}
                    </div>
                    <h3 className="font-medium">{config.label}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{config.description}</p>
                  <div className="flex items-start gap-1.5 text-xs text-green-600 dark:text-green-400">
                    <CheckCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                    <span>{config.verification}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Stats Bar */}
      <div className="border-b border-border bg-surface/50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground mr-2 hidden sm:inline">Browse:</span>
            <button
              onClick={() => setSelectedSource('all')}
              className={`px-3 py-2 sm:py-1.5 rounded-full text-sm font-medium transition-colors min-h-[44px] sm:min-h-0 ${
                selectedSource === 'all' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted hover:bg-muted/80'
              }`}
            >
              All ({data?.stats.reduce((acc, s) => acc + s.count, 0)?.toLocaleString() || '...'})
            </button>
            {data?.stats.map((stat) => (
              <button
                key={stat.source}
                onClick={() => setSelectedSource(stat.source)}
                className={`px-3 py-2 sm:py-1.5 rounded-full text-sm font-medium transition-colors min-h-[44px] sm:min-h-0 ${
                  selectedSource === stat.source 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted hover:bg-muted/80'
                }`}
              >
                {stat.label} ({formatNumber(stat.count)})
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar Filters */}
          <aside className="lg:w-64 flex-shrink-0">
            <div className="sticky top-32 space-y-6">
              {/* Search */}
              <div>
                <label className="text-sm font-medium mb-2 block">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search texts..."
                    className="w-full pl-10 pr-4 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                    >
                      <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                    </button>
                  )}
                </div>
              </div>

              {/* Book Filter */}
              {data?.books && data.books.length > 0 && (
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    <Filter className="w-4 h-4 inline mr-1" />
                    Filter by Book
                  </label>
                  <select
                    value={selectedBook}
                    onChange={(e) => {
                      setSelectedBook(e.target.value);
                      setPage(1);
                    }}
                    className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">All Books</option>
                    {data.books.map((book) => (
                      <option key={book} value={book}>
                        {book}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Current Selection */}
              {selectedSource !== 'all' && (
                <div className="p-4 bg-card border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    {getSourceBadge(selectedSource)}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {SOURCE_CONFIG[selectedSource]?.description}
                  </p>
                </div>
              )}
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {/* Results Header */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">
                {loading ? 'Loading...' : `${formatNumber(data?.total || 0)} results`}
                {debouncedSearch && ` for "${debouncedSearch}"`}
              </p>
              {data && data.totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    Page {page} of {data.totalPages}
                  </span>
                </div>
              )}
            </div>

            {/* Results List */}
            {loading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="p-4 border rounded-lg animate-pulse">
                    <div className="h-4 bg-muted rounded w-1/4 mb-3" />
                    <div className="h-4 bg-muted rounded w-full mb-2" />
                    <div className="h-4 bg-muted rounded w-3/4" />
                  </div>
                ))}
              </div>
            ) : data?.sources.length === 0 ? (
              <div className="text-center py-12">
                <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No results found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your search or filters
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {data?.sources.map((source) => (
                  <div
                    key={source.id}
                    className="p-4 bg-card border rounded-lg hover:border-primary/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <span className="text-sm font-medium text-primary">
                        {source.reference}
                      </span>
                      {selectedSource === 'all' && getSourceBadge(source.source)}
                    </div>
                    <p className="text-foreground leading-relaxed">
                      {renderSourceText(source)}
                    </p>
                    {source.category && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        Category: {source.category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {data && data.totalPages > 1 && (
              <div className="flex items-center justify-center gap-1 sm:gap-2 mt-8 flex-wrap">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="flex items-center gap-1 px-3 sm:px-4 py-2 border rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">Previous</span>
                </button>
                <div className="flex items-center gap-1">
                  {[...Array(Math.min(5, data.totalPages))].map((_, i) => {
                    let pageNum: number;
                    if (data.totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (page <= 3) {
                      pageNum = i + 1;
                    } else if (page >= data.totalPages - 2) {
                      pageNum = data.totalPages - 4 + i;
                    } else {
                      pageNum = page - 2 + i;
                    }
                    return (
                      <button
                        key={i}
                        onClick={() => setPage(pageNum)}
                        className={`w-10 h-10 min-w-[44px] min-h-[44px] rounded-lg ${
                          page === pageNum
                            ? 'bg-primary text-primary-foreground'
                            : 'hover:bg-muted'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => setPage(p => Math.min(data.totalPages, p + 1))}
                  disabled={page === data.totalPages}
                  className="flex items-center gap-1 px-3 sm:px-4 py-2 border rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
                >
                  <span className="hidden sm:inline">Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
