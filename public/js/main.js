/**
 * KAIRU — The Void Marshal
 * main.js — UI interactions, scroll, animations, voting, newsletter
 */

'use strict';

/* ═══════════════════════════════════════════════════
   SCROLL HELPERS
   ═══════════════════════════════════════════════════ */

/**
 * Smooth-scroll to a section by ID.
 * @param {string} id - The section element ID.
 */
function go(id) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* ═══════════════════════════════════════════════════
   MOBILE MENU
   ═══════════════════════════════════════════════════ */
function toggleMenu() {
  const menu = document.getElementById('mobile-menu');
  const btn = document.getElementById('hamburger');
  const isOpen = menu.classList.toggle('open');
  btn.setAttribute('aria-expanded', String(isOpen));
}

function closeMenu() {
  document.getElementById('mobile-menu').classList.remove('open');
  document.getElementById('hamburger').setAttribute('aria-expanded', 'false');
}

// Close mobile menu on outside click
document.addEventListener('click', (e) => {
  const menu = document.getElementById('mobile-menu');
  const btn = document.getElementById('hamburger');
  if (menu.classList.contains('open') && !menu.contains(e.target) && !btn.contains(e.target)) {
    closeMenu();
  }
});

/* ═══════════════════════════════════════════════════
   TOAST NOTIFICATION
   ═══════════════════════════════════════════════════ */
let _toastTimer = null;

/**
 * Show a toast notification.
 * @param {string} msg  - Message to display.
 * @param {string} type - Optional extra CSS class (e.g. 'terror').
 */
function showToast(msg, type = '') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast show' + (type ? ' ' + type : '');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => t.classList.remove('show'), 3400);
}

/* ═══════════════════════════════════════════════════
   PARTICLES
   ═══════════════════════════════════════════════════ */
(function spawnParticles() {
  const container = document.getElementById('particles');
  if (!container) return;

  for (let i = 0; i < 22; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const size = Math.random() * 3 + 1;
    p.style.cssText = [
      `left: ${Math.random() * 100}%`,
      `width: ${size}px`,
      `height: ${size}px`,
      `animation-duration: ${Math.random() * 9 + 6}s`,
      `animation-delay: ${Math.random() * 10}s`,
      `background: ${Math.random() > 0.55 ? '#3b82f6' : '#dc2626'}`,
      `opacity: 0.6`,
    ].join(';');
    container.appendChild(p);
  }
})();

/* ═══════════════════════════════════════════════════
   FADE-IN ON SCROLL (IntersectionObserver)
   ═══════════════════════════════════════════════════ */
(function initFadeIn() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -30px 0px' }
  );

  document.querySelectorAll('.fade-in').forEach((el) => observer.observe(el));
})();

/* ═══════════════════════════════════════════════════
   TIER LIST — click to pre-fill chat
   ═══════════════════════════════════════════════════ */
(function initTierEntries() {
  document.querySelectorAll('.tier-entry[data-ask]').forEach((entry) => {
    entry.addEventListener('click', () => {
      const question = entry.dataset.ask;
      if (!question) return;
      go('chat-section');
      // Small delay so the scroll completes before the input updates
      setTimeout(() => {
        const input = document.getElementById('chat-in');
        if (input) {
          input.value = question;
          input.focus();
        }
      }, 650);
    });

    // Keyboard accessibility
    entry.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        entry.click();
      }
    });
  });
})();

/* ═══════════════════════════════════════════════════
   ORDER CARDS — click to pre-fill chat
   ═══════════════════════════════════════════════════ */
(function initOrderCards() {
  document.querySelectorAll('.order-card[data-ask]').forEach((card) => {
    card.addEventListener('click', () => {
      const question = card.dataset.ask;
      if (!question) return;
      go('chat-section');
      setTimeout(() => {
        const input = document.getElementById('chat-in');
        if (input) {
          input.value = question;
          input.focus();
        }
      }, 650);
    });

    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        card.click();
      }
    });
  });
})();

/* ═══════════════════════════════════════════════════
   WAR COUNCIL — voting
   ═══════════════════════════════════════════════════ */
(function initVoting() {
  const voted = {};

  document.querySelectorAll('.vote-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const debateId = btn.dataset.debate;
      if (!debateId || voted[debateId]) return;

      voted[debateId] = true;

      // Disable all buttons in this debate card
      const card = btn.closest('.debate-card');
      card.querySelectorAll('.vote-btn').forEach((b) => {
        b.disabled = true;
        b.style.opacity = '0.4';
      });

      // Highlight selected button
      btn.classList.add('voted');
      btn.style.opacity = '1';

      // Increment vote count
      const countEl = document.getElementById('vc-' + debateId);
      if (countEl) {
        const current = parseInt(countEl.textContent.replace(/\D/g, ''), 10) || 0;
        countEl.textContent = (current + 1).toLocaleString() + ' votes';
      }

      showToast('✓ Vote cast. Kairu notes your conviction.');
    });
  });
})();

/* ═══════════════════════════════════════════════════
   LOYALTY OATH — newsletter signup
   ═══════════════════════════════════════════════════ */
(function initOath() {
  const emailInput = document.getElementById('email-in');
  const pledgeBtn  = document.getElementById('pledge-btn');
  const oathMsg    = document.getElementById('oath-msg');

  if (!emailInput || !pledgeBtn || !oathMsg) return;

  function pledge() {
    const email = emailInput.value.trim();
    const valid = email.length > 0 && email.includes('@') && email.includes('.');

    if (!valid) {
      oathMsg.textContent = '⚠ The Void Marshal requires a valid email to dispatch his decrees.';
      oathMsg.style.color = '#ef4444';
      emailInput.focus();
      return;
    }

    // In production, replace this with a real API call to your mailing list provider
    emailInput.value = '';
    oathMsg.textContent = '✓ Oath sworn. Your briefing package arrives shortly. Welcome to the Shadow Army.';
    oathMsg.style.color = '#22c55e';

    // Bump the army counter for fun
    const counter = document.getElementById('army-count');
    if (counter) {
      const parsed = parseFloat(counter.textContent);
      if (!isNaN(parsed)) {
        counter.textContent = (parsed + 0.1).toFixed(1) + 'K';
      }
    }

    showToast('⚔ Another soldier joins the Shadow Army.');
  }

  pledgeBtn.addEventListener('click', pledge);

  emailInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') pledge();
  });
})();

/* ═══════════════════════════════════════════════════
   NAV — scroll effect
   ═══════════════════════════════════════════════════ */
(function initNavScroll() {
  const nav = document.getElementById('nav');
  if (!nav) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 80) {
      nav.style.borderBottomColor = 'rgba(220, 38, 38, 0.18)';
    } else {
      nav.style.borderBottomColor = 'rgba(220, 38, 38, 0.1)';
    }
  }, { passive: true });
})();

/* ═══════════════════════════════════════════════════
   KEYBOARD NAV for nav-links
   ═══════════════════════════════════════════════════ */
document.querySelectorAll('.nav-links li').forEach((li) => {
  li.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      li.click();
    }
  });
});

// Expose globals used by inline onclick attributes in HTML
window.go           = go;
window.showToast    = showToast;
window.toggleMenu   = toggleMenu;
window.closeMenu    = closeMenu;
