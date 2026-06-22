// public/js/chat.js
/* ================================================================
   AI CHATBOT — Full Featured JS
   Features: Streaming · Markdown · Code Highlight · Copy ·
             Sidebar Toggle · Typing Indicator · Rename · Delete ·
             Clear · Suggestions · Char Counter · Regenerate
   ================================================================ */

'use strict';

// ── State ─────────────────────────────────────────────────────────
const State = {
    convId    : null,
    streaming : false,
    lastUser  : '',          // last user message (for regenerate)
};

// Stores raw message text keyed by bubble ID so copy buttons never
// embed user/AI content inside HTML attributes (which breaks on " chars).
const TextStore = new Map();

// ── DOM References ────────────────────────────────────────────────
const $ = id => document.getElementById(id);

const El = {
    sidebar      : () => $('sidebar'),
    showSidebarBtn: () => $('showSidebarBtn'),
    convList     : () => $('convList'),
    noConvMsg    : () => $('noConvMsg'),
    modelSelect  : () => $('modelSelect'),
    chatTitle    : () => $('chatTitle'),
    chatSubtitle : () => $('chatSubtitle'),
    welcomeScreen: () => $('welcomeScreen'),
    msgList      : () => $('msgList'),
    messagesWrap : () => $('messagesWrap'),
    typingBar    : () => $('typingBar'),
    msgInput     : () => $('msgInput'),
    charCount    : () => $('charCount'),
    sendBtn      : () => $('sendBtn'),
    sendIcon     : () => $('sendIcon'),
    loadIcon     : () => $('loadIcon'),
    toasts       : () => $('toastContainer'),
    renameModal  : () => $('renameModal'),
    renameInput  : () => $('renameInput'),
};

// ── Marked Config ─────────────────────────────────────────────────
function initMarked() {
    const renderer = new marked.Renderer();

    // Custom code block with header + copy btn
    renderer.code = function (code, lang) {
        const language = lang || 'plaintext';
        let highlighted;
        try {
            highlighted = hljs.getLanguage(language)
                ? hljs.highlight(code, { language }).value
                : hljs.highlightAuto(code).value;
        } catch {
            highlighted = escHtml(code);
        }
        return `
<div class="code-block-wrap">
  <div class="code-header">
    <span>${escHtml(language)}</span>
    <button class="copy-code-btn text-gray-400 hover:text-white transition-colors
                   flex items-center gap-1 text-xs"
            onclick="copyCode(this)">
      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2
                 m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
      </svg>
      Copy code
    </button>
  </div>
  <pre><code class="hljs language-${escHtml(language)}">${highlighted}</code></pre>
</div>`;
    };

    marked.setOptions({
        renderer,
        breaks : true,
        gfm    : true,
    });
}

// ── Init ──────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    initMarked();

    // Load conversation ID from server-injected global
    State.convId = window.CHAT?.conversationId ?? null;

    // Input events
    El.msgInput().addEventListener('input', onInputChange);
    El.msgInput().addEventListener('keydown', onKeyDown);

    // Scroll to bottom if messages exist
    scrollBottom('instant');

    // Highlight any server-rendered code blocks
    processCodeBlocks(document);
});

// ── Input Handlers ────────────────────────────────────────────────
function onInputChange() {
    const len = El.msgInput().value.length;
    El.charCount().textContent = len;
    El.sendBtn().disabled = len === 0 || State.streaming;
    autoGrow(El.msgInput());
}

function onKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
}

function autoGrow(el) {
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 200) + 'px';
}

// ── Send Message ──────────────────────────────────────────────────
async function sendMessage() {
    const text = El.msgInput().value.trim();
    if (!text || State.streaming) return;

    State.lastUser = text;

    // Clear input immediately
    El.msgInput().value = '';
    El.charCount().textContent = '0';
    El.msgInput().style.height = 'auto';
    El.sendBtn().disabled = true;

    // Create conversation first if needed
    if (!State.convId) {
        const ok = await createConversation();
        if (!ok) return;
    }

    // Show chat area, hide welcome
    showChatArea();

    // Append user bubble
    appendUserBubble(text);
    scrollBottom();

    // Start streaming
    await doStream(text);
}

async function createConversation() {
    const [provider, model] = El.modelSelect().value.split(':');
    try {
        const res  = await api('POST', '/chat', { provider, model });
        State.convId = res.conversation.id;
        history.pushState({}, '', res.url);

        // Add to sidebar
        prependConvItem(res.conversation.id, 'New Chat');
        return true;
    } catch (err) {
        toast('Failed to start conversation: ' + err.message, 'error');
        return false;
    }
}

