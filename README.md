# Lumina Chat

Lumina is a responsive AI chat workspace with OpenAI model streaming, Markdown responses, personas, generation-style filters, speech controls, history, and accessibility preferences.

## Run locally

Requirements: Node.js 20+ and MongoDB for persistent history.

```bash
npm install
npm install --prefix server
npm install --prefix client
cp server/.env.example server/.env
cp client/.env.example client/.env.local
```

Set `MONGO_URI`, `GROQ_API_KEY`, `GROQ_BASE_URL`, and `OPENAI_MODEL` in `server/.env`. The API key is only read by the server and is never exposed to the browser. Without a key, chat returns an actionable configuration error instead of saving fallback text.

Create `server/.env` from the example and add your rotated key:

```env
GROQ_API_KEY=your_groq_key
GROQ_BASE_URL=https://api.groq.com/openai/v1
OPENAI_MODEL=openai/gpt-oss-20b
```

The key included in your message is exposed and should be revoked or rotated in your provider before use.

Check the provider without opening the UI:

```bash
npm --prefix server run check:openai
```

Restart both servers after editing `server/.env`:

```bash
pkill -f "node.*server/src/server.js" || true
npm run dev
```

Successful startup includes `AI token loaded: true`, the configured model and URL, followed by `Lumina server listening on 4000`. Verify configuration with `GET http://localhost:4000/api/health`.

Start both applications:

```bash
npm run dev
```

The client runs on `http://localhost:3000` and the API on `http://localhost:4000`.

## Vercel and Render deployment

For Vercel, set this environment variable in **Production** and **Preview**:

```env
NEXT_PUBLIC_API_URL=https://chatbot-ai-v8mi.onrender.com
```

Vercel embeds `NEXT_PUBLIC_*` values during the Next.js build, so changing the variable requires a new deployment/redeploy. Do not put the Render URL in application code.

For Render, set `CLIENT_URL` to the Vercel origin, for example:

```env
CLIENT_URL=https://your-app.vercel.app,https://preview-your-app.vercel.app
```

MongoDB Atlas must allow the Render service to connect. In Atlas, open **Network Access** and add `0.0.0.0/0` (or the narrower Render egress ranges when available). Keep database credentials only in Render environment variables.

The production client calls `/api/health` on first load to wake a sleeping Render instance. Slow or failed requests retry with backoff and show a waking/unreachable message instead of trying the Vercel origin or parsing an HTML error page as JSON.

## Architecture

- `server/src/services/aiService.js` owns OpenAI Chat Completions streaming and strict character JSON parsing.
- `server/src/services/promptBuilder.js` composes safety, age-filter, and persona instructions.
- `server/src/middleware/emergencyInterceptor.js` short-circuits medical emergency phrases before any AI call.
- `server/src/controllers/chatController.js` handles SSE, history, and the development memory fallback.
- `client/app/page.js` contains the responsive chat workspace and its speech, theme, persona, history, and accessibility controls.

## API

- `POST /api/chat/stream`
- `POST /api/chat/characters`
- `GET /api/chats`
- `GET/PATCH/DELETE /api/chats/:id`
- `DELETE /api/chats`
- `GET/PUT /api/user/preferences`

The client generates an anonymous ID in local storage and sends it as `x-anonymous-id`; this boundary can be replaced with JWT middleware later.

## Validation

```bash
npm --prefix client run build
node --check server/src/server.js
npm --prefix server run fix-messages
```

## Manual AI failure checklist

- Wrong `GROQ_API_KEY`: server returns a readable provider error and does not save it as a chat message.
- Unavailable `OPENAI_MODEL`: verify model access and inspect the provider status error.
- Network offline: the chat shows a friendly error bubble instead of crashing Markdown rendering.
- Empty provider reply: the controller rejects it and does not persist an empty assistant message.
- Long Markdown reply: headings, lists, tables, and code should render as text-safe Markdown.
- Reload old history: messages are normalized through `toText()` before rendering; run `npm --prefix server run fix-messages` to clean MongoDB permanently.
## Privacy Note for Web Speech API
The Web Speech API in Chrome sends audio to Google's speech service for processing. To use this feature, the site must run on HTTPS (Vercel is fine, localhost is fine). No voice audio is stored by Lumina; only the final transcribed text is sent to the backend.
