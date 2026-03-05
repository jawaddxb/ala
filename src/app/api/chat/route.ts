import { createOpenAI } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { loadOracleContext, compileOraclePrompt, checkTopicStatus, findRelevantThesis } from '@/lib/oracle-prompt';
import { searchCorpus, formatSourcesForPrompt } from '@/lib/corpus-search';
import { createTopicSuggestion } from '@/lib/db';

export const maxDuration = 60;

// Use OpenRouter
const openrouter = createOpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
});

const model = openrouter('anthropic/claude-3.5-sonnet');

export async function POST(req: Request) {
  const body = await req.json();
  
  // Handle both 'messages' array and single 'message' string
  let messages: { role: 'user' | 'assistant'; content: string | unknown }[];
  if (body.messages && Array.isArray(body.messages)) {
    messages = body.messages;
  } else if (body.message) {
    messages = [{ role: 'user', content: body.message }];
  } else {
    return new Response(
      JSON.stringify({ error: 'Missing messages or message parameter' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Sanitize messages
  const sanitizedMessages = messages.map(m => ({
    role: m.role as 'user' | 'assistant',
    content: typeof m.content === 'string' 
      ? m.content 
      : Array.isArray(m.content) 
        ? m.content.map((part: { text?: string }) => part.text || '').join('') 
        : String(m.content || '')
  }));

  const userMessage = sanitizedMessages[sanitizedMessages.length - 1]?.content || '';
  const conversationHistory = sanitizedMessages.slice(0, -1);

  // Load oracle context from DB
  const oracleCtx = loadOracleContext();

  // Check if this topic is disabled
  const deflection = checkTopicStatus(userMessage, oracleCtx.topics);
  if (deflection) {
    return new Response(deflection, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }

  // Find relevant thesis entries
  const relevantThesis = findRelevantThesis(userMessage, oracleCtx.thesisEntries);
  
  // If no thesis entries match and the question seems substantive, queue a suggestion
  if (relevantThesis.length === 0 && userMessage.length > 20) {
    // Don't block the response — fire and forget
    try { createTopicSuggestion(userMessage); } catch { /* ignore */ }
  }

  // Search corpus for relevant wisdom texts — retrieve top 12 across all 6 collections
  const searchQuery = `${userMessage}`;
  const sources = searchCorpus(searchQuery, 'mixed' as any, 12);
  const wisdomText = formatSourcesForPrompt(sources);
  
  // Inject knowledge + wisdom into context
  oracleCtx.knowledgeContext = undefined; // TODO: BM25 search knowledge_docs when Feature 5 is built
  oracleCtx.wisdomSources = wisdomText || undefined;

  // Compile the full oracle system prompt
  const systemPrompt = compileOraclePrompt(oracleCtx, userMessage);

  // Build conversation context
  let conversationContext = '';
  if (conversationHistory.length > 0) {
    conversationContext = conversationHistory.map(m => 
      `${m.role === 'user' ? 'User' : 'Assistant'}: ${String(m.content || '').trim()}`
    ).join('\n\n') + '\n\n';
  }
  
  const promptWithContext = conversationContext 
    ? `Previous conversation:\n${conversationContext}\nUser: ${userMessage}`
    : userMessage;

  // Single-pass oracle response — no two-pass, no separator
  const result = streamText({
    model,
    system: systemPrompt,
    prompt: promptWithContext,
  });
  
  return result.toTextStreamResponse();
}
