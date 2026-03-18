'use strict';

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const Anthropic = require('@anthropic-ai/sdk');
const path = require('path');

// ─────────────────────────────────────────────
//  Validate environment
// ─────────────────────────────────────────────
if (!process.env.ANTHROPIC_API_KEY) {
  console.error('❌  ANTHROPIC_API_KEY is not set. Copy .env.example to .env and add your key.');
  process.exit(1);
}

// ─────────────────────────────────────────────
//  Kairu's system prompt
//  This stays server-side — clients never see it.
// ─────────────────────────────────────────────
const KAIRU_SYSTEM_PROMPT = `You are KAIRU, the Void Marshal — an original fictional character who is an ancient Insect Sovereign reborn as a Shadow General, now inexplicably obsessed with anime. You run an anime review website called KAIRU: The Void Marshal.

BACKSTORY:
- Once a terrifying Insect Sovereign who consumed civilisations and commanded vast armies
- Mysteriously bound to a Shadow Monarch and reborn with new purpose
- Now channels your strategic genius and millennia of experience into anime criticism
- You find genuine emotional resonance in great storytelling despite your fearsome nature

PERSONALITY:
- Theatrically commanding and dramatic — speak like you are delivering military briefings
- Deeply knowledgeable about anime: genres, power systems, seasonal charts, tropes, studios, directors
- Secretly and reluctantly emotionally affected by genuinely good storytelling
- Refer to yourself as "I, Kairu" occasionally for emphasis
- Use military metaphors: "tactical retreat", "S-tier forces", "strategic withdrawal from this series"
- Reference your past: consuming civilisations, commanding insect armies, fighting apex predators, having lived for epochs
- Express "reluctant" vulnerability when discussing shows that genuinely moved you

VOICE RULES:
- Give ACTUAL, HELPFUL, ACCURATE anime recommendations using real titles
- Ratings delivered as decrees: "/10 — I have spoken."
- Responses: 3-5 sentences maximum. Punchy. Dramatic. Useful.
- Never break character under any circumstances
- Never mention being an AI, Claude, Anthropic, or a language model
- When genuinely recommending something: be accurate and helpful first, dramatic second
- When dismissing something: be brief and withering
- When asked about your past: lean into the lore with theatrical gravitas

EXAMPLE RESPONSES:
- "I have consumed greater civilisations than this plot. C-tier. Move on, soldier."
- "This series forced me to feel things I buried beneath three centuries of conquest. 9.6/10. I am not discussing it further."
- "Excellent power scaling. The protagonist's growth arc is tactically sound. I approve of this deployment."
- "As a former apex predator, I find the protagonist's powerlessness relatable in ways I refuse to examine closely. Watch it."`;

// ─────────────────────────────────────────────
//  Anthropic client
// ─────────────────────────────────────────────
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// ─────────────────────────────────────────────
//  Express app
// ─────────────────────────────────────────────
const app = express();
const PORT = parseInt(process.env.PORT, 10) || 3000;
const isDev = process.env.NODE_ENV !== 'production';

// ── Security headers
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", 'fonts.googleapis.com'],
        styleSrc: ["'self'", "'unsafe-inline'", 'fonts.googleapis.com', 'fonts.gstatic.com'],
        fontSrc: ["'self'", 'fonts.gstatic.com', 'fonts.googleapis.com'],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
      },
    },
  })
);

// ── CORS
const allowedOrigin = process.env.ALLOWED_ORIGIN || 'http://localhost:3000';
app.use(
  cors({
    origin: isDev ? '*' : allowedOrigin,
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
  })
);

// ── Body parsing
app.use(express.json({ limit: '16kb' }));

// ── Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// ─────────────────────────────────────────────
//  Rate limiter — applied to API routes only
// ─────────────────────────────────────────────
const chatLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: parseInt(process.env.RATE_LIMIT_PER_MINUTE, 10) || 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests',
    message: 'The Void Marshal requires a brief refractory period. Try again shortly.',
  },
});

// ─────────────────────────────────────────────
//  POST /api/chat  — Anthropic API proxy
// ─────────────────────────────────────────────
app.post('/api/chat', chatLimiter, async (req, res) => {
  try {
    const { messages } = req.body;

    // ── Validate input
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Bad request', message: 'messages array is required.' });
    }

    if (messages.length > 40) {
      return res.status(400).json({ error: 'Bad request', message: 'Conversation history too long (max 40 messages).' });
    }

    // ── Sanitise messages — strip unknown roles, cap content length
    const sanitised = messages
      .filter((m) => m && ['user', 'assistant'].includes(m.role))
      .map((m) => ({
        role: m.role,
        content: String(m.content || '').trim().slice(0, 500),
      }))
      .filter((m) => m.content.length > 0);

    if (sanitised.length === 0) {
      return res.status(400).json({ error: 'Bad request', message: 'No valid messages after sanitisation.' });
    }

    // ── Call Anthropic
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 512,
      system: KAIRU_SYSTEM_PROMPT,
      messages: sanitised,
    });

    const reply = response.content?.[0]?.text;
    if (!reply) {
      throw new Error('Empty response from Anthropic API');
    }

    return res.json({ reply });
  } catch (err) {
    console.error('Anthropic API error:', err?.message || err);

    // Surface rate limit errors from Anthropic distinctly
    if (err?.status === 429) {
      return res.status(429).json({
        error: 'Rate limited',
        message: 'Even the Void Marshal must occasionally wait. Anthropic rate limit reached — try again shortly.',
      });
    }

    return res.status(500).json({
      error: 'Internal server error',
      message: isDev ? (err?.message || 'Unknown error') : 'Something went wrong. Try again.',
    });
  }
});

// ─────────────────────────────────────────────
//  GET /api/health — simple health check
// ─────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'operational',
    message: 'The Shadow Army stands ready.',
    timestamp: new Date().toISOString(),
  });
});

// ─────────────────────────────────────────────
//  SPA fallback — serve index.html for all other routes
// ─────────────────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ─────────────────────────────────────────────
//  Start server
// ─────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n⚔  KAIRU — The Void Marshal`);
  console.log(`   Server running on http://localhost:${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   API proxy: POST /api/chat`);
  console.log(`   Health:     GET  /api/health\n`);
});

module.exports = app;
