/**
 * KAIRU — The Void Marshal
 * chat.js — Live AI chat with Kairu via the /api/chat proxy
 *
 * This module never calls Anthropic directly.
 * All requests go through the Express proxy in server.js
 * so the API key stays server-side.
 */

'use strict';

(function KairuChat() {
  /* ── State ── */
  const history = [];   // Full message history sent to the server
  let isLoading = false;

  /* ── DOM references ── */
  const messagesEl  = document.getElementById('chat-msgs');
  const inputEl     = document.getElementById('chat-in');
  const sendBtn     = document.getElementById('chat-btn');
  const quickEl     = document.getElementById('quick-prompts');

  if (!messagesEl || !inputEl || !sendBtn) return; // chat section not present

  /* ═══════════════════════════════════════════════
     API CALL — proxied through Express
     ═══════════════════════════════════════════════ */

  /**
   * Send a user message to /api/chat and return Kairu's reply.
   * @param {string} userMessage
   * @returns {Promise<string>} Kairu's reply text
   */
  async function callKairu(userMessage) {
    history.push({ role: 'user', content: userMessage });

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history }),
      });

      if (res.status === 429) {
        return '"The shadow network demands a brief pause. The Void Marshal requires a moment to regather his forces. Try again shortly."';
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.error('Chat API error:', err);
        return '"A disturbance in the Void has interrupted my transmission. Try again, soldier."';
      }

      const data = await res.json();
      const reply = data.reply || '"The abyss offered no response. Try again."';

      history.push({ role: 'assistant', content: reply });
      return reply;

    } catch (networkErr) {
      console.error('Network error:', networkErr);
      // Remove the user message we just added since it won't have a response
      history.pop();
      return '"The Shadow Interface is temporarily unreachable. Check your connection, soldier."';
    }
  }

  /* ═══════════════════════════════════════════════
     DOM HELPERS
     ═══════════════════════════════════════════════ */

  /**
   * Safely escape HTML to prevent XSS.
   * @param {string} str
   * @returns {string}
   */
  function escapeHTML(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * Append a message bubble to the chat.
   * @param {'kairu'|'user'} role
   * @param {string} text
   */
  function appendMessage(role, text) {
    const isKairu = role === 'kairu';
    const row = document.createElement('div');
    row.className = 'chat-msg-row' + (isKairu ? '' : ' user-row');

    row.innerHTML = `
      <div class="msg-avatar ${isKairu ? 'av-k' : 'av-u'}" aria-hidden="true">
        ${isKairu ? 'K' : 'YOU'}
      </div>
      <div class="msg-body ${isKairu ? '' : 'user-body'}">
        <div class="msg-name ${isKairu ? 'mn-k' : 'mn-u'}">
          ${isKairu ? 'Kairu — Void Marshal' : 'You'}
        </div>
        <div class="msg-bubble ${isKairu ? 'mb-k' : 'mb-u'}">
          ${escapeHTML(text)}
        </div>
      </div>
    `;

    messagesEl.appendChild(row);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  /** Show the animated typing indicator. */
  function showTyping() {
    const row = document.createElement('div');
    row.className = 'chat-msg-row';
    row.id = 'typing-row';

    row.innerHTML = `
      <div class="msg-avatar av-k" aria-hidden="true">K</div>
      <div class="msg-body">
        <div class="msg-name mn-k">Kairu — Void Marshal</div>
        <div class="typing-indicator" aria-label="Kairu is typing">
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
        </div>
      </div>
    `;

    messagesEl.appendChild(row);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  /** Remove the typing indicator. */
  function removeTyping() {
    const row = document.getElementById('typing-row');
    if (row) row.remove();
  }

  /**
   * Toggle loading state on input + button.
   * @param {boolean} loading
   */
  function setLoading(loading) {
    isLoading = loading;
    inputEl.disabled = loading;
    sendBtn.disabled = loading;
    sendBtn.textContent = loading ? '...' : 'Send';
  }

  /* ═══════════════════════════════════════════════
     SEND MESSAGE
     ═══════════════════════════════════════════════ */

  async function sendMessage() {
    if (isLoading) return;

    const msg = inputEl.value.trim();
    if (!msg) return;

    inputEl.value = '';

    // Hide quick prompts after first interaction
    if (quickEl) quickEl.style.display = 'none';

    appendMessage('user', msg);
    setLoading(true);
    showTyping();

    const reply = await callKairu(msg);

    removeTyping();
    appendMessage('kairu', reply);
    setLoading(false);
    inputEl.focus();
  }

  /* ═══════════════════════════════════════════════
     EVENT LISTENERS
     ═══════════════════════════════════════════════ */

  // Send on button click
  sendBtn.addEventListener('click', sendMessage);

  // Send on Enter (but not Shift+Enter)
  inputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  // Quick-prompt buttons
  if (quickEl) {
    quickEl.querySelectorAll('.qp[data-quick]').forEach((btn) => {
      btn.addEventListener('click', () => {
        inputEl.value = btn.dataset.quick || '';
        sendMessage();
      });
    });
  }

  /* ═══════════════════════════════════════════════
     EXPOSE sendQuick for tier-list entries
     (tier entries pre-fill via main.js, but if
     someone calls sendQuick directly it should work)
     ═══════════════════════════════════════════════ */
  window.sendQuick = function sendQuick(msg) {
    if (!msg) return;
    inputEl.value = msg;
    sendMessage();
  };

})();
