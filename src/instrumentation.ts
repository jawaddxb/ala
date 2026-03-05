/**
 * Next.js Instrumentation Hook
 * Runs once on server startup (before any routes are served).
 * Used to guarantee DB initialization and seeding happen at boot time.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Import db module — this triggers initializeDefaultAdmin(), seedKiyanIfEmpty(), seedScriptureIfEmpty()
    const { default: db } = await import('./lib/db');
    
    // Verify seeding worked
    const count = (db.prepare('SELECT COUNT(*) as c FROM sources').get() as { c: number }).c;
    console.log(`[ALA] Boot complete. Sources in DB: ${count.toLocaleString()}`);
  }
}