// ── Streaming ─────────────────────────────────────────────────────
async function doStream(userText) {
    State.streaming = true;
    setLoadingState(true);
    showTyping(true);

    const msgId  = 'ai-' + Date.now();
    const bubble = createAiBubble(msgId);
    El.msgList().appendChild(bubble);
    scrollBottom();

    let full = '';
    let firstChunk = true;

    try {
        const res = await fetch(`/chat/${State.convId}/message`, {
            method  : 'POST',
            headers : {
                'Content-Type' : 'application/json',
                'Accept'       : 'text/event-stream',
                'X-CSRF-TOKEN' : window.CHAT.csrfToken,
            },
            body    : JSON.stringify({ message: userText }),
        });

        if (!res.ok) throw new Error(`Server error ${res.status}`);

        const reader  = res.body.getReader();
        const decoder = new TextDecoder();
        let   buf     = '';

        // eslint-disable-next-line no-constant-condition
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buf += decoder.decode(value, { stream: true });
            const lines = buf.split('\n');
            buf = lines.pop();           // keep incomplete line

            for (const line of lines) {
                if (!line.startsWith('data: ')) continue;
                let evt;
                try { evt = JSON.parse(line.slice(6)); } catch { continue; }

                if (evt.type === 'delta') {
                    if (firstChunk) {
                        showTyping(false);
                        firstChunk = false;
                    }
                    full += evt.content;
                    updateAiBubble(msgId, full);
                    scrollBottom('instant');

                } else if (evt.type === 'done') {
                    finalizeAiBubble(msgId, full);

                    // Update header title
                    if (evt.title) {
                        El.chatTitle().textContent = evt.title;
                        updateConvTitle(evt.id, evt.title);
                    }

                } else if (evt.type === 'error') {
                    throw new Error(evt.message);
                }
            }
        }

    } catch (err) {
        console.log('err');
        console.log(err);
        showTyping(false);
        updateAiBubble(msgId, '');
        $(`${msgId}-content`).innerHTML = errorBubble(err.message);
        toast('Error: ' + err.message, 'error');
    } finally {
        State.streaming = false;
        setLoadingState(false);
        scrollBottom();
    }
}

// ── Regenerate ────────────────────────────────────────────────────
async function regenerate() {
    if (!State.lastUser || State.streaming || !State.convId) return;

    // Remove last assistant bubble from UI
    const bubbles = El.msgList().querySelectorAll('[data-role="assistant"]');
    if (bubbles.length) bubbles[bubbles.length - 1].remove();

    await doStream(State.lastUser);
}

// ── DOM Builders ──────────────────────────────────────────────────
function appendUserBubble(text) {
    const now = timeNow();
    const div = document.createElement('div');
    div.dataset.role = 'user';
    div.className    = 'flex justify-end gap-3 msg-anim';
    div.innerHTML    = `
        <div class="group max-w-[78%]">
            <div class="bg-gradient-to-br from-indigo-600 to-purple-600
                        text-white px-5 py-3.5 rounded-2xl rounded-tr-sm
                        shadow-lg shadow-indigo-900/30">
                <p class="text-sm leading-relaxed whitespace-pre-wrap break-words">
                    ${escHtml(text)}
                </p>
            </div>
            <div class="flex items-center justify-end gap-2 mt-1
                        opacity-0 group-hover:opacity-100 transition-opacity">
                <span class="text-xs text-gray-600">${now}</span>
                <button data-copy-btn
                        class="text-gray-600 hover:text-gray-400 transition-colors
                               flex items-center gap-1 text-xs p-0.5">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8
                                 a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8
                                 a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                    </svg>
                    Copy
                </button>
            </div>
        </div>
        <div class="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500
                    flex items-center justify-center font-bold text-xs flex-shrink-0 mt-1">
            U
        </div>`;
    El.msgList().appendChild(div);

    // Store text and attach listener — never embed raw text in HTML attributes.
    const bubbleId = 'user-' + Date.now();
    TextStore.set(bubbleId, text);
    div.querySelector('[data-copy-btn]').dataset.copyId = bubbleId;
    div.querySelector('[data-copy-btn]').addEventListener('click', function () {
        copyTextById(this);
    });
}

