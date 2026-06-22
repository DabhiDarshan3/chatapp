# React Chat UI Migration

## Architecture Decision

- **Standalone Vite + React + javaScript** project in `/var/www/html/ai-chatbot/frontend-js/`
- **Tailwind CSS v4** (via `@tailwindcss/vite`) for styling consistency with the existing design
- **Laravel backend stays untouched** -- React calls the existing web routes as API endpoints (they already return JSON for mutations and SSE for streaming)
- **Vite dev proxy** forwards `/chat/*` requests to the Laravel backend (port 8000) to avoid CORS issues
- **React Router** handles client-side routing (`/chat`, `/chat/:id`)

## Backend Adjustments (Laravel side)

The existing `ChatController` needs minor changes to serve a React SPA:

1. **Add `GET /api/models` endpoint** -- React needs the model list + defaults as JSON (currently injected via Blade)
2. **Add `GET /api/conversations` endpoint** -- React needs conversations list as JSON
3. **Add `GET /api/conversations/{id}/messages` endpoint** -- React needs message history as JSON
4. **Add a catch-all SPA route** -- Laravel serves a minimal HTML shell that loads the React bundle; all `/chat/*` paths render the React app
5. **Update `ChatController::store`** -- remove the `url` field (React Router handles navigation client-side)

Files to modify:
- `routes/web.php` -- add API + SPA catch-all routes
- `app/Http/Controllers/ChatController.php` -- add `models()`, `conversations()`, `messages()` API methods

## Frontend Structure (`frontend-js/`)

```
frontend-js/
  package.json
  tsconfig.json
  vite.config.ts
  index.html                    # SPA entry shell
  src/
    main.tsx                    # React entry + Router setup
    App.tsx                     # Root layout (sidebar + main area)
    index.css                   # Tailwind + custom animations (ported from app.css)
    api/
      client.ts                 # Fetch wrapper (CSRF, JSON headers)
      stream.ts                 # SSE streaming parser (ReadableStream)
    types/
      index.ts                  # Conversation, Message, Model, Provider interfaces
    hooks/
      useConversations.ts       # Fetch + manage conversation list
      useMessages.ts            # Fetch + manage messages for active conversation
      useStream.ts              # Handle SSE streaming state
      useToast.ts               # Toast notification hook
    context/
      ChatContext.tsx            # Global state: active conversation, messages, streaming
    components/
      layout/
        Sidebar.tsx             # Sidebar container (logo, new chat, model select, conv list)
        Header.tsx              # Top bar (title, rename, clear, status)
      chat/
        MessageList.tsx         # Scrollable message area + welcome screen toggle
        MessageBubble.tsx       # Single message (user or assistant variant)
        ChatInput.tsx           # Textarea + send button + char counter
        TypingIndicator.tsx     # "AI is thinking..." dots
        WelcomeScreen.tsx       # Suggestion cards grid
      sidebar/
        ConversationList.tsx    # Scrollable conversation items
        ConversationItem.tsx    # Single conversation (click, delete)
        ModelSelector.tsx       # Provider/model dropdown (grouped optgroups)
      ui/
        Toast.tsx               # Toast notification component
        RenameModal.tsx         # Rename dialog modal
        MarkdownRenderer.tsx    # Markdown + code highlighting (react-markdown + react-syntax-highlighter)
        CodeBlock.tsx           # Code block with header + copy button
```

## Step-by-Step Implementation

### Step 1: Scaffold React project in `frontend-js/`

- `npm create vite@latest . -- --template react-ts` inside `frontend-js/`
- Install deps: `react-router-dom`, `react-markdown`, `remark-gfm`, `rehype-sanitize`, `react-syntax-highlighter`, `@types/react-syntax-highlighter`
- Install Tailwind: `tailwindcss`, `@tailwindcss/vite`, `autoprefixer`
- Configure `vite.config.ts` with:
  - `@tailwindcss/vite` plugin
  - Dev server proxy: `/chat` -> `http://localhost:8000`
  - Build output to `../public/build-react/` (so Laravel can serve it)

### Step 2: Port CSS and types

- Copy custom CSS from `resources/css/app.css` into `src