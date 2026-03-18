# KAIRU — The Void Marshal 🐜

> *"I was an Insect Sovereign. I consumed three continents for breakfast. Now I consume seasonal anime charts."*

A personality-driven anime review website featuring **Kairu**, an original character inspired by the commanding, dramatic energy of a shadow army general. Built with Node.js + Express on the backend and vanilla HTML/CSS/JS on the frontend, with a live AI chat powered by the Anthropic Claude API.

![Kairu Banner](https://img.shields.io/badge/KAIRU-Void%20Marshal-dc2626?style=for-the-badge&labelColor=04040a)
![Node](https://img.shields.io/badge/Node.js-18%2B-339933?style=flat-square&logo=node.js)
![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)
![Status](https://img.shields.io/badge/Status-Active-22c55e?style=flat-square)

---

## ✨ Features

- **Live AI Chat** — Talk directly to Kairu, powered by Claude (Anthropic API). Ask for recommendations, power scaling verdicts, or ratings — all answered in character.
- **Tier Lists** — Clickable anime rankings with Kairu's in-character verdicts.
- **Season Picks** — Curated watchlist cards with the Marshal's decree on each title.
- **War Council** — Community debate/voting section on hot anime topics.
- **Newsletter Signup** — Email capture with "loyalty oath" framing.
- **Responsive Design** — Mobile-first, dark aesthetic with animated hero section.
- **Secure API Proxy** — API key lives on the server, never exposed to the client.

---

## 🗂 Project Structure

```
kairu-void-marshal/
├── public/                   # Static frontend assets
│   ├── index.html            # Main HTML page
│   ├── css/
│   │   └── style.css         # All styles (dark theme, animations)
│   └── js/
│       ├── main.js           # UI interactions, scroll, votes, animations
│       └── chat.js           # AI chat logic (calls /api/chat proxy)
├── server.js                 # Express server + Anthropic API proxy
├── package.json
├── .env.example              # Environment variable template
├── .gitignore
├── .github/
│   └── workflows/
│       ├── deploy.yml        # Auto-deploy to Railway / Render on push
│       └── lint.yml          # ESLint check on PRs
└── README.md
```

---

## 🚀 Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/YOUR_USERNAME/kairu-void-marshal.git
cd kairu-void-marshal
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env
```

Then edit `.env` and add your Anthropic API key:

```env
ANTHROPIC_API_KEY=sk-ant-your-key-here
PORT=3000
```

Get your API key at [console.anthropic.com](https://console.anthropic.com).

### 3. Run locally

```bash
npm run dev     # development (nodemon, auto-restart)
# or
npm start       # production
```

Open [http://localhost:3000](http://localhost:3000) — Kairu awaits.

---

## 🌐 Deployment

### Railway (Recommended — free tier available)

1. Push your repo to GitHub
2. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
3. Select your repo
4. Add environment variable: `ANTHROPIC_API_KEY=sk-ant-...`
5. Railway auto-detects Node.js and deploys. Done.

### Render

1. Go to [render.com](https://render.com) → New Web Service
2. Connect GitHub repo
3. Build command: `npm install`
4. Start command: `npm start`
5. Add `ANTHROPIC_API_KEY` in Environment settings

### Vercel (Serverless — requires minor refactor)

For Vercel, convert `server.js` to an API route at `api/chat.js`. See [Vercel Node.js docs](https://vercel.com/docs/functions).

### Self-hosted (VPS / DigitalOcean)

```bash
# On your server
git clone https://github.com/YOUR_USERNAME/kairu-void-marshal.git
cd kairu-void-marshal
npm install
cp .env.example .env && nano .env  # add your key

# Run with PM2 for process management
npm install -g pm2
pm2 start server.js --name kairu
pm2 save
pm2 startup
```

---

## 🔌 API Reference

The backend exposes one endpoint:

### `POST /api/chat`

Proxies requests to Anthropic's Claude API with the Kairu system prompt pre-loaded.

**Request body:**
```json
{
  "messages": [
    { "role": "user", "content": "Rate Frieren for me" }
  ]
}
```

**Response:**
```json
{
  "reply": "\"Frieren forced me to feel things I buried beneath three centuries of conquest. 9.8/10. I am not discussing it further.\""
}
```

**Error response:**
```json
{
  "error": "Internal server error",
  "message": "..."
}
```

---

## 🎨 Customisation Guide

### Changing Kairu's personality

Edit the `KAIRU_SYSTEM_PROMPT` constant in `server.js`. The prompt defines his voice, vocabulary, and behaviour.

### Adding new anime to the tier list

In `public/index.html`, find the `.tier-entries` section and add:

```html
<div class="tier-entry" data-ask="Give me your verdict on [ANIME NAME]">[ANIME NAME]</div>
```

### Adding new debate cards

Copy an existing `.debate-card` block in `index.html` and update the question, Kairu's take, and the vote button labels.

### Changing the colour scheme

All CSS variables are at the top of `public/css/style.css`:

```css
:root {
  --cr: #dc2626;       /* crimson — primary accent */
  --crb: #ef4444;      /* crimson bright */
  --bl: #3b82f6;       /* blue — secondary accent */
  --void: #04040a;     /* background */
  /* ... */
}
```


## 🛡 Security Notes

- **API key is server-side only** — the client JS calls `/api/chat` (your own server), never Anthropic directly. Your key is never exposed.
- **Rate limiting** — `express-rate-limit` is configured at 30 requests per minute per IP on the `/api/chat` endpoint.
- **Input sanitisation** — user messages are trimmed and capped at 500 characters before being sent to the API.
- **CORS** — configured for your domain in production. Update `ALLOWED_ORIGIN` in `.env`.

---

## 📦 Dependencies

| Package | Purpose |
|---|---|
| `express` | Web server |
| `@anthropic-ai/sdk` | Official Anthropic API client |
| `dotenv` | Environment variable loading |
| `express-rate-limit` | API rate limiting |
| `helmet` | Security headers |
| `cors` | Cross-origin resource sharing |
| `nodemon` | Dev auto-restart (devDependency) |

---

## 🤝 Contributing

Pull requests are welcome. For major changes, open an issue first.

1. Fork the repo
2. Create your branch: `git checkout -b feature/my-feature`
3. Commit: `git commit -m 'Add my feature'`
4. Push: `git push origin feature/my-feature`
5. Open a pull request

---

## ⚠️ Disclaimer

Kairu is a fully original character. This is a fan-made project. No affiliation with any existing anime, manga, manhwa, webtoon, or IP. All anime titles mentioned are property of their respective owners and are referenced for review/commentary purposes only.


---

## 📄 License & Copyright

**All Rights Reserved** — See [LICENSE](LICENSE) for full terms.

"Kairu — The Void Marshal" is an original character and brand. You may not reproduce, distribute, or create derivative works without express written permission.

To register your copyright formally (US): [copyright.gov](https://copyright.gov) — $65 fee.

---

*"Anime by Decree."*