function createAiBubble(id) {
    const div = document.createElement('div');
    div.id           = id;
    div.dataset.role = 'assistant';
    div.className    = 'flex gap-3 msg-anim';
    div.innerHTML    = `
        <div class="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600
                    flex items-center justify-center flex-shrink-0 mt-1
                    shadow-md shadow-indigo-900/40">
            <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2a10 10 0 100 20A10 10 0 0012 2zm-1 14.5v-9l6 4.5-6 4.5z"/>
            </svg>
        </div>
        <div class="group flex-1 min-w-0 max-w-[85%]">
            <div class="bg-gray-800 border border-gray-700/60 px-5 py-4
                        rounded-2xl rounded-tl-sm shadow-md">
                <div id="${id}-content"
                     class="md text-gray-200 text-sm leading-relaxed break-words">
                    <span class="inline-block w-0.5 h-4 bg-indigo-400 cursor-blink rounded"></span>
                </div>
            </div>
            <div id="${id}-meta"
                 class="flex items-center gap-3 mt-1
                        opacity-0 group-hover:opacity-100 transition-opacity">
            </div>
        </div>`;
    return div;
}

function updateAiBubble(id, text) {
    const el = $(`${id}-content`);
    if (!el) return;
    const html = DOMPurify.sanitize(marked.parse(text));
    el.innerHTML = html + '<span class="inline-block w-0.5 h-4 bg-indigo-400 cursor-blink rounded ml-0.5"></span>';
}

function finalizeAiBubble(id, text) {
    const el = $(`${id}-content`);
    if (!el) return;

    const html = DOMPurify.sanitize(marked.parse(text));
    el.innerHTML = html;

    // Highlight code & add copy buttons
    processCodeBlocks(el);

    // Store raw text in Map — never embed it in HTML attributes.
    TextStore.set(id, text);

    // Add meta row
    const meta = $(`${id}-meta`);
    if (meta) {
        const now = timeNow();
        meta.innerHTML = `
            <span class="text-xs text-gray-600">${now}</span>
            <button data-copy-btn data-copy-id="${id}"
                    class="text-gray-600 hover:text-gray-400 transition-colors
                           flex items-center gap-1 text-xs p-0.5">
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8
                             a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8
                             a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                </svg>
                Copy response
            </button>
            <button data-regen-btn
                    class="text-gray-600 hover:text-gray-400 transition-colors
                           flex items-center gap-1 text-xs p-0.5">
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M4 4v5h.582m15.356 2
                             A8.001 8.001 0 004.582 9m0 0H9
                             m11 11v-5h-.581m0 0
                             a8.003 8.003 0 01-15.357-2
                             m15.357 2H15"/>
                </svg>
                Regenerate
            </button>`;

        // Attach listeners programmatically — avoids HTML attribute escaping bugs.
        meta.querySelector('[data-copy-btn]')?.addEventListener('click', function () {
            copyTextById(this);
        });
        meta.querySelector('[data-regen-btn]')?.addEventListener('click', regenerate);
    }
}

function errorBubble(msg) {
    return `<div class="flex items-center gap-2 text-red-400 text-sm">
        <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        <span>Error: ${escHtml(msg)}. Please try again.</span>
    </div>`;
}

// ── Code Block Processing ─────────────────────────────────────────
function processCodeBlocks(root) {
    root.querySelectorAll('pre code').forEach(block => {
        hljs.highlightElement(block);
    });
}

function copyToClipboardHelper(text, onSuccess) {
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(onSuccess).catch(() => fallbackCopy(text, onSuccess));
    } else {
        fallbackCopy(text, onSuccess);
    }

    function fallbackCopy(text, onSuccess) {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.top = "0";
        textArea.style.left = "0";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
            document.execCommand('copy');
            if (onSuccess) onSuccess();
        } catch (err) {
            console.error('Fallback copy failed', err);
            toast('Failed to copy', 'error');
        }
        document.body.removeChild(textArea);
    }
}

function copyCode(btn) {
    const code = btn.closest('.code-block-wrap')?.querySelector('code');
    if (!code) return;
    
    const textToCopy = code.textContent || code.innerText || '';
    copyToClipboardHelper(textToCopy, () => {
        const orig = btn.innerHTML;
        btn.innerHTML = '✓ Copied!';
        btn.classList.add('text-emerald-400');
        setTimeout(() => {
            btn.innerHTML = orig;
            btn.classList.remove('text-emerald-400');
        }, 2000);
    });
}

// ── UI Helpers ────────────────────────────────────────────────────
function showChatArea() {
    El.welcomeScreen().classList.add('hidden');
    El.msgList().classList.remove('hidden');
}

