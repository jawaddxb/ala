# ALA - Choice-Conditioned Reflective Assistant

A language model interface that separates factual answering from value framing. Based on the ALA paper by Kiyan Sasan.

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment file and add your API key
cp .env.example .env.local
# Edit .env.local and add either ANTHROPIC_API_KEY or OPENROUTER_API_KEY

# Run development server
npm run dev
# Or use the Makefile
make dev
```

Open [http://localhost:3000](http://localhost:3000).

## How It Works

1. **Neutral Answer**: Every query gets a factual, neutral response first
2. **Optional Reflection**: If the user enables a perspective (Islam, Christianity, Judaism, Secular, etc.) and sets an intensity (1-3), a reflection is added
3. **User Control**: The user controls all settings. ALA never suggests changing perspectives.

## Features

- 7 perspective options (None, Abrahamic, Islam, Christianity, Judaism, Secular, Mixed)
- 4 intensity levels (Off, Light, Medium, Deep)
- Two-pass generation with clear visual separation
- Persistent user preferences
- Non-coercive by design

## Tech Stack

- Next.js 14 (App Router)
- Tailwind CSS + shadcn/ui
- Vercel AI SDK
- Claude 3.5 Sonnet (via Anthropic or OpenRouter)

## Deployment

```bash
# Build for production
npm run build

# Deploy to Vercel
vercel
```

## API

### POST /api/chat

```json
{
  "messages": [{ "role": "user", "content": "How do I manage stress?" }],
  "perspective": "islam",
  "intensity": 2
}
```

Returns a text stream or combined response with neutral answer and reflection.

## License

Proprietary - ALA Project
