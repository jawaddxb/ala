import { createOpenAI } from '@ai-sdk/openai';
import { generateText, streamText } from 'ai';
import { NEUTRAL_SYSTEM_PROMPT, buildReflectionPromptWithSources, type Perspective, type Intensity } from '@/lib/prompts';
import { searchCorpus, formatSourcesForPrompt } from '@/lib/corpus-search';

export const maxDuration = 60;

// Use OpenRouter
const openrouter = createOpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
});

const model = openrouter('anthropic/claude-3.5-sonnet');

export async function POST(req: Request) {
  const body = await req.json();
  const { perspective = 'none', intensity = 0 } = body as {
    messages?: { role: 'user' | 'assistant'; content: string | unknown }[];
    message?: string;
    perspective?: Perspective;
    intensity?: Intensity;
  };
  
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

  // Sanitize messages - ensure content is always a string
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

  // If no reflection needed, just stream the neutral answer directly
  if (intensity === 0 || perspective === 'none') {
    // Build conversation context to avoid message format issues
    let conversationContext = '';
    if (conversationHistory.length > 0) {
      conversationContext = conversationHistory.map(m => 
        `${m.role === 'user' ? 'User' : 'Assistant'}: ${String(m.content || '').split('───────────────────')[0].trim()}`
      ).join('\n\n') + '\n\n';
    }
    
    const promptWithContext = conversationContext 
      ? `Previous conversation:\n${conversationContext}\nUser: ${userMessage}`
      : userMessage;
      
    const result = streamText({
      model,
      system: NEUTRAL_SYSTEM_PROMPT,
      prompt: promptWithContext,
    });
    return result.toTextStreamResponse();
  }

  // For reflection mode:
  // 1. Generate neutral answer
  // 2. Search corpus for relevant sources
  // 3. Generate reflection WITH citations
  
  try {
    // Build conversation context as a single prompt to avoid AI SDK message format issues
    let conversationContext = '';
    if (conversationHistory.length > 0) {
      conversationContext = conversationHistory.map(m => 
        `${m.role === 'user' ? 'User' : 'Assistant'}: ${String(m.content || '').split('───────────────────')[0].trim()}`
      ).join('\n\n') + '\n\n';
    }
    
    // Build the prompt with context
    const promptWithContext = conversationContext 
      ? `Previous conversation:\n${conversationContext}\nUser: ${userMessage}`
      : userMessage;

    const neutralResult = await generateText({
      model,
      system: NEUTRAL_SYSTEM_PROMPT,
      prompt: promptWithContext,
    });

    const neutralText = neutralResult.text;
    
    // Search corpus for relevant passages
    const searchQuery = `${userMessage} ${neutralText.slice(0, 200)}`;
    const sources = searchCorpus(searchQuery, perspective, 5);
    const sourcesText = formatSourcesForPrompt(sources);
    
    // Generate reflection with sources
    const reflectionPrompt = buildReflectionPromptWithSources(
      perspective as Exclude<Perspective, 'none'>,
      intensity,
      userMessage,
      neutralText,
      sourcesText
    );

    const reflectionResult = await generateText({
      model,
      messages: [{ role: 'user' as const, content: String(reflectionPrompt) }],
    });

    const reflectionText = reflectionResult.text;

    // Combine with clear visual separation
    const combinedResponse = `${neutralText}

───────────────────

${reflectionText}`;

    return new Response(combinedResponse, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
