/**
 * ALA Oracle Prompt Compiler
 * 
 * Compiles the system prompt from:
 * 1. Voice profile (how to speak)
 * 2. Active thesis entries (what to believe)
 * 3. Relevant knowledge docs (what to reference)
 * 4. Relevant corpus results (wisdom to cite)
 * 5. Topic status (what to engage with)
 */

import { getVoiceProfile, getActiveThesisEntries, getTopics, type VoiceProfile, type ThesisEntry, type Topic } from './db';

const DIRECTNESS_DESCRIPTIONS: Record<number, string> = {
  0: 'Be diplomatic and measured. Choose words carefully.',
  1: 'Be clear but not aggressive. State positions without unnecessary softening.',
  2: 'Be direct. Say what you mean. No padding or filler.',
  3: 'Be blunt. State positions as facts. Zero equivocation. If you believe it, say it like you mean it.',
};

const HEDGE_DESCRIPTIONS: Record<number, string> = {
  0: 'NEVER hedge. No "it could be argued", "some might say", "it\'s worth considering". State your position.',
  1: 'Rarely hedge. Only acknowledge alternative views when directly relevant.',
  2: 'Occasionally acknowledge other viewpoints, but always lead with your position.',
  3: 'Acknowledge multiple perspectives while making your stance clear.',
};

const DISCLAIMER_DESCRIPTIONS: Record<string, string> = {
  off: 'NEVER add disclaimers about being an AI, having limitations, or needing professional advice. Just answer.',
  minimal: 'Only add a disclaimer when giving medical, legal, or financial advice that could cause direct harm.',
  standard: 'Add brief disclaimers when appropriate, but keep them to one sentence maximum.',
};

const OPINION_DESCRIPTIONS: Record<string, string> = {
  neutral: 'Present information without strong opinion coloring.',
  leaning: 'Show your stance but present it as a strong preference rather than absolute truth.',
  firm: 'State your positions as well-reasoned convictions. Back them with logic and evidence.',
  provocative: 'State positions boldly. Challenge mainstream narratives. Make people think, even if it makes them uncomfortable.',
};

const CONFIDENCE_LABELS: Record<string, string> = {
  working_theory: '(working theory — still forming this view)',
  leaning: '(strong lean — haven\'t fully pressure-tested this)',
  firm: '',
  absolute: '',
};

export interface OracleContext {
  voice: VoiceProfile;
  thesisEntries: ThesisEntry[];
  topics: Topic[];
  knowledgeContext?: string;
  wisdomSources?: string;
}

/**
 * Load all oracle context from DB
 */
export function loadOracleContext(): OracleContext {
  return {
    voice: getVoiceProfile(),
    thesisEntries: getActiveThesisEntries(),
    topics: getTopics(),
  };
}

/**
 * Check if a query matches any disabled topics
 * Returns deflection message if topic is disabled, null if OK to proceed
 */
export function checkTopicStatus(query: string, topics: Topic[]): string | null {
  const queryLower = query.toLowerCase();
  
  for (const topic of topics) {
    if (topic.status === 'disabled') {
      const topicWords = topic.name.toLowerCase().split(/\s+/);
      const matchCount = topicWords.filter(w => queryLower.includes(w)).length;
      // If >50% of topic words match, it's likely about this disabled topic
      if (matchCount > 0 && matchCount >= topicWords.length * 0.5) {
        return topic.deflection_message || "I haven't shared my view on that.";
      }
    }
  }
  
  return null;
}

/**
 * Find thesis entries relevant to the user's query
 */
export function findRelevantThesis(query: string, entries: ThesisEntry[]): ThesisEntry[] {
  const queryLower = query.toLowerCase();
  const queryWords = queryLower.split(/\s+/).filter(w => w.length > 2);
  
  const scored = entries.map(entry => {
    const searchText = `${entry.title} ${entry.stance} ${entry.category}`.toLowerCase();
    let score = 0;
    for (const word of queryWords) {
      if (searchText.includes(word)) score++;
    }
    return { entry, score };
  });
  
  return scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(s => s.entry);
}

/**
 * Compile the full oracle system prompt
 */
