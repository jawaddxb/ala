import { bulkImportSources, getSourceStats } from "../src/lib/db";
import fs from "fs";
import path from "path";

const corpusDir = path.join(process.cwd(), "src/data/corpus");

async function initDatabase() {
  console.log("Initializing database with corpus data...\n");

  const files = [
    { file: "quran.json", name: "Quran" },
    { file: "bible.json", name: "Bible" },
    { file: "hadith-bukhari.json", name: "Hadith Bukhari" },
    { file: "hadith-muslim.json", name: "Hadith Muslim" },
    { file: "secular.json", name: "Secular" },
  ];

  for (const { file, name } of files) {
    const filePath = path.join(corpusDir, file);
    
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  ${name}: File not found`);
      continue;
    }

    try {
      const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      const sources = Array.isArray(data) ? data : [data];
      
      console.log(`📚 ${name}: Importing ${sources.length} entries...`);
      const result = bulkImportSources(sources);
      console.log(`   ✓ Success: ${result.success}, Failed: ${result.failed}`);
    } catch (error) {
      console.error(`   ✗ Error: ${error}`);
    }
  }

  console.log("\n📊 Final Statistics:");
  const stats = getSourceStats();
  stats.forEach((s) => {
    console.log(`   ${s.source}: ${s.count.toLocaleString()} entries`);
  });
  
  const total = stats.reduce((acc, s) => acc + s.count, 0);
  console.log(`   Total: ${total.toLocaleString()} entries`);
}

initDatabase().catch(console.error);