function showTyping(show) {
    El.typingBar().classList.toggle('hidden', !show);
    El.typingBar().classList.toggle('flex', show);
}

function setLoadingState(loading) {
    El.sendIcon().classList.toggle('hidden', loading);
    El.loadIcon().classList.toggle('hidden', !loading);
    El.sendBtn().disabled = loading;
}

function scrollBottom(behavior = 'smooth') {
    requestAnimationFrame(() => {
        const wrap = El.messagesWrap();
        wrap.scrollTo({ top: wrap.scrollHeight, behavior });
    });
}

// ── Sidebar ───────────────────────────────────────────────────────
function toggleSidebar() {
    const sidebar    = El.sidebar();
    const showBtn    = El.showSidebarBtn();
    const collapsed  = sidebar.classList.toggle('collapsed');
    showBtn.classList.toggle('hidden', !collapsed);
}

// ── Suggestions ───────────────────────────────────────────────────
function useSuggestion(text) {
    El.msgInput().value = text;
    El.msgInput().dispatchEvent(new Event('input'));
    El.msgInput().focus();
}

// ── New Chat ──────────────────────────────────────────────────────
async function newChat() {
    const [provider, model] = El.modelSelect().value.split(':');
    try {
        const res = await api('POST', '/chat', { provider, model });
        window.location.href = res.url;
    } catch (err) {
        toast('Failed to create chat: ' + err.message, 'error');
    }
}

// ── Delete Conversation ───────────────────────────────────────────
async function deleteConv(id, e) {
    e.preventDefault();
    e.stopPropagation();

    if (!confirm('Delete this conversation? This cannot be undone.')) return;

    try {
        await api('DELETE', `/chat/${id}`);

        // Remove from sidebar
        const el = document.querySelector(`.conv-item[data-id="${id}"]`);
        if (el) el.remove();

        // Redirect if current
        if (State.convId === id) {
            window.location.href = '/chat';
        }

        toast('Conversation deleted', 'success');
    } catch (err) {
        toast('Delete failed: ' + err.message, 'error');
    }
}

// ── Clear Chat ────────────────────────────────────────────────────
async function clearChat(id) {
    if (!confirm('Clear all messages? This cannot be undone.')) return;
    try {
        await api('POST', `/chat/${id}/clear`);
        El.msgList().innerHTML = '';
        El.welcomeScreen().classList.remove('hidden');
        El.msgList().classList.add('hidden');
        El.chatTitle().textContent = 'New Chat';
        toast('Chat cleared', 'success');
    } catch (err) {
        toast('Clear failed: ' + err.message, 'error');
    }
}

// ── Rename ────────────────────────────────────────────────────────
function startRename() {
    El.renameInput().value = El.chatTitle().textContent.trim();
    El.renameModal().classList.remove('hidden');
    El.renameInput().focus();
    El.renameInput().select();
}

function closeRename() {
    El.renameModal().classList.add('hidden');
}

async function confirmRename() {
    const title = El.renameInput().value.trim();
    if (!title || !State.convId) return closeRename();

    try {
        const res = await api('PATCH', `/chat/${State.convId}/rename`, { title });
        El.chatTitle().textContent = res.title;
        updateConvTitle(State.convId, res.title);
        closeRename();
        toast('Renamed successfully', 'success');
    } catch (err) {
        toast('Rename failed: ' + err.message, 'error');
    }
}

// Close modal on backdrop click
document.addEventListener('click', e => {
    if (e.target === El.renameModal()) closeRename();
});

// Rename on Enter key
document.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !El.renameModal().classList.contains('hidden')) {
        confirmRename();
    }
    if (e.key === 'Escape' && !El.renameModal().classList.contains('hidden')) {
        closeRename();
    }
});