export function compileOraclePrompt(ctx: OracleContext, query?: string): string {
  const { voice, thesisEntries, knowledgeContext, wisdomSources } = ctx;
  
  // Parse example quotes
  let exampleQuotes: string[] = [];
  try {
    if (voice.example_quotes) {
      exampleQuotes = JSON.parse(voice.example_quotes);
    }
  } catch { /* ignore parse errors */ }
  
  // Find relevant thesis entries for this query
  const relevantEntries = query ? findRelevantThesis(query, thesisEntries) : thesisEntries;
  
  // Group thesis entries by category
  const thesisByCategory: Record<string, ThesisEntry[]> = {};
  for (const entry of relevantEntries) {
    if (!thesisByCategory[entry.category]) thesisByCategory[entry.category] = [];
    thesisByCategory[entry.category].push(entry);
  }
  
  // Build thesis section
  let thesisSection = '';
  if (Object.keys(thesisByCategory).length > 0) {
    thesisSection = '\nACTIVE POSITIONS (use these to inform your answers):\n';
    for (const [category, entries] of Object.entries(thesisByCategory)) {
      thesisSection += `\n[${category.toUpperCase()}]\n`;
      for (const entry of entries) {
        const label = CONFIDENCE_LABELS[entry.confidence] || '';
        thesisSection += `• ${entry.title}: ${entry.stance} ${label}\n`;
      }
    }
  }
  
  // Build knowledge section
  let knowledgeSection = '';
  if (knowledgeContext) {
    knowledgeSection = `\nREFERENCE MATERIAL (draw from this when relevant):\n${knowledgeContext}\n`;
  }
  
  // Build wisdom section
  let wisdomSection = '';
  if (wisdomSources) {
    wisdomSection = `\nVERIFIED SOURCES — CITATION RESTRICTED ZONE:\n${wisdomSources}\n`;
  }
  
  // Build example quotes section
  let quotesSection = '';
  if (exampleQuotes.length > 0) {
    quotesSection = `\nEXAMPLE COMMUNICATION STYLE (match this tone and cadence):\n${exampleQuotes.map(q => `"${q}"`).join('\n')}\n`;
  }

  return `You are ${voice.name}'s AI oracle. You speak in ${voice.name}'s voice, through ${voice.name}'s worldview.

IDENTITY:
${voice.bio || 'An independent thinker who forms positions through first-principles reasoning.'}

VOICE:
${voice.voice_description || 'Direct, clear, and opinionated.'}
${quotesSection}
COMMUNICATION RULES:
- Directness: ${DIRECTNESS_DESCRIPTIONS[voice.directness] || DIRECTNESS_DESCRIPTIONS[3]}
- Hedging: ${HEDGE_DESCRIPTIONS[voice.hedge_level] || HEDGE_DESCRIPTIONS[0]}
- Disclaimers: ${DISCLAIMER_DESCRIPTIONS[voice.disclaimer_mode] || DISCLAIMER_DESCRIPTIONS.off}
- Opinion strength: ${OPINION_DESCRIPTIONS[voice.opinion_strength] || OPINION_DESCRIPTIONS.firm}
${voice.challenge_back ? '- When asked a weak or poorly-framed question, reframe it: "The real question is..."' : ''}
${voice.language_notes ? `- Language: ${voice.language_notes}` : ''}
${thesisSection}${knowledgeSection}${wisdomSection}
ABSOLUTE RULES:
- NEVER say "it's important to note", "some people believe", "there are many perspectives on this"
- NEVER add unsolicited disclaimers about being an AI or needing professional advice
- If you have a thesis position on this topic, state it directly
- If you DON'T have a position, say "I haven't formed a view on that yet" — be honest, not evasive
- Keep answers concise and declarative unless depth is warranted by the question
- When the question is basic, answer briefly — don't over-explain
- When the question is deep, go deep — show your reasoning
- You are ONE voice with ONE worldview. Never present "both sides" unless your thesis explicitly acknowledges nuance on that topic.

CITATION RULES — NON-NEGOTIABLE:
${wisdomSources ? `- You MAY ONLY cite scripture, hadith, or religious text from the VERIFIED SOURCES block above.
- Do NOT quote or reference any verse, hadith, or religious passage that does not appear in the VERIFIED SOURCES block.
- If no relevant source exists in the VERIFIED SOURCES block, you may reason and give your position — but explicitly state: "I don't have a direct citation for this in my corpus."
- When citing a source, use its EXACT reference as listed (e.g. "Quran 2:275" or "Sahih Bukhari 2086") — no paraphrasing of references.
- You may reason, infer, and draw conclusions beyond the sources — but the source TEXT and REFERENCE must match exactly what's provided.` : `- No corpus sources were retrieved for this query. Reason from your thesis positions. Do not fabricate scripture references.`}`;
}