// ── Sidebar Helpers ───────────────────────────────────────────────
function prependConvItem(id, title) {
    const noMsg = El.noConvMsg();
    if (noMsg) noMsg.remove();

    const div        = document.createElement('div');
    div.className    = 'conv-item group relative rounded-xl mb-0.5 cursor-pointer hover:bg-gray-800/60 transition-colors active';
    div.dataset.id   = id;
    div.innerHTML    = `
        <a href="/chat/${id}" class="flex items-center gap-3 px-3 py-2.5">
            <div class="w-8 h-8 rounded-lg bg-gray-700/60 flex items-center justify-center flex-shrink-0">
                <svg class="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M8 12h.01M12 12h.01M16 12h.01
                             M21 12c0 4.418-4.03 8-9 8
                             a9.863 9.863 0 01-4.255-.949
                             L3 20l1.395-3.72
                             C3.512 15.042 3 13.574 3 12
                             c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                </svg>
            </div>
            <div class="flex-1 min-w-0">
                <p class="text-xs font-medium text-gray-300 truncate group-hover:text-white
                          transition-colors conv-title">${escHtml(title)}</p>
                <p class="text-[10px] text-gray-600 mt-0.5">Just now</p>
            </div>
        </a>
        <div class="absolute right-2 top-1/2 -translate-y-1/2
                    opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
            <button onclick="deleteConv(${id}, event)"
                    class="p-1.5 rounded-lg text-gray-600 hover:text-red-400
                           hover:bg-gray-700 transition-colors">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21
                             H7.862a2 2 0 01-1.995-1.858L5 7
                             m5 4v6m4-6v6
                             m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                </svg>
            </button>
        </div>`;

    El.convList().prepend(div);
}

function updateConvTitle(id, title) {
    const el = document.querySelector(`.conv-item[data-id="${id}"] .conv-title`);
    if (el) el.textContent = title;
}

// ── Copy ──────────────────────────────────────────────────────────
// Used by server-rendered copy buttons (blade partials) that pass text
// directly via onclick="copyText(this, '...')".
function copyText(btn, text) {
    copyToClipboardHelper(text, () => {
        const orig = btn.innerHTML;
        btn.innerHTML = btn.innerHTML.includes('svg')
            ? btn.innerHTML.replace(/Copy.*/, 'Copied!')
            : 'Copied!';
        setTimeout(() => { btn.innerHTML = orig; }, 2000);
        toast('Copied to clipboard', 'success');
    });
}

// Used by JS-generated copy buttons that store text in TextStore
// and reference it via data-copy-id (avoids embedding raw text in HTML).
function copyTextById(btn) {
    const id   = btn.dataset.copyId;
    const text = TextStore.get(id) ?? '';
    copyToClipboardHelper(text, () => {
        const orig = btn.innerHTML;
        btn.innerHTML = btn.innerHTML.includes('svg')
            ? btn.innerHTML.replace(/Copy.*/, 'Copied!')
            : 'Copied!';
        btn.classList.add('text-emerald-400');
        setTimeout(() => {
            btn.innerHTML = orig;
            btn.classList.remove('text-emerald-400');
        }, 2000);
        toast('Copied to clipboard', 'success');
    });
}

// ── Toast ─────────────────────────────────────────────────────────
function toast(msg, type = 'info') {
    const colors = {
        success : 'bg-emerald-600 border-emerald-500',
        error   : 'bg-red-700 border-red-600',
        info    : 'bg-indigo-700 border-indigo-600',
    };
    const el  = document.createElement('div');
    el.className = `toast pointer-events-auto flex items-center gap-2 px-4 py-3
                    text-sm text-white rounded-xl border shadow-xl max-w-sm
                    ${colors[type] || colors.info}`;
    el.innerHTML = `
        <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            ${type === 'success'
        ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>'
        : type === 'error'
            ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>'
            : '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>'}
        </svg>
        <span>${escHtml(msg)}</span>`;

    El.toasts().appendChild(el);
    setTimeout(() => el.remove(), 3500);
}

// ── API Helper ────────────────────────────────────────────────────
async function api(method, url, body = null) {
    const opts = {
        method,
        headers: {
            'Content-Type' : 'application/json',
            'X-CSRF-TOKEN' : window.CHAT.csrfToken,
        },
    };
    if (body) opts.body = JSON.stringify(body);

    const res  = await fetch(url, opts);
    const data = await res.json();

    if (!res.ok || !data.success) {
        throw new Error(data.message || `HTTP ${res.status}`);
    }
    return data;
}

// ── Utilities ─────────────────────────────────────────────────────
function escHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function timeNow() {
    return new Date().toLocaleTimeString('en-US', {
        hour   : '2-digit',
        minute : '2-digit',
        hour12 : false,
    });
}

// ── Expose functions used by inline onclick handlers ─────────────
// 'use strict' does NOT attach functions to window automatically,
// but Blade onclick="..." attributes resolve from window scope.
Object.assign(window, {
    toggleSidebar,
    newChat,
    deleteConv,
    clearChat,
    sendMessage,
    startRename,
    closeRename,
    confirmRename,
    useSuggestion,
    copyText,
    copyTextById,
    copyCode,
    regenerate,
});
